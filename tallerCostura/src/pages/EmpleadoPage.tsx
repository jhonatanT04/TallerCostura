import { useCallback, useEffect, useState } from 'react'
import { getMisRegistros } from '../api'
import type { RegistroDTO } from '../api/types'
import { FormRegistroConfeccion } from '../components/FormRegistroConfeccion'
import { FormRegistroMullosAtaches } from '../components/FormRegistroMullosAtaches'
import { RegistrosTable } from '../components/RegistrosTable'

type ModoRegistro = 'confeccion' | 'mullosAtaches'

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

  return (
    <div className="page">
      <h2>Registrar blusa</h2>
      <label className="tipo-registro">
        <select value={modo} onChange={(event) => setModo(event.target.value as ModoRegistro)}>
          <option value="confeccion">Blusas confeccionadas</option>
          <option value="mullosAtaches">Mullos y ataches</option>
        </select>
      </label>
      {modo === 'confeccion' ? (
        <FormRegistroConfeccion {...formProps} />
      ) : (
        <FormRegistroMullosAtaches {...formProps} />
      )}

      <h2>Mis registros</h2>
      {loading ? (
        <p>Cargando…</p>
      ) : loadError ? (
        <p className="error">{loadError}</p>
      ) : (
        <RegistrosTable registros={registros} />
      )}
    </div>
  )
}
