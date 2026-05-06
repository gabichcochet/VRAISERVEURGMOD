const express = require('express');
const router = express.Router();
const db = require('../config/db');

// Info utilisateur
router.get('/me', async (req, res) => {
  if (!req.user) {
    return res.json({ loggedIn: false });
  }

  try {
    const user = await new Promise((resolve, reject) => {
      db.get(
        'SELECT id, steam_id, username, rank FROM users WHERE steam_id = ?',
        [req.user.steamId],
        (err, row) => {
          if (err) return reject(err);
          resolve(row);
        }
      );
    });

    if (!user) {
      return res.json({ loggedIn: false });
    }

    res.json({
      loggedIn: true,
      user: {
        dbId: user.id,
        steamId: user.steam_id,
        username: user.username,
        rank: user.rank,
      },
    });
  } catch (err) {
    console.error('Erreur récupération utilisateur:', err);
    res.status(500).json({ error: 'Erreur interne' });
  }
});

module.exports = router;