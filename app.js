require('dotenv').config();
const express = require('express');
const session = require('express-session');
const cookieParser = require('cookie-parser');
const i18next = require('i18next');
const i18nextMiddleware = require('i18next-http-middleware');
const Backend = require('i18next-fs-backend');
const { initDatabase } = require('./db/database');
const { seedDatabase } = require('./db/seed.js');

// Importar rutas
const indexRouter = require('./routes/index');
const authRouter = require('./routes/authRoutes');
const adminRouter = require('./routes/adminRoutes')
const tournamentRouter = require('./routes/tournamentRoutes');
const apiRouter = require('./routes/apiRoutes');
const clubRouter = require('./routes/clubRoutes');

i18next
    .use(Backend)
    .use(i18nextMiddleware.LanguageDetector)
    .init({
        backend: {
            loadPath: __dirname + '/locales/{{lng}}/translation.json',
        },
        fallbackLng: 'en',
        preload: ['en', 'es'],
        saveMissing: true,
        detection: {
            order: ['cookie', 'header'],
            caches: ['cookie']
        }
    });

const app = express();

// Configuración de Express
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(cookieParser());
app.use(express.static('public'));
app.use('/vendor/bootstrap', express.static(__dirname + '/node_modules/bootstrap'));

// Middleware de i18next
app.use(i18nextMiddleware.handle(i18next));

// Configuración de EJS
app.set('view engine', 'ejs');

// Configuración de la sesión
app.use(session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false } // Poner a true si usas HTTPS
}));

// Middleware para pasar la función de traducción y el idioma actual a las vistas
app.use((req, res, next) => {
    res.locals.t = req.t;
    res.locals.currentLanguage = req.language;
    next();
});

// Middleware to detect device type from cookie
app.use((req, res, next) => {
  const width = parseInt(req?.cookies?.deviceWidth, 10);
  if (width) {
    if (width < 768) {
      res.locals.deviceType = 'mobile';
    } else if (width >= 768 && width < 992) {
      res.locals.deviceType = 'tablet';
    } else {
      res.locals.deviceType = 'desktop';
    }
  } else {
    res.locals.deviceType = 'unknown'; // Default to unknown if no cookie
  }
  next();
});

// Usar archivos de rutas
app.use('/', indexRouter);
app.use('/', authRouter);
app.use('/admin', adminRouter);
app.use('/club', clubRouter);
app.use('/tournaments', tournamentRouter);
app.use('/api', apiRouter);

// Definir puerto y arrancar servidor
const PORT = process.env.PORT || 3000;

console.log('Initializing application...');

initDatabase()
    .then(({ justCreated }) => {
        // Si la BD se acaba de crear y no estamos en producción, la poblamos.
        if (justCreated && process.env.NODE_ENV !== 'production') {
            console.log('Database was just created, seeding with development data...');
            // Devolvemos la promesa de seedDatabase para encadenarla
            return seedDatabase();
        }
        // Si no hay que poblar, devolvemos una promesa resuelta para continuar.
        return Promise.resolve();
    })
    .then(() => {
        // Este bloque se ejecuta DESPUÉS de que initDatabase y el sembrado (si ocurrió) hayan terminado.
        app.listen(PORT, () => {
            console.log(`Server listening on http://localhost:${PORT}`);
        });
    })
    .catch(err => {
        console.error('Failed to initialize or seed database:', err);
        process.exit(1); // Salir del proceso si la inicialización falla
    });