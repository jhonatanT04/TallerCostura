import { Sidebarpage } from '../../components/Sidebar'
import { Outlet } from 'react-router-dom'

export function AdminPage() {  

  return (
    <div className="page admin-page">
      <Sidebarpage/>
      <main className="admin-content">
        <Outlet/>
      </main>
    </div>
  )
}
