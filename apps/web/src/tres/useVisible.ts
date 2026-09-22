import { useEffect, useRef, useState } from 'react'

// Devuelve si el elemento está en pantalla: sirve para pausar el render 3D cuando no se ve.
export function useVisible<T extends HTMLElement>(margen = '120px') {
  const ref = useRef<T>(null)
  const [visible, setVisible] = useState(true)
  useEffect(() => {
    const el = ref.current
    if (!el || typeof IntersectionObserver === 'undefined') return
    const obs = new IntersectionObserver(([e]) => setVisible(Boolean(e?.isIntersecting)), { rootMargin: margen })
    obs.observe(el)
    return () => obs.disconnect()
  }, [margen])
  return { ref, visible }
}
