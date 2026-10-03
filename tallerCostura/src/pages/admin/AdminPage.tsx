import { Outlet } from 'react-router-dom'

export function AdminPage() {
  return (
    <div className="admin-page">
      <main className="admin-content">
        <Outlet />
      </main>
    </div>
  )
}
