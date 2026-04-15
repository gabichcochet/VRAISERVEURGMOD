const express = require('express');
const router = express.Router();
const passport = require('../config/steamConfig');
const { findOrCreateBySteamId } = require('../models/userModel');

// Démarre le login Steam
router.get('/auth/steam', passport.authenticate('steam'));

// Callback après Steam
router.get(
  '/auth/steam/return',
  passport.authenticate('steam', { failureRedirect: '/' }),
  async (req, res) => {
    try {
        const steamId = req.user.steamId;

        const userRow = await findOrCreateBySteamId(steamId);

        req.user.dbId = userRow.id;

        res.redirect('/me');
    } catch (err) {
        next(err);
    }
  }
);

// Info utilisateur
router.get('/me', (req, res) => {
  if (!req.user) {
    return res.json({ loggedIn: false });
  }

  res.json({
    loggedIn: true,
    user: {
        dbId: req.user.dbId,
        steamId: req.user.steamId
    },
  });
});

// Logout
router.get('/logout', (req, res) => {
  req.logout(() => {
    res.redirect('/');
  });
});

module.exports = router;
