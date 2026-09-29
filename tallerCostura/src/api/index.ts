import { apiFetch } from './client'
import type {
  AuthUser,
  CalcularPagoInput,
  Cliente,
  ConfiguracionPagoDTO,
  Empleado,
  NuevaOrden,
  NuevoCliente,
  NuevoEmpleado,
  NuevoRegistro,
  OrdenDTO,
  OrdenPagoDTO,
  RegistroDTO,
} from './types'

export { ApiError } from './client'
export type {
  AuthUser,
  CalcularPagoInput,
  Cliente,
  ConfiguracionPagoDTO,
  Empleado,
  EstadoPago,
  ItemOrdenInput,
  NuevaOrden,
  NuevoCliente,
  NuevoEmpleado,
  NuevoRegistro,
  OrdenDTO,
  OrdenItemDTO,
  OrdenPagoDTO,
  RegisterUser,
  RegistroDTO,
  Role,
} from './types'

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

export function actualizarPagoEmpleado(id: number, pagoPorBlusa: number): Promise<Empleado> {
  return apiFetch<Empleado>(`/empleados/${id}/pago`, {
    method: 'PATCH',
    body: JSON.stringify({ pagoPorBlusa }),
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

export function crearCliente(data: NuevoCliente): Promise<Cliente> {
  return apiFetch<Cliente>('/clientes', {
    method: 'POST',
    body: JSON.stringify(data),
  })
}

export function getClientes(): Promise<Cliente[]> {
  return apiFetch<Cliente[]>('/clientes')
}

export function crearOrden(data: NuevaOrden): Promise<OrdenDTO> {
  return apiFetch<OrdenDTO>('/ordenes', {
    method: 'POST',
    body: JSON.stringify(data),
  })
}

export function getOrdenes(): Promise<OrdenDTO[]> {
  return apiFetch<OrdenDTO[]>('/ordenes')
}

export function getOrden(id: number): Promise<OrdenDTO> {
  return apiFetch<OrdenDTO>(`/ordenes/${id}`)
}

export function getOrdenesDeCliente(clienteId: number): Promise<OrdenDTO[]> {
  return apiFetch<OrdenDTO[]>(`/ordenes/cliente/${clienteId}`)
}

export function getConfiguracionPago(): Promise<ConfiguracionPagoDTO> {
  return apiFetch<ConfiguracionPagoDTO>('/configuracion-pago')
}

export function actualizarConfiguracionPago(
  data: ConfiguracionPagoDTO,
): Promise<ConfiguracionPagoDTO> {
  return apiFetch<ConfiguracionPagoDTO>('/configuracion-pago', {
    method: 'PUT',
    body: JSON.stringify(data),
  })
}

export function calcularPago(data: CalcularPagoInput): Promise<OrdenPagoDTO> {
  return apiFetch<OrdenPagoDTO>('/pagos/calcular', {
    method: 'POST',
    body: JSON.stringify(data),
  })
}

export function getPagos(): Promise<OrdenPagoDTO[]> {
  return apiFetch<OrdenPagoDTO[]>('/pagos')
}

export function getPagosDeEmpleado(empleadoId: number): Promise<OrdenPagoDTO[]> {
  return apiFetch<OrdenPagoDTO[]>(`/pagos/empleado/${empleadoId}`)
}

export function getMisPagos(): Promise<OrdenPagoDTO[]> {
  return apiFetch<OrdenPagoDTO[]>('/pagos/mios')
}
