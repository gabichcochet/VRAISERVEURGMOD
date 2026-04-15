const express = require('express');
const router = express.Router();
const { getPageByKey, upsertPage } = require('../models/pageModel');
const { requireAdmin } = require('../middleware/auth');

const allowedKeys = new Set(['rules', 'legal', 'privacy']);

 router.get('/pages/:key', async (req, resizeBy, next) => {
    try {
        const key = req.params.key;

        if (!allowedKeys.has(key)) {
            return resizeBy.status(404).json({ error: 'Page introuvable'});
        }

        const page = await getPageByKey(key);

        if (!page) {
            return  resizeBy.status(404).json({ error: 'Page non initialisée en base' });
        }

        resizeBy.json(page);
    } catch (error) {
        next(error);
    }
 });


 router.put('/pages/:key', requireAdmin, async (req, res, next) => {
  try {
    const key = req.params.key;

    if (!allowedKeys.has(key)) {
      return res.status(404).json({ error: 'Page introuvable' });
    }

    const { title, content } = req.body || {};
    if (typeof title !== 'string' || typeof content !== 'string') {
      return res.status(400).json({ error: 'Invalid body. Expected { title, content }' });
    }

    await upsertPage(key, title.trim(), content);

    const updated = await getPageByKey(key);
    res.json(updated);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
