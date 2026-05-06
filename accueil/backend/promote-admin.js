const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, 'db.sqlite');
const steamId = 'STEAMID';
const username = 'Admin_User';

const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('❌ Erreur de connexion à la base de données:', err);
        process.exit(1);
    }

    db.get('SELECT id, username, rank FROM users WHERE steam_id = ?', [steamId], (err, user) => {
        if (err) {
            console.error('❌ Erreur lors de la recherche:', err);
            db.close();
            process.exit(1);
        }

        if (user) {
            db.run("UPDATE users SET rank = 'admin', updated_at = datetime('now') WHERE steam_id = ?", [steamId], function(err) {
                if (err) {
                    console.error('❌ Erreur lors de la mise à jour:', err);
                    db.close();
                    process.exit(1);
                }
                console.log('✅ Utilisateur existant promu administrateur.');
                console.log(`ID: ${user.id} | Nom: ${user.username || 'N/A'} | Rank: admin`);
                db.close();
                process.exit(0);
            });
        } else {
            db.run('INSERT INTO users (steam_id, username, rank) VALUES (?, ?, ?)', [steamId, username, 'admin'], function(err) {
                if (err) {
                    console.error('❌ Erreur lors de la création:', err);
                    db.close();
                    process.exit(1);
                }
                console.log('✅ Utilisateur créé et promu administrateur.');
                console.log(`ID: ${this.lastID} | Nom: ${username} | Rank: admin`);
                db.close();
                process.exit(0);
            });
        }
    });
});
