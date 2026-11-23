import { useEffect, useRef, useState, type FormEvent } from 'react'
import { CheckCircleIcon, PaperPlaneRightIcon, SparkleIcon, XIcon } from '@phosphor-icons/react'
import {
  calcularPago,
  mensajeDeError,
  preguntarAsistente,
  type AccionConfirmarPago,
  type MensajeChat,
} from '../../api'
import { formatRangoFechas } from '../../lib/fechas'
import { formatMoney } from '../../lib/formato'
import { Button } from '../ui/Button'
import { IconButton } from '../ui/IconButton'
import './AsistenteChat.css'

type EstadoAccion = 'pendiente' | 'guardando' | 'pagado' | 'descartado'

interface AccionEnChat {
  accion: AccionConfirmarPago
  estado: EstadoAccion
  montoPagado?: number
  error?: string
}

interface Entrada {
  id: number
  rol: MensajeChat['rol']
  texto: string
  acciones?: AccionEnChat[]
  // Mensajes que solo se muestran (bienvenida, errores): no se mandan al asistente.
  local?: boolean
}

// El backend acepta hasta 40 mensajes por pregunta.
const MAX_HISTORIAL = 40

const SUGERENCIAS = [
  '¿Cuántas blusas se hicieron esta semana?',
  '¿Cuántas blusas hizo cada empleada este mes?',
  '¿Cuánto le debo a cada empleada esta semana?',
]

const BIENVENIDA: Entrada = {
  id: 0,
  rol: 'assistant',
  texto: 'Hola, pregúntame por la producción del taller o por lo que le debes a una empleada.',
  local: true,
}

function historial(entradas: Entrada[]): MensajeChat[] {
  const mensajes = entradas
    .filter((e) => !e.local)
    .slice(-MAX_HISTORIAL)
    .map(({ rol, texto }) => ({ rol, texto }))
  // La conversación que recibe el backend siempre empieza con una pregunta.
  while (mensajes.length > 0 && mensajes[0].rol !== 'user') mensajes.shift()
  return mensajes
}

