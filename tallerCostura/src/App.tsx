import { Navigate, Route, Routes } from 'react-router-dom'
import './App.css'
import { AuthProvider, useAuth } from './auth/AuthContext'
import { ProtectedRoute } from './auth/ProtectedRoute'
import { Navbar } from './components/Navbar'
import { AdminPage } from './pages/admin/AdminPage'
import { EmpleadoPage } from './pages/EmpleadoPage'
import { LoginPage } from './pages/LoginPage'

function HomeRedirect() {
  const { user } = useAuth()
  return <Navigate to={user?.role === 'ADMIN' ? '/admin' : '/registros'} replace />
}

function AppRoutes() {
  const { user } = useAuth()

  return (
    <Routes>
      <Route path="/login" element={user ? <Navigate to="/" replace /> : <LoginPage />} />
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <HomeRedirect />
          </ProtectedRoute>
        }
      />
      <Route
        path="/registros"
        element={
          <ProtectedRoute allowedRoles={['EMPLEADO']}>
            <EmpleadoPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin"
        element={
          <ProtectedRoute allowedRoles={['ADMIN']}>
            <AdminPage />
          </ProtectedRoute>
        }
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

function App() {
  return (
    <AuthProvider>
      <Navbar />
      <AppRoutes />
    </AuthProvider>
  )
}

export default App
