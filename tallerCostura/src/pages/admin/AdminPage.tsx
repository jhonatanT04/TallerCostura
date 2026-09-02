import { useCallback, useEffect, useState, type FormEvent } from 'react'
import { crearEmpleado, getEmpleados, getRegistrosDeEmpleado, getTodosLosRegistros } from '../../api'
import type { Empleado, RegistroDTO } from '../../api/types'
import { RegistrosTable } from '../../components/RegistrosTable'

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
      <aside className="panel">
        <div className="panel-header">
          <h2>Empleados</h2>
          <button type="button" onClick={() => setShowCreateForm((v) => !v)}>
            {showCreateForm ? 'Cancelar' : '+ Nuevo empleado'}
          </button>
        </div>

        {showCreateForm && (
          <form className="inline-form" onSubmit={handleCreate}>
            <label>
              Nombre completo
              <input value={newNombre} onChange={(event) => setNewNombre(event.target.value)} required />
            </label>
            <label>
              Usuario
              <input value={newUsername} onChange={(event) => setNewUsername(event.target.value)} required />
            </label>
            <label>
              Contraseña
              <input
                type="password"
                value={newPassword}
                onChange={(event) => setNewPassword(event.target.value)}
                required
              />
            </label>
            {createError && <p className="error">{createError}</p>}
            <button type="submit" className="primary" disabled={creating}>
              {creating ? 'Creando…' : 'Crear empleado'}
            </button>
          </form>
        )}

        {loadingEmpleados ? (
          <p>Cargando…</p>
        ) : empleadosError ? (
          <p className="error">{empleadosError}</p>
        ) : (
          <ul className="employee-list">
            <li>
              <button type="button" className={viewAll ? 'active' : ''} onClick={selectTodos}>
                Todos los registros
              </button>
            </li>
            {empleados.map((empleado) => (
              <li key={empleado.id}>
                <button
                  type="button"
                  className={selected?.id === empleado.id ? 'active' : ''}
                  onClick={() => selectEmpleado(empleado)}
                >
                  {empleado.nombreCompleto} <span className="muted">@{empleado.username}</span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </aside>

      <section className="panel registros-panel">
        <h2>
          {viewAll
            ? 'Todos los registros'
            : selected
              ? `Registros de ${selected.nombreCompleto}`
              : 'Selecciona un empleado'}
        </h2>
        {viewAll || selected ? (
          loadingRegistros ? (
            <p>Cargando…</p>
          ) : registrosError ? (
            <p className="error">{registrosError}</p>
          ) : (
            <RegistrosTable registros={registros} showEmpleado={viewAll} />
          )
        ) : (
          <p className="empty">Elige un empleado o "Todos los registros" para ver los datos.</p>
        )}
      </section>
    </div>
  )
}