export function AsistenteChat() {
  const [abierto, setAbierto] = useState(false)
  const [entradas, setEntradas] = useState<Entrada[]>([BIENVENIDA])
  const [texto, setTexto] = useState('')
  const [enviando, setEnviando] = useState(false)
  const siguienteId = useRef(1)
  const listaRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    if (!abierto) return
    inputRef.current?.focus()
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') setAbierto(false)
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [abierto])

  useEffect(() => {
    listaRef.current?.scrollTo({ top: listaRef.current.scrollHeight, behavior: 'smooth' })
  }, [entradas, enviando, abierto])

  function nuevaEntrada(entrada: Omit<Entrada, 'id'>): Entrada {
    return { ...entrada, id: siguienteId.current++ }
  }

  async function enviar(pregunta: string) {
    const limpia = pregunta.trim()
    if (!limpia || enviando) return

    const conPregunta = [...entradas, nuevaEntrada({ rol: 'user', texto: limpia })]
    setEntradas(conPregunta)
    setTexto('')
    setEnviando(true)
    try {
      const { respuesta, acciones } = await preguntarAsistente(historial(conPregunta))
      const entrada = nuevaEntrada({
        rol: 'assistant',
        texto: respuesta,
        acciones: acciones.map((accion) => ({ accion, estado: 'pendiente' as const })),
      })
      setEntradas((prev) => [...prev, entrada])
    } catch (err) {
      const entrada = nuevaEntrada({
        rol: 'assistant',
        texto: mensajeDeError(err, 'No pude responder en este momento. Intenta de nuevo.'),
        local: true,
      })
      setEntradas((prev) => [...prev, entrada])
    } finally {
      setEnviando(false)
    }
  }

  function actualizarAccion(entradaId: number, indice: number, cambios: Partial<AccionEnChat>) {
    setEntradas((prev) =>
      prev.map((e) =>
        e.id === entradaId && e.acciones
          ? { ...e, acciones: e.acciones.map((a, i) => (i === indice ? { ...a, ...cambios } : a)) }
          : e,
      ),
    )
  }

  async function confirmarPago(entradaId: number, indice: number, accion: AccionConfirmarPago) {
    actualizarAccion(entradaId, indice, { estado: 'guardando', error: undefined })
    try {
      // El backend recalcula el monto: es el mismo cálculo que la página de Pagos.
      const pago = await calcularPago({ empleadoId: accion.empleadoId, semanaInicio: accion.semanaInicio })
      actualizarAccion(entradaId, indice, { estado: 'pagado', montoPagado: pago.montoTotal })
    } catch (err) {
      actualizarAccion(entradaId, indice, {
        estado: 'pendiente',
        error: mensajeDeError(err, 'No se pudo registrar el pago.'),
      })
    }
  }

  function handleSubmit(event: FormEvent) {
    event.preventDefault()
    void enviar(texto)
  }

  const soloBienvenida = entradas.length === 1

  return (
    <>
      {!abierto && (
        <button type="button" className="asistente-lanzador" onClick={() => setAbierto(true)}>
          <SparkleIcon size={20} weight="fill" aria-hidden="true" />
          Asistente
        </button>
      )}

      {abierto && (
        <section className="asistente-panel" role="dialog" aria-label="Asistente del taller">
          <header className="asistente-header">
            <span className="asistente-titulo">
              <SparkleIcon size={20} weight="fill" aria-hidden="true" />
              Asistente
            </span>
            <IconButton icon={XIcon} label="Cerrar asistente" onClick={() => setAbierto(false)} />
          </header>

          <div className="asistente-mensajes" ref={listaRef} aria-live="polite">
            {entradas.map((entrada) => (
              <div key={entrada.id} className={`asistente-fila asistente-${entrada.rol}`}>
                <p className="asistente-burbuja">{entrada.texto}</p>
                {entrada.acciones?.map((item, indice) => (
                  <TarjetaPago
                    key={`${item.accion.empleadoId}-${item.accion.semanaInicio}`}
                    item={item}
                    onConfirmar={() => confirmarPago(entrada.id, indice, item.accion)}
                    onDescartar={() => actualizarAccion(entrada.id, indice, { estado: 'descartado' })}
                  />
                ))}
              </div>
            ))}

            {soloBienvenida && (
              <div className="asistente-sugerencias">
                {SUGERENCIAS.map((s) => (
                  <button key={s} type="button" className="asistente-sugerencia" onClick={() => enviar(s)}>
                    {s}
                  </button>
                ))}
              </div>
            )}

            {enviando && (
              <div className="asistente-fila asistente-assistant">
                <p className="asistente-burbuja asistente-pensando">Consultando…</p>
              </div>
            )}
          </div>

          <form className="asistente-form" onSubmit={handleSubmit}>
            <textarea
              ref={inputRef}
              value={texto}
              onChange={(e) => setTexto(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault()
                  void enviar(texto)
                }
              }}
              placeholder="Escribe tu pregunta…"
              aria-label="Pregunta para el asistente"
              rows={1}
              maxLength={4000}
            />
            <IconButton
              icon={PaperPlaneRightIcon}
              label="Enviar"
              type="submit"
              className="asistente-enviar"
              disabled={enviando || !texto.trim()}
            />
          </form>
        </section>
      )}
    </>
  )
}

interface TarjetaPagoProps {
  item: AccionEnChat
  onConfirmar: () => void
  onDescartar: () => void
}

function TarjetaPago({ item, onConfirmar, onDescartar }: TarjetaPagoProps) {
  const { accion, estado, montoPagado, error } = item
  const semana = formatRangoFechas(accion.semanaInicio, accion.semanaFin)

  if (estado === 'pagado') {
    return (
      <div className="asistente-tarjeta asistente-tarjeta-ok" role="status">
        <CheckCircleIcon size={20} weight="fill" aria-hidden="true" />
        <span>
          Pago registrado: {formatMoney(montoPagado ?? accion.montoTotal)} a {accion.empleadoNombre} ({semana}).
        </span>
      </div>
    )
  }

  if (estado === 'descartado') {
    return (
      <div className="asistente-tarjeta asistente-tarjeta-muted">
        El pago de {accion.empleadoNombre} sigue pendiente. Puedes registrarlo después en Pagos.
      </div>
    )
  }

  return (
    <div className="asistente-tarjeta">
      <p>
        ¿Ya le pagaste a <strong>{accion.empleadoNombre}</strong> {formatMoney(accion.montoTotal)} por la semana{' '}
        {semana}?
      </p>
      {error && <p className="error">{error}</p>}
      <div className="asistente-tarjeta-acciones">
        <Button variant="primary" size="sm" loading={estado === 'guardando'} onClick={onConfirmar}>
          Sí, registrar pago
        </Button>
        <Button variant="secondary" size="sm" disabled={estado === 'guardando'} onClick={onDescartar}>
          Todavía no
        </Button>
      </div>
    </div>
  )
}
