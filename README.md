# Costurería

Sistema web para la gestión de una costurería, compuesto por una API REST en Spring Boot y una aplicación frontend en React.

Para el detalle completo de cada parte (configuración, endpoints, estructura de carpetas, notas de desarrollo), ve a su propio README:

- [`backend/README.md`](backend/README.md)
- [`tallerCostura/README.md`](tallerCostura/README.md)

Este README cubre solo el arranque rápido del proyecto completo.

## Estructura del proyecto

```text
Costureria/
├── backend/        # API REST con Spring Boot
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

- Java 17
- Spring Boot 4.1.1
- Spring Security
- JWT
- Spring Data JPA
- PostgreSQL
- Maven
- Lombok

### Frontend

- React 19
- TypeScript
- Vite
- React Compiler
- React Router
- Oxlint

## Requisitos

- Java 17 (exactamente esa versión — Lombok no soporta JDKs más nuevos en este proyecto, ver `backend/README.md`)
- Node.js 20 o superior
- npm
- PostgreSQL
- Git

## Configuración del backend

Desde la carpeta `backend`, crea un archivo `.env`:

```env
DB_URL=jdbc:postgresql://localhost:5432/costureria
DB_USER=postgres
DB_PASSWORD=tu contraseña
JWT_SECRET_KEY=una clave secreta segura de al menos 32 caracteres
```

Asegúrate de que la base de datos exista:

```sql
CREATE DATABASE costureria;
```

## Ejecutar el backend

```bash
cd backend
./mvnw spring-boot:run
```

En Linux, si el archivo no tiene permisos:

```bash
chmod +x mvnw
./mvnw spring-boot:run
```

La API estará disponible en:

```text
http://localhost:8080
```

## Compilar y probar el backend

```bash
cd backend
./mvnw clean package
./mvnw test
```

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

En producción, agrega el dominio real del frontend a la configuración CORS (`backend`, `SecurityConfig`).

## Construir para producción

### Backend

```bash
cd backend
./mvnw clean package
java -jar target/backend-0.0.1-SNAPSHOT.jar
```

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
3. `http://localhost:5173` esté permitido en CORS.
4. Las solicitudes `OPTIONS` estén habilitadas.

### Error de conexión con PostgreSQL

Verifica:

- Que PostgreSQL esté iniciado.
- Que la base de datos exista.
- Que las credenciales de `.env` sean correctas.
- Que `DB_URL` utilice el puerto correcto.

### Lombok falla al compilar el backend

Si ves errores de símbolos no encontrados en clases con `@Data`/`@Builder`, es casi siempre el JDK: fuerza Java 17 con `JAVA_HOME=/usr/lib/jvm/java-17-openjdk ./mvnw ...` (ver `backend/README.md`).

## Licencia

Este proyecto es de uso privado para la gestión de una costurería.
