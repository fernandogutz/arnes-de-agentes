import { Link } from 'react-router-dom'

export function Logo() {
  return (
    <Link to="/" className="logo" aria-label="Nébula Dental, inicio">
      <span className="logo__orbe" aria-hidden="true" />
      Nébula <small>dental</small>
    </Link>
  )
}
