const db = require('../config/db');

function findOrCreateBySteamId(steamId, displayName, avatarUrl){
    return new Promise((resolve, reject) => {
        db.get(
            'SELECT * FROM users WHERE steam_id = ?',
            [steamId],
            (err, row) => {
                if (err) return reject(err);

                if (row) {
                    // Mettre à jour le pseudo ou l'avatar s'ils ont changé
                    if (row.username !== displayName || row.avatar_url !== avatarUrl) {
                        db.run(
                            'UPDATE users SET username = ?, avatar_url = ? WHERE steam_id = ?',
                            [displayName, avatarUrl, steamId],
                            (errUpdate) => {
                                if (errUpdate) return reject(errUpdate);
                                row.username = displayName;
                                row.avatar_url = avatarUrl;
                                resolve(row);
                            }
                        );
                    } else {
                        return resolve(row);
                    }
                } else {
                    db.run(
                        'INSERT INTO users (steam_id, username, avatar_url) VALUES (?, ?, ?)',
                        [steamId, displayName, avatarUrl],
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