require('dotenv').config();

const express = require('express');
const session = require('express-session');
const passport = require('./config/steamConfig');

const indexRoutes = require('./routes/index.routes');
const authRoutes = require('./routes/auth.routes');
const authApiRoutes = require('./routes/auth-api.routes');
const shopRoutes = require('./routes/shop.routes');
const userRoutes = require('./routes/user.routes');
const adminRoutes = require('./routes/admin.routes');


const app = express();
const cors = require('cors');

app.use(cors({
    origin: ['http://localhost:5173', 'http://localhost:5174'],
    credentials: true
}));

const PORT = process.env.PORT || 3000;

app.use(express.json());

app.use(
    session({
        secret: process.env.SESSION_SECRET || 'dev-secret',
        resave: false,
        saveUninitialized: false,
    })
);

app.use(passport.initialize());
app.use(passport.session());

// Ajouter après les routes existantes:
app.use('/api/shop', shopRoutes);
app.use('/api', userRoutes);
app.use('/api', authApiRoutes);
app.use('/api/admin', adminRoutes);
app.use('/', indexRoutes);
app.use('/', authRoutes);

app.listen(PORT, (err) => {
    if (err) {
        if (err.code === 'EADDRINUSE') {
            console.error(`Impossible de lancer le backend: le port ${PORT} est déjà utilisé.`);
            console.error('Arrête l’ancien backend ou configure un autre PORT dans .env.');
            process.exit(1);
        }

        console.error('Erreur au lancement du backend:', err);
        process.exit(1);
    }

    console.log(`Backend listening on http://localhost:${PORT}`);
});

