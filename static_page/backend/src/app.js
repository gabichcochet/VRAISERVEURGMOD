require('dotenv').config();

const express = require('express');
const session = require('express-session');
const passport = require('./config/steamConfig');

const pagesRoutes = require('./routes/pages.routes');
const authRoutes = require('./routes/auth.routes');
const pagesApiRoutes = require('./routes/pagesApi.routes');

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


app.use('/', pagesRoutes);
app.use('/', authRoutes);
app.use('/', pagesApiRoutes);

app.listen(PORT, () => {
    console.log(`Backend listening on http://localhost:${PORT}`);
});

