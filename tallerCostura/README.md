# Costurería — Frontend

Aplicación web en React para la gestión de una costurería: los empleados registran su propia
producción de blusas, y la jefa (ADMIN) administra empleados, clientes, órdenes y el pago
semanal. Consume la API REST en `../backend`.

## Stack

- React 19 + TypeScript
- Vite, con el React Compiler habilitado vía Babel (`@rolldown/plugin-babel` +
  `reactCompilerPreset()` en `vite.config.ts`) — los componentes se memoizan automáticamente, no
  hace falta `useMemo`/`useCallback` manual para eso
- React Router (`react-router-dom`)
- Oxlint para lint (no ESLint)

No hay librería de gráficos externa: los charts del panel de administración (`src/components/
charts/`) son SVG hechos a mano.

## Requisitos

- Node.js 20+
- npm
- El backend corriendo (ver `../backend/README.md`)

## Instalación y ejecución

```bash
npm install
npm run dev
```

La app queda disponible en `http://localhost:5173`.

## Configuración de la API

La URL base de la API está fijada directamente en `src/api/client.ts`:

```ts
const API_URL = 'http://localhost:8080/api'
```

Si necesitas apuntar a otro backend (otro puerto, un entorno desplegado, etc.), edita esa
constante.

## Scripts

```bash
npm run dev      # servidor de desarrollo con HMR
npm run build    # type-check (tsc -b) + build de producción con Vite
npm run lint     # oxlint
npm run preview  # sirve el build de producción localmente
```

No hay test runner configurado todavía.

## Autenticación

El login guarda `{ token, role, username, nombreCompleto }` en `localStorage` bajo la clave
`auth` (`src/auth/AuthContext.tsx`). El cliente de API (`src/api/client.ts`) lee el token de ahí
y lo adjunta como `Authorization: Bearer <token>` en cada request; si el backend responde 401,
limpia la sesión y redirige a `/login`.

Las rutas están protegidas por rol vía `ProtectedRoute` (`src/auth/ProtectedRoute.tsx`).

## Rutas principales

| Ruta | Rol | Página |
|---|---|---|
| `/login` | — | Inicio de sesión |
| `/register` | — | Auto-registro de empleado (queda pendiente de activación por la jefa) |
| `/registros` | EMPLEADO | Registrar una blusa producida + ver registros propios |
| `/pagos` | EMPLEADO | Historial de pagos propio |
| `/admin/dashboard` | ADMIN | Panel con gráficos (producción, empleados, clientes, pagos) |
| `/admin/clientes` | ADMIN | Lista de clientes + crear cliente |
| `/admin/ordenes` | ADMIN | Crear y ver órdenes (agrupadas por color, con filtro por cliente) |
| `/admin/pagos` | ADMIN | Calcular pago semanal + historial de pagos |
| `/admin/registros` | ADMIN | Registros de todos los empleados, con filtro por empleado y rango de fechas |
| `/admin/empleados` | ADMIN | Lista de empleados, crear empleado, activar cuentas pendientes, editar tarifa por blusa |

La configuración global de pago (precio de mullos/ataches) se edita desde un menú en el navbar,
visible solo para ADMIN (`src/components/ConfiguracionPagoMenu.tsx`), no desde una página aparte.

## Estructura

```text
src/
├── api/            # Cliente fetch (client.ts), funciones por endpoint (index.ts), tipos (types.ts)
├── auth/            # AuthContext + ProtectedRoute
├── components/      # Componentes compartidos (Navbar, Modal, formularios, tablas, charts/)
├── lib/             # Utilidades (catálogo de tallas)
└── pages/           # Páginas, con pages/admin/ para las vistas de la jefa
```

Los formularios de creación (cliente, orden, empleado) se abren en un `Modal` (overlay a pantalla
completa con fondo difuminado) en vez de en línea con la página.
