const express = require('express');
const router = express.Router();
const db = require('../config/db');

// Middleware pour vérifier l'authentification
const isAuthenticated = (req, res, next) => {
    if (req.isAuthenticated()) {
        next();
    } else {
        res.status(401).json({ error: 'Non authentifié' });
    }
};

// ============ ROUTES PUBLIQUES ============

// Récupérer toutes les catégories avec leurs items
router.get('/categories', (req, res) => {
    db.all(`
        SELECT 
            c.id, c.name, c.description, c.icon, c.order_index,
            COUNT(i.id) as item_count
        FROM shop_categories c
        LEFT JOIN shop_items i ON c.id = i.category_id AND i.in_stock = 1
        ORDER BY c.order_index ASC
    `, (err, rows) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        res.json(rows || []);
    });
});

// Récupérer tous les items d'une catégorie
router.get('/items/category/:categoryId', (req, res) => {
    const { categoryId } = req.params;
    
    db.all(`
        SELECT * FROM shop_items 
        WHERE category_id = ? AND in_stock = 1
        ORDER BY order_index ASC
    `, [categoryId], (err, rows) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        res.json(rows || []);
    });
});

// Récupérer tous les items en stock
router.get('/items', (req, res) => {
    db.all(`
        SELECT * FROM shop_items 
        WHERE in_stock = 1
        ORDER BY order_index ASC
    `, (err, rows) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        res.json(rows || []);
    });
});

// Valider un code promo
router.post('/promo/validate', isAuthenticated, (req, res) => {
    const { code, totalPrice } = req.body;
    
    if (!code) {
        return res.status(400).json({ error: 'Code requis' });
    }

    db.get(`
        SELECT * FROM promo_codes 
        WHERE code = ? AND is_active = 1 
        AND (expiry_date IS NULL OR expiry_date > datetime('now'))
    `, [code.toUpperCase()], (err, promo) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }

        if (!promo) {
            return res.status(404).json({ error: 'Code promo invalide ou expiré' });
        }

        if (promo.max_uses && promo.current_uses >= promo.max_uses) {
            return res.status(400).json({ error: 'Code promo épuisé' });
        }

        if (totalPrice < promo.min_purchase_amount) {
            return res.status(400).json({ 
                error: `Montant minimum: €${promo.min_purchase_amount}` 
            });
        }

        let discount = 0;
        if (promo.discount_type === 'percentage') {
            discount = (totalPrice * promo.discount_value) / 100;
        } else {
            discount = promo.discount_value;
        }

        res.json({
            valid: true,
            code: promo.code,
            discountType: promo.discount_type,
            discountValue: promo.discount_value,
            discount: discount,
            finalPrice: Math.max(0, totalPrice - discount)
        });
    });
});

// ============ ROUTES STRIPE ============

// Créer une session de paiement Stripe
router.post('/checkout', isAuthenticated, (req, res) => {
    const { items, promoCode } = req.body;
    const userId = req.user.id;

    if (!items || items.length === 0) {
        return res.status(400).json({ error: 'Panier vide' });
    }

    // Valider que les items existent
    const placeholders = items.map(() => '?').join(',');
    const itemIds = items.map(i => i.itemId);

    db.all(`
        SELECT id, price FROM shop_items 
        WHERE id IN (${placeholders}) AND in_stock = 1
    `, itemIds, (err, dbItems) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }

        if (dbItems.length !== items.length) {
            return res.status(400).json({ error: 'Certains items ne sont pas disponibles' });
        }

        // Calculer le total
        let total = items.reduce((sum, cartItem) => {
            const dbItem = dbItems.find(i => i.id === cartItem.itemId);
            return sum + (dbItem.price * (cartItem.quantity || 1));
        }, 0);

        // Appliquer code promo si fourni
        if (promoCode) {
            db.get(`
                SELECT * FROM promo_codes 
                WHERE code = ? AND is_active = 1
            `, [promoCode.toUpperCase()], (err, promo) => {
                if (!err && promo) {
                    if (promo.discount_type === 'percentage') {
                        total *= (1 - promo.discount_value / 100);
                    } else {
                        total = Math.max(0, total - promo.discount_value);
                    }
                }
                createPaymentIntent(total, userId, items, promoCode);
            });
        } else {
            createPaymentIntent(total, userId, items, null);
        }
    });

    function createPaymentIntent(total, userId, items, promoCode) {
        // NOTE: Intégration Stripe requise
        // Pour maintenant, retourner l'info pour frontend
        res.json({
            clientSecret: 'placeholder_' + Date.now(),
            amount: Math.round(total * 100), // Stripe utilise les centimes
            currency: 'eur',
            items: items,
            promoCode: promoCode
        });
    }
});

