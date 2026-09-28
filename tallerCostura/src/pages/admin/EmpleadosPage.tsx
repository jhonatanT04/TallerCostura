import { useCallback, useEffect, useState } from "react";
import { activarEmpleado, getEmpleados, type Empleado } from "../../api";
import { FormEditarPago } from "../../components/FormEditarPago";
import { FormNewTrabajador } from "../../components/FormNewTrabajador";
import { Modal } from "../../components/Modal";


export function EmpleadosPage() {

    const [empleados, setEmpleados] = useState<Empleado[]>([])
    const [loadingEmpleados, setLoadingEmpleados] = useState(true)
    const [empleadosError, setEmpleadosError] = useState<string | null>(null)
    const [showCreateForm, setShowCreateForm] = useState(false)

    const [select, setSelect] = useState(false)

    const [selectedEmpleado, setSelectedEmpleado] = useState<Empleado | null>(null)

    const [activandoId, setActivandoId] = useState<number | null>(null)
    const [activarError, setActivarError] = useState<string | null>(null)

    const [editingEmpleado, setEditingEmpleado] = useState<Empleado | null>(null)


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

    const handleSelectEmpleado = (empleado: Empleado) => {
        if (selectedEmpleado?.id === empleado.id) {
            setSelect(false)
            setSelectedEmpleado(null)
            return
        }
        setSelect(true)
        setSelectedEmpleado(empleado)
    }

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
        <div className="page empleados-page">
            <div className="empleados-header">
                <div>
                    <h2>Empleados</h2>
                    <p>Lista de empleados</p>
                </div>

                <button
                    className="primary"
                    onClick={() => setShowCreateForm(true)}
                >
                    Crear empleado
                </button>
            </div>

            {showCreateForm && (
                <Modal onClose={() => setShowCreateForm(false)}>
                    <FormNewTrabajador
                        onClose={() => setShowCreateForm(false)}
                        onCreate={loadEmpleados}
                    />
                </Modal>
            )}

            {editingEmpleado && (
                <FormEditarPago
                    empleado={editingEmpleado}
                    onClose={() => setEditingEmpleado(null)}
                    onUpdate={loadEmpleados}
                />
            )}

            {empleadosError && (
                <p className="error">{empleadosError}</p>
            )}

            {activarError && (
                <p className="error">{activarError}</p>
            )}

            {loadingEmpleados ? (
                <p>Cargando empleados...</p>
            ) : (
                <ul className="empleados-list">
                    {empleados.map((empleado) => (
                        <li key={empleado.id} className="empleado-item">
                            <span className="empleado-name">
                                {empleado.nombreCompleto}
                                <span className="muted">${empleado.pagoPorBlusa.toFixed(2)} / blusa</span>
                                {!empleado.activo && <span className="badge-pendiente">Pendiente</span>}
                            </span>

                            <div className="empleado-actions">
                                {!empleado.activo && (
                                    <button
                                        type="button"
                                        className="primary"
                                        disabled={activandoId === empleado.id}
                                        onClick={() => handleActivar(empleado)}
                                    >
                                        {activandoId === empleado.id ? 'Activando...' : 'Activar'}
                                    </button>
                                )}

                                <button
                                    type="button"
                                    className="employee-menu-button"
                                    onClick={() => handleSelectEmpleado(empleado)}
                                >
                                    ⋮
                                </button>

                                {select && selectedEmpleado?.id === empleado.id && (
                                    <ul className="employee-menu">
                                        <li>
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setEditingEmpleado(empleado)
                                                    setSelect(false)
                                                    setSelectedEmpleado(null)
                                                }}
                                            >
                                                Editar tarifa
                                            </button>
                                        </li>
                                        <li>
                                            <button type="button">Eliminar</button>
                                        </li>
                                    </ul>
                                )}
                            </div>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
}