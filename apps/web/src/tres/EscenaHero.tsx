// Escena 3D del hero: un cristal de vidrio con núcleo luminoso, satélites en órbita y partículas.
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { Environment, Float, Lightformer, MeshTransmissionMaterial } from '@react-three/drei'
import { useMemo, useRef } from 'react'
import * as THREE from 'three'
import { prefiereMenosMovimiento } from './soporte'

const CIAN = '#38e8ff'
const VIOLETA = '#8b5cf6'
// Fondo que 've' el vidrio al refractar (el canvas es transparente y sin esto sale negro).
const FONDO_CRISTAL = new THREE.Color('#17204a')
const ICOSAEDRO = new THREE.IcosahedronGeometry(1.46, 0)

function Cristal({ quieto }: { quieto: boolean }) {
  const grupo = useRef<THREE.Group>(null)
  const nucleo = useRef<THREE.Mesh>(null)
  const { viewport } = useThree()
  const movil = viewport.aspect < 0.9
  const medio = viewport.aspect < 1.5

  useFrame(({ pointer, clock }, delta) => {
    const g = grupo.current
    if (!g) return
    const t = clock.elapsedTime
    if (!quieto) {
      g.rotation.y += delta * 0.18
      // Sigue levemente al mouse.
      g.rotation.x = THREE.MathUtils.lerp(g.rotation.x, pointer.y * -0.35, 0.04)
      g.rotation.z = THREE.MathUtils.lerp(g.rotation.z, pointer.x * 0.25, 0.04)
    }
    if (nucleo.current) {
      const s = 0.42 + Math.sin(t * 2.2) * 0.03
      nucleo.current.scale.setScalar(s)
    }
  })

  return (
    <group ref={grupo} position={movil ? [0, 2.3, 0] : [Math.max(1.8, viewport.width * 0.29), 0.2, 0]}
      scale={movil ? 0.55 : medio ? 0.8 : 1}>
      <Float speed={quieto ? 0 : 1.4} rotationIntensity={0.25} floatIntensity={0.9}>
        <mesh>
          <icosahedronGeometry args={[1.45, 0]} />
          <MeshTransmissionMaterial
            samples={6}
            resolution={512}
            backside
            backsideThickness={0.4}
            background={FONDO_CRISTAL}
            envMapIntensity={2.2}
            thickness={0.7}
            roughness={0.18}
            ior={1.4}
            chromaticAberration={0.05}
            anisotropy={0.2}
            distortion={0.2}
            distortionScale={0.3}
            temporalDistortion={0.06}
            color="#eaf9ff"
            attenuationColor="#9fe6ff"
            attenuationDistance={4}
          />
        </mesh>
        {/* Aristas del cristal */}
        <lineSegments>
          <edgesGeometry args={[ICOSAEDRO]} />
          <lineBasicMaterial color={CIAN} transparent opacity={0.55} />
        </lineSegments>
        {/* Núcleo emisivo */}
        <mesh ref={nucleo}>
          <sphereGeometry args={[1, 32, 32]} />
          <meshStandardMaterial color={VIOLETA} emissive={VIOLETA} emissiveIntensity={1.4} toneMapped={false} />
        </mesh>
        <pointLight color={VIOLETA} intensity={6} distance={6} />
      </Float>
      <Satelites quieto={quieto} />
    </group>
  )
}

