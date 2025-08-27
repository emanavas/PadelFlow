# PadelFlow: Lista de tareas y contexto de aspectos claves

Esta es una lista de verificación detallada para el desarrollo de la plataforma de gestión de torneos de pádel "PadelFlow".

Definicion de las necesidades del proyecto:
* La plataforma cuenta con 3 roles de usuarios, los cuales son: (admin_plataforma, admin_club, jugador) ademas de los espectadores (sin registo pueden visualizar el wallshow)
* cada administrador puede entrar a dashboard correspondientes con funciones diferentes
* administrador de plataforma puede visualizar estado general de la plataforma como ser: listado de clubes, pagos, metricas, lista de torneos, etc
* 
* 
* adminstrador de club puede crear torneos, añadir jugadores al club o eventos etc.
* 
## 1. Configuración del Proyecto y Entorno

- [x] Inicializar el proyecto Node.js: `npm init -y`.
- [x] Crear el archivo `.gitignore`.
- [x] Añadir `node_modules/` y `.env` al `.gitignore`.
- [x] Instalar dependencias principales: `npm install express ejs sqlite3 express-session bcryptjs`.
- [x] Instalar dependencias de desarrollo: `npm install nodemon --save-dev`.
- [x] Añadir scripts `start` y `dev` al `package.json`.

## 2. Estructura de Directorios y Archivos

- [x] Crear carpeta `public`.
- [x] Crear carpeta `views`.
- [x] Crear carpeta `routes`.
- [x] Crear carpeta `middlewares`.
- [x] Crear carpeta `db`.
- [x] Crear carpeta `models`.
- [x] Crear `public/css/style.css`.
- [x] Crear `public/js/sse-client.js`.
- [x] Crear `views/layouts/main.ejs`.
- [x] Crear `views/admin/dashboard.ejs`.
- [x] Crear `views/admin/create_tournament.ejs`.
- [x] Crear `views/admin/manage_tournament.ejs`.
- [x] Crear `views/public/live_dashboard.ejs`.
- [x] Crear `views/auth/login.ejs`.
- [x] Crear `views/auth/signup.ejs`.
- [x] Crear `routes/authRoutes.js`.
- [x] Crear `routes/tournamentRoutes.js`.
- [x] Crear `routes/apiRoutes.js`.
- [x] Crear `routes/index.js`.
- [x] Crear `middlewares/authMiddleware.js`.
- [x] Crear `middlewares/freemiumMiddleware.js`.
- [x] Crear `db/database.js`.
- [x] Crear `db/init.sql`.
- [x] Crear `models/clubModel.js`.
- [x] Crear `models/tournamentModel.js`.
- [x] Crear `models/matchModel.js`.
- [x] Crear `app.js` en la raíz del proyecto.
- [x] Renombrar `public/index.html` a `views/index.ejs`.

## 3. Lógica Principal del Servidor (`app.js`)

- [x] Importar `express`, `express-session` y los módulos de rutas en `app.js`.
- [x] Configurar el middleware `express.urlencoded`.
- [x] Configurar el middleware para servir archivos estáticos desde `public`.
- [x] Configurar EJS como motor de plantillas.
- [x] Configurar `express-session` con un secreto.
- [x] Enlazar las rutas de `index.js`.
- [x] Enlazar las rutas de `authRoutes.js`.
- [x] Enlazar las rutas de `tournamentRoutes.js`.
- [x] Enlazar las rutas de `apiRoutes.js`.
- [x] Enlazar las rutas de `clubRoutes.js`.
- [x] Definir el puerto (leyendo de `process.env.PORT`) y arrancar el servidor.
- [x] Configurar i18next (inicialización, middleware, `res.locals.t` y `res.locals.currentLanguage`).

## 3.1. Internacionalización (i18n)

- [x] Instalar `i18next`, `i18next-http-middleware` y `i18next-fs-backend`.
- [x] Crear estructura de directorios `locales/en` y `locales/es` con `translation.json`.
- [x] Configurar `i18next` en `app.js` (inicialización, middleware, `res.locals.t`).
- [x] Añadir ruta `/lang/:lng` en `routes/index.js` para cambio de idioma.
- [x] Adaptar `public/index.ejs` para usar `t()` y selector de idioma.
- [x] Actualizar archivos de traducción con nuevas claves (`features`, `plans`, `contact`).

## 3.2. Rutas Básicas y Vistas

- [x] Modificar la ruta principal (`/`) en `routes/index.js` para renderizar `public/index.ejs`.
- [x] Crear rutas básicas en `routes/authRoutes.js` para `GET /login` y `GET /signup`.

## 4. Base de Datos SQLite (`db/` y `models/`)

