import { useEffect, useState } from 'react'
import { getRegistrosDate } from '../api'
import type { OrdenPagoDTO, RegistroDTO } from '../api/types'
import { addDays, formatDiaCorto, formatRangoSemana, parseISODate, toISODate } from '../lib/fechas'

function formatMoney(n: number): string {
  return n.toFixed(2)
}

function capitalizar(texto: string): string {
  return texto.charAt(0).toUpperCase() + texto.slice(1)
}

function sumar(registros: RegistroDTO[]) {
  return registros.reduce(
    (acc, r) => ({
      confeccion: acc.confeccion + r.cantidadConfeccion,
      mullos: acc.mullos + r.cantidadMullos,
      ataches: acc.ataches + r.cantidadAtaches,
    }),
    { confeccion: 0, mullos: 0, ataches: 0 },
  )
}

interface ResumenSemanaPagoProps {
  pago: OrdenPagoDTO
}

// El padre debe montarlo con una key por empleado + semana para que la carga se reinicie por pago
// (en una previsualización pago.id es null).
export function ResumenSemanaPago({ pago }: ResumenSemanaPagoProps) {
  const [registros, setRegistros] = useState<RegistroDTO[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    getRegistrosDate(pago.semanaInicio, pago.semanaFin, pago.empleado.id)
      .then(setRegistros)
      .catch(() => setError('No se pudieron cargar los registros de la semana.'))
      .finally(() => setLoading(false))
  }, [pago.semanaInicio, pago.semanaFin, pago.empleado.id])

  const lunes = parseISODate(pago.semanaInicio)
  const dias = Array.from({ length: 7 }, (_, i) => addDays(lunes, i))
  const porDia = new Map<string, RegistroDTO[]>(dias.map((dia) => [toISODate(dia), []]))
  const otros: RegistroDTO[] = []
  for (const registro of registros) {
    // fechaRegistro es un instante UTC; se agrupa por el día local de quien mira.
    const lista = porDia.get(toISODate(new Date(registro.fechaRegistro)))
    if (lista) lista.push(registro)
    else otros.push(registro)
  }

  const totales = [
    { label: 'Blusas confeccionadas', cantidad: pago.totalBlusas, monto: pago.montoBlusas },
    { label: 'Mullos puestos', cantidad: pago.totalConMullos, monto: pago.montoMullos },
    { label: 'Ataches puestos', cantidad: pago.totalConAtaches, monto: pago.montoAtaches },
  ]

  return (
    <div className="resumen-semana">
      <header className="resumen-semana-header">
        <h4>{pago.empleado.nombreCompleto}</h4>
        <p className="muted">{formatRangoSemana(lunes)}</p>
      </header>

      <div className="resumen-totales">
        {totales.map((t) => (
          <div key={t.label} className="resumen-total">
            <span className="resumen-total-label">{t.label}</span>
            <strong className="resumen-total-cantidad">{t.cantidad}</strong>
            <span className="muted">${formatMoney(t.monto)}</span>
          </div>
        ))}
        <div className="resumen-total resumen-total-pagar">
          <span className="resumen-total-label">Total a pagar</span>
          <strong className="resumen-total-cantidad">${formatMoney(pago.montoTotal)}</strong>
        </div>
      </div>

      <h4>Detalle por día</h4>
      {loading ? (
        <p>Cargando registros…</p>
      ) : error ? (
        <p className="error">{error}</p>
      ) : (
        <div className="resumen-dias">
          {dias.map((dia) => (
            <DiaResumen key={toISODate(dia)} titulo={capitalizar(formatDiaCorto(dia))} registros={porDia.get(toISODate(dia)) ?? []} />
          ))}
          {otros.length > 0 && <DiaResumen titulo="Otros registros de la semana" registros={otros} />}
        </div>
      )}
    </div>
  )
}

function DiaResumen({ titulo, registros }: { titulo: string; registros: RegistroDTO[] }) {
  const subtotal = sumar(registros)
  return (
    <section className="resumen-dia">
      <div className="resumen-dia-header">
        <strong>{titulo}</strong>
        {registros.length > 0 && (
          <span className="muted">
            {subtotal.confeccion} conf. · {subtotal.mullos} mullos · {subtotal.ataches} ataches
          </span>
        )}
      </div>
      {registros.length === 0 ? (
        <p className="muted">Sin registros</p>
      ) : (
        <ul className="resumen-dia-lista">
          {registros.map((r) => (
            <li key={r.id}>
              <span>
                {r.color} · {r.talla}
              </span>
              <span>
                {r.cantidadConfeccion} conf. · {r.cantidadMullos} mullos · {r.cantidadAtaches} ataches
              </span>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
