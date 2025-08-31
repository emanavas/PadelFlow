require('dotenv').config();
const express = require('express');
const session = require('express-session');
const i18next = require('i18next');
const i18nextMiddleware = require('i18next-http-middleware');
const Backend = require('i18next-fs-backend');
const { initDatabase } = require('./db/database');


// Importar rutas (aunque todavía no las usemos)
const indexRouter = require('./routes/index');
const authRouter = require('./routes/authRoutes');
const adminRouter = require('./routes/adminRoutes')
const tournamentRouter = require('./routes/tournamentRoutes');
const apiRouter = require('./routes/apiRoutes');
const clubRouter = require('./routes/clubRoutes'); // Added this line

i18next
    .use(Backend)
    .use(i18nextMiddleware.LanguageDetector)
    .init({
        backend: {
            loadPath: __dirname + '/locales/{{lng}}/translation.json',
        },
        fallbackLng: 'en',
        preload: ['en', 'es'],
        saveMissing: true, // Ayuda a encontrar claves que falten durante el desarrollo
        detection: {
            order: ['cookie', 'header'],
            caches: ['cookie']
        }
    });

const app = express();

// Configuración de Express
app.use(express.urlencoded({ extended: true }));
app.use(express.json()); // Add this line to parse JSON bodies
app.use(express.static('public'));

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

// Usar archivos de rutas
app.use('/', indexRouter);
app.use('/', authRouter);
app.use('/admin', adminRouter);
app.use('/club', clubRouter); // Added this line
app.use('/tournaments', tournamentRouter);
app.use('/api', apiRouter);

// Definir puerto y arrancar servidor
const PORT = process.env.PORT || 3000;

initDatabase().then(() => {
    app.listen(PORT, () => {
        console.log(`Servidor escuchando en http://localhost:${PORT}`);
    });
}).catch(err => {
    console.error('Failed to initialize database:', err);
});