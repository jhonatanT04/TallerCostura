import { useCallback, useEffect, useState } from "react"
import { getEmpleados, getRegistrosDeEmpleado, getTodosLosRegistros, type Empleado, type RegistroDTO } from "../../api"

export function RegistroPage() {
    const [empleados, setEmpleados] = useState<Empleado[]>([])
    const [loadingEmpleados, setLoadingEmpleados] = useState(true)
    const [empleadosError, setEmpleadosError] = useState<string | null>(null)

    const [registros, setRegistros] = useState<RegistroDTO[]>([])
    const [loadingRegistros, setLoadingRegistros] = useState(false)
    const [registrosError, setRegistrosError] = useState<string | null>(null)

    const [selectEmpleado, setSelectEmpleado] = useState(false)
    const [selectViewAll, setSelectViewAll] = useState(true)

    const [selectedDateRange, setSelectedDateRange] = useState('')
    const [startDate, setStartDate] = useState('')
    const [endDate, setEndDate] = useState('')

    function formatFecha(iso: string): string {
        return new Date(iso).toLocaleString()
    }

    const loadEmpleados = useCallback(async () => {
        setLoadingEmpleados(true)
        setEmpleadosError(null)
        try {
            setEmpleados(await getEmpleados())
        } catch {
            setEmpleadosError('No se pudo cargar la lista de empleados.')
        } finally {
            setLoadingEmpleados(false)
        }
    }, [])

    useEffect(() => {
        loadEmpleados()
    }, [loadEmpleados])



    const loadAllRegistros = useCallback(async () => {
        setLoadingRegistros(true)
        setSelectEmpleado(false)
        setSelectViewAll(true)
        setRegistrosError(null)
        try {
            setRegistros(await getTodosLosRegistros())
        } catch {
            setRegistrosError('No se pudo cargar la lista de registros.')
        } finally {
            setLoadingRegistros(false)
        }
    }, [])

    const loadRegistrosByEmpleado = useCallback(async (empleadoId: number) => {
        setLoadingRegistros(true)
        setSelectEmpleado(true)
        setSelectViewAll(false)
        setRegistrosError(null)
        try {
            setRegistros(await getRegistrosDeEmpleado(empleadoId))
        } catch {
            setRegistrosError('No se pudo cargar la lista de registros del empleado.')
        } finally {
            setLoadingRegistros(false)
        }
    }, [])



    useEffect(() => {
        loadAllRegistros()
    }, [loadAllRegistros])

    return (
        <section className="page registros-page">
            <h2>Registros</h2>
            {empleadosError && <p className="error">{empleadosError}</p>}
            {loadingEmpleados ? (

                <p>Cargando empleados...</p>

            ) : (
                <ul className="select-registros">
                    <li onClick={() => { loadAllRegistros() }} className="opcion-select select-all-registre">
                        Todos los empleados
                    </li>
                    {empleados.map((empleado) => (
                        <li key={empleado.id} onClick={() => loadRegistrosByEmpleado(empleado.id)} className="opcion-select">
                            {empleado.nombreCompleto}
                        </li>
                    ))}
                </ul>
            )}

            <div className="date-filter">
                <label htmlFor="date">
                    Seleccione un rango de fechas
                </label>

                <select
                    id="date"
                    value={selectedDateRange}
                    onChange={(e) => setSelectedDateRange(e.target.value)}
                >
                    <option value="" disabled>
                        Seleccione una opción
                    </option>
                    <option value="last-week">Semana anterior</option>
                    <option value="two-weeks">Hace dos semanas</option>
                    <option value="last-month">Último mes</option>
                    <option value="custom">Fecha personalizada</option>
                </select>

                {selectedDateRange === 'custom' && (
                    <div className="custom-date">
                        <label>
                            Desde
                            <input
                                type="date"
                                value={startDate}
                                onChange={(e) => setStartDate(e.target.value)}
                            />
                        </label>

                        <label>
                            Hasta
                            <input
                                type="date"
                                value={endDate}
                                onChange={(e) => setEndDate(e.target.value)}
                            />
                        </label>
                    </div>
                )}
            </div>
            <div className="table-wrap">
                {registrosError && (
                    <p className="error">{registrosError}</p>
                )}

                {loadingRegistros ? (
                    <p className="loading">Cargando registros...</p>
                ) : (
                    <table className="table">
                        <thead>
                            <tr>
                                {selectViewAll && !selectEmpleado && (
                                    <th>Empleado</th>
                                )}
                                <th>Color</th>
                                <th>Talla</th>
                                <th>Mullos</th>
                                <th>Ataches</th>
                                <th>Cantidad</th>
                                <th>Fecha</th>
                            </tr>
                        </thead>

                        <tbody>
                            {registros.map((registro) => (
                                <tr key={registro.id}>
                                    {selectViewAll && !selectEmpleado && (
                                        <td>{registro.empleado.nombreCompleto}</td>
                                    )}
                                    <td>{registro.color}</td>
                                    <td>{registro.talla}</td>
                                    <td>{registro.tieneMullos ? 'Sí' : 'No'}</td>
                                    <td>{registro.tieneAtaches ? 'Sí' : 'No'}</td>
                                    <td>{registro.cantidad}</td>
                                    <td>{formatFecha(registro.fechaRegistro)}</td>
                                </tr>
                            ))}

                            {registros.length === 0 && (
                                <tr>
                                    <td
                                        colSpan={selectViewAll && !selectEmpleado ? 7 : 6}
                                        className="empty-table"
                                    >
                                        No hay registros para mostrar.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                )}
            </div>

        </section>

    )
}