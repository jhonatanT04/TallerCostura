export function Sidebarpage() {

  const listComponets = [
    { name: 'Menu', href: '/admin' },
    { name: 'Ordenes', href: '/admin/ordenes' },
    { name: 'Registros', href: '/admin/registros' },
    { name: 'Empleados', href: '/admin/empleados' },
  ]

  return (
    <div className="div-sidebar">
      <nav className="sidebar">
        {listComponets.map((component)=>(
          <span className="item-sidebar" key={component.href}>
            <a href={component.href} >{component.name}</a>
          </span>
        ))}
      </nav>
    </div>
  );
}