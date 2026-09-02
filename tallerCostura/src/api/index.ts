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

export function crearEmpleado(data: NuevoEmpleado): Promise<Empleado> {
  return apiFetch<Empleado>('/empleados', {
    method: 'POST',
    body: JSON.stringify(data),
  })
}

export function getEmpleados(): Promise<Empleado[]> {
  return apiFetch<Empleado[]>('/empleados')
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
