import { CheckCircleIcon } from '@phosphor-icons/react'

// Error y confirmación de los formularios de registro. El role="status" queda siempre montado
// para que los lectores de pantalla anuncien "Registro guardado".
export function RegistroMensajes({ error, exito }: { error: string | null; exito: boolean }) {
  return (
    <>
      {error && <p className="error registro-mensaje">{error}</p>}
      <p className="registro-exito" role="status">
        {exito && (
          <>
            <CheckCircleIcon size={20} aria-hidden="true" />
            Registro guardado
          </>
        )}
      </p>
    </>
  )
}