- [x] **`db/init.sql`**: Escribir las sentencias `CREATE TABLE` para `Clubs`, `Torneos`, `Jugadores` y `Partidos`.
- [x] **`db/database.js`**:
    - [x] Importar `sqlite3`.
    - [x] Crear la función `initDatabase()` que se conecte a la base de datos.
    - [x] Dentro de `initDatabase()`, leer el archivo `init.sql`.
    - [x] Ejecutar las sentencias SQL de `init.sql`.
    - [x] Exportar la instancia de la base de datos.
    - [x] Implementar la comprobación y creación del administrador por defecto.
- [x] **`models/clubModel.js`**:
    - [x] Crear función `crearClub` (INSERT).
    - [x] Crear función `encontrarPorEmail` (SELECT).
- [x] **`models/tournamentModel.js`**: Implementar funciones CRUD para torneos.
- [x] **`models/matchModel.js`**: Implementar funciones CRUD para partidos.
- [x] **`models/playerModel.js`**: Implementar funciones CRUD para jugadores.
- [x] **`models/userModel.js`**: Implementar funciones CRUD para usuarios (plataforma, club, jugadores).

## 5. Lógica de Autenticación y Middlewares (hasta finalizar funcionalidades)

- [x] **`routes/authRoutes.js`**:
    - [x] `GET /signup`: Renderizar la vista `signup.ejs`.
    - [x] `GET /login`: Renderizar la vista `login.ejs`.
    - [x] `POST /signup`:
        - [x] Hashear la contraseña con `bcrypt.hash()`.
        - [x] Permitir el registro como 'club_admin' (creando club) o 'platform_admin' (sin club).
        - [x] Validar que 'clubName' se proporcione si el tipo de usuario es 'club_admin'.
        - [x] Redirigir a `/login`.
    - [x] `POST /login`:
        - [x] Buscar club por email.
        - [x] Comparar contraseña con `bcrypt.compare()`.
        - [x] Si es válido, guardar `userId` en `req.session`.
        - [x] Redirigir a `/dashboard`.
    - [x] `POST /player/signup`: Implementar ruta para el registro de jugadores.
- [x] **`middlewares/authMiddleware.js`**:
    - [x] Crear la función `isAuthenticated`.
    - [x] Verificar si `req.session.userId` existe.
    - [x] Si no existe, redirigir a `/login`.
- [x] **`middlewares/freemiumMiddleware.js`**:
    - [x] Crear la función `checkFreemium`.
    - [ ] Obtener el `clubId` de la sesión.
    - [ ] Contar los torneos activos del club.
    - [ ] Si es freemium y tiene 3 o más torneos, redirigir con error.

## 6. Lógica de Gestión de Torneos y API en Tiempo Real

- [x] **`routes/tournamentRoutes.js`**:
    - [x] Aplicar el middleware `isAuthenticated` a todas las rutas del archivo.
    - [x] `GET /dashboard`: Renderizar el dashboard del administrador.
    - [x] `GET /tournaments/create`: Aplicar `checkFreemium` y renderizar el formulario.
    - [x] `POST /tournaments/create`: Procesar la creación del torneo.
- [x] **`routes/apiRoutes.js`**:
    - [x] Crear un objeto `clients = {}` para manejar las conexiones SSE.
    - [x] `GET /api/events/:id`:
        - [x] Configurar los headers para SSE.
        - [x] Diferenciar entre clientes (público vs. admin) y almacenar la conexión.
        - [x] Manejar el evento `close` para eliminar al cliente.
    - [x] `POST /api/tournaments/:id/score`: (Ruta de Admin) Actualizar el marcador en la BD y notificar a todos los clientes.
    - [x] `POST /api/tournaments/:id/suggest-score`: (Ruta Pública) Recibir sugerencia y notificar solo al admin.
- [x] **`public/js/sse-client.js`**:
    - [x] Crear una instancia de `EventSource`.
    - [x] `source.onmessage`: Procesar los datos de puntuación y actualizar el DOM.
    - [x] Implementar la lógica para enviar sugerencias de puntuación al servidor.

## 7. Diseño y Contenido de las Vistas (`.ejs`)

- [x] **`views/layouts/main.ejs`**: Crear la plantilla base con `head`, `body`, etc.
- [x] **`views/auth/signup.ejs`**: Crear formulario de registro.
- [x] **`views/auth/login.ejs`**: Crear formulario de inicio de sesión.
- [x] **`views/admin/dashboard.ejs`**: Diseñar la lista de torneos y el botón de creación.
- [x] **`views/club/dashboard.ejs`**: Clonar y adaptar el dashboard de admin plataforma para el admin de club.
- [x] **`views/admin/create_tournament.ejs`**: Crear el formulario de creación de torneos.
- [x] **`views/club/create_player.ejs`**: Crear formulario de registro de jugador para el admin del club.
- [x] **`views/club/players.ejs`**: Mostrar la lista de jugadores del club.
- [x] **`views/club/add_player_to_tournament.ejs`**: Formulario para añadir jugadores a un torneo.
- [ ] **`views/admin/manage_tournament.ejs`**: Añadir UI para recibir y gestionar sugerencias de puntuación.
- [ ] **`views/public/live_dashboard.ejs`**: 
    - [ ] Diseñar la vista pública con el cuadro de partidos y marcadores.
    - [ ] Añadir UI para que los espectadores puedan enviar sugerencias de puntuación.

