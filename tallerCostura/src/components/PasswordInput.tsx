import { useState, type InputHTMLAttributes } from 'react'
import { EyeIcon, EyeSlashIcon } from '@phosphor-icons/react'

type PasswordInputProps = Omit<InputHTMLAttributes<HTMLInputElement>, 'type'>

export function PasswordInput(props: PasswordInputProps) {
  const [visible, setVisible] = useState(false)
  const Icono = visible ? EyeSlashIcon : EyeIcon

  return (
    <div className="password-input">
      <input {...props} type={visible ? 'text' : 'password'} />
      <button
        type="button"
        className="password-toggle"
        onClick={() => setVisible((v) => !v)}
        aria-label={visible ? 'Ocultar contraseña' : 'Mostrar contraseña'}
        title={visible ? 'Ocultar contraseña' : 'Mostrar contraseña'}
      >
        <Icono size={20} aria-hidden="true" />
      </button>
    </div>
  )
}
