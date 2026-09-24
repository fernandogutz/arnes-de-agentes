import { Link } from 'react-router-dom'
import { DienteSvg } from '../tres/DienteSvg'

export function Logo() {
  return (
    <Link to="/" className="logo" aria-label="Nébula Dental, inicio">
      <DienteSvg className="logo__diente" />
      Nébula <small>dental</small>
    </Link>
  )
}
