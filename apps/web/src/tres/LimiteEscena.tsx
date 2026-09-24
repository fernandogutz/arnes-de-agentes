import { Component, type ReactNode } from 'react'

type Props = { children: ReactNode; respaldo: ReactNode }
type Estado = { fallo: boolean }

/**
 * Si el chunk 3D no carga (red caída, WebGL que revienta al inicializar) muestra el
 * respaldo en vez de dejar un hueco negro en el hero.
 */
export class LimiteEscena extends Component<Props, Estado> {
  state: Estado = { fallo: false }

  static getDerivedStateFromError(): Estado {
    return { fallo: true }
  }

  componentDidCatch(error: unknown) {
    console.warn('[nébula] escena 3D no disponible, se usa el respaldo:', error)
  }

  render() {
    return this.state.fallo ? this.props.respaldo : this.props.children
  }
}
