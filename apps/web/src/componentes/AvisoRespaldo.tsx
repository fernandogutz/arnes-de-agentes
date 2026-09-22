// Aviso discreto cuando se muestran datos de respaldo porque la API no respondió.
export function AvisoRespaldo({ visible }: { visible: boolean }) {
  if (!visible) return null
  return (
    <p className="aviso" role="status">
      <span aria-hidden="true">◌</span> API sin conexión: mostrando datos de referencia.
    </p>
  )
}
