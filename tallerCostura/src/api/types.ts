export type Role = 'ADMIN' | 'EMPLEADO'

export interface AuthUser {
  token: string
  role: Role
  username: string
  nombreCompleto: string
}

export interface Empleado {
  id: number
  username: string
  nombreCompleto: string
}

export interface RegistroDTO {
  id: number
  color: string
  talla: string
  tieneMullos: boolean
  tieneAtaches: boolean
  cantidad: number
  fechaRegistro: string
  empleado: {
    id: number
    nombreCompleto: string
    username: string
  }
}

export interface NuevoRegistro {
  color: string
  talla: string
  tieneMullos: boolean
  tieneAtaches: boolean
  cantidad: number
}

export interface NuevoEmpleado {
  username: string
  password: string
  nombreCompleto: string
}
