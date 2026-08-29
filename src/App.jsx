/* eslint-disable react-hooks/refs */

import { useEffect, useRef, useState } from "react";
import * as THREE from "three";

import "./index.css";

function ParticleSystem({ scene }) {
  const pointsRef = useRef(null);

  const COUNT = 8000;

  useEffect(() => {
    /*
     * --------------------------------------------------
     * GEOMETRÍA
     * --------------------------------------------------
     */

    const geometry =
      new THREE.BufferGeometry();

    const positions =
      new Float32Array(COUNT * 3);

    const velocities =
      new Float32Array(COUNT * 3);

    const randomness =
      new Float32Array(COUNT);

    for (let i = 0; i < COUNT; i++) {
      const i3 = i * 3;

      /*
       * Distribuir partículas
       * alrededor del origen.
       */

      const radius =
        Math.random() * 1.5;

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
        0.3 +
        0.05;

      velocities[i3 + 2] =
        (Math.random() - 0.5) *
        0.15;

      randomness[i] =
        Math.random() *
        Math.PI *
        2;
    }

    geometry.setAttribute(
      "position",
      new THREE.BufferAttribute(
        positions,
        3
      )
    );

    /*
     * --------------------------------------------------
     * MATERIAL
     * --------------------------------------------------
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
     * --------------------------------------------------
     * PARTICLE OBJECT
     * --------------------------------------------------
     */

    const particles =
      new THREE.Points(
        geometry,
        material
      );

    /*
     * Colocamos inicialmente
     * delante de la cámara.
     */

    particles.position.set(
      0,
      0,
      -2
    );

    scene.add(particles);

    pointsRef.current = particles;

    /*
     * --------------------------------------------------
     * ANIMATION
     * --------------------------------------------------
     */

    let animationFrame;

    const clock =
      new THREE.Clock();

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
         * Movimiento orgánico
         */

        array[i3] +=
          Math.sin(
            time * 1.5 +
            randomness[i]
          ) *
          0.001;

        array[i3 + 2] +=
          Math.cos(
            time * 1.2 +
            randomness[i]
          ) *
          0.001;

        /*
         * Reiniciar partículas
         */

        if (
          array[i3 + 1] >
          1.5
        ) {
          array[i3 + 1] =
            0;
        }
      }

      positionAttribute.needsUpdate =
        true;

      /*
       * Rotación suave
       */

      particles.rotation.y +=
        delta * 0.1;
    }

    animate();

    /*
     * Cleanup
     */

    return () => {
      cancelAnimationFrame(
        animationFrame
      );

      geometry.dispose();

      material.dispose();

      scene.remove(
        particles
      );
    };
  }, [scene]);

  return null;
}


/*
 * ======================================================
 * APP
 * ======================================================
 */

export default function App() {
  const containerRef =
    useRef(null);

  const rendererRef =
    useRef(null);

  const sceneRef =
    useRef(null);

  const cameraRef =
    useRef(null);

  const [
    started,
    setStarted,
  ] = useState(false);

  const [
    error,
    setError,
  ] = useState("");

  /*
   * --------------------------------------------------
   * INICIALIZAR THREE.JS
   * --------------------------------------------------
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
     * Scene
     */

    const scene =
      new THREE.Scene();

    sceneRef.current =
      scene;

    /*
     * Camera
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

    cameraRef.current =
      camera;

    /*
     * Renderer
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

    renderer.xr.enabled =
      false;

    rendererRef.current =
      renderer;

    container.appendChild(
      renderer.domElement
    );

    /*
     * Fondo transparente.
     * La cámara AR estará
     * detrás del canvas.
     */

    renderer.setClearColor(
      0x000000,
      0
    );

    /*
     * Luz
     */

    const ambient =
      new THREE.AmbientLight(
        0xffffff,
        1
      );

    scene.add(ambient);

    /*
     * Resize
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
     * Render loop
     */

    function render() {
      renderer.render(
        scene,
        camera
      );
    }

    renderer.setAnimationLoop(
      render
    );

    /*
     * Cleanup
     */

    return () => {
      window.removeEventListener(
        "resize",
        resize
      );

      renderer.setAnimationLoop(
        null
      );

      renderer.dispose();

      if (
        renderer.domElement
          .parentNode
      ) {
        renderer.domElement
          .parentNode
          .removeChild(
            renderer.domElement
          );
      }
    };
  }, [started]);


  /*
   * --------------------------------------------------
   * START
   * --------------------------------------------------
   */

  async function startAR() {
    try {
      setError("");

      /*
       * Comprobar cámara
       */

      if (
        !navigator.mediaDevices ||
        !navigator.mediaDevices
          .getUserMedia
      ) {
        throw new Error(
          "Este navegador no permite acceso a la cámara."
        );
      }

      /*
       * Pedir permiso.
       *
       * Esto funciona tanto en
       * iPhone como Android.
       */

      await navigator.mediaDevices
        .getUserMedia({
          video: {
            facingMode: {
              ideal:
                "environment",
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

      setStarted(true);

    } catch (err) {
      console.error(err);

      setError(
        err?.message ||
          "No se pudo iniciar la cámara."
      );
    }
  }


  /*
   * --------------------------------------------------
   * UI
   * --------------------------------------------------
   */

  return (
    <div className="app">

      {!started && (
        <div className="start">

          <div className="logo">
            ✨
          </div>

          <h1>
            AR Particles
          </h1>

          <p>
            Experiencia AR para
            iPhone y Android
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
          <div
            ref={containerRef}
            className="three-container"
          />

          // eslint-disable-next-line react-hooks/refs
          {sceneRef.current && (
            <ParticleSystem
              scene={
                sceneRef.current
              }
            />
          )}

          <div className="hud">

            <div className="status">
              ● AR
            </div>

            <div className="instructions">
              Mueve el teléfono para
              explorar las partículas
            </div>

          </div>
        </>
      )}

    </div>
  );
}

