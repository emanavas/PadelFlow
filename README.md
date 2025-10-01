# 🚀 PadelFlow: Un Vistazo Técnico Detallado

PadelFlow es una **plataforma web integral** para la gestión de torneos de pádel, diseñada como un sistema multi-inquilino (*multi-tenant*) sobre el ecosistema de **Node.js**. Su objetivo principal es automatizar la compleja logística de la organización de torneos, ofreciendo una solución centralizada para administradores de plataforma y autonomía para cada club.

## 1. 💡 Resumen del Proyecto

| Característica | Detalle |
| :--- | :--- |
| **Propósito Principal** | Gestión y automatización de torneos de pádel. |
| **Modelo de Negocio** | **Freemium** (límite de 3 torneos activos para cuentas no premium). |
| **Base Tecnológica** | Node.js, Express.js. |
| **Arquitectura** | Patrón **MVC** (Model-View-Controller). |
| **Base de Datos** | **SQLite** con extensiones especializadas. |
| **Licencia** | **Apache 2.0**. |

### 1.3. 👥 Jerarquía de Roles de Usuario y Permisos

Un sistema de roles robusto garantiza la seguridad y la segmentación de datos en la arquitectura multi-inquilino.

| Rol | Identificador en el Sistema | Nivel de Acceso | Capacidades Clave |
| :--- | :--- | :--- | :--- |
| **Administrador de Plataforma** | `admin_plataforma` | **Global** | Gestión de todos los clubes, supervisión y métricas de la plataforma. |
| **Administrador de Club** | `admin_club` | Específico del Club | Creación/gestión de torneos, administración de jugadores y marcadores. |
| **Jugador** | `jugador` | Específico del Torneo | Inscripción en torneos y visualización del estado de sus competiciones. |
| **Espectador** | `espectadores` | **Público** | Acceso de solo lectura al "Wallshow" (marcador público en tiempo real). |

---

## 2. ⚙️ Arquitectura del Sistema

PadelFlow implementa un patrón **Model-View-Controller (MVC)** sobre **Express.js**, asegurando una separación lógica de responsabilidades.

### 2.1. Visión General y Flujo de Petición

El flujo estructurado de una petición HTTP garantiza un procesamiento predecible y robusto:

`Cliente` ➡️ `Capa de Rutas (Routes)` ➡️ `Pipeline de Middleware` ➡️ `Controladores` ➡️ `Modelos` ➡️ `Base de Datos (SQLite)`

### 2.2. Núcleo de la Aplicación (`app.js`)

El fichero **`app.js`** es el **orquestador principal**, encargado de la inicialización secuencial de todos los componentes antes del arranque del servidor HTTP:

1. **Inicialización** de Express.js.
2. **Configuración** de Middleware.
3. **Internacionalización** (i18next).
4. **Gestión de Sesiones** (express-session).
5. **Motor de Vistas** (EJS).
6. **Registro** de Módulos de Rutas.
7. **Inicialización de la Base de Datos** (`initDatabase()`).
8. **Arranque** del Servidor HTTP.

### 2.3. Pipeline de Middleware

El pipeline es la columna vertebral del procesamiento, preparando el contexto necesario para los controladores:

| Middleware | Propósito |
| :--- | :--- |
| `express.urlencoded()`, `express.json()` | Parseo de los cuerpos (`req.body`) de las peticiones entrantes. |
| `express.static('public')` | Servir ficheros estáticos (CSS, JS, imágenes). |
| `i18nextMiddleware.handle(i18next)` | Detección de idioma y carga de traducciones. |
| `session()` | Persistencia del estado del usuario mediante cookies. |
| `Middleware Personalizado (res.locals)` | Exposición de la función de traducción (`req.t`) y otras variables a las plantillas EJS. |

### 2.4. Arquitectura de Enrutamiento Modular

La estrategia de enrutamiento separa las rutas en módulos dedicados para mejorar la organización y facilitar la aplicación de middleware de autorización.

| Módulo de Ruta | Punto de Montaje | Propósito Principal |
| :--- | :--- | :--- |
| `indexRouter` | `/` | Rutas públicas (ej. página de inicio). |
| `authRouter` | `/` | Endpoints de autenticación (login, signup, logout). |
| `adminRouter` | `/admin` | Funcionalidades para el **Administrador de Plataforma**. |
| `clubRouter` | `/club` | Gestión de club para el **Administrador de Club**. |
| `apiRouter` | `/` | Endpoints de la API (incluye funcionalidades en tiempo real). |

---

## 3. 🎯 Características Clave

### 3.2. 🏆 Sistema de Gestión de Torneos

El sistema maneja el ciclo de vida completo de un torneo y soporta múltiples formatos de competición:

