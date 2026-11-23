# Backend — Costurería

API REST del sistema de la costurería: cuentas de empleados, registro de la producción de
blusas, clientes y órdenes, y la nómina semanal. Hecha con **FastAPI** + **SQLAlchemy** sobre
**PostgreSQL**, con autenticación JWT. Todas las rutas están bajo `/api`.

## Requisitos

- [uv](https://docs.astral.sh/uv/) (gestiona Python 3.14 y las dependencias)
- PostgreSQL con las tablas ya creadas (ver [Esquema de la base de datos](#esquema-de-la-base-de-datos))
- Docker, solo para desplegar con la imagen

## Configuración

Copia `.env.example` a `.env` y completa los valores. Las variables de entorno del sistema
tienen prioridad sobre el `.env`.

| Variable | Obligatoria | Por defecto | Descripción |
|---|---|---|---|
| `DB_URL` | sí | — | `postgresql://host:5432/db` (también acepta el formato `jdbc:postgresql://...`) |
| `DB_USER` / `DB_PASSWORD` | sí | — | Credenciales de Postgres |
| `JWT_SECRET_KEY` | sí | — | Secreto HMAC para firmar los tokens, **mínimo 32 bytes** (si no, no arranca) |
| `JWT_EXPIRATION_MS` | no | `28800000` (8 h) | Duración del token |
| `ADMIN_USERNAME` / `ADMIN_PASSWORD` | no | `jefa` / `jefa1234` | Cuenta ADMIN que se crea al arrancar **solo si no existe ningún ADMIN** |
| `CORS_ORIGINS` | no | `["http://localhost:5173","https://taller-costura-gray.vercel.app"]` | Orígenes permitidos, en formato JSON |
| `DOCS_ENABLED` | no | `true` (`false` en Docker) | Activa `/docs` y `/openapi.json` (son públicos) |
| `ASISTENTE_PROVEEDOR` | no | `openai` | IA del asistente del panel: `openai`, `gemini` o `anthropic` (cualquier otro valor impide arrancar) |
| `ASISTENTE_MODELO` | no | según el proveedor | Modelo a usar. Vacío: `gpt-5.5` (OpenAI), `gemini-3.5-flash` (Gemini), `claude-opus-5-5` (Anthropic) |
| `OPENAI_API_KEY` / `GEMINI_API_KEY` / `ANTHROPIC_API_KEY` | no | — | Clave del proveedor elegido; las otras no se usan. Sin ella, `POST /api/asistente/chat` responde **503** y el resto funciona igual |
| `MCP_TOKEN` | no | — | Si se define, publica el servidor MCP en `/mcp` (exige `Authorization: Bearer <MCP_TOKEN>`). Sin él, `/mcp` no existe |
| `ASISTENTE_MCP_URL` / `ASISTENTE_MCP_TOKEN` | no | — | Para que el chat use un servidor MCP remoto. Vacío: usa el de este mismo proceso, sin red |
| `TZ` | no | zona del sistema (`America/Guayaquil` en Docker) | Zona horaria para "hoy" y para cortar la semana de pago |

## Desarrollo

```bash
uv sync                                          # crea .venv e instala dependencias
uv run uvicorn app.main:app --reload --port 8080
```

- Prueba rápida: `curl http://localhost:8080/api/ping` → `pong`
- Documentación interactiva: http://localhost:8080/docs
- Agregar una dependencia: `uv add <paquete>` (o `uv add --dev <paquete>` para tests)

### Tests

```bash
uv run pytest
```

Usan SQLite en memoria (`tests/conftest.py`), así que no necesitan Postgres ni tocan la base real.

### Verificar el esquema

Compara los modelos con las tablas reales de Postgres. Abre la sesión en modo **solo lectura**,
así que no puede modificar nada:

```bash
uv run python -m scripts.verificar_esquema       # debe terminar en "PROBLEMAS: 0"
```

## Despliegue con Docker

```bash
docker build -t costureria-backend .
docker run -d --name costureria-backend --env-file .env -p 8080:8080 costureria-backend
```

La imagen:

- corre con un usuario sin privilegios y sin dependencias de desarrollo;
- viene con `TZ=America/Guayaquil` y `DOCS_ENABLED=false` (se pueden sobrescribir con `-e`);
- escucha en `$PORT` (por defecto `8080`), así que funciona en plataformas como Render o Railway,
  que asignan el puerto ellas mismas;
- tiene un `HEALTHCHECK` contra `GET /api/ping`.

En la plataforma de despliegue configura las variables de la tabla anterior. Como mínimo:
`DB_URL`, `DB_USER`, `DB_PASSWORD`, `JWT_SECRET_KEY` y `CORS_ORIGINS` con el dominio del frontend.

## Endpoints

| Método y ruta | Rol | Descripción |
|---|---|---|
| `GET /api/ping` | público | Health check, responde `pong` |
| `POST /api/auth/login` | público | Devuelve `token`, `role`, `username`, `nombreCompleto` |
| `POST /api/auth/register` | público | Auto-registro de empleada; queda **inactiva** hasta que la ADMIN la active |
| `POST /api/empleados` | ADMIN | Crea una empleada activa (`pagoPorBlusa` opcional, 0 por defecto) |
| `GET /api/empleados` | ADMIN | Lista empleadas, incluidas las pendientes de activar |
| `GET /api/empleados/{id}/registros` | ADMIN | Registros de una empleada |
| `PATCH /api/empleados/{id}/activar` | ADMIN | Activa una cuenta auto-registrada |
| `PATCH /api/empleados/{id}/pago` | ADMIN | Cambia la tarifa por blusa (debe ser > 0) |
| `PATCH /api/empleados/{id}/password` | ADMIN | Cambia la contraseña de cualquier usuario, ADMIN incluido |
| `DELETE /api/empleados/{id}` | ADMIN | Borrado lógico; conserva su historial |
| `POST /api/registros` | EMPLEADO | Registra producción propia |
| `GET /api/registros/mios` | EMPLEADO | Registros propios |
| `GET /api/registros` | ADMIN | Registros de todas las empleadas, últimos 30 días |
| `GET /api/registros/getForDate?fechaInicio=&fechaFin=&empleadoId=` | ADMIN | Por rango de fechas (por defecto hoy), sin tope de días |
| `POST /api/clientes`, `GET /api/clientes` | ADMIN | Clientes |
| `POST /api/ordenes`, `GET /api/ordenes`, `GET /api/ordenes/{id}`, `GET /api/ordenes/cliente/{id}` | ADMIN | Órdenes por color con precio por ítem |
| `GET /api/configuracion-pago`, `PUT /api/configuracion-pago` | ADMIN | Precios globales de mullos y ataches |
| `GET /api/pagos/previsualizar?empleadoId=&semanaInicio=` | ADMIN | Calcula el pago de la semana **sin guardarlo** |
| `POST /api/pagos/calcular` | ADMIN | Calcula y guarda el pago como `PAGADO` |
| `GET /api/pagos`, `GET /api/pagos/empleado/{id}` | ADMIN | Historial de pagos |
| `GET /api/pagos/mios` | EMPLEADO | Pagos propios |
| `POST /api/asistente/chat` | ADMIN | Chat con IA de solo lectura (proveedor según `ASISTENTE_PROVEEDOR`): producción, empleadas y pagos. Recibe el historial `{mensajes: [{rol, texto}]}` y devuelve `{respuesta, acciones}`; cada acción `CONFIRMAR_PAGO` la registra el frontend con `POST /api/pagos/calcular` |

Todas las rutas que no son públicas necesitan `Authorization: Bearer <token>`: sin token o con
uno inválido o vencido dan **401**, y con el rol equivocado **403**. Los errores siempre tienen
la forma `{"message": "..."}` (los de validación responden **400**, no el 422 por defecto de FastAPI).

## Servidor MCP (`mcp_server/`)

Todas las consultas del chat a la base de datos pasan por un servidor
[MCP](https://modelcontextprotocol.io) hecho con el SDK oficial de Python (`mcp`). Sus
herramientas son **de solo lectura** y reutilizan los servicios de `app/`, así que los montos
coinciden con la página de Pagos:

| Herramienta | Qué devuelve |
|---|---|
| `listar_empleados` | Empleadas con id, estado y tarifa por blusa |
| `configuracion_pagos` | Precios globales de mullos y ataches |
| `resumen_produccion` | Producción entre dos fechas: total, por empleada, por color y por talla |
| `pago_semanal` | Lo que se le debe a una empleada en una semana, o el pago ya registrado |
| `pagos_registrados` | Historial de pagos, filtrable por empleada y semana |
| `listar_clientes` | Clientes, con búsqueda por nombre |
| `ordenes` | Órdenes con ítems por color y totales, filtrables por cliente y fecha |

Formas de usarlo:

- **Chat del panel:** por defecto se conecta en proceso (sin red ni configuración).
- **HTTP:** con `MCP_TOKEN`, queda en `https://<tu-backend>/mcp` (Streamable HTTP, sin estado).
- **stdio**, para clientes locales como Claude Desktop, Claude Code o Cursor, con el mismo `.env`:

  ```json
  {
    "mcpServers": {
      "costureria": {
        "command": "uv",
        "args": ["--directory", "/ruta/a/backend", "run", "python", "-m", "mcp_server"]
      }
    }
  }
  ```

Para agregar una consulta: escribe la función en `mcp_server/consultas.py` y regístrala con
`@_herramienta(...)` en `mcp_server/servidor.py`. El chat la descubre sola.

## Reglas de negocio

- **Cuentas:** una cuenta inactiva (pendiente de aprobación) o eliminada no puede iniciar sesión y
  su token deja de servir de inmediato. Solo se pueden eliminar EMPLEADAS, nunca una ADMIN.
- **Registros:** la empleada y la fecha siempre las pone el servidor, nunca el cliente. Confección,
  mullos y ataches son trabajos independientes, cada uno con su cantidad (≥ 0, no las tres en 0),
  y **no** se validan entre sí: la ADMIN los revisa. La talla debe ser XS–XXL o 30–46.
- **Nómina semanal** (de lunes a domingo, ambos incluidos, en la zona `TZ`):
  - `montoBlusas` = Σ confección × `pagoPorBlusa` de la empleada
  - `montoMullos` = Σ mullos × precio global de mullos
  - `montoAtaches` = Σ ataches × precio global de ataches
  - `previsualizar` y `calcular` usan la misma función, así que no pueden dar montos distintos.
  - **409** si la semana ya se pagó, o si hay trabajo de un tipo cuya tarifa es 0. Un pago no se
    puede deshacer.
  - Los montos quedan congelados: si después cambian las tarifas, el pago guardado no cambia.

## Esquema de la base de datos

Los modelos de SQLAlchemy **mapean tablas que ya existen**: la aplicación no crea ni modifica
tablas en Postgres. Las tablas (`usuarios`, `registros_blusa`, `clientes`, `ordenes`,
`orden_items`, `configuracion_pago`, `ordenes_pago`) las creó el backend anterior en Spring Boot.

> **Pendiente:** con el backend anterior eliminado, ya no hay nada que gestione el esquema. Para
> una base nueva o para cambiar un modelo hay que crear las tablas o columnas a mano. Lo
> recomendable es agregar migraciones con **Alembic**: una migración base marcada como aplicada
> con `alembic stamp` sobre la base actual, y desde ahí `alembic revision --autogenerate`.

Los tokens y contraseñas son compatibles con los del backend anterior: BCrypt `$2a$` y JWT HS256,
HS384 o HS512 según el largo del secreto. Los usuarios y sesiones existentes siguen funcionando.

## Estructura

```text
backend/
├── app/
│   ├── main.py          # app FastAPI, CORS, routers
│   ├── config.py        # variables de entorno (.env)
│   ├── database.py      # engine y sesión de SQLAlchemy
│   ├── exceptions.py    # errores como {"message": "..."}
│   ├── seed.py          # crea el ADMIN inicial
│   ├── models/          # tablas (Usuario, RegistroBlusa, Cliente, Orden, OrdenPago, ...)
│   ├── schemas/         # request/response (Pydantic, JSON en camelCase)
│   ├── services/        # lógica de negocio
│   ├── security/        # JWT, BCrypt, dependencias de auth y roles
│   └── routers/         # endpoints
├── scripts/
│   └── verificar_esquema.py
├── tests/
├── Dockerfile
├── pyproject.toml
└── uv.lock
```
