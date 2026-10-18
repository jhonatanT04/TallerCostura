export type Role = 'ADMIN' | 'EMPLEADO'

export interface AuthUser {
  token: string
  role: Role
  username: string
  nombreCompleto: string
}

export interface RegisterUser {
  username: string
  password: string
  nombreCompleto: string
}

export interface Empleado {
  id: number
  username: string
  nombreCompleto: string
  activo: boolean
  pagoPorBlusa: number
}

export interface RegistroDTO {
  id: number
  color: string
  talla: string
  cantidadConfeccion: number
  cantidadMullos: number
  cantidadAtaches: number
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
  cantidadConfeccion: number
  cantidadMullos: number
  cantidadAtaches: number
}

export interface NuevoEmpleado {
  username: string
  password: string
  nombreCompleto: string
  pagoPorBlusa?: number
}

export interface Cliente {
  id: number
  nombre: string
  telefono: string | null
}

export interface NuevoCliente {
  nombre: string
  telefono: string | null
}

export interface OrdenItemDTO {
  id: number
  color: string
  cantidad: number
  precioUnitario: number
  subtotal: number
}

export interface ItemOrdenInput {
  color: string
  cantidad: number
  precioUnitario: number
}

export interface OrdenDTO {
  id: number
  cliente: Cliente
  fechaCreacion: string
  items: OrdenItemDTO[]
  totalBlusas: number
  total: number
}

export interface NuevaOrden {
  clienteId: number
  items: ItemOrdenInput[]
}

export interface ConfiguracionPagoDTO {
  precioMullos: number
  precioAtaches: number
}

export type EstadoPago = 'PENDIENTE' | 'PAGADO'

// id y fechaPago son null solo en una previsualización (GET /pagos/previsualizar), que no se guarda.
export interface OrdenPagoDTO {
  id: number | null
  empleado: {
    id: number
    username: string
    nombreCompleto: string
    activo: boolean
    pagoPorBlusa: number
  }
  semanaInicio: string
  semanaFin: string
  totalBlusas: number
  totalConMullos: number
  totalConAtaches: number
  montoBlusas: number
  montoMullos: number
  montoAtaches: number
  montoTotal: number
  estado: EstadoPago
  fechaPago: string | null
}

export interface CalcularPagoInput {
  empleadoId: number
  semanaInicio: string
}