| Formato de Torneo | Estado de Implementación | Lógica |
| :--- | :--- | :--- |
| **Round Robin (Liguilla)** | Implementado **parcialmente**. | Todos se enfrentan entre sí. |
| **Single Elimination (Eliminatoria Directa)** | Implementado **parcialmente**. | Cuadro de eliminación directa. |
| **Liga (League)** | **Planeado**. | Competición de larga duración. |
| **Americana Clásica** | **Planeado**. | Rotación de parejas y puntuación individual. |

### 3.3. ⚡ Funcionalidades en Tiempo Real con SSE

Se utiliza **Server-Sent Events (SSE)** para proporcionar actualizaciones en vivo, creando una experiencia dinámica para espectadores y administradores ("Wallshow").

| Acción | Endpoint | Resultado |
| :--- | :--- | :--- |
| **Conexión** | `/api/events/:id` | El cliente establece una conexión persistente para recibir eventos. |
| **Actualización de Marcador (Admin)** | `POST /api/tournaments/:id/score` | Modifica DB y dispara un evento SSE a **todos** los clientes conectados. |
| **Sugerencia de Marcador (Público)** | `POST /api/tournaments/:id/suggest-score` | **No** modifica DB; envía notificación SSE solo a **Administradores** conectados. |

### 3.4. 🔒 Sistema de Autenticación y Control de Acceso

- **Autenticación:** Basada en **sesiones** gestionadas por `express-session`. Las contraseñas se protegen con **bcrypt**.
- **Autorización (Middlewares):**
    - `isAuthenticated`: Verifica que el usuario haya iniciado sesión.
    - `checkFreemium`: Aplica la limitación de **tres torneos activos** para clubes no premium.

### 3.5. 🌍 Internacionalización (`i18next`)

El sistema soporta múltiples idiomas para una audiencia global:

- **Configuración:** Ficheros JSON organizados en `./locales/{{lng}}/translation.json`.
- **Idiomas Soportados:** **Inglés (`en`)** y **Español (`es`)**. El inglés es el idioma de respaldo (*fallback*).
- **Integración:** La función de traducción (`t()`) se expone directamente a las plantillas **EJS**.

---

## 4. 🗃️ Capa de Datos y Persistencia

### 4.1. Arquitectura de la Base de Datos

La plataforma utiliza **SQLite** por su simplicidad, portabilidad y bajo requerimiento de configuración. La herramienta gráfica **DB Browser for SQLite** facilita la gestión del esquema y la manipulación de datos.

### 4.3. Extensiones de la Base de Datos

Para ampliar las capacidades nativas de SQLite y soportar la lógica de negocio compleja, se integran librerías dinámicas (`.dll`):

- **`math.dll`**: Proporciona funciones matemáticas (Trigonométricas, Estadísticas, Aritméticas) esenciales para la lógica de torneos y análisis de rendimiento.
- **`formats.dll`**: Utilidades para serialización y conversión de datos (ej. Base64, Property List).
- **`sqlean.dll`**: Fuente adicional de funciones de utilidad SQL.

### 4.4. Esquema de la Base de Datos y Relaciones

El esquema está diseñado para el modelo multi-inquilino y la gestión de torneos:

- **`Clubs`**: Entidad central multi-inquilino.
- **`Users`**: Cuentas de usuario con rol (`user_type` se vincula a la jerarquía de roles).
- **`Torneos`**: Eventos creados por un club, con tipo (Liguilla, Eliminatoria) y estado.
- **`Jugadores (Players)`**: Participantes vinculados a un club y torneos.
- **`Partidos (Matches)`**: Enfrentamientos individuales, almacenando marcador y estado.

---

## 5. 💻 Configuración y Entorno de Desarrollo

El entorno está estandarizado para la eficiencia y la colaboración:

| Componente | Configuración | Propósito |
| :--- | :--- | :--- |
| **IDE** | Visual Studio Code (`PadelFlow.code-workspace`) | Entorno de desarrollo recomendado y configurado. |
| **Depuración** | `.vscode/launch.json` | Configuración para iniciar y depurar `app.js` con puntos de interrupción, ignorando ficheros internos de Node.js (`skipFiles`). |
| **Control de Versiones** | `.gitignore` | Excluye dependencias (`node_modules/`), logs, cachés y ficheros sensibles (`.env`), manteniendo `.env.example` como plantilla. |

---

## 6. 🔗 Integraciones y Licenciamiento

### 6.1. Integración con Google Docs

Una integración programática enlaza la documentación externa a través del fichero de metadatos **`PadelFlow.gdoc`** (formato JSON), que contiene el `doc_id` y el `email` de la cuenta asociada.

### 6.2. 📜 Licenciamiento del Proyecto

PadelFlow se distribuye bajo la **Licencia Apache 2.0**, una licencia de código abierto **permisiva**:

- ✅ Permite uso, modificación y distribución para fines comerciales y privados (sin royalties).
- ⚠️ Requiere la conservación de los avisos de **copyright** y de la **propia licencia**.
- 🚫 Ofrece el software **"TAL CUAL" (AS IS)**, limitando la responsabilidad de los contribuidores.