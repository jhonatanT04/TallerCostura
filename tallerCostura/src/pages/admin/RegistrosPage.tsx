import { useEffect, useState } from "react"
import { getEmpleados, getRegistrosDate, type Empleado, type RegistroDTO } from "../../api"
import { RegistrosLista } from "../../components/RegistrosLista"
import { Button } from "../../components/ui/Button"
import { Metric } from "../../components/ui/Metric"
import { PageHeader } from "../../components/ui/PageHeader"
import { SegmentedControl } from "../../components/ui/SegmentedControl"
import { SkeletonRows } from "../../components/ui/Skeleton"
import { addDays, formatRangoFechas, toISODate } from "../../lib/fechas"

type Preset = 'hoy' | '7d' | '30d' | 'custom'

const PRESETS: { value: Preset; label: string }[] = [
    { value: 'hoy', label: 'Hoy' },
    { value: '7d', label: '7 días' },
    { value: '30d', label: '30 días' },
    { value: 'custom', label: 'Personalizado' },
]

interface Rango {
    inicio: string
    fin: string
}

function rangoDePreset(preset: Exclude<Preset, 'custom'>): Rango {
    const hoy = new Date()
    const fin = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate())
    const dias = preset === 'hoy' ? 1 : preset === '7d' ? 7 : 30
    return { inicio: toISODate(addDays(fin, -(dias - 1))), fin: toISODate(fin) }
}

interface Consulta {
    empleadoId: number | null
    rango: Rango
}

function claveDe(consulta: Consulta): string {
    return `${consulta.empleadoId ?? 'todos'}|${consulta.rango.inicio}|${consulta.rango.fin}`
}

export function RegistroPage() {
    const [empleados, setEmpleados] = useState<Empleado[]>([])
    const [loadingEmpleados, setLoadingEmpleados] = useState(true)
    const [empleadosError, setEmpleadosError] = useState<string | null>(null)

    const [empleadoId, setEmpleadoId] = useState<number | null>(null)
    const [preset, setPreset] = useState<Preset>('30d')
    const [startDate, setStartDate] = useState('')
    const [endDate, setEndDate] = useState('')
    const [rangoCustom, setRangoCustom] = useState<Rango | null>(null)
    const [customError, setCustomError] = useState<string | null>(null)

    // Resultado guardado junto con la consulta que lo produjo: si no coincide con los filtros
    // actuales, la tabla está cargando.
    const [resultado, setResultado] = useState<{ clave: string; registros: RegistroDTO[] } | null>(null)
    const [errorClave, setErrorClave] = useState<string | null>(null)

    const rango = preset === 'custom' ? rangoCustom : rangoDePreset(preset)
    const consulta: Consulta | null = rango ? { empleadoId, rango } : null
    const clave = consulta ? claveDe(consulta) : null

    useEffect(() => {
        getEmpleados()
            .then((data) => setEmpleados(data.filter((e) => e.activo)))
            .catch(() => setEmpleadosError('No se pudo cargar la lista de empleados.'))
            .finally(() => setLoadingEmpleados(false))
    }, [])

    useEffect(() => {
        if (!clave) return
        const [id, inicio, fin] = clave.split('|')
        let cancelado = false
        getRegistrosDate(inicio, fin, id === 'todos' ? undefined : Number(id))
            .then((registros) => {
                if (!cancelado) setResultado({ clave, registros })
            })
            .catch(() => {
                if (!cancelado) setErrorClave(clave)
            })
        return () => {
            cancelado = true
        }
    }, [clave])

    const registros = resultado && resultado.clave === clave ? resultado.registros : null
    const fallo = clave !== null && errorClave === clave && !registros

    function aplicarRangoCustom() {
        setCustomError(null)
        if (!startDate || !endDate) {
            setCustomError('Selecciona una fecha de inicio y una fecha de fin.')
            return
        }
        if (startDate > endDate) {
            setCustomError('La fecha de inicio no puede ser mayor que la fecha de fin.')
            return
        }
        setRangoCustom({ inicio: startDate, fin: endDate })
    }

    const totales = (registros ?? []).reduce(
        (acc, r) => ({
            confeccion: acc.confeccion + r.cantidadConfeccion,
            mullos: acc.mullos + r.cantidadMullos,
            ataches: acc.ataches + r.cantidadAtaches,
        }),
        { confeccion: 0, mullos: 0, ataches: 0 },
    )

    return (
        <section className="page registros-page">
            <PageHeader title="Registros" description="Producción de blusas por empleado." />

            {empleadosError && <p className="error">{empleadosError}</p>}

            <div className="toolbar registros-filtros">
                <label>
                    Empleado
                    <select
                        value={empleadoId ?? ''}
                        disabled={loadingEmpleados}
                        onChange={(e) => setEmpleadoId(e.target.value ? Number(e.target.value) : null)}
                    >
                        <option value="">Todos los empleados</option>
                        {empleados.map((empleado) => (
                            <option key={empleado.id} value={empleado.id}>
                                {empleado.nombreCompleto}
                            </option>
                        ))}
                    </select>
                </label>

                <SegmentedControl label="Rango de fechas" options={PRESETS} value={preset} onChange={setPreset} />
            </div>

            {preset === 'custom' && (
                <div className="toolbar registros-custom">
                    <label>
                        Desde
                        <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
                    </label>
                    <label>
                        Hasta
                        <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
                    </label>
                    <Button variant="primary" onClick={aplicarRangoCustom}>
                        Aplicar
                    </Button>
                </div>
            )}
            {customError && <p className="error">{customError}</p>}

            {!consulta ? (
                <p className="muted registros-hint">Elige las fechas y pulsa Aplicar.</p>
            ) : (
                <>
                    <div className="registros-totales" aria-live="polite">
                        <p className="muted">{formatRangoFechas(consulta.rango.inicio, consulta.rango.fin)}</p>
                        <div className="registros-totales-metricas">
                            <Metric label="Blusas confeccionadas" value={totales.confeccion} />
                            <Metric label="Mullos puestos" value={totales.mullos} />
                            <Metric label="Ataches puestos" value={totales.ataches} />
                        </div>
                    </div>

                    {fallo ? (
                        <p className="error">No se pudo cargar la lista de registros.</p>
                    ) : !registros ? (
                        <SkeletonRows label="Cargando registros" />
                    ) : (
                        <RegistrosLista registros={registros} showEmpleado />
                    )}
                </>
            )}
        </section>
    )
}
