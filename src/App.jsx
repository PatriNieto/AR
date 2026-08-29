
import { Canvas } from '@react-three/fiber'
import {
  OrbitControls,
  useGLTF,
  Environment,
} from '@react-three/drei'

import './App.css'


/*
|--------------------------------------------------------------------------
| MODELO GLB
|--------------------------------------------------------------------------
*/

function ParticulasGLB() {
  const { scene } =
    useGLTF('/models/particles.glb')

  return (
    <primitive
      object={scene}
      scale={1}
      position={[0, 0, 0]}
    />
  )
}

useGLTF.preload(
  '/models/particles.glb'
)


/*
|--------------------------------------------------------------------------
| ESCENA 3D
|--------------------------------------------------------------------------
*/

function Escena3D() {
  return (
    <Canvas
      camera={{
        position: [0, 1.5, 4],
        fov: 50,
        near: 0.01,
        far: 100,
      }}
      dpr={[1, 2]}
    >

      <ambientLight
        intensity={1.5}
      />

      <directionalLight
        position={[3, 5, 3]}
        intensity={2}
      />

      <ParticulasGLB />

      <Environment preset="city" />

      <OrbitControls
        enableDamping
        dampingFactor={0.05}
      />

    </Canvas>
  )
}


/*
|--------------------------------------------------------------------------
| DETECTAR iOS
|--------------------------------------------------------------------------
*/

function esIOS() {
  return /iPhone|iPad|iPod/i.test(
    navigator.userAgent
  )
}


/*
|--------------------------------------------------------------------------
| PANTALLA AR
|--------------------------------------------------------------------------
*/

function PantallaAR() {
  return (
    <main className="ar-screen">

      <div className="ar-content">

        <div className="particle-icon">
          ✨
        </div>

        <h1>
          Partículas AR
        </h1>

        <p>
          Coloca la nube de partículas
          en tu espacio
        </p>


        <a
          rel="ar"
          href="/models/particles.usdz"
          className="ar-button"
        >
          📱 Ver en realidad aumentada
        </a>


        <span className="ar-hint">
          Apunta a una superficie plana
          y pulsa para colocarla
        </span>

      </div>

    </main>
  )
}


/*
|--------------------------------------------------------------------------
| APP
|--------------------------------------------------------------------------
*/

function App() {

  const iphone =
    esIOS()


  /*
   * iPhone / iPad
   *
   * Apple AR Quick Look
   */

  if (iphone) {
    return <PantallaAR />
  }


  /*
   * Android / Desktop
   *
   * Three.js
   */

  return (
    <main className="app">

      <Escena3D />

      <div className="desktop-ui">

        <h1>
          ✨ Partículas
        </h1>

        <p>
          Explora el sistema de partículas
        </p>

      </div>

    </main>
  )
}


export default App

