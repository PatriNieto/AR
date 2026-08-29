
import { useEffect, useRef, useState } from "react";
import * as THREE from "three";

import "./index.css";

export default function App() {
  const videoRef = useRef(null);
  const containerRef = useRef(null);

  const [started, setStarted] = useState(false);
  const [error, setError] = useState("");

  /*
   * =====================================================
   * INICIAR CÁMARA
   * =====================================================
   */

  async function startAR() {
    try {
      setError("");

      if (
        !navigator.mediaDevices ||
        !navigator.mediaDevices.getUserMedia
      ) {
        throw new Error(
          "Este navegador no permite acceder a la cámara."
        );
      }

      const stream =
        await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: {
              ideal: "environment",
            },
            width: {
              ideal: 1920,
            },
            height: {
              ideal: 1080,
            },
          },
          audio: false,
        });

      /*
       * IMPORTANTE:
       * Guardamos el stream en el vídeo.
       */

      if (videoRef.current) {
        videoRef.current.srcObject = stream;

        await videoRef.current.play();
      }

      setStarted(true);

    } catch (err) {
      console.error(err);

      setError(
        err?.message ||
          "No se pudo acceder a la cámara."
      );
    }
  }


  /*
   * =====================================================
   * THREE.JS
   * =====================================================
   */

  useEffect(() => {
    if (!started) {
      return;
    }

    const container =
      containerRef.current;

    if (!container) {
      return;
    }


    /*
     * -----------------------------------------------------
     * SCENE
     * -----------------------------------------------------
     */

    const scene =
      new THREE.Scene();


    /*
     * -----------------------------------------------------
     * CAMERA
     * -----------------------------------------------------
     */

    const camera =
      new THREE.PerspectiveCamera(
        60,
        window.innerWidth /
          window.innerHeight,
        0.01,
        100
      );

    camera.position.set(
      0,
      0,
      0
    );


    /*
     * -----------------------------------------------------
     * RENDERER
     * -----------------------------------------------------
     */

    const renderer =
      new THREE.WebGLRenderer({
        alpha: true,
        antialias: true,
      });

    renderer.setPixelRatio(
      Math.min(
        window.devicePixelRatio,
        2
      )
    );

    renderer.setSize(
      window.innerWidth,
      window.innerHeight
    );

    renderer.setClearColor(
      0x000000,
      0
    );

    container.appendChild(
      renderer.domElement
    );


    /*
     * -----------------------------------------------------
     * PARTÍCULAS
     * -----------------------------------------------------
     */

    const COUNT = 6000;

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
      const i3 = i * 3;

      /*
       * Distribución circular
       */

      const radius =
        Math.random() * 1.2;

      const angle =
        Math.random() *
        Math.PI *
        2;

      positions[i3] =
        Math.cos(angle) *
        radius;

      positions[i3 + 1] =
        Math.random() * 1.5 -
        0.5;

      positions[i3 + 2] =
        Math.sin(angle) *
        radius;


      /*
       * Velocidad
       */

      velocities[i3] =
        (Math.random() - 0.5) *
        0.2;

      velocities[i3 + 1] =
        Math.random() *
        0.25 +
        0.03;

      velocities[i3 + 2] =
        (Math.random() - 0.5) *
        0.2;


      random[i] =
        Math.random() *
        Math.PI *
        2;
    }


    /*
     * -----------------------------------------------------
     * GEOMETRY
     * -----------------------------------------------------
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
     * -----------------------------------------------------
     * MATERIAL
     * -----------------------------------------------------
     */

    const material =
      new THREE.PointsMaterial({
        color: 0x00ffff,
        size: 0.035,
        transparent: true,
        opacity: 0.95,
        depthWrite: false,
        blending:
          THREE.AdditiveBlending,
      });


    /*
     * -----------------------------------------------------
     * PARTICLES
     * -----------------------------------------------------
     */

    const particles =
      new THREE.Points(
        geometry,
        material
      );


    /*
     * MUY IMPORTANTE:
     *
     * Las partículas tienen que estar
     * delante de la cámara.
     */

    particles.position.set(
      0,
      0,
      -3
    );

    scene.add(
      particles
    );


    /*
     * -----------------------------------------------------
     * ANIMATION
     * -----------------------------------------------------
     */

    const clock =
      new THREE.Clock();

    let animationFrame;


    function animate() {
      animationFrame =
        requestAnimationFrame(
          animate
        );

      const delta =
        clock.getDelta();

      const time =
        clock.elapsedTime;

      const positionAttribute =
        geometry.attributes.position;

      const array =
        positionAttribute.array;


      for (
        let i = 0;
        i < COUNT;
        i++
      ) {
        const i3 = i * 3;


        /*
         * Movimiento vertical
         */

        array[i3 + 1] +=
          velocities[i3 + 1] *
          delta;


        /*
         * Movimiento horizontal
         */

        array[i3] +=
          Math.sin(
            time * 1.5 +
            random[i]
          ) *
          0.001;


        array[i3 + 2] +=
          Math.cos(
            time * 1.2 +
            random[i]
          ) *
          0.001;


        /*
         * Reiniciar
         */

        if (
          array[i3 + 1] >
          1
        ) {
          array[i3 + 1] =
            -0.8;
        }
      }


      positionAttribute.needsUpdate =
        true;


      /*
       * Rotación
       */

      particles.rotation.y +=
        delta * 0.1;


      /*
       * Render
       */

      renderer.render(
        scene,
        camera
      );
    }


    animate();


    /*
     * -----------------------------------------------------
     * RESIZE
     * -----------------------------------------------------
     */

    function resize() {
      camera.aspect =
        window.innerWidth /
        window.innerHeight;

      camera.updateProjectionMatrix();

      renderer.setSize(
        window.innerWidth,
        window.innerHeight
      );
    }


    window.addEventListener(
      "resize",
      resize
    );


    /*
     * -----------------------------------------------------
     * CLEANUP
     * -----------------------------------------------------
     */

    return () => {
      cancelAnimationFrame(
        animationFrame
      );

      window.removeEventListener(
        "resize",
        resize
      );

      geometry.dispose();

      material.dispose();

      renderer.dispose();

      if (
        renderer.domElement.parentNode
      ) {
        renderer.domElement.parentNode.removeChild(
          renderer.domElement
        );
      }
    };
  }, [started]);


  /*
   * =====================================================
   * PARAR CÁMARA
   * =====================================================
   */

  useEffect(() => {
    return () => {
      const video =
        videoRef.current;

      if (!video) {
        return;
      }

      const stream =
        video.srcObject;

      if (stream) {
        stream
          .getTracks()
          .forEach((track) => {
            track.stop();
          });
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

      {!started && (
        <div className="start-screen">

          <div className="logo">
            ✨
          </div>

          <h1>
            AR Particles
          </h1>

          <p>
            Partículas en realidad
            aumentada
          </p>

          <button
            onClick={startAR}
          >
            Activar cámara
          </button>

          {error && (
            <div className="error">
              {error}
            </div>
          )}

        </div>
      )}


      {started && (
        <>

          {/*
           * =============================================
           * CÁMARA
           * =============================================
           */}

          <video
            ref={videoRef}
            className="camera"
            autoPlay
            muted
            playsInline
          />


          {/*
           * =============================================
           * THREE.JS
           * =============================================
           */}

          <div
            ref={containerRef}
            className="three-container"
          />


          {/*
           * =============================================
           * HUD
           * =============================================
           */}

          <div className="hud">

            <div className="status">
              ● AR
            </div>

            <div className="instructions">
              Mueve el teléfono
            </div>

          </div>

        </>
      )}

    </div>
  );
}