// Webhook Stripe (à implémenter avec clé Stripe secrète)
router.post('/webhook', express.raw({type: 'application/json'}), (req, res) => {
    const signature = req.headers['stripe-signature'];
    
    // TODO: Vérifier la signature avec STRIPE_WEBHOOK_SECRET
    // TODO: Mettre à jour le statut de la commande
    // TODO: Enregistrer le log admin
    
    res.json({ received: true });
});

// ============ ROUTES UTILISATEUR ============

// Récupérer l'historique des commandes de l'utilisateur
router.get('/orders/my', isAuthenticated, (req, res) => {
    const userId = req.user.id;

    db.all(`
        SELECT 
            o.id, o.item_id, o.quantity, o.total_price, o.status,
            i.name as item_name, i.image_url,
            c.name as category_name,
            o.created_at, o.completed_at
        FROM shop_orders o
        JOIN shop_items i ON o.item_id = i.id
        JOIN shop_categories c ON i.category_id = c.id
        WHERE o.user_id = ?
        ORDER BY o.created_at DESC
    `, [userId], (err, rows) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        res.json(rows || []);
    });
});

// ============ ROUTES ADMIN ============

// Ajouter une catégorie (Propriétaire/SuperAdmin)
router.post('/admin/categories', isAuthenticated, (req, res) => {
    const { name, description, icon, order_index } = req.body;
    const admin = req.user;

    // Vérifier permission
    const adminRanks = ['owner', 'superadmin'];
    if (!adminRanks.includes(admin.rank)) {
        return res.status(403).json({ error: 'Accès refusé' });
    }

    db.run(`
        INSERT INTO shop_categories (name, description, icon, order_index)
        VALUES (?, ?, ?, ?)
    `, [name, description, icon, order_index], function(err) {
        if (err) {
            return res.status(500).json({ error: err.message });
        }

        // Log admin
        logAdminAction(admin.id, 'category_created', null, 'category', this.lastID, {
            name, description, icon
        }, req.ip);

        res.json({ id: this.lastID, name, description, icon, order_index });
    });
});

// Ajouter un item à la boutique (SuperAdmin/Responsable)
router.post('/admin/items', isAuthenticated, (req, res) => {
    const { category_id, name, description, price, image_url, in_stock, order_index } = req.body;
    const admin = req.user;

    const adminRanks = ['owner', 'superadmin', 'responsable'];
    if (!adminRanks.includes(admin.rank)) {
        return res.status(403).json({ error: 'Accès refusé' });
    }

    db.run(`
        INSERT INTO shop_items (category_id, name, description, price, image_url, in_stock, order_index)
        VALUES (?, ?, ?, ?, ?, ?, ?)
    `, [category_id, name, description, price, image_url, in_stock ? 1 : 0, order_index], 
    function(err) {
        if (err) {
            return res.status(500).json({ error: err.message });
        }

        logAdminAction(admin.id, 'item_created', null, 'item', this.lastID, {
            name, price, category_id
        }, req.ip);

        res.json({ id: this.lastID, category_id, name, description, price, image_url });
    });
});

// Créer un code promo (SuperAdmin/Responsable)
router.post('/admin/promo-codes', isAuthenticated, (req, res) => {
    const { 
        code, discount_type, discount_value, max_uses, 
        min_purchase_amount, applicable_categories, expiry_date 
    } = req.body;
    const admin = req.user;

    const adminRanks = ['owner', 'superadmin', 'responsable'];
    if (!adminRanks.includes(admin.rank)) {
        return res.status(403).json({ error: 'Accès refusé' });
    }

    db.run(`
        INSERT INTO promo_codes 
        (code, discount_type, discount_value, max_uses, min_purchase_amount, 
         applicable_categories, expiry_date, created_by_user_id)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `, [
        code.toUpperCase(),
        discount_type,
        discount_value,
        max_uses || null,
        min_purchase_amount || 0,
        applicable_categories ? JSON.stringify(applicable_categories) : null,
        expiry_date || null,
        admin.id
    ], function(err) {
        if (err) {
            return res.status(500).json({ error: err.message });
        }

        logAdminAction(admin.id, 'promo_code_created', null, 'promo_code', this.lastID, {
            code, discount_type, discount_value
        }, req.ip);

        res.json({ code: code.toUpperCase(), discount_type, discount_value });
    });
});

// Fonction pour enregistrer les actions admin
function logAdminAction(adminId, action, targetUserId, resourceType, resourceId, details, ip) {
    db.run(`
        INSERT INTO admin_logs 
        (admin_user_id, action, target_user_id, target_resource_type, target_resource_id, details, ip_address)
        VALUES (?, ?, ?, ?, ?, ?, ?)
    `, [
        adminId,
        action,
        targetUserId,
        resourceType,
        resourceId,
        JSON.stringify(details),
        ip
    ], (err) => {
        if (err) console.error('Erreur log admin:', err);
    });
}

module.exports = router;
