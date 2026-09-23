import { useCallback, useEffect, useState } from "react"
import { getEmpleados, getRegistrosDate, getRegistrosDeEmpleado, getTodosLosRegistros, type Empleado, type RegistroDTO } from "../../api"

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

    function formatDate(date: Date): string {
        const year = date.getFullYear()
        const month = String(date.getMonth() + 1).padStart(2, '0')
        const day = String(date.getDate()).padStart(2, '0')

        return `${year}-${month}-${day}`
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
            setRegistrosError(
                'No se pudo cargar la lista de registros del empleado.',
            )
        } finally {
            setLoadingRegistros(false)
        }
    }, [])

    const loadRegistrosByDate = useCallback(
        async (fechaInicio: string, fechaFin: string) => {
            setLoadingRegistros(true)
            setSelectEmpleado(false)
            setSelectViewAll(true)
            setRegistrosError(null)

            try {
                setRegistros(
                    await getRegistrosDate(fechaInicio, fechaFin),
                )
            } catch {
                setRegistrosError(
                    'No se pudo cargar los registros del rango seleccionado.',
                )
            } finally {
                setLoadingRegistros(false)
            }
        },
        [],
    )

    const handleDateRangeChange = (
        value: string,
    ) => {
        setSelectedDateRange(value)

        // Fecha personalizada
        if (value === 'custom') {
            return
        }

        const today = new Date()

        const day = today.getDay()

        const daysSinceMonday = day === 0 ? 6 : day - 1

        const currentMonday = new Date(today)
        currentMonday.setDate(
            today.getDate() - daysSinceMonday,
        )

        let fechaInicio: Date
        let fechaFin: Date
        if (value === 'this-week') {
            fechaInicio = new Date(currentMonday)
            fechaFin = new Date(today)

        } else if (value === 'last-week') {
            fechaInicio = new Date(currentMonday)
            fechaInicio.setDate(
                currentMonday.getDate() - 7,
            )
            fechaFin = new Date(currentMonday)
            fechaFin.setDate(
                currentMonday.getDate() - 1,
            )
        } else if (value === 'two-weeks') {
            fechaInicio = new Date(currentMonday)
            fechaInicio.setDate(
                currentMonday.getDate() - 14,
            )
            fechaFin = new Date(currentMonday)
            fechaFin.setDate(
                currentMonday.getDate() - 8,
            )
        } else if (value === 'last-month') {
            fechaInicio = new Date(
                today.getFullYear(),
                today.getMonth() - 1,
                1,
            )
            fechaFin = new Date(
                today.getFullYear(),
                today.getMonth(),
                0,
            )
        } else {
            return
        }
        const inicio = formatDate(fechaInicio)
        const fin = formatDate(fechaFin)
        loadRegistrosByDate(inicio, fin)
    }

    const handleCustomDateSearch = () => {
        setRegistrosError(null)

        if (!startDate || !endDate) {
            setRegistrosError(
                'Selecciona una fecha de inicio y una fecha de fin.',
            )
            return
        }

        if (startDate > endDate) {
            setRegistrosError(
                'La fecha de inicio no puede ser mayor que la fecha de fin.',
            )
            return
        }

        loadRegistrosByDate(startDate, endDate)
    }

    useEffect(() => {
        loadAllRegistros()
    }, [loadAllRegistros])


    return (
        <section className="page registros-page">
            <h2>Registros</h2>
            {empleadosError && (
                <p className="error">{empleadosError}</p>
            )}

            {loadingEmpleados ? (
                <p>Cargando empleados...</p>
            ) : (
                <ul className="select-registros">
                    <li
                        onClick={loadAllRegistros}
                        className="opcion-select select-all-registre"
                    >
                        Todos los empleados
                    </li>

                    {empleados.map((empleado) => (
                        <li
                            key={empleado.id}
                            onClick={() =>
                                loadRegistrosByEmpleado(empleado.id)
                            }
                            className="opcion-select"
                        >
                            {empleado.nombreCompleto}
                        </li>
                    ))}
                </ul>
            )}
            <br />

            <div className="date-filter">
                <label htmlFor="date">
                    Seleccione un rango de fechas
                </label>


                <select
                    id="date"
                    value={selectedDateRange}
                    onChange={(e) =>
                        handleDateRangeChange(e.target.value)
                    }
                >
                    <option value="" disabled>
                        Seleccione una opción
                    </option>

                    <option value="this-week">
                        Esta semana
                    </option>

                    <option value="last-week">
                        Semana anterior
                    </option>

                    <option value="two-weeks">
                        Hace dos semanas
                    </option>

                    <option value="last-month">
                        Último mes
                    </option>

                    <option value="custom">
                        Fecha personalizada
                    </option>
                </select>

                {selectedDateRange === 'custom' && (
                    <div className="custom-date">
                        <label>
                            Desde
                            <input
                                type="date"
                                value={startDate}
                                onChange={(e) =>
                                    setStartDate(e.target.value)
                                }
                            />
                        </label>

                        <label>
                            Hasta
                            <input
                                type="date"
                                value={endDate}
                                onChange={(e) =>
                                    setEndDate(e.target.value)
                                }
                            />
                        </label>

                        <button
                            type="button"
                            className="primary"
                            onClick={handleCustomDateSearch}
                            disabled={loadingRegistros}
                        >
                            {loadingRegistros
                                ? 'Buscando...'
                                : 'Buscar por fecha'}
                        </button>
                    </div>
                )}
            </div>

            <div className="table-wrap">
                {registrosError && (
                    <p className="error">{registrosError}</p>
                )}

                {loadingRegistros ? (
                    <p className="loading">
                        Cargando registros...
                    </p>
                ) : (
                    <table className="table">
                        <thead>
                            <tr>
                                {selectViewAll &&
                                    !selectEmpleado && (
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
                                    {selectViewAll &&
                                        !selectEmpleado && (
                                            <td>
                                                {
                                                    registro.empleado
                                                        .nombreCompleto
                                                }
                                            </td>
                                        )}

                                    <td>{registro.color}</td>
                                    <td>{registro.talla}</td>

                                    <td>
                                        {registro.tieneMullos
                                            ? 'Sí'
                                            : 'No'}
                                    </td>

                                    <td>
                                        {registro.tieneAtaches
                                            ? 'Sí'
                                            : 'No'}
                                    </td>

                                    <td>{registro.cantidad}</td>

                                    <td>
                                        {formatFecha(
                                            registro.fechaRegistro,
                                        )}
                                    </td>
                                </tr>
                            ))}

                            {registros.length === 0 && (
                                <tr>
                                    <td
                                        colSpan={
                                            selectViewAll &&
                                                !selectEmpleado
                                                ? 7
                                                : 6
                                        }
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