
import { useEffect, useRef, useState } from "react";
import * as THREE from "three";

import "./index.css";

export default function App() {
  const canvasRef = useRef(null);

  const particlesRef = useRef(null);

  const [status, setStatus] = useState(
    "Cargando AR..."
  );

  const [error, setError] = useState("");

  /*
   * =====================================================
   * INICIAR 8TH WALL
   * =====================================================
   */

  useEffect(() => {
    let XR8 = null;

    let animationStarted = false;

    /*
     * -----------------------------------------------------
     * CREAR PARTÍCULAS
     * -----------------------------------------------------
     */

    function createParticles(
      scene
    ) {
      const COUNT = 10000;

      const positions =
        new Float32Array(
          COUNT * 3
        );

      const velocities =
        new Float32Array(
          COUNT * 3
        );

      const random =
        new Float32Array(
          COUNT
        );


      for (
        let i = 0;
        i < COUNT;
        i++
      ) {
        const i3 =
          i * 3;


        /*
         * Distribución alrededor
         * del punto de origen.
         */

        const radius =
          Math.random() *
          1.2;

        const angle =
          Math.random() *
          Math.PI *
          2;


        positions[i3] =
          Math.cos(angle) *
          radius;

        positions[i3 + 1] =
          Math.random() *
          1.5;

        positions[i3 + 2] =
          Math.sin(angle) *
          radius;


        /*
         * Velocidad
         */

        velocities[i3] =
          (Math.random() - 0.5) *
          0.15;

        velocities[i3 + 1] =
          Math.random() *
          0.25 +
          0.05;

        velocities[i3 + 2] =
          (Math.random() - 0.5) *
          0.15;


        random[i] =
          Math.random() *
          Math.PI *
          2;
      }


      /*
       * Geometry
       */

      const geometry =
        new THREE.BufferGeometry();

      geometry.setAttribute(
        "position",
        new THREE.BufferAttribute(
          positions,
          3
        )
      );


      /*
       * Material
       */

      const material =
        new THREE.PointsMaterial({
          color: 0x00ffff,

          size: 0.025,

          transparent: true,

          opacity: 0.9,

          depthWrite: false,

          blending:
            THREE.AdditiveBlending,
        });


      /*
       * Points
       */

      const particles =
        new THREE.Points(
          geometry,
          material
        );


      /*
       * IMPORTANTE
       *
       * Las partículas están
       * inicialmente 1.5 metros
       * delante de la cámara.
       */

      particles.position.set(
        0,
        -0.5,
        -1.5
      );


      scene.add(
        particles
      );


      particlesRef.current =
        particles;


      return {
        particles,
        geometry,
        material,
        velocities,
        random,
        COUNT,
      };
    }


    /*
     * =====================================================
     * ANIMACIÓN
     * =====================================================
     */

    function animateParticles(
      particleData
    ) {
      if (!particleData) {
        return;
      }

      const {
        particles,
        geometry,
        velocities,
        random,
        COUNT,
      } = particleData;


      const positionAttribute =
        geometry.attributes.position;


      const positions =
        positionAttribute.array;


      const time =
        performance.now() *
        0.001;


      for (
        let i = 0;
        i < COUNT;
        i++
      ) {
        const i3 =
          i * 3;


        /*
         * Movimiento vertical
         */

        positions[i3 + 1] +=
          velocities[i3 + 1] *
          0.016;


        /*
         * Movimiento orgánico
         */

        positions[i3] +=
          Math.sin(
            time * 1.5 +
            random[i]
          ) *
          0.0005;


        positions[i3 + 2] +=
          Math.cos(
            time * 1.2 +
            random[i]
          ) *
          0.0005;


        /*
         * Reinicio
         */

        if (
          positions[i3 + 1] >
          1.5
        ) {
          positions[i3 + 1] =
            -0.5;
        }
      }


      positionAttribute.needsUpdate =
        true;


      /*
       * Rotación del sistema
       */

      particles.rotation.y +=
        0.002;
    }


    /*
     * =====================================================
     * PIPELINE
     * =====================================================
     */

    function initScenePipelineModule() {
      let particleData =
        null;


      return {
        name:
          "particles-ar-scene",


        /*
         * Se ejecuta cuando
         * Three.js está listo.
         */

        onStart: () => {
          setStatus(
            "AR iniciada"
          );
        },


        /*
         * Se ejecuta cuando
         * tenemos la escena.
         */

        onAttach: () => {
          const {
            scene,
          } =
            XR8.Threejs.xrScene();


          /*
           * Crear partículas
           */

          particleData =
            createParticles(
              scene
            );


          /*
           * Iluminación
           */

          const light =
            new THREE.AmbientLight(
              0xffffff,
              1
            );

          scene.add(
            light
          );


          setStatus(
            "Busca una superficie..."
          );
        },


        /*
         * Cada frame.
         */

        onUpdate: () => {
          animateParticles(
            particleData
          );
        },


        /*
         * Tracking
         */

        onProcessCpu: ({
          processCpuResult,
        }) => {
          const reality =
            processCpuResult?.reality;


          if (!reality) {
            return;
          }


          if (
            reality.trackingStatus ===
            "NORMAL"
          ) {
            setStatus(
              "✓ Tracking activo"
            );
          } else {
            setStatus(
              "Buscando tracking..."
            );
          }
        },
      };
    }


    /*
     * =====================================================
     * ARRANCAR ENGINE
     * =====================================================
     */

    function startXR() {
      XR8 =
        window.XR8;


      if (!XR8) {
        setError(
          "No se pudo cargar 8th Wall Engine."
        );

        setStatus(
          "Error"
        );

        return;
      }


      /*
       * Canvas
       */

      const canvas =
        canvasRef.current;


      /*
       * Módulos del pipeline
       *
       * GlTextureRenderer
       *    ↓
       * cámara
       *
       * Threejs
       *    ↓
       * escena Three.js
       *
       * XrController
       *    ↓
       * SLAM / World Tracking
       */

      XR8.addCameraPipelineModules([
        XR8.GlTextureRenderer
          .pipelineModule(),

        XR8.Threejs
          .pipelineModule(),

        XR8.XrController
          .pipelineModule(),

        initScenePipelineModule(),
      ]);


      /*
       * Configurar Three.js
       */

      XR8.Threejs.configure({
        renderCameraTexture:
          true,
      });


      /*
       * Arrancar cámara
       */

      XR8.run({
        canvas,

        allowedDevices:
          XR8.XrConfig.device()
            .ANY,
      });


      animationStarted =
        true;
    }


    /*
     * =====================================================
     * ESPERAR A XR8
     * =====================================================
     */

    if (window.XR8) {
      startXR();
    } else {
      window.addEventListener(
        "xrloaded",
        startXR,
        {
          once: true,
        }
      );
    }


    /*
     * =====================================================
     * CLEANUP
     * =====================================================
     */

    return () => {
      window.removeEventListener(
        "xrloaded",
        startXR
      );


      if (
        XR8 &&
        animationStarted
      ) {
        try {
          XR8.stop();
        } catch {
          // ignore
        }
      }
    };
  }, []);


  /*
   * =====================================================
   * UI
   * =====================================================
   */

  return (
    <div className="app">

      <canvas
        ref={canvasRef}
        id="camerafeed"
      />


      <div className="hud">

        <div className="title">
          ✨ AR Particles
        </div>

        <div className="status">
          {status}
        </div>

        {error && (
          <div className="error">
            {error}
          </div>
        )}

      </div>

    </div>
  );
}

