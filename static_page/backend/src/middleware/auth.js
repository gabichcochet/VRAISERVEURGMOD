function requireAuth(req, res, next) {
  if (!req.user) return res.status(401).json({ error: 'Not authenticated' });
  next();
}

function requireAdmin(req, res, next) {
  const adminSteamId = process.env.ADMIN_STEAM_ID;
  if (!req.user) return res.status(401).json({ error: 'Not authenticated' });
  if (!adminSteamId) return res.status(500).json({ error: 'ADMIN_STEAM_ID not set' });

  if (req.user.steamId !== adminSteamId) {
    return res.status(403).json({ error: 'Forbidden' });
  }
  next();
}

module.exports = {
  requireAuth,
  requireAdmin,
};