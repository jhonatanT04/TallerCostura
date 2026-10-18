import { useEffect, useState, useSyncExternalStore } from 'react'
import { NavLink, Outlet } from 'react-router-dom'
import {
  AddressBookIcon,
  ClipboardTextIcon,
  GearIcon,
  HouseIcon,
  ListIcon,
  PackageIcon,
  ReceiptIcon,
  ScissorsIcon,
  SignOutIcon,
  UsersIcon,
  WalletIcon,
  XIcon,
  type Icon,
} from '@phosphor-icons/react'
import { useAuth } from '../../auth/AuthContext'
import { iniciales } from '../../lib/formato'
import { FormConfiguracionPago } from '../FormConfiguracionPago'
import { Modal } from '../Modal'
import { IconButton } from '../ui/IconButton'
import './AppLayout.css'

interface NavItem {
  label: string
  to: string
  icon: Icon
}

const ADMIN_NAV: NavItem[] = [
  { label: 'Inicio', to: '/admin/dashboard', icon: HouseIcon },
  { label: 'Registros', to: '/admin/registros', icon: ClipboardTextIcon },
  { label: 'Pagos', to: '/admin/pagos', icon: WalletIcon },
  { label: 'Empleados', to: '/admin/empleados', icon: UsersIcon },
  { label: 'Clientes', to: '/admin/clientes', icon: AddressBookIcon },
  { label: 'Órdenes', to: '/admin/ordenes', icon: PackageIcon },
]

const EMPLEADO_NAV: NavItem[] = [
  { label: 'Registrar', to: '/registros', icon: ScissorsIcon },
  { label: 'Mis pagos', to: '/pagos', icon: ReceiptIcon },
]

const DESKTOP_QUERY = '(min-width: 1024px)'

function subscribeDesktop(callback: () => void) {
  const media = window.matchMedia(DESKTOP_QUERY)
  media.addEventListener('change', callback)
  return () => media.removeEventListener('change', callback)
}

function useIsDesktop(): boolean {
  return useSyncExternalStore(subscribeDesktop, () => window.matchMedia(DESKTOP_QUERY).matches)
}

function Brand() {
  return (
    <span className="shell-brand">
      <img src="/favicon.png" alt="" className="shell-brand-icon" />
      Taller de Costura
    </span>
  )
}

export function AppLayout() {
  const { user, logout } = useAuth()
  const isDesktop = useIsDesktop()
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [configOpen, setConfigOpen] = useState(false)

  const drawerVisible = drawerOpen && !isDesktop

  useEffect(() => {
    if (!drawerVisible) return
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') setDrawerOpen(false)
    }
    const overflowPrevio = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.body.style.overflow = overflowPrevio
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [drawerVisible])

  if (!user) return null

  const isAdmin = user.role === 'ADMIN'
  const items = isAdmin ? ADMIN_NAV : EMPLEADO_NAV
  const cerrarDrawer = () => setDrawerOpen(false)

  return (
    <div className="shell">
      <header className="shell-topbar">
        <Brand />
        <IconButton
          icon={ListIcon}
          label="Abrir menú"
          aria-expanded={drawerOpen}
          aria-controls="shell-sidebar"
          onClick={() => setDrawerOpen(true)}
        />
      </header>

      <div className={`shell-overlay${drawerVisible ? ' open' : ''}`} onClick={cerrarDrawer} aria-hidden="true" />

      <aside
        id="shell-sidebar"
        className={`shell-sidebar${drawerVisible ? ' open' : ''}`}
        aria-label="Navegación principal"
        inert={!isDesktop && !drawerOpen}
      >
        <div className="shell-sidebar-header">
          <Brand />
          <IconButton icon={XIcon} label="Cerrar menú" className="shell-close" onClick={cerrarDrawer} />
        </div>

        <nav className="shell-nav">
          {items.map(({ label, to, icon: ItemIcon }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) => `shell-nav-item${isActive ? ' active' : ''}`}
              onClick={cerrarDrawer}
            >
              <ItemIcon size={20} aria-hidden="true" />
              {label}
            </NavLink>
          ))}
        </nav>

        <div className="shell-sidebar-footer">
          {isAdmin && (
            <button
              type="button"
              className="shell-nav-item"
              onClick={() => {
                cerrarDrawer()
                setConfigOpen(true)
              }}
            >
              <GearIcon size={20} aria-hidden="true" />
              Configuración de pagos
            </button>
          )}

          <div className="shell-user">
            <span className="shell-avatar" aria-hidden="true">
              {iniciales(user.nombreCompleto || user.username)}
            </span>
            <div className="shell-user-text">
              <span className="shell-user-name">{user.nombreCompleto || user.username}</span>
              <span className="shell-user-role">{isAdmin ? 'Administradora' : 'Empleada'}</span>
            </div>
            <IconButton icon={SignOutIcon} label="Cerrar sesión" onClick={logout} />
          </div>
        </div>
      </aside>

      <main className="shell-content">
        <div className="shell-content-inner">
          <Outlet />
        </div>
      </main>

      {configOpen && (
        <Modal onClose={() => setConfigOpen(false)} label="Configuración de pagos">
          <FormConfiguracionPago onClose={() => setConfigOpen(false)} />
        </Modal>
      )}
    </div>
  )
}
