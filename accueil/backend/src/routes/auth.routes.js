const express = require('express');
const router = express.Router();
const db = require('../config/db');
const passport = require('../config/steamConfig');
const { findOrCreateBySteamId } = require('../models/userModel');

// Démarre le login Steam
router.get('/auth/steam', passport.authenticate('steam'));

// Callback après Steam
router.get(
  '/auth/steam/return',
  passport.authenticate('steam', { failureRedirect: 'http://localhost:5173/' }),
  async (req, res) => {
    try {
        const steamId = req.user.steamId;
        const displayName = req.user.profile.displayName;

        const userRow = await findOrCreateBySteamId(steamId, displayName);

        req.user.id = userRow.id;
        req.user.dbId = userRow.id;
        req.user.rank = userRow.rank || 'user';
        req.user.username = userRow.username;

        res.redirect('http://localhost:5173/');
    } catch (err) {
        console.error('Erreur lors de l\'authentification:', err);
        res.status(500).send('Erreur interne du serveur');
    }
  }
);

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

// Logout
router.get('/logout', (req, res) => {
  req.logout(() => {
    res.redirect('http://localhost:5173/');
  });
});

module.exports = router;

