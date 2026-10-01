# Costurería — Backend

API REST en Spring Boot para la gestión de una costurería: cuentas de empleados, registro de
producción de blusas, clientes y órdenes (agrupadas por color), y cálculo de pago semanal a
empleados. Toda la API vive bajo `/api` y usa autenticación JWT. El frontend que la consume está
en `../tallerCostura`.

## Stack

- Java 17, Spring Boot 4.1.1
- Spring Web + Spring Validation (`@Valid` en los DTOs)
- Spring Security — autenticación JWT sin estado (stateless)
- Spring Data JPA + PostgreSQL
- `io.jsonwebtoken` (jjwt 0.12.6) — emisión/validación de tokens
- Lombok
- H2 (solo para tests)
- Maven (usa el wrapper `./mvnw`, no una instalación global)

## Requisitos

- **Java 17** (no una versión más nueva — ver nota abajo)
- PostgreSQL en ejecución, con una base de datos creada
- Maven no es necesario si usas `./mvnw`

### JDK 17 obligatorio

Lombok (fijado en 1.18.46 por `spring-boot-starter-parent`) no soporta JDKs más nuevos que 17 en
este proyecto; su procesador de anotaciones falla en silencio y cualquier miembro generado por
`@Data`/`@Builder`/`@RequiredArgsConstructor` da error de compilación ("cannot find symbol"). Si
el JDK por defecto de tu máquina es más nuevo, fuerza `JAVA_HOME` en cada comando de Maven:

```bash
JAVA_HOME=/usr/lib/jvm/java-17-openjdk ./mvnw spring-boot:run
```

Si ves errores de símbolos no encontrados relacionados con Lombok, revisa `JAVA_HOME` antes de
sospechar del código.

## Configuración

La app lee la configuración desde `src/main/resources/application.yml` (perfil `prob`, activo
por defecto) y carga variables opcionales desde un archivo `.env` en la raíz de `backend/` (vía
`spring.config.import: optional:file:.env[.properties]`).

Crea `backend/.env`:

```env
DB_URL=jdbc:postgresql://localhost:5432/costureria
DB_USER=postgres
DB_PASSWORD=tu_contraseña
JWT_SECRET_KEY=una_clave_secreta_de_al_menos_32_caracteres
```

| Variable | Requerida | Descripción |
|---|---|---|
| `DB_URL`, `DB_USER`, `DB_PASSWORD` | Sí, sin valor por defecto | Conexión a PostgreSQL |
| `JWT_SECRET_KEY` | Sí, sin valor por defecto | Secreto HMAC para firmar JWT. **Debe tener al menos 32 bytes**, o `JwtService` lanza `WeakKeyException` al arrancar (HS256 exige una clave de 256 bits) |
| `JWT_EXPIRATION_MS` | No (default `28800000`, 8h) | Duración del token |
| `ADMIN_USERNAME` / `ADMIN_PASSWORD` | No (default `jefa` / `jefa1234`) | Cuenta ADMIN sembrada al arrancar, solo si no existe ya una |

Crea la base de datos antes de arrancar:

```sql
CREATE DATABASE costureria;
```

`ddl-auto` está en `update`: el esquema se actualiza automáticamente desde las entidades. Cómodo
para desarrollo local, pero ten cuidado en entornos compartidos — agregar una columna
`nullable = false` a una entidad cuya tabla ya tiene filas falla si esa columna no trae un
`DEFAULT` (Postgres rechaza el `ALTER TABLE ... NOT NULL` sin default cuando hay filas
existentes). Si agregas un campo obligatorio a `Usuario` o `RegistroBlusa` (las únicas tablas que
siempre tienen filas en un entorno real), dale a `@Column` un `columnDefinition = "<tipo> default
<valor>"` explícito.

## Ejecutar

```bash
cd backend
./mvnw spring-boot:run
```

En Linux, si `mvnw` no tiene permisos de ejecución:

```bash
chmod +x mvnw
```

La API queda disponible en `http://localhost:8080`. Puedes verificar que está viva con:

```bash
curl http://localhost:8080/api/ping   # -> pong
```

## Compilar y probar

```bash
./mvnw clean package   # compila, corre tests y empaqueta
./mvnw test             # solo tests
./mvnw test -Dtest=BackendApplicationTests            # una clase
./mvnw test -Dtest=BackendApplicationTests#contextLoads  # un método
```

