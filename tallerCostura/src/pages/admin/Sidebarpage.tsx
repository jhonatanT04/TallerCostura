import { Link } from "react-router-dom";

export function Sidebarpage() {

  const listComponets = [
    { name: 'Home', href: '/admin/dashboard' },
    { name: 'Ordenes', href: '/admin/ordenes' },
    { name: 'Registros', href: '/admin/registros' },
    { name: 'Empleados', href: '/admin/empleados' },
  ]

  return (
    <div className="div-sidebar">
      <nav className="sidebar">
        {listComponets.map((component) => (
          <span className="item-sidebar" key={component.href}>
            <Link to={component.href}>
              {component.name}
            </Link>
          </span>
        ))}
      </nav>
    </div>
  );
}