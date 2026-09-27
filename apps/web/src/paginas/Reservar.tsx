// Wizard de reserva en 4 pasos: sucursal → servicio → fecha y hora → datos del paciente.
import { useEffect, useMemo, useRef, useState, type FormEvent, type ReactNode } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { AvisoRespaldo } from '../componentes/AvisoRespaldo'
import { IconoCheck, IconoFlecha } from '../componentes/Iconos'
import { NOMBRES_CATEGORIA } from '../datos/respaldo'
import { api, ErrorApi, useServicios, useSucursales } from '../lib/api'
import { capitalizar, fechaLarga, horaLocal, horarioDelDia, proximosDias, slotsDeRespaldo } from '../lib/fechas'
import { formatearCLP } from '../lib/precio'
import { desplazarAlElemento } from '../lib/scroll'
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

  const refWizard = useRef<HTMLDivElement>(null)
  const refTitulo = useRef<HTMLHeadingElement>(null)
  const pasoPrevio = useRef<Paso | null>(null)
  const saltoPorURL = useRef(false)
  const omitirScroll = useRef(false)

  const sucursal = sucursales.find((s) => s.slug === sucursalSlug)
  const servicio = servicios.find((s) => s.slug === servicioSlug)

  // Si llegamos con ?sucursal= o ?servicio= válidos, partimos en el paso que corresponde (una sola vez).
  useEffect(() => {
    if (saltoPorURL.current) return
    const desdeURL = params.get('sucursal') ?? ''
    if (!desdeURL || !sucursales.some((s) => s.slug === desdeURL)) return
    saltoPorURL.current = true
    omitirScroll.current = true
    const servicioURL = params.get('servicio') ?? ''
    setPaso(servicioURL && servicios.some((s) => s.slug === servicioURL) ? 3 : 2)
  }, [params, sucursales, servicios])

  // Auto-scroll: al cambiar de paso, la vista (y el foco) arrancan en el paso nuevo.
  // No se dispara en la primera pintada ni en el salto inicial por URL: ahí la página ya está arriba.
  useEffect(() => {
    const previo = pasoPrevio.current
    pasoPrevio.current = paso
    if (previo === null) return
    if (omitirScroll.current) {
      omitirScroll.current = false
      return
    }
    desplazarAlElemento(refWizard.current)
    refTitulo.current?.focus({ preventScroll: true })
  }, [paso])

  // Disponibilidad al entrar al paso 3 o cambiar la fecha.
  useEffect(() => {
    if (paso !== 3 || !sucursal || !fecha) return
    let vivo = true
    setCargandoSlots(true)
    // Mantiene la hora elegida si sigue disponible (volver al paso 3 no borra lo que ya elegiste).
    const aplicar = (nuevos: string[]) => {
      setSlots(nuevos)
      setInicio((actual) => (nuevos.includes(actual) ? actual : ''))
    }
    api
      .disponibilidad(sucursal.slug, fecha)
      .then((d) => {
        if (!vivo) return
        aplicar(soloFuturos(d.slots))
        setSlotsRespaldo(false)
      })
      .catch(() => {
        if (!vivo) return
        const dia = dias.find((d) => d.iso === fecha)
        aplicar(soloFuturos(slotsDeRespaldo(fecha, horarioDelDia(sucursal.horario, dia?.diaSemana ?? 1))))
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

  // Cambiar de sucursal invalida la hora elegida (los cupos son por sucursal y día).
  function elegirSucursal(slug: string) {
    if (slug !== sucursalSlug) setInicio('')
    setSucursalSlug(slug)
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

  // Un paso del riel es alcanzable solo si ya tenemos lo que pide el anterior.
  const alcanzable = (p: Paso): boolean => {
    if (p === 1) return true
    if (p === 2) return Boolean(sucursal)
    if (p === 3) return Boolean(sucursal && servicio)
    return Boolean(sucursal && servicio && inicio)
  }

  return (
    <main className="pagina">
      <div className="contenedor pagina__cabecera pagina__cabecera--compacta">
        <span className="sobretitulo">Reservar hora</span>
        <h1>Cuatro pasos y listo.</h1>
        <p>Sin registro ni llamadas. Te confirmamos al instante con un código de 6 caracteres.</p>
      </div>

      <div className="contenedor wizard" ref={refWizard}>
        <ol className="pasos">
          {PASOS.map((nombre, i) => {
            const n = (i + 1) as Paso
            const resumen = resumenPaso(n)
            const hecho = n !== paso && resumen !== null
            const estado = n === paso ? 'activo' : hecho ? 'hecho' : ''
            const puedeIr = n !== paso && alcanzable(n)
            return (
              <li key={nombre}>
                <button
                  type="button"
                  className={`paso ${estado}`}
                  onClick={() => puedeIr && irA(n)}
                  disabled={!puedeIr && n !== paso}
                  aria-current={n === paso ? 'step' : undefined}
                  aria-label={`Paso ${n}: ${nombre}${resumen ? `, ${resumen}` : ''}${puedeIr ? ' (volver a este paso)' : ''}`}
                >
                  <span className="paso__num" aria-hidden="true">
                    {hecho ? <IconoCheck tamano={15} /> : n}
                  </span>
                  <span className="paso__texto">
                    {nombre}
                    {hecho && resumen && <small>{resumen}</small>}
                  </span>
                </button>
              </li>
            )
          })}
        </ol>

        <section className="vidrio wizard__panel">
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
              <h2 ref={refTitulo} tabIndex={-1} className="wizard__titulo">
                ¿En qué sucursal?
              </h2>
              <AvisoRespaldo visible={sucRespaldo} />
              <div className="opciones">
                {sucursales.map((s) => (
                  <button
                    key={s.slug}
                    type="button"
                    className={`opcion ${s.slug === sucursalSlug ? 'seleccionada' : ''}`}
                    onClick={() => elegirSucursal(s.slug)}
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
              <Acciones pista={sucursal ? null : 'Elige una sucursal para continuar.'}>
                <button className="boton boton--primario" type="button" disabled={!sucursal} onClick={() => irA(2)}>
                  Continuar <IconoFlecha />
                </button>
              </Acciones>
            </>
          )}

          {paso === 2 && (
            <>
              <h2 ref={refTitulo} tabIndex={-1} className="wizard__titulo">
                ¿Qué necesitas?
              </h2>
              <AvisoRespaldo visible={servRespaldo} />
              <div className="opciones">
                {servicios.map((s) => (
                  <button
                    key={s.slug}
                    type="button"
                    className={`opcion ${s.slug === servicioSlug ? 'seleccionada' : ''}`}
                    onClick={() => setServicioSlug(s.slug)}
                    aria-pressed={s.slug === servicioSlug}
                  >
                    <b>{s.nombre}</b>
                    <span>
                      {NOMBRES_CATEGORIA[s.categoria]} · {s.duracionMin} min
                    </span>
                    <div className="opcion__meta">
                      <span>desde</span>
                      <strong>{formatearCLP(s.precioDesde)}</strong>
                    </div>
                  </button>
                ))}
              </div>
              <Acciones atras={{ etiqueta: 'Sucursal', alPulsar: () => irA(1) }} pista={servicio ? null : 'Elige un servicio para continuar.'}>
                <button className="boton boton--primario" type="button" disabled={!servicio} onClick={() => irA(3)}>
                  Continuar <IconoFlecha />
                </button>
              </Acciones>
            </>
          )}

          {paso === 3 && sucursal && (
            <>
              <h2 ref={refTitulo} tabIndex={-1} className="wizard__titulo">
                ¿Cuándo?
              </h2>
              <p className="silenciado pequeno wizard__nota">
                Horas en hora de Chile (America/Santiago) para {sucursal.nombre}.
              </p>
              <div className="dias" role="group" aria-label="Día">
                {dias.map((d) => {
                  const cerrado = !horarioDelDia(sucursal.horario, d.diaSemana)
                  return (
                    <button
                      key={d.iso}
                      type="button"
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
              <div aria-live="polite">
                {cargandoSlots ? (
                  <div className="vacio vacio--cargando">
                    <span className="cargando" aria-hidden="true" /> Buscando horas disponibles…
                  </div>
                ) : slots.length === 0 ? (
                  <div className="vacio">No quedan horas para este día. Prueba con otro.</div>
                ) : (
                  <>
                    <p className="silenciado pequeno wizard__nota">
                      {slots.length} {slots.length === 1 ? 'hora disponible' : 'horas disponibles'}
                    </p>
                    <div className="horas" role="listbox" aria-label="Hora">
                      {slots.map((s) => (
                        <button
                          key={s}
                          type="button"
                          role="option"
                          aria-selected={s === inicio}
                          className={`hora ${s === inicio ? 'seleccionada' : ''}`}
                          onClick={() => setInicio(s)}
                        >
                          {horaLocal(s)}
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </div>
              <Acciones atras={{ etiqueta: 'Servicio', alPulsar: () => irA(2) }} pista={inicio ? null : 'Elige una hora para continuar.'}>
                <button className="boton boton--primario" type="button" disabled={!inicio} onClick={() => irA(4)}>
                  Continuar <IconoFlecha />
                </button>
              </Acciones>
            </>
          )}

          {paso === 4 && sucursal && servicio && (
            <form onSubmit={enviar} noValidate className="wizard__form">
              <h2 ref={refTitulo} tabIndex={-1} className="wizard__titulo">
                Tus datos
              </h2>
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
              <Acciones atras={{ etiqueta: 'Fecha y hora', alPulsar: () => irA(3) }}>
                <button type="submit" className="boton boton--primario" disabled={enviando}>
                  {enviando ? (
                    <>
                      <span className="cargando" aria-hidden="true" /> Confirmando…
                    </>
                  ) : (
                    'Confirmar reserva'
                  )}
                </button>
              </Acciones>
            </form>
          )}
        </section>
      </div>
    </main>
  )
}

type AccionesProps = {
  atras?: { etiqueta: string; alPulsar: () => void }
  pista?: string | null
  children: ReactNode
}

// Barra de acciones pegada al borde inferior del panel: "Continuar" siempre a la vista.
function Acciones({ atras, pista, children }: AccionesProps) {
  return (
    <div className="wizard__acciones">
      {atras ? (
        <button type="button" className="boton boton--texto" onClick={atras.alPulsar}>
          <span aria-hidden="true">←</span> {atras.etiqueta}
        </button>
      ) : (
        <span className="wizard__hueco" />
      )}
      {pista && <span className="wizard__pista">{pista}</span>}
      {children}
    </div>
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