Los tests corren contra una base H2 en memoria (perfil `test`), no contra Postgres — no necesitas
nada externo para correr `./mvnw test`.

## Endpoints

Todas las rutas salvo `/api/auth/**` y `GET /api/ping` requieren el header
`Authorization: Bearer <token>`.

### Auth (públicas)

| Método | Ruta | Descripción |
|---|---|---|
| POST | `/api/auth/login` | Inicia sesión, devuelve el JWT y el rol |
| POST | `/api/auth/register` | Auto-registro de un empleado — queda `activo=false` hasta que un ADMIN lo active |

### Empleados (`ROLE_ADMIN`)

| Método | Ruta | Descripción |
|---|---|---|
| POST | `/api/empleados` | Crea un empleado directamente (queda activo de inmediato) |
| GET | `/api/empleados` | Lista todos los empleados (incluye `activo` y `pagoPorBlusa`) |
| GET | `/api/empleados/{id}/registros` | Registros de producción de un empleado |
| PATCH | `/api/empleados/{id}/activar` | Activa una cuenta auto-registrada |
| PATCH | `/api/empleados/{id}/pago` | Fija/cambia la tarifa por blusa de un empleado |

### Registros de producción

| Método | Ruta | Rol | Descripción |
|---|---|---|---|
| POST | `/api/registros` | EMPLEADO | Crea un registro propio (el empleado se infiere del JWT) |
| GET | `/api/registros/mios` | EMPLEADO | Registros propios |
| GET | `/api/registros` | ADMIN | Todos los registros, **limitado a los últimos 30 días** |
| GET | `/api/registros/getForDate?fechaInicio=&fechaFin=&empleadoId=` | ADMIN | Registros por rango de fechas explícito (sin tope de 30 días), opcionalmente filtrado por empleado |

### Clientes y órdenes (`ROLE_ADMIN`)

| Método | Ruta | Descripción |
|---|---|---|
| POST | `/api/clientes` | Crea un cliente |
| GET | `/api/clientes` | Lista clientes |
| POST | `/api/ordenes` | Crea una orden con ítems agrupados por color (cada ítem tiene su propio `precioUnitario`) |
| GET | `/api/ordenes` | Todas las órdenes |
| GET | `/api/ordenes/{id}` | Una orden puntual |
| GET | `/api/ordenes/cliente/{clienteId}` | Órdenes de un cliente |

### Configuración de pago global (`ROLE_ADMIN`)

| Método | Ruta | Descripción |
|---|---|---|
| GET | `/api/configuracion-pago` | Precio de mullos/ataches (aplica a todos los empleados por igual) |
| PUT | `/api/configuracion-pago` | Actualiza esos precios |

### Pago semanal

| Método | Ruta | Rol | Descripción |
|---|---|---|---|
| POST | `/api/pagos/calcular` | ADMIN | Calcula y congela el pago de una semana para un empleado (409 si ya existe para esa semana) |
| GET | `/api/pagos` | ADMIN | Todos los pagos calculados |
| GET | `/api/pagos/empleado/{empleadoId}` | ADMIN | Pagos de un empleado |
| GET | `/api/pagos/mios` | EMPLEADO | Historial de pagos propio |

## Reglas de negocio a tener presentes

- Un `Usuario` es ADMIN (la jefa) o EMPLEADO. Un EMPLEADO puede crearse directo por un ADMIN
  (activo de inmediato) o auto-registrarse (queda pendiente de activación).
- Un empleado solo ve/crea sus propios registros; solo ADMIN ve entre empleados.
- El pago por blusa (`pagoPorBlusa`) es por empleado; el bono de mullos/ataches es un valor
  global igual para todos. Para el cálculo del pago, "blusas" se cuentan por `cantidad`, no por
  fila de registro — un registro de 5 blusas con mullos paga el bono 5 veces.
- Un pago semanal calculado queda congelado: no se recalcula si luego cambian las tarifas, y no
  hay endpoint para deshacerlo.

## Estructura

```text
src/main/java/ec/cue/backend/
├── model/        # Entidades JPA
├── repository/    # Spring Data JPA
├── dto/           # Records de request/response
├── security/      # JwtService, filtro de autenticación, UserDetailsService
├── config/        # SecurityConfig, AdminSeeder
├── service/       # Lógica de negocio
├── controller/    # Endpoints REST
└── exception/     # Manejo centralizado de errores (@RestControllerAdvice)
```
