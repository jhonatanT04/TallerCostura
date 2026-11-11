# backendPython

Migración gradual del backend Java (`../backend`) a Python con FastAPI.

## Ejecutar

Requiere [uv](https://docs.astral.sh/uv/). Para agregar dependencias: `uv add <paquete>`.

```bash
uv sync
uv run uvicorn app.main:app --reload --port 8080
```

Prueba: `curl http://localhost:8080/api/ping` → `pong`

## Progreso de la migración

- [x] `GET /api/ping`
- [ ] Auth (login/register + JWT)
- [ ] Empleados
- [ ] Registros
- [ ] Clientes / Órdenes
- [ ] Configuración de pago / Pagos
