require('dotenv').config();

const express = require('express');
const session = require('express-session');
const passport = require('./config/steamConfig');

const indexRoutes = require('./routes/index.routes');
const authRoutes = require('./routes/auth.routes');
const shopRoutes = require('./routes/shop.routes');
const userRoutes = require('./routes/user.routes');
const adminRoutes = require('./routes/admin.routes');


const app = express();
const cors = require('cors');

app.use(cors({
    origin: 'http://localhost:5173',
    creditentials: true
}));

const PORT = 3000;

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
app.use('/api/admin', adminRoutes);
app.use('/', indexRoutes);
app.use('/', authRoutes);

app.listen(PORT, () => {
    console.log(`Backend listening on http://localhost:${PORT}`);
});

