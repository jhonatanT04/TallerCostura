import type { RegistroDTO } from '../api/types'

function formatFecha(iso: string): string {
  return new Date(iso).toLocaleString()
}

interface RegistrosTableProps {
  registros: RegistroDTO[]
  showEmpleado?: boolean
}

export function RegistrosTable({ registros, showEmpleado = false }: RegistrosTableProps) {
  if (registros.length === 0) {
    return <p className="empty">No hay registros todavía.</p>
  }

  return (
    <div className="table-wrap">
      <table className="table">
        <thead>
          <tr>
            {showEmpleado && <th>Empleado</th>}
            <th>Color</th>
            <th>Talla</th>
            <th>Confeccionadas</th>
            <th>Mullos</th>
            <th>Ataches</th>
            <th>Fecha</th>
          </tr>
        </thead>
        <tbody>
          {registros.map((registro) => (
            <tr key={registro.id}>
              {showEmpleado && <td>{registro.empleado.nombreCompleto}</td>}
              <td>{registro.color}</td>
              <td>{registro.talla}</td>
              <td>{registro.cantidadConfeccion}</td>
              <td>{registro.cantidadMullos}</td>
              <td>{registro.cantidadAtaches}</td>
              <td>{formatFecha(registro.fechaRegistro)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
