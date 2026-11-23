// Carga de los SDK oficiales de Google Identity Services y Facebook. Se cargan solo cuando
// el backend dice que ese proveedor está habilitado, y una sola vez por página.

interface GoogleCredentialResponse {
  credential: string
}

interface GoogleIdApi {
  initialize(config: {
    client_id: string
    callback: (respuesta: GoogleCredentialResponse) => void
    ux_mode?: 'popup' | 'redirect'
    auto_select?: boolean
    cancel_on_tap_outside?: boolean
  }): void
  renderButton(
    contenedor: HTMLElement,
    opciones: {
      type?: 'standard' | 'icon'
      theme?: 'outline' | 'filled_blue' | 'filled_black'
      size?: 'large' | 'medium' | 'small'
      text?: 'signin_with' | 'signup_with' | 'continue_with' | 'signin'
      shape?: 'rectangular' | 'pill' | 'circle' | 'square'
      logo_alignment?: 'left' | 'center'
      width?: number
      locale?: string
    },
  ): void
}

interface FacebookAuthResponse {
  status: 'connected' | 'not_authorized' | 'unknown'
  authResponse: { accessToken: string } | null
}

interface FacebookSdk {
  init(config: { appId: string; version: string; cookie?: boolean; xfbml?: boolean }): void
  login(callback: (respuesta: FacebookAuthResponse) => void, opciones?: { scope?: string }): void
}

declare global {
  interface Window {
    google?: { accounts: { id: GoogleIdApi } }
    FB?: FacebookSdk
    fbAsyncInit?: () => void
  }
}

const scripts = new Map<string, Promise<void>>()

function cargarScript(src: string): Promise<void> {
  let promesa = scripts.get(src)
  if (!promesa) {
    promesa = new Promise<void>((resolve, reject) => {
      const script = document.createElement('script')
      script.src = src
      script.async = true
      script.defer = true
      script.onload = () => resolve()
      script.onerror = () => {
        scripts.delete(src) // permite reintentar
        reject(new Error(`No se pudo cargar ${src}`))
      }
      document.head.appendChild(script)
    })
    scripts.set(src, promesa)
  }
  return promesa
}

export async function cargarGoogle(): Promise<GoogleIdApi> {
  await cargarScript('https://accounts.google.com/gsi/client')
  const api = window.google?.accounts.id
  if (!api) throw new Error('Google Identity Services no está disponible')
  return api
}

let facebookListo: Promise<FacebookSdk> | null = null

export function cargarFacebook(appId: string, version: string): Promise<FacebookSdk> {
  if (!facebookListo) {
    facebookListo = new Promise<FacebookSdk>((resolve, reject) => {
      window.fbAsyncInit = () => {
        const fb = window.FB
        if (!fb) {
          reject(new Error('El SDK de Facebook no está disponible'))
          return
        }
        fb.init({ appId, version, cookie: false, xfbml: false })
        resolve(fb)
      }
      cargarScript('https://connect.facebook.net/es_LA/sdk.js').catch((err: unknown) => {
        facebookListo = null
        reject(err)
      })
    })
  }
  return facebookListo
}

// FB.login abre una ventana emergente: hay que llamarlo directamente desde el clic.
// Resuelve con el access token, o null si la persona cerró la ventana o no dio permiso.
export function loginFacebook(fb: FacebookSdk): Promise<string | null> {
  return new Promise((resolve) => {
    fb.login(
      (respuesta) => resolve(respuesta.status === 'connected' ? (respuesta.authResponse?.accessToken ?? null) : null),
      { scope: 'public_profile,email' },
    )
  })
}
