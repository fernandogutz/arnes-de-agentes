// Desplazamiento suave reutilizable, respetando prefers-reduced-motion.

// Alto de la barra fija + un respiro, para no dejar el encabezado pegado al borde.
export const DESFASE_NAV = 88

export function prefiereMenosMovimiento(): boolean {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return false
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

// El scroll suave se anima con frames: en una pestaña oculta no avanza. Ahí saltamos directo.
function sinAnimacion(): boolean {
  return prefiereMenosMovimiento() || (typeof document !== 'undefined' && document.visibilityState === 'hidden')
}

// Lleva la ventana hasta dejar `nodo` justo bajo la barra fija. No hace nada si ya estamos ahí.
export function desplazarAlElemento(nodo: HTMLElement | null, desfase = DESFASE_NAV): void {
  if (!nodo || typeof window === 'undefined' || typeof window.scrollTo !== 'function') return
  const destino = Math.max(0, nodo.getBoundingClientRect().top + window.scrollY - desfase)
  if (Math.abs(destino - window.scrollY) < 2) return
  const opciones: ScrollToOptions = { top: destino, behavior: sinAnimacion() ? 'auto' : 'smooth' }
  try {
    window.scrollTo(opciones)
  } catch {
    window.scrollTo(0, destino)
  }
}
