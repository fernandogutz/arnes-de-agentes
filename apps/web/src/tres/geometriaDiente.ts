// Geometría dental generada por código (sin modelos externos ni loaders).
//
// Cada diente se arma como un sólido de revolución deformado:
//   1. Corona: aros apilados sobre un perfil vertical (Catmull-Rom) con sección
//      superelíptica (cuadrada-redondeada = molar, aplanada = incisivo) y una
//      tapa oclusal con cúspides, surcos y fosa central.
//   2. Raíces: uno o dos tubos que salen desde dentro de la corona, curvados por
//      una bézier cuadrática y afinados hasta el ápice.
// La línea cervical (cuello) queda en y = 0: así todos los tipos se alinean en la
// arcada aunque tengan coronas de distinto alto.
import * as THREE from 'three'

export type TipoDiente = 'molar' | 'premolar' | 'canino' | 'incisivo'
export type Calidad = 'alta' | 'media' | 'baja'

type Raiz = {
  /** Punto de salida en el plano XZ (dentro de la corona). */
  x: number
  z: number
  /** Ápice: hacia dónde se abre la raíz. */
  xApice: number
  zApice: number
  radio: number
  largo: number
  /** < 1 achata la raíz en Z (las raíces no son cilindros perfectos). */
  achatado: number
}

type Receta = {
  /** Semiancho mesio-distal (X) y vestíbulo-lingual (Z). */
  a: number
  b: number
  /** Exponente de la superelipse: 2 = elipse, 4 = casi cuadrado. */
  n: number
  /** Perfil vertical: alturas y escalas horizontales en u equiespaciado (0 = polo inferior, 1 = borde oclusal). */
  alturas: number[]
  escalas: number[]
  /** Nº de cúspides alrededor (0 = corona lisa) y desfase para ubicarlas. */
  crestas: number
  faseCresta: number
  ampCuspide: number
  /** Profundidad de la fosa central (molares y premolares). */
  ampFosa: number
  /** Altura de la cúspide única central (caninos). */
  ampPico: number
  raices: Raiz[]
}

const SEGMENTOS: Record<Calidad, { P: number; V: number; S: number; T: number }> = {
  // P = segmentos alrededor, V = aros de la corona, S = aros de la tapa oclusal, T = aros por raíz.
  alta: { P: 48, V: 30, S: 8, T: 16 },
  media: { P: 28, V: 20, S: 6, T: 12 },
  baja: { P: 16, V: 12, S: 4, T: 8 },
}

const RECETAS: Record<TipoDiente, Receta> = {
  // Molar inferior: corona cuadrada con 4 cúspides y dos raíces divergentes.
  molar: {
    a: 0.5,
    b: 0.44,
    n: 3.4,
    alturas: [-0.3, -0.26, -0.16, 0, 0.22, 0.44, 0.62, 0.75],
    escalas: [0, 0.42, 0.62, 0.72, 0.95, 1, 0.98, 0.88],
    crestas: 4,
    faseCresta: 0,
    ampCuspide: 0.085,
    ampFosa: 0.075,
    ampPico: 0,
    raices: [
      { x: -0.11, z: 0, xApice: -0.3, zApice: 0.04, radio: 0.155, largo: 1.3, achatado: 0.78 },
      { x: 0.11, z: 0, xApice: 0.28, zApice: -0.03, radio: 0.15, largo: 1.22, achatado: 0.78 },
    ],
  },
  // Premolar: dos cúspides (vestibular y lingual) separadas por un surco, una raíz.
  premolar: {
    a: 0.36,
    b: 0.42,
    n: 3,
    alturas: [-0.28, -0.24, -0.14, 0, 0.22, 0.44, 0.6, 0.72],
    escalas: [0, 0.45, 0.66, 0.76, 0.96, 1, 0.96, 0.8],
    crestas: 2,
    faseCresta: 0,
    ampCuspide: 0.13,
    ampFosa: 0.05,
    ampPico: 0,
    raices: [{ x: 0, z: 0, xApice: 0.04, zApice: 0.02, radio: 0.155, largo: 1.35, achatado: 0.68 }],
  },
  // Canino: una sola cúspide en punta y la raíz más larga de la boca.
  canino: {
    a: 0.34,
    b: 0.38,
    n: 2.6,
    alturas: [-0.28, -0.24, -0.14, 0, 0.24, 0.48, 0.66, 0.78],
    escalas: [0, 0.42, 0.64, 0.74, 0.95, 1, 0.92, 0.6],
    crestas: 2,
    faseCresta: 0,
    ampCuspide: 0.03,
    ampFosa: 0,
    ampPico: 0.32,
    raices: [{ x: 0, z: 0, xApice: 0.03, zApice: 0.03, radio: 0.16, largo: 1.6, achatado: 0.74 }],
  },
  // Incisivo: pala plana que se ensancha hacia el borde incisal.
  incisivo: {
    a: 0.42,
    b: 0.19,
    n: 2.4,
    alturas: [-0.26, -0.22, -0.12, 0, 0.26, 0.5, 0.68, 0.82],
    escalas: [0, 0.4, 0.62, 0.7, 0.9, 0.99, 1, 0.96],
    crestas: 2,
    faseCresta: Math.PI, // cresta a lo largo de X: borde incisal.
    ampCuspide: 0.035,
    ampFosa: 0,
    ampPico: 0.03,
    raices: [{ x: 0, z: 0, xApice: 0.02, zApice: -0.04, radio: 0.135, largo: 1.28, achatado: 0.7 }],
  },
}

