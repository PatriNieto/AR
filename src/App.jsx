/* eslint-disable react-hooks/purity */

import React, { useEffect, useRef, useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import * as THREE from "three";
import "./index.css";

/* =========================================================
   CÁMARA DEL TELÉFONO
========================================================= */

function CameraBackground() {
  const videoRef = useRef(null);

  useEffect(() => {
    let stream;

    async function startCamera() {
      try {
        stream = await navigator.mediaDevices.getUserMedia({
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

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
        }
      } catch (error) {
        console.error("Error cámara:", error);
      }
    }

    startCamera();

    return () => {
      if (stream) {
        stream.getTracks().forEach((track) => {
          track.stop();
        });
      }
    };
  }, []);

  return (
    <video
      ref={videoRef}
      className="camera"
      autoPlay
      muted
      playsInline
    />
  );
}


/* =========================================================
   PARTÍCULAS
========================================================= */

function Particles({
  count = 5000,
}) {
  const pointsRef = useRef();

  const particles = React.useMemo(() => {
    const positions =
      new Float32Array(count * 3);

    const velocities =
      new Float32Array(count * 3);

    const random =
      new Float32Array(count);

    for (let i = 0; i < count; i++) {
      const i3 = i * 3;

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
        Math.random() * 2 -
        1;

      positions[i3 + 2] =
        Math.sin(angle) *
        radius;

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

      random[i] =
        Math.random() *
        Math.PI *
        2;
    }

    return {
      positions,
      velocities,
      random,
    };
  }, [count]);


  useFrame((state, delta) => {
    if (!pointsRef.current) {
      return;
    }

    const positions =
      pointsRef.current.geometry
        .attributes.position.array;

    const time =
      state.clock.elapsedTime;

    for (let i = 0; i < count; i++) {
      const i3 = i * 3;

      positions[i3 + 1] +=
        particles.velocities[i3 + 1] *
        delta;

      positions[i3] +=
        Math.sin(
          time +
          particles.random[i]
        ) *
        0.001;

      positions[i3 + 2] +=
        Math.cos(
          time +
          particles.random[i]
        ) *
        0.001;

      if (positions[i3 + 1] > 1) {
        positions[i3 + 1] = -1;
      }
    }

    pointsRef.current.geometry.attributes
      .position.needsUpdate = true;

    pointsRef.current.rotation.y +=
      delta * 0.15;
  });


  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={
            particles.positions.length / 3
          }
          array={particles.positions}
          itemSize={3}
        />
      </bufferGeometry>

      <pointsMaterial
        color="#00ffff"
        size={0.025}
        transparent
        opacity={0.9}
        depthWrite={false}
        blending={
          THREE.AdditiveBlending
        }
      />
    </points>
  );
}


/* =========================================================
   ESCENA
========================================================= */

function Scene() {
  return (
    <>
      <Particles count={5000} />
    </>
  );
}


/* =========================================================
   APP
========================================================= */

export default function App() {
  const [
    cameraStarted,
    setCameraStarted,
  ] = useState(false);

  const [
    error,
    setError,
  ] = useState("");

  async function startAR() {
    try {
      if (
        !navigator.mediaDevices ||
        !navigator.mediaDevices.getUserMedia
      ) {
        throw new Error(
          "Tu navegador no permite acceder a la cámara."
        );
      }

      await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: "environment",
        },
        audio: false,
      });

      setCameraStarted(true);

    } catch (err) {
      console.error(err);

      setError(
        "No se puede acceder a la cámara. Comprueba los permisos."
      );
    }
  }


  return (
    <div className="app">

      {!cameraStarted && (
        <div className="start-screen">

          <h1>
            ✨ AR Particles
          </h1>

          <p>
            Activa la cámara para comenzar
          </p>

          <button
            onClick={startAR}
          >
            Iniciar AR
          </button>

          {error && (
            <div className="error">
              {error}
            </div>
          )}

        </div>
      )}


      {cameraStarted && (
        <>
          <CameraBackground />

          <Canvas
            camera={{
              position: [
                0,
                0,
                3,
              ],
              fov: 60,
            }}
            gl={{
              alpha: true,
              antialias: true,
            }}
          >
            <Scene />
          </Canvas>

          <div className="ar-ui">
            <div className="badge">
              AR activa
            </div>
          </div>
        </>
      )}

    </div>
  );
}

