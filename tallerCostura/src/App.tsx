import { Navigate, Outlet, Route, Routes } from 'react-router-dom'
import './App.css'
import { AuthProvider, useAuth } from './auth/AuthContext'
import { ProtectedRoute } from './auth/ProtectedRoute'
import { AppLayout } from './components/layout/AppLayout'
import { EmpleadoPage } from './pages/EmpleadoPage'
import { LoginPage } from './pages/LoginPage'
import { EmpleadosPage } from './pages/admin/EmpleadosPage'
import { DashboardPage } from './pages/admin/DashboardPage'
import { ClientesPage } from './pages/admin/ClientesPage'
import { OrdenesPage } from './pages/admin/OrdenesPage'
import { PagosPage } from './pages/admin/PagosPage'
import { RegistroPage } from './pages/admin/RegistrosPage'
import { RegisterPage } from './pages/RegisterPage'
import { MisPagosPage } from './pages/MisPagosPage'

function HomeRedirect() {
  const { user } = useAuth()
  return <Navigate to={user?.role === 'ADMIN' ? '/admin' : '/registros'} replace />
}

function AppRoutes() {
  const { user } = useAuth()

  return (
    <Routes>
      <Route path="/login" element={user ? <Navigate to="/" replace /> : <LoginPage />} />
      <Route path="/register" element={ user ? <Navigate to="/" replace /> : <RegisterPage /> } />
      <Route
        element={
          <ProtectedRoute>
            <AppLayout />
          </ProtectedRoute>
        }
      >
        <Route path="/" element={<HomeRedirect />} />
        <Route
          path="/registros"
          element={
            <ProtectedRoute allowedRoles={['EMPLEADO']}>
              <EmpleadoPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/pagos"
          element={
            <ProtectedRoute allowedRoles={['EMPLEADO']}>
              <MisPagosPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin"
          element={
            <ProtectedRoute allowedRoles={['ADMIN']}>
              <Outlet />
            </ProtectedRoute>
          }
        >
          <Route index element={<Navigate to="dashboard" replace />} />
          <Route path="dashboard" element={<DashboardPage />} />
          <Route path="clientes" element={<ClientesPage />} />
          <Route path="ordenes" element={<OrdenesPage />} />
          <Route path="pagos" element={<PagosPage />} />
          <Route path="registros" element={<RegistroPage />} />
          <Route path="empleados" element={<EmpleadosPage />} />
        </Route>
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

function App() {
  return (
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>
  )
}

export default App
