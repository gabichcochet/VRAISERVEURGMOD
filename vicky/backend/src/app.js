const express = require('express');
const app = express();

const PORT = 3000;

const pagesRoutes = require('./routes/pages.routes');

app.use('/', pagesRoutes);

app.listen(PORT, () => {
    console.log(`Backend listening on http://localhost:${PORT}`);
});