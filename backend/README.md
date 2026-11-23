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
| `GOOGLE_CLIENT_ID` | no | — | Client ID de OAuth de Google (tipo "Aplicación web"). Sin él no aparece el botón de Google |
| `FACEBOOK_APP_ID` / `FACEBOOK_APP_SECRET` | no | — | App de Facebook Login. Sin ambos no aparece el botón de Facebook. El secreto nunca sale del backend |
| `FACEBOOK_GRAPH_VERSION` | no | `v26.0` | Versión de la Graph API (backend y SDK del navegador) |
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
| `GET /api/auth/proveedores` | público | Qué proveedores están habilitados y sus ids públicos (`clientId` de Google, `appId` de Facebook) |
| `POST /api/auth/social` | público | Entra con `{proveedor: GOOGLE\|FACEBOOK, token}`. Devuelve `estado` `AUTENTICADO` (con `sesion`, igual que `/login`) o `PENDIENTE` |
| `GET /api/auth/vinculos` | con sesión | Cuentas de Google/Facebook vinculadas al usuario |
| `POST /api/auth/vinculos` | con sesión | Vincula la cuenta del `token` al usuario (`409` si es de otro usuario o ya tiene una de ese proveedor) |
| `DELETE /api/auth/vinculos/{proveedor}` | con sesión | Desvincula; el usuario sigue entrando con su contraseña |
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

Todas las rutas que no son públicas necesitan `Authorization: Bearer <token>`: sin token o con
uno inválido o vencido dan **401**, y con el rol equivocado **403**. Los errores siempre tienen
la forma `{"message": "..."}` (los de validación responden **400**, no el 422 por defecto de FastAPI).

## Inicio de sesión con Google y Facebook

Además de usuario y contraseña. El navegador obtiene un token con el SDK oficial de cada
proveedor y el backend lo **verifica** antes de confiar en él:

- **Google:** el ID token (JWT) de Google Identity Services. Se valida la firma con las claves
  públicas de Google, que la audiencia sea `GOOGLE_CLIENT_ID`, el emisor y la fecha.
- **Facebook:** el access token de `FB.login()`. Se valida con `debug_token` que sea válido y
  de **esta** app (`FACEBOOK_APP_ID`), y el perfil se lee con `appsecret_proof`.

Después, el backend emite su propio JWT, igual que el login con contraseña. La cuenta se
identifica por el id que da el proveedor, no por el correo.

- **Cuenta de Google/Facebook nueva:** se crea una EMPLEADA **inactiva** (con una contraseña
  aleatoria que nadie conoce) y queda pendiente, como el auto-registro. La ADMIN la activa
  en Empleados.
- **Usuarios existentes** (incluida la ADMIN): entran con su contraseña y vinculan su cuenta en
  **Cuentas vinculadas** (menú lateral). Desde entonces pueden entrar también con ella.
- Un usuario dado de baja no puede entrar por ningún medio (**403**).

Para habilitarlos:

1. **Google:** en Google Cloud Console → APIs y servicios → Credenciales, crea un "ID de cliente
   de OAuth" de tipo **Aplicación web** y agrega en "Orígenes de JavaScript autorizados" las URLs
   del frontend (`http://localhost:5173` y el dominio de Vercel). Copia el Client ID a
   `GOOGLE_CLIENT_ID`.
2. **Facebook:** en developers.facebook.com crea una app con **Facebook Login** para web, agrega
   los dominios del frontend en "Dominios permitidos para el SDK de JavaScript" y copia el App ID
   y el App Secret a `FACEBOOK_APP_ID` / `FACEBOOK_APP_SECRET`. Facebook exige HTTPS fuera de
   `localhost`, y para que lo use gente que no administra la app hay que pasarla a modo "Live".

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

## Esquema de la base de datos (Alembic)

El esquema se gestiona con migraciones de **Alembic** (`migrations/`), con la misma conexión
que la API (`DB_URL`, `DB_USER`, `DB_PASSWORD`):

| Migración | Qué hace |
|---|---|
| `0001` | Las tablas que creó el backend anterior en Spring Boot (`usuarios`, `registros_blusa`, `clientes`, `ordenes`, `orden_items`, `configuracion_pago`, `ordenes_pago`) |
| `0002` | `identidades_externas`: cuentas de Google/Facebook vinculadas a un usuario |

**Base que ya existe (la de producción), solo la primera vez:** las tablas de `0001` ya están
creadas, así que se marca como aplicada sin ejecutarla y después se aplica el resto:

```bash
uv run alembic stamp 0001     # no toca las tablas: solo registra que 0001 ya está
uv run alembic upgrade head   # crea identidades_externas
```

**Base nueva:** `uv run alembic upgrade head` crea todo desde cero.

**Cambiar un modelo:** `uv run alembic revision --autogenerate -m "descripción"`, revisa el
archivo generado y aplícalo con `upgrade head`. El test `tests/test_migraciones.py` falla si las
migraciones y los modelos dejan de coincidir. Las migraciones **no** se aplican solas al
arrancar la API: se corren a mano (o en el paso de despliegue).

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
├── migrations/          # Alembic (alembic.ini en la raíz del backend)
├── scripts/
│   └── verificar_esquema.py
├── tests/
├── Dockerfile
├── pyproject.toml
└── uv.lock
```
