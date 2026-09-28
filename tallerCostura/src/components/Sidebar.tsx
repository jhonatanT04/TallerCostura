import { NavLink } from "react-router-dom";

export function Sidebarpage() {

  const listComponets = [
    { name: 'Home', href: '/admin/dashboard' },
    { name: 'Clientes', href: '/admin/clientes' },
    { name: 'Ordenes', href: '/admin/ordenes' },
    { name: 'Pagos', href: '/admin/pagos' },
    { name: 'Registros', href: '/admin/registros' },
    { name: 'Empleados', href: '/admin/empleados' },
  ]

  return (
    <div className="div-sidebar">
      <nav className="sidebar">
        {listComponets.map((component) => (
          <span className="item-sidebar" key={component.href}>
            <NavLink to={component.href} className={({ isActive }) => (isActive ? 'active' : '')}>
              {component.name}
            </NavLink>
          </span>
        ))}
      </nav>
    </div>
  );
}