const express = require('express');
const router = express.Router();

router.get('/', (req, res) => {
    res.send('Accueil - API GMod fonctionne !');
});

router.get('/reglement', (req, res) => {
    res.send('Règlement du serveur');
});

router.get('/legal', (req, res) => {
    res.send('Mentions légales du site');
});

router.get('/confidentialite', (req, res) => {
    res.send('Politique de confidentialité');
});

router.get('/sante', (req, res) => {
    res.json({status: 'OK', time: new Date()});
});

module.exports = router;