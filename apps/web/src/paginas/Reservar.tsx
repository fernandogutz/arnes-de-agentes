// Wizard de reserva en 4 pasos: sucursal → servicio → fecha y hora → datos del paciente.
import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { AvisoRespaldo } from '../componentes/AvisoRespaldo'
import { IconoFlecha } from '../componentes/Iconos'
import { NOMBRES_CATEGORIA } from '../datos/respaldo'
import { api, ErrorApi, useServicios, useSucursales } from '../lib/api'
import { capitalizar, fechaLarga, horaLocal, horarioDelDia, proximosDias, slotsDeRespaldo } from '../lib/fechas'
import { formatearCLP } from '../lib/precio'
import type { Paciente } from '../lib/tipos'
import { hayErrores, validarPaciente, type ErroresPaciente } from '../lib/validacion'

const PASOS = ['Sucursal', 'Servicio', 'Fecha y hora', 'Tus datos'] as const
type Paso = 1 | 2 | 3 | 4

export function Reservar() {
  const navegar = useNavigate()
  const [params] = useSearchParams()
  const { datos: sucursales, deRespaldo: sucRespaldo } = useSucursales()
  const { datos: servicios, deRespaldo: servRespaldo } = useServicios()

  const [paso, setPaso] = useState<Paso>(1)
  const [sucursalSlug, setSucursalSlug] = useState(params.get('sucursal') ?? '')
  const [servicioSlug, setServicioSlug] = useState(params.get('servicio') ?? '')
  const dias = useMemo(() => proximosDias(10), [])
  const [fecha, setFecha] = useState(dias[0]?.iso ?? '')
  const [inicio, setInicio] = useState('')
  const [slots, setSlots] = useState<string[]>([])
  const [slotsRespaldo, setSlotsRespaldo] = useState(false)
  const [cargandoSlots, setCargandoSlots] = useState(false)
  const [saltoAuto, setSaltoAuto] = useState(false)
  const [paciente, setPaciente] = useState<Paciente>({ nombre: '', email: '', telefono: '' })
  const [errores, setErrores] = useState<ErroresPaciente>({})
  const [enviando, setEnviando] = useState(false)
  const [errorEnvio, setErrorEnvio] = useState<{ titulo: string; detalles?: string[] } | null>(null)

  const sucursal = sucursales.find((s) => s.slug === sucursalSlug)
  const servicio = servicios.find((s) => s.slug === servicioSlug)

  // Si venimos con ?sucursal= o ?servicio= válidos, saltamos al paso correspondiente.
  useEffect(() => {
    if (paso !== 1) return
    if (sucursalSlug && sucursales.some((s) => s.slug === sucursalSlug)) setPaso(servicioSlug ? 3 : 2)
  }, [sucursales, sucursalSlug, servicioSlug, paso])

  // Disponibilidad al entrar al paso 3 o cambiar la fecha.
  useEffect(() => {
    if (paso !== 3 || !sucursal || !fecha) return
    let vivo = true
    setCargandoSlots(true)
    setInicio('')
    api
      .disponibilidad(sucursal.slug, fecha)
      .then((d) => {
        if (!vivo) return
        setSlots(soloFuturos(d.slots))
        setSlotsRespaldo(false)
      })
      .catch(() => {
        if (!vivo) return
        const dia = dias.find((d) => d.iso === fecha)
        setSlots(soloFuturos(slotsDeRespaldo(fecha, horarioDelDia(sucursal.horario, dia?.diaSemana ?? 1))))
        setSlotsRespaldo(true)
      })
      .finally(() => vivo && setCargandoSlots(false))
    return () => {
      vivo = false
    }
  }, [paso, sucursal, fecha, dias])

  // Si "hoy" ya no tiene horas, salta una sola vez al siguiente día abierto.
  useEffect(() => {
    if (paso !== 3 || cargandoSlots || saltoAuto || !sucursal || slots.length > 0 || fecha !== dias[0]?.iso) return
    const siguiente = dias.slice(1).find((d) => horarioDelDia(sucursal.horario, d.diaSemana))
    setSaltoAuto(true)
    if (siguiente) setFecha(siguiente.iso)
  }, [paso, cargandoSlots, saltoAuto, sucursal, slots, fecha, dias])

  function irA(p: Paso) {
    setErrorEnvio(null)
    setPaso(p)
  }

  async function enviar(e: FormEvent) {
    e.preventDefault()
    const err = validarPaciente(paciente)
    setErrores(err)
    if (hayErrores(err) || !sucursal || !servicio || !inicio) return
    setEnviando(true)
    setErrorEnvio(null)
    try {
      const reserva = await api.crearReserva({
        sucursal: sucursal.slug,
        servicio: servicio.slug,
        inicio,
        paciente: { nombre: paciente.nombre.trim(), email: paciente.email.trim(), telefono: paciente.telefono.trim() },
      })
      navegar(`/reserva/${reserva.codigo}`, { state: { reserva } })
    } catch (error) {
      if (error instanceof ErrorApi && error.status === 409) {
        setErrorEnvio({ titulo: 'Esa hora se acaba de ocupar. Elige otra, por favor.' })
        setPaso(3)
      } else if (error instanceof ErrorApi && error.status === 400) {
        setErrorEnvio({ titulo: 'La API rechazó los datos:', detalles: error.detalles })
      } else {
        setErrorEnvio({
          titulo: 'No pudimos conectar con la API de reservas. Revisa que esté corriendo en el puerto 3001 y reintenta.',
        })
      }
    } finally {
      setEnviando(false)
    }
  }

  const resumenPaso = (p: number): string | null => {
    if (p === 1) return sucursal?.comuna ?? null
    if (p === 2) return servicio?.nombre ?? null
    if (p === 3) return inicio ? `${fechaLarga(inicio)} · ${horaLocal(inicio)}` : null
    return null
  }

  return (
    <main className="pagina">
      <div className="contenedor pagina__cabecera" style={{ paddingBottom: 24 }}>
        <span className="sobretitulo">Reservar hora</span>
        <h1>Cuatro pasos y listo.</h1>
        <p>Sin registro ni llamadas. Te confirmamos al instante con un código de 6 caracteres.</p>
      </div>

      <div className="contenedor wizard">
        <ol className="pasos" style={{ listStyle: 'none', margin: 0, padding: 0 }}>
          {PASOS.map((nombre, i) => {
            const n = (i + 1) as Paso
            const estado = n === paso ? 'activo' : n < paso ? 'hecho' : ''
            return (
              <li key={nombre}>
                <button className={`paso ${estado}`} onClick={() => n < paso && irA(n)} disabled={n > paso} aria-current={n === paso ? 'step' : undefined}>
                  <span className="paso__num">{n}</span>
                  <span>
                    {nombre}
                    {n < paso && resumenPaso(n) && <small>{resumenPaso(n)}</small>}
                  </span>
                </button>
              </li>
            )
          })}
        </ol>

        <section className="vidrio wizard__panel" aria-live="polite">
          {errorEnvio && (
            <div className="alerta" role="alert">
              {errorEnvio.titulo}
              {errorEnvio.detalles && errorEnvio.detalles.length > 0 && (
                <ul>
                  {errorEnvio.detalles.map((d) => (
                    <li key={d}>{d}</li>
                  ))}
                </ul>
              )}
            </div>
          )}

          {paso === 1 && (
            <>
              <h2>¿En qué sucursal?</h2>
              <AvisoRespaldo visible={sucRespaldo} />
              <div className="opciones">
                {sucursales.map((s) => (
                  <button
                    key={s.slug}
                    className={`opcion ${s.slug === sucursalSlug ? 'seleccionada' : ''}`}
                    onClick={() => setSucursalSlug(s.slug)}
                    aria-pressed={s.slug === sucursalSlug}
                  >
                    <b>{s.nombre}</b>
                    <span>{s.direccion}</span>
                    <div className="opcion__meta">
                      <span>Lun a vie {s.horario.lunVie}</span>
                      <span>{s.horario.sab ? `Sáb ${s.horario.sab}` : 'Sáb cerrado'}</span>
                    </div>
                  </button>
                ))}
              </div>
              <div className="wizard__acciones">
                <span />
                <button className="boton boton--primario" disabled={!sucursal} onClick={() => irA(2)}>
                  Continuar <IconoFlecha />
                </button>
              </div>
            </>
          )}

          {paso === 2 && (
            <>
              <h2>¿Qué necesitas?</h2>
              <AvisoRespaldo visible={servRespaldo} />
              <div className="opciones">
                {servicios.map((s) => (
                  <button
                    key={s.slug}
                    className={`opcion ${s.slug === servicioSlug ? 'seleccionada' : ''}`}
                    onClick={() => setServicioSlug(s.slug)}
                    aria-pressed={s.slug === servicioSlug}
                  >
                    <b>{s.nombre}</b>
                    <span>{NOMBRES_CATEGORIA[s.categoria]} · {s.duracionMin} min</span>
                    <div className="opcion__meta">
                      <span>desde</span>
                      <strong>{formatearCLP(s.precioDesde)}</strong>
                    </div>
                  </button>
                ))}
              </div>
              <div className="wizard__acciones">
                <button className="boton boton--texto" onClick={() => irA(1)}>
                  ← Sucursal
                </button>
                <button className="boton boton--primario" disabled={!servicio} onClick={() => irA(3)}>
                  Continuar <IconoFlecha />
                </button>
              </div>
            </>
          )}

          {paso === 3 && sucursal && (
            <>
              <h2>¿Cuándo?</h2>
              <p className="silenciado pequeno">Horas en hora de Chile (America/Santiago) para {sucursal.nombre}.</p>
              <div className="dias" role="tablist" aria-label="Día">
                {dias.map((d) => {
                  const cerrado = !horarioDelDia(sucursal.horario, d.diaSemana)
                  return (
                    <button
                      key={d.iso}
                      className={`dia ${d.iso === fecha ? 'seleccionado' : ''}`}
                      disabled={cerrado}
                      onClick={() => setFecha(d.iso)}
                      aria-pressed={d.iso === fecha}
                      title={cerrado ? 'Cerrado' : undefined}
                    >
                      <b>{d.etiqueta}</b>
                      <span>{cerrado ? 'cerrado' : d.iso.slice(5).replace('-', '/')}</span>
                    </button>
                  )
                })}
              </div>
              <AvisoRespaldo visible={slotsRespaldo} />
              {cargandoSlots ? (
                <div className="vacio">
                  <span className="cargando" aria-label="Buscando horas" />
                </div>
              ) : slots.length === 0 ? (
                <div className="vacio">No quedan horas para este día. Prueba con otro.</div>
              ) : (
                <div className="horas" role="listbox" aria-label="Hora">
                  {slots.map((s) => (
                    <button
                      key={s}
                      role="option"
                      aria-selected={s === inicio}
                      className={`hora ${s === inicio ? 'seleccionada' : ''}`}
                      onClick={() => setInicio(s)}
                    >
                      {horaLocal(s)}
                    </button>
                  ))}
                </div>
              )}
              <div className="wizard__acciones">
                <button className="boton boton--texto" onClick={() => irA(2)}>
                  ← Servicio
                </button>
                <button className="boton boton--primario" disabled={!inicio} onClick={() => irA(4)}>
                  Continuar <IconoFlecha />
                </button>
              </div>
            </>
          )}

          {paso === 4 && sucursal && servicio && (
            <form onSubmit={enviar} noValidate>
              <div style={{ display: 'grid', gap: 22 }}>
                <h2>Tus datos</h2>
                <div className="resumen">
                  <div>
                    <span>Sucursal</span>
                    <b>{sucursal.nombre}</b>
                  </div>
                  <div>
                    <span>Servicio</span>
                    <b>
                      {servicio.nombre} · desde {formatearCLP(servicio.precioDesde)}
                    </b>
                  </div>
                  <div>
                    <span>Cuándo</span>
                    <b>
                      {capitalizar(fechaLarga(inicio))} · {horaLocal(inicio)} hrs
                    </b>
                  </div>
                </div>
                <div className="grilla grilla--2">
                  <Campo
                    id="nombre"
                    etiqueta="Nombre y apellido"
                    valor={paciente.nombre}
                    error={errores.nombre}
                    alCambiar={(v) => setPaciente({ ...paciente, nombre: v })}
                    autoComplete="name"
                  />
                  <Campo
                    id="telefono"
                    etiqueta="Teléfono"
                    tipo="tel"
                    valor={paciente.telefono}
                    error={errores.telefono}
                    alCambiar={(v) => setPaciente({ ...paciente, telefono: v })}
                    autoComplete="tel"
                    placeholder="+56 9 1234 5678"
                  />
                </div>
                <Campo
                  id="email"
                  etiqueta="Correo (te enviamos la confirmación)"
                  tipo="email"
                  valor={paciente.email}
                  error={errores.email}
                  alCambiar={(v) => setPaciente({ ...paciente, email: v })}
                  autoComplete="email"
                />
                <div className="wizard__acciones">
                  <button type="button" className="boton boton--texto" onClick={() => irA(3)}>
                    ← Fecha y hora
                  </button>
                  <button type="submit" className="boton boton--primario" disabled={enviando}>
                    {enviando ? <span className="cargando" aria-label="Enviando" /> : 'Confirmar reserva'}
                  </button>
                </div>
              </div>
            </form>
          )}
        </section>
      </div>
    </main>
  )
}

type CampoProps = {
  id: string
  etiqueta: string
  valor: string
  error?: string
  alCambiar: (v: string) => void
  tipo?: string
  autoComplete?: string
  placeholder?: string
}

function Campo({ id, etiqueta, valor, error, alCambiar, tipo = 'text', autoComplete, placeholder }: CampoProps) {
  return (
    <div className="campo">
      <label htmlFor={id}>{etiqueta}</label>
      <input
        id={id}
        name={id}
        type={tipo}
        value={valor}
        onChange={(e) => alCambiar(e.target.value)}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? `${id}-error` : undefined}
        autoComplete={autoComplete}
        placeholder={placeholder}
      />
      {error && (
        <span className="campo__error" id={`${id}-error`} role="alert">
          {error}
        </span>
      )}
    </div>
  )
}

// Descarta horas que ya pasaron (con 15 min de colchón).
function soloFuturos(slots: string[]): string[] {
  const limite = Date.now() + 15 * 60_000
  return slots.filter((s) => new Date(s).getTime() > limite)
}
