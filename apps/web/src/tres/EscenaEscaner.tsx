// Escena chica para la sección de tecnología: una arcada dental real que un escáner recorre y "digitaliza".
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { useLayoutEffect, useMemo, useRef } from 'react'
import * as THREE from 'three'
import { crearDienteGeometria, tipoPorIndice } from './geometriaDiente'
import { prefiereMenosMovimiento } from './soporte'

const CIAN = '#38e8ff'
const N_DIENTES = 14
// Arcada elíptica: incisivos al frente (+Z), segundos molares al fondo.
const ANG_MAX = 1.45
const RADIO_X = 2.2
const RADIO_Z = 2.0
const CORRIMIENTO_Z = -1
const ESCALA_DIENTE = 0.5

function anguloDiente(i: number): number {
  return (i / (N_DIENTES - 1) - 0.5) * 2 * ANG_MAX
}

/** Posición de la pieza i sobre la arcada (i puede ser fraccionario: lo usa el cabezal). */
function posicionDiente(i: number): [number, number, number] {
  const th = anguloDiente(i)
  return [RADIO_X * Math.sin(th), 0, RADIO_Z * Math.cos(th) + CORRIMIENTO_Z]
}

/** Aleja la cámara lo justo para que la arcada entre completa en el ancho que haya. */
function CamaraQueEncuadra() {
  const { camera, size } = useThree()
  useLayoutEffect(() => {
    const aspecto = size.width / Math.max(size.height, 1)
    const cam = camera as THREE.PerspectiveCamera
    const medioFovV = THREE.MathUtils.degToRad(cam.fov ?? 38) / 2
    // Semiancho a cubrir: media arcada + el vaivén del grupo.
    const distancia = THREE.MathUtils.clamp(2.45 / (Math.tan(medioFovV) * aspecto), 5, 9)
    camera.position.set(0, distancia * 0.56, distancia * 0.83)
    camera.lookAt(0, -0.15, 0)
    camera.updateProjectionMatrix()
  }, [camera, size])
  return null
}

function Arcada({ quieto }: { quieto: boolean }) {
  const grupo = useRef<THREE.Group>(null)
  const escaner = useRef<THREE.Group>(null)
  const solidos = useRef<(THREE.Mesh | null)[]>([])
  const mallas = useRef<(THREE.Mesh | null)[]>([])

  // 14 piezas que reusan 4 geometrías (incisivo, canino, premolar, molar) en dos resoluciones.
  const piezas = useMemo(
    () =>
      Array.from({ length: N_DIENTES }, (_, i) => {
        const tipo = tipoPorIndice(i, N_DIENTES)
        return {
          tipo,
          posicion: posicionDiente(i),
          angulo: anguloDiente(i),
          geo: crearDienteGeometria(tipo, 'media'),
          geoBaja: crearDienteGeometria(tipo, 'baja'),
        }
      }),
    [],
  )

  useFrame(({ clock }) => {
    const t = clock.elapsedTime
    if (grupo.current) grupo.current.rotation.y = quieto ? 0 : Math.sin(t * 0.35) * 0.3
    // El escáner va y vuelve por la arcada; las piezas ya recorridas pasan a malla cian.
    const progreso = quieto ? 0.5 : (Math.sin(t * 0.7 - Math.PI / 2) + 1) / 2
    const idx = progreso * (N_DIENTES - 1)
    if (escaner.current) {
      const [x, , z] = posicionDiente(idx)
      escaner.current.position.set(x, 0.85, z)
      escaner.current.rotation.y = anguloDiente(idx)
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
    <group ref={grupo} position={[0, -0.05, 0]} scale={0.95}>
      {piezas.map((p, i) => (
        <group key={i} position={p.posicion} rotation={[0, p.angulo, 0]} scale={ESCALA_DIENTE}>
          <mesh
            geometry={p.geo}
            ref={(el) => {
              solidos.current[i] = el
            }}
          >
            <meshPhysicalMaterial color="#f4f6fb" roughness={0.28} clearcoat={1} clearcoatRoughness={0.12} />
          </mesh>
          <mesh
            geometry={p.geoBaja}
            ref={(el) => {
              mallas.current[i] = el
            }}
            visible={false}
            scale={1.01}
          >
            <meshBasicMaterial color={CIAN} wireframe transparent opacity={0.85} />
          </mesh>
        </group>
      ))}
      {/* Cabezal del escáner con haz de luz */}
      <group ref={escaner}>
        <mesh>
          <boxGeometry args={[0.5, 0.12, 0.3]} />
          <meshStandardMaterial color="#1a2140" metalness={0.6} roughness={0.3} />
        </mesh>
        <mesh position={[0, -0.45, 0]} rotation={[Math.PI, 0, 0]}>
          <coneGeometry args={[0.5, 0.9, 4, 1, true]} />
          <meshBasicMaterial color={CIAN} transparent opacity={0.14} side={THREE.DoubleSide} depthWrite={false} />
        </mesh>
        <pointLight color={CIAN} intensity={8} distance={3} position={[0, -0.3, 0]} />
      </group>
      {/* Base con rejilla: las raíces quedan bajo la línea del hueso, como en un escáner 3D */}
      <gridHelper args={[8, 24, '#1c2547', '#141a33']} position={[0, -0.92, 0]} />
    </group>
  )
}

export default function EscenaEscaner({ activo = true }: { activo?: boolean }) {
  const quieto = prefiereMenosMovimiento()
  return (
    <Canvas
      dpr={[1, 1.5]}
      camera={{ position: [0, 3, 4.4], fov: 38 }}
      gl={{ antialias: true, alpha: true }}
      frameloop={quieto ? 'demand' : activo ? 'always' : 'never'}
      style={{ position: 'absolute', inset: 0 }}
    >
      <CamaraQueEncuadra />
      <ambientLight intensity={0.5} />
      <directionalLight position={[3, 5, 4]} intensity={2} />
      <pointLight position={[-4, 2, 2]} color="#8b5cf6" intensity={20} distance={12} />
      <Arcada quieto={quieto} />
    </Canvas>
  )
}
