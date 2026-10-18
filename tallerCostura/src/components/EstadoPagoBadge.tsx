import type { OrdenPagoDTO } from '../api/types'
import { Badge } from './ui/Badge'

export function EstadoPagoBadge({ pago }: { pago: OrdenPagoDTO }) {
  return pago.estado === 'PAGADO' ? <Badge color="success">Pagado</Badge> : <Badge color="warning">Pendiente</Badge>
}