/** Catmull-Rom uniforme sobre valores equiespaciados en [0, 1]. */
function interpolar(valores: number[], t: number): number {
  const n = valores.length - 1
  const x = Math.min(Math.max(t, 0), 1) * n
  const i = Math.min(Math.floor(x), n - 1)
  const f = x - i
  const p0 = valores[Math.max(i - 1, 0)] as number
  const p1 = valores[i] as number
  const p2 = valores[i + 1] as number
  const p3 = valores[Math.min(i + 2, n)] as number
  return (
    0.5 *
    (2 * p1 + (-p0 + p2) * f + (2 * p0 - 5 * p1 + 4 * p2 - p3) * f * f + (-p0 + 3 * p1 - 3 * p2 + p3) * f * f * f)
  )
}

/** Radio de una superelipse de semiejes a/b y exponente n. */
function radioSuper(phi: number, a: number, b: number, n: number): number {
  const cx = Math.abs(Math.cos(phi) / a)
  const cz = Math.abs(Math.sin(phi) / b)
  return 1 / Math.pow(Math.pow(cx, n) + Math.pow(cz, n), 1 / n)
}

function suavizar(borde0: number, borde1: number, x: number): number {
  const t = Math.min(Math.max((x - borde0) / (borde1 - borde0), 0), 1)
  return t * t * (3 - 2 * t)
}

/** Acumula vértices e índices; el orden de los quads deja las normales hacia fuera. */
class Constructor {
  private pos: number[] = []
  private idx: number[] = []

  vertice(x: number, y: number, z: number): number {
    this.pos.push(x, y, z)
    return this.pos.length / 3 - 1
  }

  private tri(a: number, b: number, c: number) {
    this.idx.push(a, b, c)
  }

  /** Une dos aros cerrados del mismo largo (inferior → superior). */
  unir(inferior: number[], superior: number[]) {
    const n = inferior.length
    for (let i = 0; i < n; i++) {
      const j = (i + 1) % n
      const a = inferior[i] as number
      const b = superior[i] as number
      const c = superior[j] as number
      const d = inferior[j] as number
      this.tri(a, b, c)
      this.tri(a, c, d)
    }
  }

  /** Cierra un aro contra un vértice polar. `arriba` = el polo está sobre el aro. */
  abanico(polo: number, aro: number[], arriba: boolean) {
    const n = aro.length
    for (let i = 0; i < n; i++) {
      const j = (i + 1) % n
      const a = aro[i] as number
      const b = aro[j] as number
      if (arriba) this.tri(polo, b, a)
      else this.tri(polo, a, b)
    }
  }

  geometria(): THREE.BufferGeometry {
    const g = new THREE.BufferGeometry()
    g.setAttribute('position', new THREE.Float32BufferAttribute(this.pos, 3))
    g.setIndex(this.idx)
    g.computeVertexNormals()
    g.computeBoundingBox()
    g.computeBoundingSphere()
    return g
  }
}

function construirCorona(c: Constructor, r: Receta, seg: { P: number; V: number; S: number }) {
  const { P, V, S } = seg
  const cresta = (phi: number) => (r.crestas === 0 ? 0 : -Math.cos(r.crestas * phi + r.faseCresta))

  let polo = -1
  const aros: number[][] = []
  for (let v = 0; v <= V; v++) {
    const t = v / V
    const escala = interpolar(r.escalas, t)
    const base = interpolar(r.alturas, t)
    if (escala < 1e-3) {
      polo = c.vertice(0, base, 0)
      continue
    }
    const aro: number[] = []
    for (let p = 0; p < P; p++) {
      const phi = (p / P) * Math.PI * 2
      const radio = escala * radioSuper(phi, r.a, r.b, r.n)
      const y = base + r.ampCuspide * cresta(phi) * suavizar(0.55, 1, t)
      aro.push(c.vertice(radio * Math.cos(phi), y, radio * Math.sin(phi)))
    }
    aros.push(aro)
  }

  if (polo >= 0 && aros[0]) c.abanico(polo, aros[0], false)
  for (let i = 0; i < aros.length - 1; i++) c.unir(aros[i] as number[], aros[i + 1] as number[])

  // Tapa oclusal: aros concéntricos desde el borde hacia el centro.
  const escalaBorde = interpolar(r.escalas, 1)
  const yBorde = interpolar(r.alturas, 1)
  const alturaTapa = (phi: number, s: number) =>
    yBorde +
    r.ampCuspide * cresta(phi) * suavizar(0.25, 1, s) -
    r.ampFosa * Math.pow(1 - s, 1.5) +
    r.ampPico * Math.pow(1 - s, 1.4)

  let anterior = aros[aros.length - 1] as number[]
  for (let k = 1; k < S; k++) {
    const s = 1 - k / S
    const aro: number[] = []
    for (let p = 0; p < P; p++) {
      const phi = (p / P) * Math.PI * 2
      const radio = s * escalaBorde * radioSuper(phi, r.a, r.b, r.n)
      aro.push(c.vertice(radio * Math.cos(phi), alturaTapa(phi, s), radio * Math.sin(phi)))
    }
    c.unir(aro, anterior)
    anterior = aro
  }
  const centro = c.vertice(0, alturaTapa(0, 0), 0)
  c.abanico(centro, anterior, true)
}

