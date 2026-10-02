import { useState } from "react";
import { NavLink, useLocation } from "react-router-dom";

const listComponets = [
  { name: 'Home', href: '/admin/dashboard' },
  { name: 'Clientes', href: '/admin/clientes' },
  { name: 'Ordenes', href: '/admin/ordenes' },
  { name: 'Pagos', href: '/admin/pagos' },
  { name: 'Registros', href: '/admin/registros' },
  { name: 'Empleados', href: '/admin/empleados' },
]

export function Sidebarpage() {
  const [open, setOpen] = useState(false)
  const { pathname } = useLocation()
  const current = listComponets.find((c) => pathname.startsWith(c.href))

  return (
    <div className="div-sidebar">
      <button
        type="button"
        className="sidebar-toggle"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
      >
        <span>
          Menú <span className="muted">· {current?.name ?? ''}</span>
        </span>
        <span aria-hidden="true">{open ? '▲' : '▼'}</span>
      </button>

      <nav className={`sidebar${open ? ' open' : ''}`}>
        {listComponets.map((component) => (
          <span className="item-sidebar" key={component.href}>
            <NavLink
              to={component.href}
              className={({ isActive }) => (isActive ? 'active' : '')}
              onClick={() => setOpen(false)}
            >
              {component.name}
            </NavLink>
          </span>
        ))}
      </nav>
    </div>
  );
}
