import { useId } from 'react'

// Marca de Nébula Dental: un diente con el degradado cian → violeta y la órbita alrededor.
// Vive en src/tres/ junto a las escenas 3D porque es la misma pieza en 2D, pero NO importa
// three: entra en el bundle principal (logo, favicon, fallback del hero sin WebGL).

// Silueta: corona ancha con dos raíces (viewBox de 64, el diente ocupa 13..51 × 7..58).
const DIENTE =
  'M32 7C43 7 51 13 51 24C51 33 47.5 39 46 47C45 53 43.5 58 39.5 58C36 58 35 50 33.5 45' +
  'C33 43.2 31 43.2 30.5 45C29 50 28 58 24.5 58C20.5 58 19 53 18 47C16.5 39 13 33 13 24' +
  'C13 13 21 7 32 7Z'

type Props = {
  className?: string
  /** Anillo en órbita alrededor del diente (la "nébula"). */
  orbita?: boolean
  /** Si se pasa, el SVG se anuncia con este título; si no, queda decorativo. */
  titulo?: string
}

export function DienteSvg({ className, orbita = true, titulo }: Props) {
  // useId trae ':' y no sirve dentro de url(#...): se limpia.
  const base = useId().replace(/[^a-zA-Z0-9-]/g, '')
  const grad = `nd-grad-${base}`
  const brillo = `nd-brillo-${base}`

  return (
    <svg
      viewBox="0 0 64 64"
      className={className}
      role={titulo ? 'img' : undefined}
      aria-hidden={titulo ? undefined : true}
      aria-label={titulo}
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <radialGradient id={grad} cx="34%" cy="26%" r="82%">
          <stop offset="0" stopColor="#ffffff" />
          <stop offset="0.3" stopColor="#38e8ff" />
          <stop offset="1" stopColor="#8b5cf6" />
        </radialGradient>
        <linearGradient id={brillo} x1="0.2" y1="0" x2="0.8" y2="1">
          <stop offset="0" stopColor="#ffffff" stopOpacity="0.55" />
          <stop offset="0.55" stopColor="#ffffff" stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={DIENTE} fill={`url(#${grad})`} />
      {/* Surco central: lo que hace que se lea como diente y no como gota. */}
      <path
        d="M32 16C32 16 30.4 24 30.6 31C30.7 34.8 32 38 32 38C32 38 33.3 34.8 33.4 31C33.6 24 32 16 32 16Z"
        fill="#06080f"
        fillOpacity="0.16"
      />
      <path d={DIENTE} fill={`url(#${brillo})`} />
      {orbita && (
        <ellipse
          className="marca-diente__orbita"
          cx="32"
          cy="32"
          rx="30"
          ry="10"
          fill="none"
          stroke="#38e8ff"
          strokeOpacity="0.7"
          strokeWidth="3"
        />
      )}
    </svg>
  )
}
