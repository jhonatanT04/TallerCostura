import { useEffect, useRef, useState, type FormEvent } from 'react'
import { actualizarConfiguracionPago, getConfiguracionPago } from '../api'

export function ConfiguracionPagoMenu() {
  const [isOpen, setIsOpen] = useState(false)
  const [loaded, setLoaded] = useState(false)
  const [precioMullos, setPrecioMullos] = useState('0')
  const [precioAtaches, setPrecioAtaches] = useState('0')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [saved, setSaved] = useState(false)

  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  function handleToggle() {
    setIsOpen((value) => {
      const next = !value
      if (next && !loaded) {
        getConfiguracionPago().then((config) => {
          setPrecioMullos(String(config.precioMullos))
          setPrecioAtaches(String(config.precioAtaches))
          setLoaded(true)
        })
      }
      return next
    })
  }

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
    <div className="config-pago-menu" ref={menuRef}>
      <button
        type="button"
        className="config-pago-toggle"
        onClick={handleToggle}
        title="Configuración de pagos"
      >
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path
            d="M12 15a3 3 0 100-6 3 3 0 000 6z"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 11-2.83 2.83l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 11-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 11-2.83-2.83l.06-.06a1.65 1.65 0 00.33-1.82 1.65 1.65 0 00-1.51-1H3a2 2 0 110-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 112.83-2.83l.06.06a1.65 1.65 0 001.82.33H9a1.65 1.65 0 001-1.51V3a2 2 0 114 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 112.83 2.83l-.06.06a1.65 1.65 0 00-.33 1.82V9a1.65 1.65 0 001.51 1H21a2 2 0 110 4h-.09a1.65 1.65 0 00-1.51 1z"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>

      <div className={`navbar-menu config-pago-panel ${isOpen ? 'open' : ''}`}>
        <h4>Configuración de pagos</h4>
        {!loaded ? (
          <p>Cargando…</p>
        ) : (
          <form onSubmit={handleSubmit}>
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
            <button type="submit" className="primary" disabled={saving}>
              {saving ? 'Guardando…' : 'Guardar'}
            </button>
          </form>
        )}
      </div>
    </div>
  )
}