function construirRaiz(c: Constructor, raiz: Raiz, yInicio: number, seg: { P: number; T: number }) {
  const P = Math.max(8, Math.round(seg.P / 2))
  const T = seg.T
  const p0 = new THREE.Vector3(raiz.x, yInicio, raiz.z)
  const p2 = new THREE.Vector3(raiz.xApice, yInicio - raiz.largo, raiz.zApice)
  const p1 = new THREE.Vector3(raiz.x * 0.75, yInicio - raiz.largo * 0.45, raiz.z * 0.5)

  const punto = (t: number) => {
    const u = 1 - t
    return new THREE.Vector3(
      u * u * p0.x + 2 * u * t * p1.x + t * t * p2.x,
      u * u * p0.y + 2 * u * t * p1.y + t * t * p2.y,
      u * u * p0.z + 2 * u * t * p1.z + t * t * p2.z,
    )
  }
  const radio = (t: number) => raiz.radio * Math.pow(Math.max(1 - Math.pow(t, 1.9), 0), 0.62)

  const aros: number[][] = []
  for (let k = 0; k < T; k++) {
    const t = k / T
    const p = punto(t)
    const rr = radio(t)
    const aro: number[] = []
    for (let i = 0; i < P; i++) {
      const phi = (i / P) * Math.PI * 2
      aro.push(c.vertice(p.x + rr * Math.cos(phi), p.y, p.z + rr * Math.sin(phi) * raiz.achatado))
    }
    aros.push(aro)
  }
  // El aro 0 queda dentro de la corona: se tapa para que el sólido quede cerrado.
  const tapa = c.vertice(p0.x, p0.y + 0.02, p0.z)
  c.abanico(tapa, aros[0] as number[], true)
  for (let i = 0; i < aros.length - 1; i++) c.unir(aros[i + 1] as number[], aros[i] as number[])
  const apice = punto(1)
  const polo = c.vertice(apice.x, apice.y, apice.z)
  c.abanico(polo, aros[aros.length - 1] as number[], false)
}

const cache = new Map<string, THREE.BufferGeometry>()

/**
 * Geometría de un diente. Se memoiza por tipo+calidad: la arcada reusa 4 geometrías
 * para 14 piezas.
 */
export function crearDienteGeometria(tipo: TipoDiente, calidad: Calidad = 'media'): THREE.BufferGeometry {
  const clave = `${tipo}:${calidad}`
  const previa = cache.get(clave)
  if (previa) return previa

  const receta = RECETAS[tipo]
  const seg = SEGMENTOS[calidad]
  const c = new Constructor()
  construirCorona(c, receta, seg)
  // Las raíces arrancan dentro del cuerpo de la corona para que la unión no se vea.
  const yInicio = (receta.alturas[0] as number) + 0.18
  for (const raiz of receta.raices) construirRaiz(c, raiz, yInicio, seg)
  const g = c.geometria()
  cache.set(clave, g)
  return g
}

/** Centro vertical de la pieza (para colgarla centrada de un grupo). */
export function centroVertical(g: THREE.BufferGeometry): number {
  if (!g.boundingBox) g.computeBoundingBox()
  const bb = g.boundingBox
  return bb ? (bb.min.y + bb.max.y) / 2 : 0
}

/** Dentadura de una arcada: 14 piezas, de incisivo central a segundo molar. */
export const ARCADA: TipoDiente[] = ['incisivo', 'incisivo', 'canino', 'premolar', 'premolar', 'molar', 'molar']

export function tipoPorIndice(i: number, total: number): TipoDiente {
  const d = Math.abs(i - (total - 1) / 2)
  const paso = Math.min(Math.floor(d), ARCADA.length - 1)
  return ARCADA[paso] as TipoDiente
}
