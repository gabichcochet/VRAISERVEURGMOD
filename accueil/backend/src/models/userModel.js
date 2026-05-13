const db = require('../config/db');

function findOrCreateBySteamId(steamId, displayName){
    return new Promise((resolve, reject) => {
        db.get(
            'SELECT * FROM users WHERE steam_id = ?',
            [steamId],
            (err, row) => {
                if (err) return reject(err);

                if (row) {
                    // Si l'utilisateur existe déjà mais n'a pas de pseudo ou si on veut le mettre à jour
                    if (!row.username && displayName) {
                        db.run(
                            'UPDATE users SET username = ? WHERE steam_id = ?',
                            [displayName, steamId],
                            (errUpdate) => {
                                if (errUpdate) return reject(errUpdate);
                                row.username = displayName;
                                resolve(row);
                            }
                        );
                    } else {
                        return resolve(row);
                    }
                } else {
                    db.run(
                        'INSERT INTO users (steam_id, username) VALUES (?, ?)',
                        [steamId, displayName],
                        function (err2) {
                            if (err2) return reject(err2);

                            db.get(
                                'SELECT * FROM users WHERE id = ?',
                                [this.lastID],
                                (err3, newRow) => {
                                    if (err3) return reject(err3);
                                    resolve(newRow);
                                }
                            );
                        }
                    );
                }
            }
        );
    });
}

module.exports = { findOrCreateBySteamId };