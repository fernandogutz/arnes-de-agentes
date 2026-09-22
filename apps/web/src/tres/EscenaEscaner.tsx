// Escena chica para la sección de tecnología: una arcada dental que un escáner recorre y "digitaliza".
import { Canvas, useFrame } from '@react-three/fiber'
import { useMemo, useRef } from 'react'
import * as THREE from 'three'
import { prefiereMenosMovimiento } from './soporte'

const CIAN = '#38e8ff'
const N_DIENTES = 14

// Posición de cada diente sobre una parábola abierta hacia la cámara.
function posicionDiente(i: number): [number, number, number] {
  const t = (i / (N_DIENTES - 1) - 0.5) * 2 // -1..1
  return [t * 2.4, 0, -Math.pow(t, 2) * 2.2 + 1.1]
}

function Arcada({ quieto }: { quieto: boolean }) {
  const grupo = useRef<THREE.Group>(null)
  const escaner = useRef<THREE.Group>(null)
  const solidos = useRef<(THREE.Mesh | null)[]>([])
  const mallas = useRef<(THREE.Mesh | null)[]>([])
  const posiciones = useMemo(() => Array.from({ length: N_DIENTES }, (_, i) => posicionDiente(i)), [])

  useFrame(({ clock }) => {
    const t = clock.elapsedTime
    if (grupo.current) grupo.current.rotation.y = quieto ? 0 : Math.sin(t * 0.35) * 0.35
    // El escáner va y vuelve por la arcada; los dientes ya recorridos pasan a malla cian.
    const progreso = quieto ? 0.5 : (Math.sin(t * 0.7 - Math.PI / 2) + 1) / 2
    const idx = progreso * (N_DIENTES - 1)
    if (escaner.current) {
      const [x, , z] = posicionDiente(idx)
      escaner.current.position.set(x, 0.9, z)
    }
    for (let i = 0; i < N_DIENTES; i++) {
      const escaneado = i <= idx
      const s = solidos.current[i]
      const m = mallas.current[i]
      if (s) s.visible = !escaneado
      if (m) m.visible = escaneado
    }
  })

  return (
    <group ref={grupo} position={[0, -0.3, 0]}>
      {posiciones.map((p, i) => {
        const alto = 0.55 + Math.abs(i - (N_DIENTES - 1) / 2) * 0.035
        return (
          <group key={i} position={p} rotation={[0, -Math.atan2(p[0], 2), 0]}>
            <mesh
              ref={(el) => {
                solidos.current[i] = el
              }}
            >
              <capsuleGeometry args={[0.16, alto, 6, 14]} />
              <meshPhysicalMaterial color="#f4f6fb" roughness={0.25} clearcoat={1} clearcoatRoughness={0.1} />
            </mesh>
            <mesh
              ref={(el) => {
                mallas.current[i] = el
              }}
              visible={false}
            >
              <capsuleGeometry args={[0.165, alto, 3, 8]} />
              <meshBasicMaterial color={CIAN} wireframe transparent opacity={0.9} />
            </mesh>
          </group>
        )
      })}
      {/* Cabezal del escáner con haz de luz */}
      <group ref={escaner}>
        <mesh>
          <boxGeometry args={[0.5, 0.12, 0.3]} />
          <meshStandardMaterial color="#1a2140" metalness={0.6} roughness={0.3} />
        </mesh>
        <mesh position={[0, -0.5, 0]} rotation={[Math.PI, 0, 0]}>
          <coneGeometry args={[0.55, 1, 4, 1, true]} />
          <meshBasicMaterial color={CIAN} transparent opacity={0.14} side={THREE.DoubleSide} depthWrite={false} />
        </mesh>
        <pointLight color={CIAN} intensity={8} distance={3} position={[0, -0.3, 0]} />
      </group>
      {/* Base con rejilla */}
      <gridHelper args={[8, 24, '#1c2547', '#141a33']} position={[0, -0.55, 0]} />
    </group>
  )
}

export default function EscenaEscaner({ activo = true }: { activo?: boolean }) {
  const quieto = prefiereMenosMovimiento()
  return (
    <Canvas
      dpr={[1, 1.5]}
      camera={{ position: [0, 2.2, 5.2], fov: 38 }}
      gl={{ antialias: true, alpha: true }}
      frameloop={quieto ? 'demand' : activo ? 'always' : 'never'}
      onCreated={({ camera }) => camera.lookAt(0, -0.2, 0)}
      style={{ position: 'absolute', inset: 0 }}
    >
      <ambientLight intensity={0.5} />
      <directionalLight position={[3, 5, 4]} intensity={2} />
      <pointLight position={[-4, 2, 2]} color="#8b5cf6" intensity={20} distance={12} />
      <Arcada quieto={quieto} />
    </Canvas>
  )
}
