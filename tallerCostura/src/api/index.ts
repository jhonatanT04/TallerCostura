import { apiFetch } from './client'
import type { AuthUser, Empleado, NuevoEmpleado, NuevoRegistro, RegistroDTO } from './types'

export { ApiError } from './client'
export type { AuthUser, Empleado, NuevoEmpleado, NuevoRegistro, RegistroDTO, Role } from './types'

export function login(username: string, password: string): Promise<AuthUser> {
  return apiFetch<AuthUser>('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ username, password }),
  })
}
export function register(
  nombreCompleto: string,
  username: string,
  password: string,
): Promise<void> {
  return apiFetch<void>('/auth/register', {
    method: 'POST',
    body: JSON.stringify({
      nombreCompleto,
      username,
      password,
    }),
  })
}

export function crearEmpleado(data: NuevoEmpleado): Promise<Empleado> {
  return apiFetch<Empleado>('/empleados', {
    method: 'POST',
    body: JSON.stringify(data),
  })
}

export function getEmpleados(): Promise<Empleado[]> {
  return apiFetch<Empleado[]>('/empleados')
}

export function activarEmpleado(id: number): Promise<Empleado> {
  return apiFetch<Empleado>(`/empleados/${id}/activar`, {
    method: 'PATCH',
  })
}

export function getRegistrosDeEmpleado(id: number): Promise<RegistroDTO[]> {
  return apiFetch<RegistroDTO[]>(`/empleados/${id}/registros`)
}

export function crearRegistro(data: NuevoRegistro): Promise<RegistroDTO> {
  return apiFetch<RegistroDTO>('/registros', {
    method: 'POST',
    body: JSON.stringify(data),
  })
}

export function getMisRegistros(): Promise<RegistroDTO[]> {
  return apiFetch<RegistroDTO[]>('/registros/mios')
}

export function getTodosLosRegistros(): Promise<RegistroDTO[]> {
  return apiFetch<RegistroDTO[]>('/registros')
}
export function getRegistrosDate(
  fechaInicio?: string,
  fechaFin?: string,
  empleadoId?: number,
): Promise<RegistroDTO[]> {
  const params = new URLSearchParams()
  if (fechaInicio) params.append('fechaInicio', fechaInicio)
  if (fechaFin) params.append('fechaFin', fechaFin)
  if (empleadoId !== undefined) params.append('empleadoId', String(empleadoId))

  const query = params.toString()
  return apiFetch<RegistroDTO[]>(`/registros/getForDate${query ? `?${query}` : ''}`)
}
