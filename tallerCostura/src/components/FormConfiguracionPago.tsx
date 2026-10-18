import { useEffect, useState, type FormEvent } from 'react'
import { actualizarConfiguracionPago, getConfiguracionPago } from '../api'
import { GearIcon } from '@phosphor-icons/react'
import { Button } from './ui/Button'
import { ModalLayout } from './ui/ModalLayout'
import { SkeletonRows } from './ui/Skeleton'

interface FormConfiguracionPagoProps {
  onClose: () => void
}

export function FormConfiguracionPago({ onClose }: FormConfiguracionPagoProps) {
  const [loaded, setLoaded] = useState(false)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [precioMullos, setPrecioMullos] = useState('0')
  const [precioAtaches, setPrecioAtaches] = useState('0')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    getConfiguracionPago()
      .then((config) => {
        setPrecioMullos(String(config.precioMullos))
        setPrecioAtaches(String(config.precioAtaches))
        setLoaded(true)
      })
      .catch(() => setLoadError('No se pudo cargar la configuración.'))
  }, [])

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setError(null)
    setSaved(false)
    setSaving(true)
    try {
      await actualizarConfiguracionPago({
        precioMullos: Number(precioMullos) || 0,
        precioAtaches: Number(precioAtaches) || 0,
      })
      setSaved(true)
    } catch {
      setError('No se pudo guardar la configuración.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <ModalLayout
      icon={GearIcon}
      title="Configuración de pagos"
      description="Precio de mullos y ataches, igual para todos los empleados."
      onSubmit={loaded ? handleSubmit : undefined}
      footer={
        <>
          <Button onClick={onClose}>Cerrar</Button>
          {loaded && (
            <Button type="submit" variant="primary" loading={saving}>
              Guardar
            </Button>
          )}
        </>
      }
    >
      {loadError ? (
        <p className="error">{loadError}</p>
      ) : !loaded ? (
        <SkeletonRows rows={2} label="Cargando configuración" />
      ) : (
        <>
          <label>
            Precio mullos
            <input
              type="number"
              min="0"
              step="0.01"
              value={precioMullos}
              onChange={(e) => {
                setPrecioMullos(e.target.value)
                setSaved(false)
              }}
              required
            />
          </label>
          <label>
            Precio ataches
            <input
              type="number"
              min="0"
              step="0.01"
              value={precioAtaches}
              onChange={(e) => {
                setPrecioAtaches(e.target.value)
                setSaved(false)
              }}
              required
            />
          </label>
          {error && <p className="error">{error}</p>}
          {saved && <p className="info">Guardado.</p>}
        </>
      )}
    </ModalLayout>
  )
}
