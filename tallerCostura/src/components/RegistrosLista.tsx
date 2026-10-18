import type { RegistroDTO } from '../api/types'
import { formatFechaHora } from '../lib/fechas'
import { cantidadesDe, formatCantidades } from '../lib/formato'
import { Persona } from './ui/Avatar'
import { ColorChip } from './ui/ColorChip'
import { RowCard } from './ui/RowCard'

interface RegistrosListaProps {
  registros: RegistroDTO[]
  showEmpleado?: boolean
  emptyMessage?: string
}

function Cantidad({ value }: { value: number }) {
  return value > 0 ? <>{value}</> : <span className="cantidad-cero">-</span>
}

// Tabla en desktop y filas-tarjeta en móvil. La comparten Registros (admin) y Mis registros.
export function RegistrosLista({ registros, showEmpleado = false, emptyMessage = 'No hay registros para mostrar.' }: RegistrosListaProps) {
  const columnas = showEmpleado ? 7 : 6

  return (
    <>
      <div className="table-wrap only-desktop">
        <table className="table table-compact">
          <thead>
            <tr>
              {showEmpleado && <th>Empleado</th>}
              <th>Color</th>
              <th>Talla</th>
              <th className="num">Confeccionadas</th>
              <th className="num">Mullos</th>
              <th className="num">Ataches</th>
              <th>Fecha</th>
            </tr>
          </thead>
          <tbody>
            {registros.map((registro) => (
              <tr key={registro.id}>
                {showEmpleado && (
                  <td>
                    <Persona nombre={registro.empleado.nombreCompleto} />
                  </td>
                )}
                <td>
                  <ColorChip color={registro.color} />
                </td>
                <td>{registro.talla}</td>
                <td className="num">
                  <Cantidad value={registro.cantidadConfeccion} />
                </td>
                <td className="num">
                  <Cantidad value={registro.cantidadMullos} />
                </td>
                <td className="num">
                  <Cantidad value={registro.cantidadAtaches} />
                </td>
                <td>{formatFechaHora(registro.fechaRegistro)}</td>
              </tr>
            ))}

            {registros.length === 0 && (
              <tr>
                <td colSpan={columnas} className="empty-table">
                  {emptyMessage}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <ul className="row-cards only-mobile">
        {registros.map((registro) => {
          const colorTalla = (
            <span className="registro-card-meta">
              <ColorChip color={registro.color} /> · {registro.talla}
            </span>
          )
          return (
            <RowCard
              key={registro.id}
              title={showEmpleado ? registro.empleado.nombreCompleto : colorTalla}
              aside={<span className="registro-card-fecha">{formatFechaHora(registro.fechaRegistro)}</span>}
              meta={showEmpleado ? colorTalla : undefined}
              footer={<span className="registro-card-cantidades">{formatCantidades(cantidadesDe(registro))}</span>}
            />
          )
        })}
        {registros.length === 0 && <li className="row-cards-empty">{emptyMessage}</li>}
      </ul>
    </>
  )
}
