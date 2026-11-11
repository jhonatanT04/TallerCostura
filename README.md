# Costurería

Sistema web para la gestión de una costurería, compuesto por una API REST en FastAPI (Python) y una aplicación frontend en React.

Para el detalle completo de cada parte (configuración, endpoints, estructura de carpetas, notas de desarrollo), ve a su propio README:

- [`backend/README.md`](backend/README.md)
- [`tallerCostura/README.md`](tallerCostura/README.md)

Este README cubre solo el arranque rápido del proyecto completo.

## Estructura del proyecto

```text
Costureria/
├── backend/        # API REST con FastAPI
├── tallerCostura/  # Aplicación web con React y TypeScript
└── README.md
```

## Funcionalidades principales

- Login con JWT; auto-registro de empleados (quedan pendientes hasta que la jefa los activa) o creación directa de cuentas por la jefa.
- Empleados: registran su propia producción de blusas (color, talla, mullos/ataches, cantidad) y solo ven sus propios registros.
- Jefa (ADMIN): gestiona empleados (crear, activar, fijar tarifa por blusa), ve los registros de cualquier empleado o de todos (con filtro por fecha), gestiona clientes y órdenes (agrupadas por color, con precio por color) y calcula el pago semanal de cada empleado (tarifa por blusa + bono global de mullos/ataches).
- Panel de administración con gráficos (producción, empleados, clientes, pagos).

## Tecnologías

### Backend

- Python 3.14
- FastAPI
- SQLAlchemy 2
- Pydantic
- JWT (PyJWT) + BCrypt
- PostgreSQL
- uv
- Docker

### Frontend

- React 19
- TypeScript
- Vite
- React Compiler
- React Router
- Oxlint

## Requisitos

- [uv](https://docs.astral.sh/uv/) (instala Python 3.14 y las dependencias del backend)
- Node.js 20 o superior
- npm
- PostgreSQL
- Git

## Configuración del backend

Desde la carpeta `backend`, copia `.env.example` a `.env` y completa los valores:

```env
DB_URL=postgresql://localhost:5432/costureria
DB_USER=postgres
DB_PASSWORD=tu contraseña
JWT_SECRET_KEY=una clave secreta segura de al menos 32 caracteres
```

La base de datos debe existir y tener las tablas creadas: el backend no las crea por sí mismo
(ver "Esquema de la base de datos" en `backend/README.md`).

El resto de variables opcionales (`CORS_ORIGINS`, `TZ`, `DOCS_ENABLED`, cuenta ADMIN inicial…)
están documentadas en `backend/README.md`.

## Ejecutar el backend

```bash
cd backend
uv sync
uv run uvicorn app.main:app --reload --port 8080
```

La API estará disponible en `http://localhost:8080`, y la documentación interactiva en
`http://localhost:8080/docs`.

## Probar el backend

```bash
cd backend
uv run pytest
```

Los tests usan SQLite en memoria, así que no necesitan PostgreSQL.

## Configuración del frontend

Instala las dependencias:

```bash
cd tallerCostura
npm install
```

La URL base de la API está fijada directamente en `tallerCostura/src/api/client.ts` (por defecto `http://localhost:8080/api`). Si necesitas apuntar a otro backend, edita esa constante — actualmente no se lee desde una variable de entorno.

## Ejecutar el frontend

```bash
cd tallerCostura
npm run dev
```

La aplicación estará disponible normalmente en:

```text
http://localhost:5173
```

## Comandos del frontend

```bash
npm run dev      # Inicia el servidor de desarrollo
npm run build    # Verifica tipos y genera la aplicación de producción
npm run lint     # Ejecuta Oxlint
npm run preview  # Previsualiza la compilación
```

## Autenticación

La API utiliza autenticación basada en JWT.

El frontend guarda la información de autenticación en `localStorage` con la clave:

```text
auth
```

Las solicitudes autenticadas incluyen el token mediante:

```http
Authorization: Bearer <token>
```

## CORS

El backend debe permitir el origen del frontend durante el desarrollo:

```text
http://localhost:5173
```

También debe permitir las solicitudes `OPTIONS` utilizadas por el navegador para las peticiones preflight.

En producción, define la variable `CORS_ORIGINS` del backend con el dominio real del frontend, en formato JSON:

```env
CORS_ORIGINS=["https://taller-costura-gray.vercel.app"]
```

## Construir para producción

### Backend

Con Docker (la imagen ya trae `TZ=America/Guayaquil` y `/docs` desactivado):

```bash
cd backend
docker build -t costureria-backend .
docker run -d --env-file .env -p 8080:8080 costureria-backend
```

Detalles del despliegue en `backend/README.md`.

### Frontend

```bash
cd tallerCostura
npm run build
```

Los archivos generados estarán en:

```text
tallerCostura/dist/
```

## Solución de problemas

### Error de CORS

Verifica que:

1. El backend esté ejecutándose.
2. La URL de la API configurada en `tallerCostura/src/api/client.ts` sea correcta.
3. `http://localhost:5173` esté permitido en `CORS_ORIGINS` (lo está por defecto).
4. Las solicitudes `OPTIONS` estén habilitadas.

### Error de conexión con PostgreSQL

Verifica:

- Que PostgreSQL esté iniciado.
- Que la base de datos exista.
- Que las credenciales de `.env` sean correctas.
- Que `DB_URL` utilice el puerto correcto.
- Con Supabase, usa el host y el usuario exactos que aparecen en *Connect → Session pooler*
  (el error `tenant/user ... not found` significa que el host o el usuario no corresponden, o que el
  proyecto está pausado).

### La fecha de "hoy" o la semana de pago no cuadran

El backend usa la zona horaria del servidor. Fuera de Docker, arráncalo con
`TZ=America/Guayaquil`; la imagen de Docker ya la trae configurada.

## Licencia

Este proyecto es de uso privado para la gestión de una costurería.
