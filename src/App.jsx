/* eslint-disable react-hooks/purity */
import { useState, useEffect, useMemo, useRef } from 'react'
import '@google/model-viewer'
import { Canvas, useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import './App.css'

// ---------- Detección de navegador embebido (in-app browser) ----------
function detectarNavegadorEmbebido() {
  const ua = navigator.userAgent
  // Instagram, Facebook, WhatsApp, TikTok, Twitter/X, LinkedIn abren webviews propios
  return /Instagram|FBAN|FBAV|WhatsApp|TikTok|Twitter|LinkedInApp/i.test(ua)
}

// ---------- Shader de partículas (decorativo, solo desktop) ----------
const vertexShader = `
  uniform float uTime;
  attribute float aRandom;
  varying float vAlpha;

  void main() {
    vec3 pos = position;
    pos.y += sin(uTime * 1.5 + aRandom * 20.0) * 0.15;
    pos.x += cos(uTime * 1.2 + aRandom * 15.0) * 0.1;

    vAlpha = 0.3 + 0.5 * (0.5 + 0.5 * sin(uTime * 2.0 + aRandom * 30.0));

    vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
    gl_PointSize = (2.0 + aRandom * 4.0) * (150.0 / -mvPosition.z);
    gl_Position = projectionMatrix * mvPosition;
  }
`

const fragmentShader = `
  varying float vAlpha;
  void main() {
    float d = length(gl_PointCoord - vec2(0.5));
    if (d > 0.5) discard;
    float glow = 1.0 - smoothstep(0.0, 0.5, d);
    gl_FragColor = vec4(vec3(0.4, 0.9, 1.0), glow * vAlpha);
  }
`

function SistemaParticulas() {
  const materialRef = useRef()
  const count = 300

  const { positions, randoms } = useMemo(() => {
    const positions = new Float32Array(count * 3)
    const randoms = new Float32Array(count)
    for (let i = 0; i < count; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 8
      positions[i * 3 + 1] = (Math.random() - 0.5) * 5
      positions[i * 3 + 2] = (Math.random() - 0.5) * 8
      randoms[i] = Math.random()
    }
    return { positions, randoms }
  }, [])

  useFrame((state) => {
    if (materialRef.current) {
      materialRef.current.uniforms.uTime.value = state.clock.elapsedTime
    }
  })

  return (
    <points>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" count={count} array={positions} itemSize={3} />
        <bufferAttribute attach="attributes-aRandom" count={count} array={randoms} itemSize={1} />
      </bufferGeometry>
      <shaderMaterial
        ref={materialRef}
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
        uniforms={{ uTime: { value: 0 } }}
        transparent
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
  )
}

function CapaParticulasDecorativas() {
  return (
    <Canvas
      className="particulas-overlay"
      camera={{ position: [0, 0, 5], fov: 50 }}
      gl={{ alpha: true }}
    >
      <SistemaParticulas />
    </Canvas>
  )
}

// ---------- Pantalla de aviso para navegadores embebidos ----------
function AvisoNavegadorEmbebido() {
  return (
    <main className="ar-screen">
      <div className="ar-content">
        <div className="robot-icon">⚠️</div>
        <h1>Abre esto en tu navegador</h1>
        <p>
          Para ver a Robbi en realidad aumentada, toca el menú "···" y elige
          "Abrir en Safari" o "Abrir en Chrome".
        </p>
      </div>
    </main>
  )
}

// ---------- Visor principal con model-viewer ----------
function VisorModelo() {
  const esTouchDevice = useMemo(
    () => 'ontouchstart' in window || navigator.maxTouchPoints > 0,
    []
  )

  return (
    <main className="app">
      <model-viewer
        src="/models/robbi.glb"
        ios-src="/models/robbi.usdz"
        alt="Robbi, un modelo 3D"
        ar
        ar-modes="webxr scene-viewer quick-look"
        camera-controls
        auto-rotate
        shadow-intensity="1"
        exposure="1"
        environment-image="neutral"
        loading="eager"
        reveal="auto"
        style={{ width: '100%', height: '100%', backgroundColor: '#111' }}
      >
        <button slot="ar-button" className="ar-button">
          📱 Ver en tu espacio
        </button>

        <div slot="progress-bar" className="progress-bar-hidden" />
      </model-viewer>

      {!esTouchDevice && <CapaParticulasDecorativas />}

      <div className="desktop-ui">
        <h1>Robbi</h1>
        <p>Explora el modelo 3D — arrastra para rotar</p>
      </div>
    </main>
  )
}

function App() {
  const [embebido, setEmbebido] = useState(null)

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setEmbebido(detectarNavegadorEmbebido())
  }, [])

  if (embebido === null) return null // evita flash mientras se detecta

  if (embebido) return <AvisoNavegadorEmbebido />

  return <VisorModelo />
}

export default App