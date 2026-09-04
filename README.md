
# Costurería

Sistema web para la gestión de una costurería, compuesto por una API REST en Spring Boot y una aplicación frontend en React.

## Estructura del proyecto

```text
Costureria/
├── backend/        # API REST con Spring Boot
├── tallerCostura/  # Aplicación web con React y TypeScript
└── README.md
```

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
- Oxlint

## Requisitos

- Java 17 o superior
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

Si es necesario configurar otra URL para la API, crea `.env.local`:

```env
VITE_API_URL=http://localhost:8080/api
```

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

En producción, agrega el dominio real del frontend a la configuración CORS.

## Funcionalidades principales

- Inicio de sesión de usuarios.
- Autenticación mediante JWT.
- Gestión de empleados.
- Gestión de registros de prendas.
- Persistencia de datos en PostgreSQL.
- Protección de rutas mediante Spring Security.

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
2. La URL de la API sea correcta.
3. `http://localhost:5173` esté permitido en CORS.
4. Las solicitudes `OPTIONS` estén habilitadas.
5. El frontend se haya reiniciado después de modificar `.env.local`.

### Error de conexión con PostgreSQL

Verifica:

- Que PostgreSQL esté iniciado.
- Que la base de datos exista.
- Que las credenciales de `.env` sean correctas.
- Que `DB_URL` utilice el puerto correcto.

## Licencia

Este proyecto es de uso privado para la gestión de una costurería.
