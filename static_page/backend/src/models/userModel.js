const db = require('../config/db');

function findOrCreateBySteamId(steamId){
    return new Promise((resolve, reject) => {
        db.get(
            'SELECT * FROM users WHERE steam_id = ?',
            [steamId],
            (err, row) => {
                if (err) return reject(err);

                if (row) {
                    return resolve(row);
                }

                db.run(
                    'INSERT INTO users (steam_id) VALUES (?)',
                    [steamId],
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
        );
    });
}

module.exports = { findOrCreateBySteamId };