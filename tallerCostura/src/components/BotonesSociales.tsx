import { useEffect, useRef, useState } from 'react'
import { getProveedores, type ConfigProveedores, type ProveedorSocial } from '../api'
import { cargarFacebook, cargarGoogle, loginFacebook } from '../lib/sdkSocial'

type FacebookSdk = Awaited<ReturnType<typeof cargarFacebook>>

interface BotonesSocialesProps {
  // Recibe el token del proveedor; el componente no sabe si es para entrar o para vincular.
  onToken: (proveedor: ProveedorSocial, token: string) => void
  texto?: 'continuar' | 'vincular'
  // Proveedores que no se muestran (p. ej. los que ya están vinculados).
  ocultar?: ProveedorSocial[]
  deshabilitado?: boolean
  // Línea "o" antes de los botones; solo aparece si hay al menos un botón.
  conSeparador?: boolean
  onError?: (mensaje: string) => void
}

export function BotonesSociales({
  onToken,
  texto = 'continuar',
  ocultar = [],
  deshabilitado = false,
  conSeparador = false,
  onError,
}: BotonesSocialesProps) {
  const [config, setConfig] = useState<ConfigProveedores | null>(null)
  const [facebook, setFacebook] = useState<FacebookSdk | null>(null)
  const googleRef = useRef<HTMLDivElement>(null)
  // El botón de Google guarda el callback al inicializarse: se lee siempre el más reciente.
  const onTokenRef = useRef(onToken)
  const onErrorRef = useRef(onError)

  useEffect(() => {
    onTokenRef.current = onToken
    onErrorRef.current = onError
  })

  useEffect(() => {
    getProveedores()
      .then(setConfig)
      .catch(() => setConfig({ google: null, facebook: null }))
  }, [])

  const mostrarGoogle = Boolean(config?.google) && !ocultar.includes('GOOGLE')
  const mostrarFacebook = Boolean(config?.facebook) && !ocultar.includes('FACEBOOK')

  useEffect(() => {
    const clientId = config?.google?.clientId
    if (!clientId || !mostrarGoogle) return
    let cancelado = false
    cargarGoogle()
      .then((google) => {
        const contenedor = googleRef.current
        if (cancelado || !contenedor) return
        google.initialize({
          client_id: clientId,
          callback: ({ credential }) => onTokenRef.current('GOOGLE', credential),
          ux_mode: 'popup',
          auto_select: false,
        })
        contenedor.replaceChildren()
        google.renderButton(contenedor, {
          type: 'standard',
          theme: 'outline',
          size: 'large',
          shape: 'rectangular',
          text: texto === 'vincular' ? 'signin_with' : 'continue_with',
          logo_alignment: 'center',
          width: Math.min(400, contenedor.clientWidth || 360),
          locale: 'es',
        })
      })
      .catch(() => onErrorRef.current?.('No se pudo cargar el inicio de sesión con Google.'))
    return () => {
      cancelado = true
    }
  }, [config, mostrarGoogle, texto])

  useEffect(() => {
    const fb = config?.facebook
    if (!fb || !mostrarFacebook) return
    let cancelado = false
    cargarFacebook(fb.appId, fb.version)
      .then((sdk) => {
        if (!cancelado) setFacebook(sdk)
      })
      .catch(() => onErrorRef.current?.('No se pudo cargar el inicio de sesión con Facebook.'))
    return () => {
      cancelado = true
    }
  }, [config, mostrarFacebook])

  async function handleFacebook() {
    if (!facebook) return
    const token = await loginFacebook(facebook)
    if (token) onToken('FACEBOOK', token)
  }

  if (!mostrarGoogle && !mostrarFacebook) return null

  return (
    <div className="social">
      {conSeparador && (
        <div className="social-separador" role="separator">
          <span>o</span>
        </div>
      )}
      <div className={`social-botones${deshabilitado ? ' deshabilitado' : ''}`} aria-busy={deshabilitado || undefined}>
        {mostrarGoogle && <div ref={googleRef} className="social-google" />}
        {mostrarFacebook && (
          <button
            type="button"
            className="social-facebook"
            onClick={handleFacebook}
            disabled={!facebook || deshabilitado}
          >
            <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true">
              <path
                fill="currentColor"
                d="M24 12.07C24 5.41 18.63 0 12 0S0 5.4 0 12.07C0 18.1 4.39 23.1 10.13 24v-8.44H7.08v-3.49h3.04V9.41c0-3.02 1.8-4.7 4.54-4.7 1.31 0 2.68.24 2.68.24v2.97h-1.5c-1.5 0-1.96.93-1.96 1.89v2.26h3.32l-.53 3.5h-2.8V24C19.62 23.1 24 18.1 24 12.07"
              />
            </svg>
            {texto === 'vincular' ? 'Vincular Facebook' : 'Continuar con Facebook'}
          </button>
        )}
      </div>
    </div>
  )
}
