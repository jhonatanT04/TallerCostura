import { useCallback, useEffect, useState } from "react";
import { activarEmpleado, getEmpleados, type Empleado } from "../../api";
import { ConfirmarEliminarEmpleado } from "../../components/ConfirmarEliminarEmpleado";
import { FormCambiarPassword } from "../../components/FormCambiarPassword";
import { FormEditarPago } from "../../components/FormEditarPago";
import { FormNewTrabajador } from "../../components/FormNewTrabajador";
import { Modal } from "../../components/Modal";
import { PlusIcon } from "@phosphor-icons/react";
import { Badge } from "../../components/ui/Badge";
import { Button } from "../../components/ui/Button";
import { ActionMenu, type ActionMenuItem } from "../../components/ui/ActionMenu";
import { Persona } from "../../components/ui/Avatar";
import { RowCard } from "../../components/ui/RowCard";
import { PageHeader } from "../../components/ui/PageHeader";
import { SkeletonRows } from "../../components/ui/Skeleton";


export function EmpleadosPage() {

    const [empleados, setEmpleados] = useState<Empleado[]>([])
    const [loadingEmpleados, setLoadingEmpleados] = useState(true)
    const [empleadosError, setEmpleadosError] = useState<string | null>(null)
    const [showCreateForm, setShowCreateForm] = useState(false)

    const [activandoId, setActivandoId] = useState<number | null>(null)
    const [activarError, setActivarError] = useState<string | null>(null)

    const [editingEmpleado, setEditingEmpleado] = useState<Empleado | null>(null)
    const [passwordEmpleado, setPasswordEmpleado] = useState<Empleado | null>(null)
    const [deletingEmpleado, setDeletingEmpleado] = useState<Empleado | null>(null)


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

    const handleActivar = async (empleado: Empleado) => {
        setActivarError(null)
        setActivandoId(empleado.id)
        try {
            await activarEmpleado(empleado.id)
            await loadEmpleados()
        } catch {
            setActivarError(`No se pudo activar a ${empleado.nombreCompleto}.`)
        } finally {
            setActivandoId(null)
        }
    }

    return (
        <div className="page">
            <PageHeader
                title="Empleados"
                description="Lista de empleados"
                actions={
                    <Button variant="primary" icon={PlusIcon} onClick={() => setShowCreateForm(true)}>
                        Crear empleado
                    </Button>
                }
            />

            {showCreateForm && (
                <Modal onClose={() => setShowCreateForm(false)}>
                    <FormNewTrabajador
                        onClose={() => setShowCreateForm(false)}
                        onCreate={loadEmpleados}
                    />
                </Modal>
            )}

            {editingEmpleado && (
                <Modal onClose={() => setEditingEmpleado(null)}>
                    <FormEditarPago
                        empleado={editingEmpleado}
                        onClose={() => setEditingEmpleado(null)}
                        onUpdate={loadEmpleados}
                    />
                </Modal>
            )}

            {passwordEmpleado && (
                <Modal onClose={() => setPasswordEmpleado(null)}>
                    <FormCambiarPassword
                        empleado={passwordEmpleado}
                        onClose={() => setPasswordEmpleado(null)}
                    />
                </Modal>
            )}

            {deletingEmpleado && (
                <Modal onClose={() => setDeletingEmpleado(null)}>
                    <ConfirmarEliminarEmpleado
                        empleado={deletingEmpleado}
                        onClose={() => setDeletingEmpleado(null)}
                        onDelete={loadEmpleados}
                    />
                </Modal>
            )}

            {empleadosError && (
                <p className="error">{empleadosError}</p>
            )}

            {activarError && (
                <p className="error">{activarError}</p>
            )}

            {loadingEmpleados ? (
                <SkeletonRows label="Cargando empleados" />
            ) : (
                <>
                    <div className="table-wrap only-desktop">
                        <table className="table">
                            <thead>
                                <tr>
                                    <th>Empleado</th>
                                    <th>Estado</th>
                                    <th className="actions">
                                        <span className="sr-only">Acciones</span>
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {empleados.map((empleado) => (
                                    <tr key={empleado.id}>
                                        <td>
                                            <Persona nombre={empleado.nombreCompleto} detalle={`@${empleado.username}`} size="md" />
                                        </td>
                                        <td>
                                            <EstadoEmpleado empleado={empleado} />
                                        </td>
                                        <td className="actions">
                                            <AccionesEmpleado
                                                empleado={empleado}
                                                activando={activandoId === empleado.id}
                                                onActivar={() => handleActivar(empleado)}
                                                onEditarTarifa={() => setEditingEmpleado(empleado)}
                                                onCambiarPassword={() => setPasswordEmpleado(empleado)}
                                                onEliminar={() => setDeletingEmpleado(empleado)}
                                            />
                                        </td>
                                    </tr>
                                ))}
                                {empleados.length === 0 && (
                                    <tr>
                                        <td colSpan={3} className="empty-table">
                                            No hay empleados todavía.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    <ul className="row-cards only-mobile">
                        {empleados.map((empleado) => (
                            <RowCard
                                key={empleado.id}
                                title={<Persona nombre={empleado.nombreCompleto} detalle={`@${empleado.username}`} size="md" />}
                                aside={<AccionesEmpleado
                                                empleado={empleado}
                                                activando={activandoId === empleado.id}
                                                onActivar={() => handleActivar(empleado)}
                                                onEditarTarifa={() => setEditingEmpleado(empleado)}
                                                onCambiarPassword={() => setPasswordEmpleado(empleado)}
                                                onEliminar={() => setDeletingEmpleado(empleado)}
                                            />}
                                meta={<EstadoEmpleado empleado={empleado} />}
                            />
                        ))}
                        {empleados.length === 0 && <li className="row-cards-empty">No hay empleados todavía.</li>}
                    </ul>
                </>
            )}
        </div>
    );
}

interface AccionesEmpleadoProps {
    empleado: Empleado
    activando: boolean
    onActivar: () => void
    onEditarTarifa: () => void
    onCambiarPassword: () => void
    onEliminar: () => void
}

function AccionesEmpleado({ empleado, activando, onActivar, onEditarTarifa, onCambiarPassword, onEliminar }: AccionesEmpleadoProps) {
    const items: ActionMenuItem[] = [
        { label: 'Editar tarifa', onSelect: onEditarTarifa },
        { label: 'Cambiar contraseña', onSelect: onCambiarPassword },
        { label: 'Eliminar', onSelect: onEliminar, danger: true },
    ]
    return (
        <span className="table-actions">
            {!empleado.activo && (
                <Button size="sm" loading={activando} onClick={onActivar}>
                    {activando ? 'Activando...' : 'Activar'}
                </Button>
            )}
            <ActionMenu label={`Acciones de ${empleado.nombreCompleto}`} items={items} />
        </span>
    )
}

function EstadoEmpleado({ empleado }: { empleado: Empleado }) {
    return empleado.activo ? <Badge color="success">Activa</Badge> : <Badge color="warning">Pendiente</Badge>
}
