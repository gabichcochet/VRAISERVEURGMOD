const path = require('path');
const sqlite3 = require('sqlite3').verbose();

const dbPath = path.join(__dirname, '../../db.sqlite');

const db = new sqlite3.Database(dbPath, err => {
    if (err) {
        console.error('Erreur ouverture DB', err);
    }else {
        console.log('DB SQLite OK ->', dbPath);
    }
});

db.serialize(() => {
    db.run(`
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            steam_id TEXT NOT NULL UNIQUE,
            created_at TEXT DEFAULT CURRENT_TIMESTAMP
        )
    `);
});

module.exports = db;