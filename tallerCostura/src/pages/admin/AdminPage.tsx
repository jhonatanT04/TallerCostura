import { useCallback, useEffect, useState, type FormEvent } from 'react'
import { crearEmpleado, getEmpleados, getRegistrosDeEmpleado, getTodosLosRegistros } from '../../api'
import type { Empleado, RegistroDTO } from '../../api/types'
import { RegistrosTable } from '../../components/RegistrosTable'
import { Sidebarpage } from './Sidebarpage'
import { EmpleadosPage } from './EmpleadosPage'
import { Outlet } from 'react-router-dom'

export function AdminPage() {
  const [empleados, setEmpleados] = useState<Empleado[]>([])
  const [loadingEmpleados, setLoadingEmpleados] = useState(true)
  const [empleadosError, setEmpleadosError] = useState<string | null>(null)

  const [selected, setSelected] = useState<Empleado | null>(null)
  const [viewAll, setViewAll] = useState(false)
  const [registros, setRegistros] = useState<RegistroDTO[]>([])
  const [loadingRegistros, setLoadingRegistros] = useState(false)
  const [registrosError, setRegistrosError] = useState<string | null>(null)

  const [showCreateForm, setShowCreateForm] = useState(false)
  const [newUsername, setNewUsername] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [newNombre, setNewNombre] = useState('')
  const [creating, setCreating] = useState(false)
  const [createError, setCreateError] = useState<string | null>(null)

  const loadEmpleados = useCallback(async () => {
    setLoadingEmpleados(true)
    setEmpleadosError(null)
    try {
      setEmpleados(await getEmpleados())
    } catch {
      setEmpleadosError('No se pudo cargar la lista de empleados.')
    } finally {
      setLoadingEmpleados(false)
    }
  }, [])

  useEffect(() => {
    loadEmpleados()
  }, [loadEmpleados])

  useEffect(() => {
    if (!viewAll && !selected) return

    let cancelled = false
    setLoadingRegistros(true)
    setRegistrosError(null)

    const request = viewAll ? getTodosLosRegistros() : getRegistrosDeEmpleado(selected!.id)
    request
      .then((data) => {
        if (!cancelled) setRegistros(data)
      })
      .catch(() => {
        if (!cancelled) setRegistrosError('No se pudieron cargar los registros.')
      })
      .finally(() => {
        if (!cancelled) setLoadingRegistros(false)
      })

    return () => {
      cancelled = true
    }
  }, [viewAll, selected])

  function selectEmpleado(empleado: Empleado) {
    setViewAll(false)
    setSelected(empleado)
  }

  function selectTodos() {
    setSelected(null)
    setViewAll(true)
  }

  async function handleCreate(event: FormEvent) {
    event.preventDefault()
    setCreateError(null)
    setCreating(true)
    try {
      await crearEmpleado({ username: newUsername, password: newPassword, nombreCompleto: newNombre })
      setNewUsername('')
      setNewPassword('')
      setNewNombre('')
      setShowCreateForm(false)
      await loadEmpleados()
    } catch {
      setCreateError('No se pudo crear el empleado.')
    } finally {
      setCreating(false)
    }
  }

  return (
    <div className="page admin-page">
      <Sidebarpage/>
      <main className="admin-content">
        <Outlet/>
      </main>
    </div>
  )
}
