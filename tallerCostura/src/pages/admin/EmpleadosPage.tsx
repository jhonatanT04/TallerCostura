import { useCallback, useEffect, useState } from "react";
import { getEmpleados, type Empleado } from "../../api";


export function EmpleadosPage() {

    const [empleados, setEmpleados] = useState<Empleado[]>([])
    const [loadingEmpleados, setLoadingEmpleados] = useState(true)
    const [empleadosError, setEmpleadosError] = useState<string | null>(null)



    const loadEmpleados = useCallback(async () => {
        setLoadingEmpleados(true)
        setEmpleadosError(null)
        try {
            setEmpleados(await getEmpleados())
            console.log(empleados)
        } catch {
            setEmpleadosError('No se pudo cargar la lista de empleados.')
        } finally {
            setLoadingEmpleados(false)
        }
    }, [])

    useEffect(() => {
        loadEmpleados()
    }, [loadEmpleados])

    return (
        <div className="page empleados-page">
            <h2>Empleados</h2>
            <p>Lista de empleados</p>
            <br />
            {empleadosError && <p className="error">{empleadosError}</p>}
            {loadingEmpleados ? (
                <p>Cargando empleados...</p>
            ) : (
                <ul>
                    {empleados.map((empleado) => (
                        <li key={empleado.id}>{empleado.nombreCompleto}</li>
                    ))}
                </ul>
            )}
        </div>
    );
}