const express = require('express');
const router = express.Router();
const db = require('../config/db');

router.get('/', (req, res) => {
    res.send('Accueil - API GMod fonctionne !');
});

// Setup endpoint - Promote user to admin (only if no admin exists yet)
router.post('/setup/promote-admin', async (req, res) => {
    const { userId, steamId } = req.body;

    // Check if an admin already exists
    try {
        const adminExists = await new Promise((resolve, reject) => {
            db.get(
                "SELECT id FROM users WHERE rank IN ('admin', 'responsable', 'superadmin', 'owner') LIMIT 1",
                (err, row) => {
                    if (err) reject(err);
                    resolve(!!row);
                }
            );
        });

        if (adminExists) {
            return res.status(403).json({
                error: 'Setup already completed. An admin already exists. Use the admin panel to manage ranks.'
            });
        }

        // Find user by ID or Steam ID
        const user = await new Promise((resolve, reject) => {
            let query = '';
            let params = [];

            if (userId) {
                query = 'SELECT id, username, steam_id FROM users WHERE id = ?';
                params = [userId];
            } else if (steamId) {
                query = 'SELECT id, username, steam_id FROM users WHERE steam_id = ?';
                params = [steamId];
            } else {
                return reject(new Error('userId or steamId required'));
            }

            db.get(query, params, (err, row) => {
                if (err) reject(err);
                resolve(row);
            });
        });

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        // Promote to admin
        await new Promise((resolve, reject) => {
            db.run(
                "UPDATE users SET rank = 'admin', updated_at = datetime('now') WHERE id = ?",
                [user.id],
                function(err) {
                    if (err) reject(err);
                    resolve();
                }
            );
        });

        res.json({
            message: 'User promoted to admin successfully',
            userId: user.id,
            username: user.username,
            steamId: user.steam_id,
            rank: 'admin'
        });

    } catch (err) {
        console.error('Setup error:', err);
        res.status(500).json({ error: 'Setup failed: ' + err.message });
    }
});

module.exports = router;