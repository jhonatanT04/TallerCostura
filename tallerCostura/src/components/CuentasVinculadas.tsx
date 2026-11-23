import { useEffect, useState } from 'react'
import { LinkSimpleIcon } from '@phosphor-icons/react'
import {
  ApiError,
  desvincularCuenta,
  getVinculos,
  vincularCuenta,
  type ProveedorSocial,
  type VinculoSocial,
} from '../api'
import { formatFecha } from '../lib/fechas'
import { BotonesSociales } from './BotonesSociales'
import { Button } from './ui/Button'
import { ModalLayout } from './ui/ModalLayout'
import { SkeletonRows } from './ui/Skeleton'

const NOMBRES: Record<ProveedorSocial, string> = { GOOGLE: 'Google', FACEBOOK: 'Facebook' }

interface CuentasVinculadasProps {
  onClose: () => void
}

// Vincula Google/Facebook a la cuenta con sesión iniciada para poder entrar con ellos.
export function CuentasVinculadas({ onClose }: CuentasVinculadasProps) {
  const [vinculos, setVinculos] = useState<VinculoSocial[] | null>(null)
  const [ocupado, setOcupado] = useState<ProveedorSocial | 'nuevo' | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    getVinculos()
      .then(setVinculos)
      .catch(() => setError('No se pudieron cargar tus cuentas vinculadas.'))
  }, [])

  function mostrarError(err: unknown, generico: string) {
    setError(err instanceof ApiError && err.serverMessage ? err.serverMessage : generico)
  }

  async function handleVincular(proveedor: ProveedorSocial, token: string) {
    setError(null)
    setOcupado('nuevo')
    try {
      setVinculos(await vincularCuenta(proveedor, token))
    } catch (err) {
      mostrarError(err, `No se pudo vincular tu cuenta de ${NOMBRES[proveedor]}.`)
    } finally {
      setOcupado(null)
    }
  }

  async function handleDesvincular(proveedor: ProveedorSocial) {
    setError(null)
    setOcupado(proveedor)
    try {
      await desvincularCuenta(proveedor)
      setVinculos((prev) => prev?.filter((v) => v.proveedor !== proveedor) ?? null)
    } catch (err) {
      mostrarError(err, `No se pudo desvincular tu cuenta de ${NOMBRES[proveedor]}.`)
    } finally {
      setOcupado(null)
    }
  }

  return (
    <ModalLayout
      icon={LinkSimpleIcon}
      title="Cuentas vinculadas"
      description="Vincula tu cuenta de Google o Facebook para entrar con ella, además de tu usuario y contraseña."
      footer={<Button onClick={onClose}>Cerrar</Button>}
    >
      {vinculos === null && !error && <SkeletonRows rows={2} />}

      {vinculos && vinculos.length > 0 && (
        <ul className="vinculos">
          {vinculos.map((v) => (
            <li key={v.proveedor} className="vinculo">
              <span className="vinculo-texto">
                <span className="vinculo-proveedor">{NOMBRES[v.proveedor]}</span>
                <span className="vinculo-detalle">
                  {v.email ?? 'Cuenta vinculada'} · desde {formatFecha(v.vinculadoEn)}
                </span>
              </span>
              <Button
                size="sm"
                variant="secondary"
                loading={ocupado === v.proveedor}
                disabled={ocupado !== null}
                onClick={() => handleDesvincular(v.proveedor)}
              >
                Desvincular
              </Button>
            </li>
          ))}
        </ul>
      )}

      {vinculos && (
        <BotonesSociales
          texto="vincular"
          ocultar={vinculos.map((v) => v.proveedor)}
          deshabilitado={ocupado !== null}
          onToken={handleVincular}
          onError={setError}
        />
      )}

      {error && (
        <p className="error" role="alert">
          {error}
        </p>
      )}
    </ModalLayout>
  )
}