// Tres anillos con esferas pequeñas (idea "molécula").
function Satelites({ quieto }: { quieto: boolean }) {
  const anillos = useRef<THREE.Group>(null)
  useFrame((_, delta) => {
    if (quieto || !anillos.current) return
    anillos.current.children.forEach((a, i) => {
      a.rotation.z += delta * (0.35 + i * 0.12) * (i % 2 ? -1 : 1)
    })
  })
  const orbitas = useMemo(
    () => [
      { radio: 2.3, inclinacion: 0.4, color: CIAN, n: 2 },
      { radio: 2.8, inclinacion: -0.9, color: VIOLETA, n: 3 },
      { radio: 3.3, inclinacion: 1.6, color: '#9ad7ff', n: 1 },
    ],
    [],
  )
  return (
    <group ref={anillos}>
      {orbitas.map((o, i) => (
        <group key={i} rotation={[o.inclinacion, i * 0.7, 0]}>
          <mesh>
            <torusGeometry args={[o.radio, 0.006, 8, 160]} />
            <meshBasicMaterial color={o.color} transparent opacity={0.35} />
          </mesh>
          {Array.from({ length: o.n }, (_, k) => {
            const ang = (k / o.n) * Math.PI * 2
            return (
              <mesh key={k} position={[Math.cos(ang) * o.radio, Math.sin(ang) * o.radio, 0]}>
                <sphereGeometry args={[0.09 - k * 0.015, 24, 24]} />
                <meshStandardMaterial color={o.color} emissive={o.color} emissiveIntensity={2} toneMapped={false} />
              </mesh>
            )
          })}
        </group>
      ))}
    </group>
  )
}

// Polvo estelar: 700 puntos con rotación lenta.
function Particulas({ quieto }: { quieto: boolean }) {
  const puntos = useRef<THREE.Points>(null)
  const posiciones = useMemo(() => {
    const n = 700
    const arr = new Float32Array(n * 3)
    for (let i = 0; i < n; i++) {
      const r = 4 + Math.random() * 9
      const th = Math.random() * Math.PI * 2
      const ph = Math.acos(2 * Math.random() - 1)
      arr[i * 3] = r * Math.sin(ph) * Math.cos(th)
      arr[i * 3 + 1] = r * Math.sin(ph) * Math.sin(th) * 0.6
      arr[i * 3 + 2] = r * Math.cos(ph) - 3
    }
    return arr
  }, [])
  useFrame((_, delta) => {
    if (quieto || !puntos.current) return
    puntos.current.rotation.y += delta * 0.02
    puntos.current.rotation.x += delta * 0.005
  })
  return (
    <points ref={puntos}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[posiciones, 3]} />
      </bufferGeometry>
      <pointsMaterial size={0.035} color={CIAN} transparent opacity={0.7} sizeAttenuation depthWrite={false} blending={THREE.AdditiveBlending} />
    </points>
  )
}

export default function EscenaHero({ activo = true }: { activo?: boolean }) {
  const quieto = prefiereMenosMovimiento()
  return (
    <Canvas
      dpr={[1, 1.5]}
      camera={{ position: [0, 0, 7.5], fov: 42 }}
      gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }}
      frameloop={quieto ? 'demand' : activo ? 'always' : 'never'}
      style={{ position: 'absolute', inset: 0 }}
    >
      <ambientLight intensity={0.25} />
      <pointLight position={[5, 4, 5]} color={CIAN} intensity={60} distance={20} />
      <pointLight position={[-5, -3, 4]} color={VIOLETA} intensity={50} distance={20} />
      <directionalLight position={[0, 5, -5]} intensity={0.6} color="#ffffff" />
      {/* Entorno sintético (sin descargar HDR): reflejos fríos para el vidrio. */}
      <Environment resolution={128}>
        <Lightformer form="rect" intensity={3} color={CIAN} position={[4, 3, -2]} scale={[4, 6, 1]} target={[0, 0, 0]} />
        <Lightformer form="rect" intensity={2.5} color={VIOLETA} position={[-5, -2, -1]} scale={[5, 5, 1]} target={[0, 0, 0]} />
        <Lightformer form="ring" intensity={1.5} color="#ffffff" position={[0, 6, 2]} scale={[3, 3, 1]} target={[0, 0, 0]} />
      </Environment>
      <Cristal quieto={quieto} />
      <Particulas quieto={quieto} />
    </Canvas>
  )
}
