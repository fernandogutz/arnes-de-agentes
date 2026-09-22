// Iconos SVG inline (trazo 1.6, 24x24). Sin dependencias.
import type { SVGProps } from 'react'

type Props = SVGProps<SVGSVGElement> & { tamano?: number }

const base = (tamano: number, props: Props) => ({
  width: tamano,
  height: tamano,
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.6,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
  'aria-hidden': true,
  ...props,
})

export const IconoEscaner = ({ tamano = 24, ...p }: Props) => (
  <svg {...base(tamano, p)}>
    <path d="M4 8V6a2 2 0 0 1 2-2h2M16 4h2a2 2 0 0 1 2 2v2M20 16v2a2 2 0 0 1-2 2h-2M8 20H6a2 2 0 0 1-2-2v-2" />
    <path d="M7 12h10" />
    <path d="M9 9.5c1-1.5 5-1.5 6 0M9 14.5c1 1.5 5 1.5 6 0" />
  </svg>
)

export const IconoRayos = ({ tamano = 24, ...p }: Props) => (
  <svg {...base(tamano, p)}>
    <circle cx="12" cy="12" r="3" />
    <path d="M12 2v3M12 19v3M2 12h3M19 12h3M4.9 4.9l2.1 2.1M17 17l2.1 2.1M4.9 19.1 7 17M17 7l2.1-2.1" />
  </svg>
)

export const IconoImplante = ({ tamano = 24, ...p }: Props) => (
  <svg {...base(tamano, p)}>
    <path d="M8 3h8l-1 5H9L8 3Z" />
    <path d="M10 8v9a2 2 0 0 0 4 0V8" />
    <path d="M10 11h4M10 14h4" />
    <path d="M12 19v2" />
  </svg>
)

export const IconoLaser = ({ tamano = 24, ...p }: Props) => (
  <svg {...base(tamano, p)}>
    <path d="M3 21 14 10" />
    <path d="M14 10l2-2 2 2-2 2-2-2Z" />
    <path d="M18 3v3M21 6h-3M19.5 4.5l-1 1" />
    <path d="M8.5 15.5c1.5-1 3.5-1 5 0" />
  </svg>
)

export const IconoPin = ({ tamano = 18, ...p }: Props) => (
  <svg {...base(tamano, p)}>
    <path d="M12 21s-6-5.3-6-11a6 6 0 1 1 12 0c0 5.7-6 11-6 11Z" />
    <circle cx="12" cy="10" r="2.2" />
  </svg>
)

export const IconoReloj = ({ tamano = 18, ...p }: Props) => (
  <svg {...base(tamano, p)}>
    <circle cx="12" cy="12" r="9" />
    <path d="M12 7v5l3 2" />
  </svg>
)

export const IconoTelefono = ({ tamano = 18, ...p }: Props) => (
  <svg {...base(tamano, p)}>
    <path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2Z" />
  </svg>
)

export const IconoFlecha = ({ tamano = 18, ...p }: Props) => (
  <svg {...base(tamano, p)}>
    <path d="M5 12h14M13 6l6 6-6 6" />
  </svg>
)

export const IconoCheck = ({ tamano = 24, ...p }: Props) => (
  <svg {...base(tamano, p)} strokeWidth={2.4}>
    <path d="M5 12.5 10 17.5 19 7" />
  </svg>
)

export const IconoComillas = ({ tamano = 28, ...p }: Props) => (
  <svg {...base(tamano, p)} fill="currentColor" stroke="none">
    <path d="M7.5 6C5 6 3 8 3 10.5V18h7v-7.5H6.5c0-1.4 1-2.5 2.5-2.5V6H7.5Zm10 0C15 6 13 8 13 10.5V18h7v-7.5h-3.5c0-1.4 1-2.5 2.5-2.5V6h-1.5Z" />
  </svg>
)

export const IconoMenu = ({ tamano = 22, ...p }: Props) => (
  <svg {...base(tamano, p)}>
    <path d="M4 7h16M4 12h16M4 17h16" />
  </svg>
)

export const IconoCerrar = ({ tamano = 22, ...p }: Props) => (
  <svg {...base(tamano, p)}>
    <path d="M6 6l12 12M18 6 6 18" />
  </svg>
)
