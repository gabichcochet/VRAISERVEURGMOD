const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, 'db.sqlite');

const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('❌ Erreur:', err);
        process.exit(1);
    }

    db.all('SELECT id, steam_id, username, rank FROM users', (err, rows) => {
        if (err) {
            console.error('❌ Erreur:', err);
            db.close();
            process.exit(1);
        }

        if (!rows || rows.length === 0) {
            console.log('❌ Aucun utilisateur trouvé en base de données');
        } else {
            console.log('Utilisateurs existants:');
            console.log('');
            rows.forEach(user => {
                console.log(`ID: ${user.id} | Steam: ${user.steam_id} | Nom: ${user.username || 'N/A'} | Rang: ${user.rank}`);
            });
        }

        db.close();
        process.exit(0);
    });
});
