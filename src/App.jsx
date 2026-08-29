/* eslint-disable react-hooks/purity */
import { useMemo, useRef } from "react";
import * as THREE from "three";
import { Canvas, useFrame } from "@react-three/fiber";
import {
  XR,
  createXRStore,
  XRButton,
} from "@react-three/xr";

const xrStore = createXRStore();

/*
 * Sistema de partículas
 */
function ParticleSystem({
  count = 5000,
  radius = 2,
  color = "#00ffff",
}) {
  const pointsRef = useRef();

  const particles = useMemo(() => {
    const positions = new Float32Array(count * 3);
    const velocities = new Float32Array(count * 3);
    const offsets = new Float32Array(count);

    for (let i = 0; i < count; i++) {
      const i3 = i * 3;

      // Distribución inicial alrededor del origen
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);

      const r = Math.pow(Math.random(), 1 / 3) * radius;

      positions[i3] =
        r * Math.sin(phi) * Math.cos(theta);

      positions[i3 + 1] =
        r * Math.sin(phi) * Math.sin(theta);

      positions[i3 + 2] =
        r * Math.cos(phi);

      // Velocidad individual
      velocities[i3] =
        (Math.random() - 0.5) * 0.15;

      velocities[i3 + 1] =
        Math.random() * 0.25 + 0.02;

      velocities[i3 + 2] =
        (Math.random() - 0.5) * 0.15;

      offsets[i] = Math.random() * Math.PI * 2;
    }

    return {
      positions,
      velocities,
      offsets,
    };
  }, [count, radius]);

  useFrame((state, delta) => {
    if (!pointsRef.current) return;

    const positionAttribute =
      pointsRef.current.geometry.attributes.position;

    const array = positionAttribute.array;

    const time = state.clock.elapsedTime;

    for (let i = 0; i < count; i++) {
      const i3 = i * 3;

      let x = array[i3];
      let y = array[i3 + 1];
      let z = array[i3 + 2];

      // Movimiento vertical
      y +=
        particles.velocities[i3 + 1] *
        delta;

      // Movimiento orgánico
      x +=
        Math.sin(
          time * 1.5 + particles.offsets[i]
        ) *
        0.002;

      z +=
        Math.cos(
          time * 1.2 + particles.offsets[i]
        ) *
        0.002;

      // Si sale por arriba, vuelve abajo
      if (y > radius) {
        y = -radius;
      }

      // Mantener partículas dentro de un radio
      const distance = Math.sqrt(
        x * x + z * z
      );

      if (distance > radius) {
        x *= 0.98;
        z *= 0.98;
      }

      array[i3] = x;
      array[i3 + 1] = y;
      array[i3 + 2] = z;
    }

    positionAttribute.needsUpdate = true;

    // Rotación global
    pointsRef.current.rotation.y += delta * 0.08;
  });

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={particles.positions.length / 3}
          array={particles.positions}
          itemSize={3}
        />
      </bufferGeometry>

      <pointsMaterial
        color={color}
        size={0.025}
        sizeAttenuation
        transparent
        opacity={0.85}
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
}


/*
 * Esfera invisible que sirve como referencia
 * para colocar las partículas.
 */
function ParticleObject() {
  return (
    <group position={[0, 0, -1.5]}>
      <ParticleSystem
        count={6000}
        radius={1.5}
        color="#00ffff"
      />

      {/* Pequeño núcleo luminoso */}
      <mesh>
        <sphereGeometry args={[0.08, 16, 16]} />

        <meshBasicMaterial
          color="#ffffff"
          transparent
          opacity={0.9}
        />
      </mesh>
    </group>
  );
}


/*
 * Escena 3D
 */
function Scene() {
  return (
    <>
      <ambientLight intensity={1} />

      <ParticleObject />
    </>
  );
}


/*
 * Aplicación
 */
export default function App() {
  return (
    <div className="app">
      <Canvas
        camera={{
          position: [0, 0, 0],
          fov: 70,
          near: 0.01,
          far: 100,
        }}
        gl={{
          antialias: true,
          alpha: true,
        }}
      >
        <XR store={xrStore}>
          <Scene />
        </XR>
      </Canvas>

      <div className="ui">
        <h1>AR Particles</h1>

        <p>
          Apunta la cámara hacia una superficie
          y entra en modo AR.
        </p>

        <XRButton
          store={xrStore}
          mode="immersive-ar"
          sessionInit={{
            requiredFeatures: ["hit-test"],
            optionalFeatures: [
              "dom-overlay",
              "anchors",
            ],
          }}
          className="ar-button"
        >
          Entrar en AR
        </XRButton>
      </div>
    </div>
  );
}