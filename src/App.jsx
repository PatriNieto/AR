/* eslint-disable react-hooks/purity */
import { useRef, useState, useMemo, useEffect } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { XR, createXRStore, useXRHitTest } from '@react-three/xr'
import * as THREE from 'three'
import './App.css'

const store = createXRStore()

// ---------- Shader de partículas ----------
const vertexShader = `
  uniform float uTime;
  attribute float aRandom;
  varying float vAlpha;

  void main() {
    vec3 pos = position;
    pos.y += sin(uTime * 1.5 + aRandom * 20.0) * 0.03;
    pos.x += cos(uTime * 1.2 + aRandom * 15.0) * 0.02;

    vAlpha = 0.4 + 0.6 * sin(uTime * 2.0 + aRandom * 30.0) * 0.5 + 0.5;

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

// ---------- Sistema de partículas ----------
function SistemaParticulas({ position }) {
  const materialRef = useRef()
  const count = 400

  const { positions, randoms } = useMemo(() => {
    const positions = new Float32Array(count * 3)
    const randoms = new Float32Array(count)
    for (let i = 0; i < count; i++) {
      const r = 0.25 * Math.cbrt(Math.random())
      const theta = Math.random() * Math.PI * 2
      const phi = Math.acos(2 * Math.random() - 1)
      positions[i * 3] = r * Math.sin(phi) * Math.cos(theta)
      positions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta) + 0.15
      positions[i * 3 + 2] = r * Math.cos(phi)
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
    <points position={position}>
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

// ---------- Retícula de colocación (hit-test) ----------
function Reticulo({ onHit }) {
  const ref = useRef()
  const [visible, setVisible] = useState(false)

  useXRHitTest((hitTestResults, getWorldMatrix) => {
    if (hitTestResults.length === 0) {
      setVisible(false)
      return
    }
    const matrix = new THREE.Matrix4()
    getWorldMatrix(matrix, hitTestResults[0])
    if (ref.current) {
      matrix.decompose(ref.current.position, ref.current.quaternion, ref.current.scale)
      onHit(ref.current.position.clone())
    }
    setVisible(true)
  }, 'viewer')

  return (
    <mesh ref={ref} visible={visible} rotation-x={-Math.PI / 2}>
      <ringGeometry args={[0.06, 0.08, 32]} />
      <meshBasicMaterial color="white" transparent opacity={0.8} />
    </mesh>
  )
}

// ---------- Escena AR (Android) ----------
function EscenaAR() {
  const [posActual, setPosActual] = useState(null)
  const [colocadas, setColocadas] = useState([])

  useEffect(() => {
    const onSelect = () => {
      if (posActual) {
        setColocadas((prev) => [...prev, posActual])
      }
    }
    window.addEventListener('xr-select', onSelect)
    return () => window.removeEventListener('xr-select', onSelect)
  }, [posActual])

  return (
    <>
      <ambientLight intensity={0.8} />
      <Reticulo onHit={setPosActual} />
      {colocadas.map((pos, i) => (
        <SistemaParticulas key={i} position={pos} />
      ))}
    </>
  )
}

function PantallaAR_Android() {
  return (
    <main className="ar-screen">
      <Canvas events={undefined} onCreated={({ gl }) => {
        gl.xr.addEventListener('sessionstart', () => {
          const session = gl.xr.getSession()
          session.addEventListener('select', () => {
            window.dispatchEvent(new Event('xr-select'))
          })
        })
      }}>
        <XR store={store}>
          <EscenaAR />
        </XR>
      </Canvas>

      <button className="ar-button-overlay" onClick={() => store.enterAR()}>
        📱 Entrar en AR
      </button>
      <p className="ar-hint">Apunta a una superficie y toca para colocar partículas</p>
    </main>
  )
}

// ---------- Pseudo-AR para iOS (cámara + overlay, sin tracking real) ----------
function PantallaAR_iOS() {
  const videoRef = useRef()

  useEffect(() => {
    navigator.mediaDevices
      .getUserMedia({ video: { facingMode: 'environment' } })
      .then((stream) => {
        if (videoRef.current) videoRef.current.srcObject = stream
      })
      .catch((err) => console.error('No se pudo acceder a la cámara', err))
  }, [])

  return (
    <main className="ar-screen">
      <video ref={videoRef} autoPlay playsInline muted className="camera-bg" />
      <Canvas
        className="canvas-overlay"
        camera={{ position: [0, 0, 1.5], fov: 50 }}
        gl={{ alpha: true }}
      >
        <ambientLight intensity={0.8} />
        <SistemaParticulas position={[0, 0, 0]} />
      </Canvas>
      <p className="ar-hint">
        Vista previa (iOS no soporta WebXR — esto no está anclado al mundo real)
      </p>
    </main>
  )
}

// ---------- Vista de escritorio ----------
function EscenaEscritorio() {
  return (
    <Canvas camera={{ position: [0, 0, 1.5], fov: 50 }}>
      <ambientLight intensity={0.8} />
      <SistemaParticulas position={[0, 0, 0]} />
    </Canvas>
  )
}

// ---------- App ----------
function detectarPlataforma() {
  const ua = navigator.userAgent
  return {
    esIOS: /iPhone|iPad|iPod/i.test(ua),
    esAndroid: /Android/i.test(ua),
  }
}

function App() {
  const [plataforma, setPlataforma] = useState(null)

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setPlataforma(detectarPlataforma())
  }, [])

  if (!plataforma) return null

  if (plataforma.esAndroid) return <PantallaAR_Android />
  if (plataforma.esIOS) return <PantallaAR_iOS />

  return (
    <main className="app">
      <EscenaEscritorio />
    </main>
  )
}

export default App