import { useCallback, useEffect, useState } from 'react'
import { getMisRegistros } from '../api'
import type { RegistroDTO } from '../api/types'
import { FormRegistroConfeccion } from '../components/FormRegistroConfeccion'
import { FormRegistroMullosAtaches } from '../components/FormRegistroMullosAtaches'
import { RegistrosLista } from '../components/RegistrosLista'
import { Card } from '../components/ui/Card'
import { Metric } from '../components/ui/Metric'
import { PageHeader } from '../components/ui/PageHeader'
import { SegmentedControl } from '../components/ui/SegmentedControl'
import { SkeletonRows } from '../components/ui/Skeleton'
import { addDays, formatRangoFechas, lunesDe, toISODate } from '../lib/fechas'

type ModoRegistro = 'confeccion' | 'mullosAtaches'

const MODOS: { value: ModoRegistro; label: string }[] = [
  { value: 'confeccion', label: 'Blusas confeccionadas' },
  { value: 'mullosAtaches', label: 'Mullos y ataches' },
]

function totalesDeEstaSemana(registros: RegistroDTO[]) {
  const lunes = lunesDe(new Date())
  const desde = toISODate(lunes)
  const hasta = toISODate(addDays(lunes, 6))
  return registros.reduce(
    (acc, r) => {
      // fechaRegistro es un instante UTC; se compara por el día local.
      const dia = toISODate(new Date(r.fechaRegistro))
      if (dia < desde || dia > hasta) return acc
      return {
        ...acc,
        confeccion: acc.confeccion + r.cantidadConfeccion,
        mullos: acc.mullos + r.cantidadMullos,
        ataches: acc.ataches + r.cantidadAtaches,
      }
    },
    { confeccion: 0, mullos: 0, ataches: 0, desde, hasta },
  )
}

export function EmpleadoPage() {
  const [modo, setModo] = useState<ModoRegistro>('confeccion')
  const [color, setColor] = useState('')
  const [talla, setTalla] = useState('')

  const [registros, setRegistros] = useState<RegistroDTO[]>([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)

  const loadRegistros = useCallback(async () => {
    setLoading(true)
    setLoadError(null)
    try {
      setRegistros(await getMisRegistros())
    } catch {
      setLoadError('No se pudieron cargar tus registros.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadRegistros()
  }, [loadRegistros])

  function handleRegistrado() {
    setColor('')
    setTalla('')
    loadRegistros()
  }

  const formProps = {
    color,
    talla,
    onColorChange: setColor,
    onTallaChange: setTalla,
    onRegistrado: handleRegistrado,
  }

  const semana = totalesDeEstaSemana(registros)

  return (
    <div className="page empleado-page">
      <PageHeader title="Registrar" description="Anota las blusas que confeccionaste o los mullos y ataches que pusiste." />

      <div className="registro-modo">
        <SegmentedControl label="Tipo de registro" options={MODOS} value={modo} onChange={setModo} />
      </div>

      <Card className="registro-card">
        {modo === 'confeccion' ? <FormRegistroConfeccion {...formProps} /> : <FormRegistroMullosAtaches {...formProps} />}
      </Card>

      <h2 className="seccion-titulo">Mis registros</h2>

      {loading && registros.length === 0 ? (
        <SkeletonRows label="Cargando tus registros" />
      ) : loadError ? (
        <p className="error">{loadError}</p>
      ) : (
        <>
          <div className="registros-totales">
            <p className="muted">Esta semana · {formatRangoFechas(semana.desde, semana.hasta)}</p>
            <div className="registros-totales-metricas">
              <Metric label="Blusas confeccionadas" value={semana.confeccion} />
              <Metric label="Mullos puestos" value={semana.mullos} />
              <Metric label="Ataches puestos" value={semana.ataches} />
            </div>
          </div>
          <RegistrosLista registros={registros} emptyMessage="Todavía no tienes registros." />
        </>
      )}
    </div>
  )
}
