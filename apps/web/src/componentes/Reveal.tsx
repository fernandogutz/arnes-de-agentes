import { createElement, useEffect, useRef, type CSSProperties, type ReactNode } from 'react'

type Props = { children: ReactNode; retraso?: number; className?: string; as?: 'div' | 'section' | 'article' | 'li' }

// Envuelve contenido y lo hace aparecer al entrar en pantalla. La animación es un plus:
// el contenido es visible por defecto (CSS) y solo se oculta si JS confirma que está bajo
// el viewport. Tres vías lo destapan: IntersectionObserver, cualquier scroll, y un tope de tiempo.
export function Reveal({ children, retraso = 0, className = '', as = 'div' }: Props) {
  const ref = useRef<HTMLElement>(null)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const bajoElViewport = () => el.getBoundingClientRect().top > window.innerHeight - 40
    if (typeof IntersectionObserver === 'undefined' || !bajoElViewport()) return

    el.classList.add('oculto')
    let listo = false
    const mostrar = () => {
      if (listo) return
      listo = true
      el.classList.remove('oculto')
      limpiar()
    }
    const alScroll = () => {
      if (!bajoElViewport()) mostrar()
    }
    const obs = new IntersectionObserver(
      (entradas) => {
        for (const e of entradas) if (e.isIntersecting || e.boundingClientRect.top < 0) mostrar()
      },
      { threshold: 0, rootMargin: '0px 0px -40px 0px' },
    )
    obs.observe(el)
    window.addEventListener('scroll', alScroll, { passive: true })
    window.addEventListener('resize', alScroll)
    // Tope: pase lo que pase, nada queda invisible más de 4 s.
    const tope = window.setTimeout(mostrar, 4000)
    function limpiar() {
      obs.disconnect()
      window.removeEventListener('scroll', alScroll)
      window.removeEventListener('resize', alScroll)
      window.clearTimeout(tope)
    }
    return limpiar
  }, [])
  const estilo = { '--retraso': `${retraso}ms` } as CSSProperties
  return createElement(as, { ref, className: `reveal ${className}`.trim(), style: estilo }, children)
}
