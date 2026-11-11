# backendPython

Migración gradual del backend Java (`../backend`) a Python con FastAPI.

## Ejecutar

Requiere [uv](https://docs.astral.sh/uv/). Para agregar dependencias: `uv add <paquete>`.

```bash
uv sync
uv run uvicorn app.main:app --reload --port 8080
```

Antes de arrancar, crea el `.env` (mismas variables que el backend Java):
`cp ../backend/.env .env` o parte de `.env.example`.

- Prueba: `curl http://localhost:8080/api/ping` → `pong`
- Docs interactivas: http://localhost:8080/docs (desactívalas con `DOCS_ENABLED=false`)
- Tests (SQLite en memoria, no tocan Postgres): `uv run pytest`

## Compatibilidad con el backend Java

Ambos backends pueden apuntar a la **misma base de datos** mientras dure la migración:

- El esquema lo sigue gestionando Hibernate (`ddl-auto: update`); los modelos de
  SQLAlchemy solo mapean las tablas existentes, **nunca** se ejecuta `create_all` en Postgres.
- Las contraseñas usan BCrypt, igual que Spring, así que los usuarios existentes pueden iniciar sesión.
- Los JWT tienen los mismos claims (`sub`, `role`, `iat`, `exp`) y el mismo algoritmo que elige
  jjwt según el largo del secreto: con el mismo `JWT_SECRET_KEY`, un token emitido por un backend sirve en el otro.

- `GET /api/registros/getForDate` interpreta las fechas en la zona horaria del servidor
  (como `ZoneId.systemDefault()` en Java). Si el servidor corre en UTC (Docker, la nube),
  arráncalo con `TZ=America/Guayaquil` para que "hoy" sea el día de Ecuador.

## Estructura

```
app/
├── config.py        # variables de entorno (.env)
├── database.py      # engine/sesión de SQLAlchemy
├── exceptions.py    # errores como {"message": "..."}
├── seed.py          # AdminSeeder
├── models/          # entidades (Usuario, RegistroBlusa, ...)
├── schemas/         # DTOs de request/response (Pydantic)
├── services/        # lógica de negocio
├── security/        # JWT, BCrypt, dependencias de auth/roles
└── routers/         # controladores
```

## Progreso de la migración

- [x] `GET /api/ping`
- [x] Conexión a PostgreSQL + modelo `Usuario`
- [x] Auth: `POST /api/auth/login`, `POST /api/auth/register`, JWT, roles, seeder del ADMIN
- [x] Empleados: crear, listar, activar, pago, password, eliminar (soft delete), `GET /{id}/registros`
- [x] Registros: crear, `mios`, últimos 30 días, `getForDate`
- [ ] Clientes / Órdenes
- [ ] Configuración de pago / Pagos
