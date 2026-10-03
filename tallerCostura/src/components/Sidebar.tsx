import { useEffect } from "react";
import { NavLink } from "react-router-dom";

const listComponets = [
  { name: 'Home', href: '/admin/dashboard' },
  { name: 'Clientes', href: '/admin/clientes' },
  { name: 'Ordenes', href: '/admin/ordenes' },
  { name: 'Pagos', href: '/admin/pagos' },
  { name: 'Registros', href: '/admin/registros' },
  { name: 'Empleados', href: '/admin/empleados' },
]

interface AdminDrawerProps {
  open: boolean
  onClose: () => void
}

export function AdminDrawer({ open, onClose }: AdminDrawerProps) {
  useEffect(() => {
    if (!open) return
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [open, onClose])

  return (
    <>
      <div className={`drawer-overlay${open ? ' open' : ''}`} onClick={onClose} />
      <aside className={`drawer${open ? ' open' : ''}`} inert={!open} aria-label="Menú de administración">
        <div className="drawer-header">
          <span className="brand">
            <img src="/favicon.png" alt="" className="brand-icon" />
            Taller de Costura
          </span>
          <button type="button" className="drawer-close" onClick={onClose} aria-label="Cerrar menú">
            ✕
          </button>
        </div>

        <nav className="drawer-nav">
          {listComponets.map((component) => (
            <NavLink
              key={component.href}
              to={component.href}
              className={({ isActive }) => (isActive ? 'active' : '')}
              onClick={onClose}
            >
              {component.name}
            </NavLink>
          ))}
        </nav>
      </aside>
    </>
  );
}