## 8. Despliegue y Mantenimiento

- [ ] Crear el archivo `.env`.
- [ ] Añadir variables de entorno (`PORT`, `SESSION_SECRET`) a `.env`.
- [ ] Modificar `app.js` para usar las variables de `.env` (requiere `dotenv`).
- [ ] **Pruebas Funcionales**:
    - [ ] Probar el registro de un nuevo club.
    - [ ] Probar el inicio de sesión.
    - [ ] Probar la creación de un torneo (límite freemium).
    - [ ] Probar la visualización del dashboard en vivo.
    - [ ] Probar la actualización de un marcador y verificar la actualización en tiempo real.
- [ ] Subir el proyecto a un servicio de hosting (ej. Heroku, Railway).
- [ ] Configurar las variables de entorno en el servicio de hosting.
- [ ] Verificar que la aplicación funcione en producción.

## Funcionalidades del Administrador de plaforma
- [x] **Formulario para crear un club**
- [ ] **Gestion de administradores de club**
    - [ ] Acceso desde el dashboard para crear un administrador de club
    - [ ] Vincular un usuario para ser un administrador de club


## Funcionalidades del Administrador de Club

- [x] **preparacion de las paginas principales del administrador de club**
- [x] **Registro de usuario administrado:**
    - [x] Crear formulario de registro para usuario.
    - [x] Ser rediccionado al dashboard.
- [x] **Creación de Torneos:**
    - [x] Permitir al administrador del club crear nuevos torneos desde su dashboard.
    - [x] Formulario de creación con campos como: nombre, tipo de torneo, fechas, número de jugadores, etc.
- [x] **Gestión de Jugadores:**
    - [x] Permitir al administrador crear jugadores.
    - [x] Permitir al administrador añadir jugadores a un torneo.
    - [ ] Permitir al administrador modificar los datos de los jugadores inscritos.
    - [ ] Permitir a los usuarios (jugadores) inscribirse a torneos abiertos.
    ### Gestión de Torneos
    - [ ] **Lógica de Tipos de Torneo:**
        - [ ] **Round Robin (Liguilla):**
            - [ ] Generar automáticamente los enfrentamientos.
            - [ ] Registrar resultados de los partidos.
            - [ ] Calcular la tabla de posiciones.
            - [ ] Determinar al ganador basado en la puntuación.
        - [ ] **Eliminatoria Directa:**
            - [ ] Generar el cuadro de enfrentamientos (bracket).
            - [ ] Registrar los resultados de cada ronda.
            - [ ] Avanzar a los ganadores a la siguiente ronda.
            - [ ] Determinar al campeón.
        - [ ] **Liga:**
            - [ ] Similar a Round Robin pero con partidos de ida y vuelta.
            - [ ] Implementar la lógica de puntuación y clasificación.
        - [ ] **Americana Clásica:**
            - [ ] Implementar la lógica de rotación de parejas.
            - [ ] Calcular la clasificación individual.
            - [ ] Determinar al ganador.
### Wallshow (Visualización en Vivo)
- [ ] **Integración con Torneos:**
    - [ ] Mostrar los cuadros y resultados de los torneos en el wallshow en tiempo real.
    - [ ] Actualizar automáticamente los enfrentamientos a medida que avanzan los torneos.
    - [ ] Mostrar información del partido en curso (jugadores, puntuación).
- [ ] **Anuncio de Ganadores:**
    - [ ] Mostrar una vista especial en el wallshow para anunciar a los ganadores/campeones del torneo.



### Autenticación y Dashboard de Usuario
- [ ] **Registro de Usuario:**
    - [ ] Crear formulario de registro para usuarios (jugadores).
    - [ ] Implementar la lógica en el backend para registrar nuevos usuarios.
- [ ] **Inicio de Sesión de Usuario:**
    - [ ] Crear formulario de inicio de sesión para usuarios.
    - [ ] Implementar la lógica en el backend para autenticar usuarios.
- [ ] **Dashboard de Usuario:**
    - [ ] Crear una vista de dashboard específica para el usuario (`views/user/dashboard.ejs`).
    - [ ] Al iniciar sesión, redirigir al usuario a su dashboard.
    - [ ] Mostrar información relevante para el usuario (torneos inscritos, próximos partidos, etc.).