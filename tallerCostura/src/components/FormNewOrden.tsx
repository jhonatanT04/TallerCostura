import { useState, type FormEvent } from 'react'
import { crearOrden } from '../api'
import type { Cliente } from '../api/types'
import { PackageIcon, PlusIcon, TrashIcon } from '@phosphor-icons/react'
import { Button } from './ui/Button'
import { ModalLayout } from './ui/ModalLayout'

interface ItemForm {
  color: string
  cantidad: string
  precioUnitario: string
}

interface FormNewOrdenProps {
  clientes: Cliente[]
  defaultClienteId?: number | null
  onClose: () => void
  onCreate: () => void
}

function emptyItem(): ItemForm {
  return { color: '', cantidad: '1', precioUnitario: '0' }
}

export function FormNewOrden({ clientes, defaultClienteId, onClose, onCreate }: FormNewOrdenProps) {
  const [clienteId, setClienteId] = useState(defaultClienteId ? String(defaultClienteId) : '')
  const [items, setItems] = useState<ItemForm[]>([emptyItem()])
  const [creating, setCreating] = useState(false)
  const [createError, setCreateError] = useState<string | null>(null)

  function updateItem(index: number, field: keyof ItemForm, value: string) {
    setItems((current) =>
      current.map((item, i) => (i === index ? { ...item, [field]: value } : item)),
    )
  }

  function addItem() {
    setItems((current) => [...current, emptyItem()])
  }

  function removeItem(index: number) {
    setItems((current) => current.filter((_, i) => i !== index))
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setCreateError(null)

    if (!clienteId) {
      setCreateError('Selecciona un cliente.')
      return
    }
    if (items.length === 0) {
      setCreateError('Agrega al menos un color a la orden.')
      return
    }

    setCreating(true)
    try {
      await crearOrden({
        clienteId: Number(clienteId),
        items: items.map((item) => ({
          color: item.color,
          cantidad: Number(item.cantidad),
          precioUnitario: Number(item.precioUnitario),
        })),
      })
      setClienteId('')
      setItems([emptyItem()])
      onClose()
      onCreate()
    } catch {
      setCreateError('No se pudo crear la orden.')
    } finally {
      setCreating(false)
    }
  }

  return (
    <ModalLayout
      icon={PackageIcon}
      title="Crear orden"
      description="Agrupa las blusas por color, cada una con su precio."
      onSubmit={handleSubmit}
      footer={
        <>
          <Button onClick={onClose} disabled={creating}>
            Cancelar
          </Button>
          <Button type="submit" variant="primary" loading={creating}>
            {creating ? 'Creando…' : 'Crear orden'}
          </Button>
        </>
      }
    >
      <label>
        Cliente
        <select value={clienteId} onChange={(e) => setClienteId(e.target.value)} required>
          <option value="" disabled>
            Selecciona un cliente
          </option>
          {clientes.map((cliente) => (
            <option key={cliente.id} value={cliente.id}>
              {cliente.nombre}
            </option>
          ))}
        </select>
      </label>

      {items.map((item, index) => (
        <fieldset className="orden-item-row" key={index}>
          <legend className="sr-only">Color {index + 1}</legend>
          <label className="orden-item-color">
            Color
            <input type="text" value={item.color} onChange={(e) => updateItem(index, 'color', e.target.value)} required />
          </label>
          <label>
            Cantidad
            <input
              type="number"
              min="1"
              value={item.cantidad}
              onChange={(e) => updateItem(index, 'cantidad', e.target.value)}
              required
            />
          </label>
          <label>
            Precio unitario
            <input
              type="number"
              min="0"
              step="0.01"
              value={item.precioUnitario}
              onChange={(e) => updateItem(index, 'precioUnitario', e.target.value)}
              required
            />
          </label>
          <Button
            size="sm"
            variant="tertiary"
            icon={TrashIcon}
            className="orden-item-quitar"
            onClick={() => removeItem(index)}
            disabled={items.length === 1}
            aria-label={`Quitar color ${index + 1}`}
          >
            Quitar
          </Button>
        </fieldset>
      ))}

      <Button icon={PlusIcon} size="sm" className="orden-agregar" onClick={addItem}>
        Agregar color
      </Button>

      {createError && <p className="error">{createError}</p>}
    </ModalLayout>
  )
}
