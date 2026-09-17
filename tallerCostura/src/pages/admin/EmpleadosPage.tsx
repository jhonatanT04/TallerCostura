import { useCallback, useEffect, useState } from "react";
import { getEmpleados, type Empleado } from "../../api";
import { FormNewTrabajador } from "../../components/FormNewTrabajador";


export function EmpleadosPage() {

    const [empleados, setEmpleados] = useState<Empleado[]>([])
    const [loadingEmpleados, setLoadingEmpleados] = useState(true)
    const [empleadosError, setEmpleadosError] = useState<string | null>(null)
    const [showCreateForm, setShowCreateForm] = useState(false)

    const [select, setSelect] = useState(false)

    const [selectedEmpleado, setSelectedEmpleado] = useState<Empleado | null>(null)


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
                <FormNewTrabajador
                    onClose={() => setShowCreateForm(false)}
                    onCreate={loadEmpleados}
                />
            )}

            {empleadosError && (
                <p className="error">{empleadosError}</p>
            )}

            {loadingEmpleados ? (
                <p>Cargando empleados...</p>
            ) : (
                <ul className="empleados-list">
                    {empleados.map((empleado) => (
                        <li key={empleado.id} className="empleado-item">
                            <span className="empleado-name">
                                {empleado.nombreCompleto}
                            </span>

                            <div className="empleado-actions">
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
                                            <button type="button">Editar</button>
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