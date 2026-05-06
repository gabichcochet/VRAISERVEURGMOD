const express = require('express');
const router = express.Router();
const db = require('../config/db');

function createLocalPayment(total, dbOrderId, items) {
    const amount = Number(total).toFixed(2);

    return {
        paypalOrderId: `LOCAL_${dbOrderId}_${Date.now()}`,
        total: amount,
        currency: 'EUR',
        items
    };
}

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
        GROUP BY c.id
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

// ============ ROUTES PAIEMENT ============

// Créer un paiement local
router.post('/create-payment-intent', isAuthenticated, (req, res) => {
    const { items, promoCode } = req.body;
    const userId = req.user.id;

    if (!Array.isArray(items) || items.length === 0) {
        return res.status(400).json({ error: 'Panier vide' });
    }

    const cartItems = items.map(item => ({
        itemId: Number(item.itemId),
        quantity: Math.max(1, Number(item.quantity) || 1)
    }));

    if (cartItems.some(item => !Number.isInteger(item.itemId) || item.itemId <= 0)) {
        return res.status(400).json({ error: 'Panier invalide' });
    }

    // Valider que les items existent et sont en stock
    const placeholders = cartItems.map(() => '?').join(',');
    const itemIds = cartItems.map(i => i.itemId);

    db.all(`
        SELECT id, name, price, in_stock FROM shop_items
        WHERE id IN (${placeholders}) AND in_stock = 1
    `, itemIds, (err, dbItems) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }

        if (dbItems.length !== items.length) {
            return res.status(400).json({ error: 'Certains articles ne sont plus disponibles' });
        }

        const dbItemsById = new Map(dbItems.map(item => [item.id, item]));

        // Calculer le total
        let total = cartItems.reduce((sum, cartItem) => {
            const dbItem = dbItemsById.get(cartItem.itemId);
            if (!dbItem) {
                return sum;
            }
            return sum + (dbItem.price * (cartItem.quantity || 1));
        }, 0);

        // Appliquer code promo si fourni
        let finalTotal = total;
        let appliedPromo = null;

        if (promoCode) {
            db.get(`
                SELECT * FROM promo_codes
                WHERE code = ? AND is_active = 1
                AND (expiry_date IS NULL OR expiry_date > datetime('now'))
            `, [promoCode.toUpperCase()], (err, promo) => {
                if (!err && promo) {
                    appliedPromo = promo;
                    if (promo.discount_type === 'percentage') {
                        finalTotal = total * (1 - promo.discount_value / 100);
                    } else {
                        finalTotal = Math.max(0, total - promo.discount_value);
                    }
                }

                createOrderAndLocalPayment(finalTotal, userId, cartItems, appliedPromo, dbItemsById);
            });
        } else {
            createOrderAndLocalPayment(finalTotal, userId, cartItems, null, dbItemsById);
        }
    });

    function createOrderAndLocalPayment(total, userId, items, promo, dbItemsById) {
        // Créer la commande en base
        const orderId = 'ORD_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);

        db.run(`
            INSERT INTO shop_orders (user_id, total_price, status, promo_code_used)
            VALUES (?, ?, 'pending', ?)
        `, [userId, total, promo ? promo.code : null], function(err) {
            if (err) {
                return res.status(500).json({ error: 'Erreur lors de la création de la commande' });
            }

            const dbOrderId = this.lastID;

            // Insérer les items de la commande
            const orderItems = items.map(item => ({
                order_id: dbOrderId,
                item_id: item.itemId,
                quantity: item.quantity || 1,
                price_at_time: dbItemsById.get(item.itemId).price
            }));

            let completed = 0;
            let insertFailed = false;
            orderItems.forEach(orderItem => {
                db.run(`
                    INSERT INTO shop_order_items (order_id, item_id, quantity, price_at_time)
                    VALUES (?, ?, ?, ?)
                `, [orderItem.order_id, orderItem.item_id, orderItem.quantity, orderItem.price_at_time], (err) => {
                    if (err) {
                        console.error('Erreur insertion item commande:', err);
                        if (!insertFailed) {
                            insertFailed = true;
                            return res.status(500).json({ error: 'Erreur lors de la creation de la commande' });
                        }
                        return;
                    }
                    if (insertFailed) return;
                    completed++;
                    if (completed === orderItems.length) {
                        // Tous les items insérés, préparer le paiement local
                        createLocalOrderPayment(total, dbOrderId, items);
                    }
                });
            });
        });
    }

    function createLocalOrderPayment(total, dbOrderId, items) {
        try {
            const payment = createLocalPayment(total, dbOrderId, items);

            db.run(`
                UPDATE shop_orders
                SET paypal_order_id = ?
                WHERE id = ? AND status = 'pending'
            `, [payment.paypalOrderId, dbOrderId], (err) => {
                if (err) {
                    return res.status(500).json({ error: 'Erreur lors de l\'enregistrement du paiement' });
                }

                res.json({
                    paypalOrderId: payment.paypalOrderId,
                    orderId: dbOrderId,
                    total: Number(payment.total),
                    currency: payment.currency,
                    items: payment.items
                });
            });
        } catch (err) {
            console.error('Erreur création paiement:', err);
            db.run(`UPDATE shop_orders SET status = 'failed' WHERE id = ? AND status = 'pending'`, [dbOrderId]);
            res.status(500).json({ error: err.message || 'Erreur lors de la création du paiement' });
        }
    }
});

// Confirmer le paiement local
router.post('/confirm-payment', isAuthenticated, async (req, res) => {
    const { paypalOrderId, orderId } = req.body;
    const userId = req.user.id;

    if (!paypalOrderId && !orderId) {
        return res.status(400).json({ error: 'Informations de paiement manquantes' });
    }

    const whereClause = orderId
        ? 'id = ? AND user_id = ? AND status = \'pending\''
        : 'paypal_order_id = ? AND user_id = ? AND status = \'pending\'';
    const whereParams = orderId ? [orderId, userId] : [paypalOrderId, userId];

    db.get(`
        SELECT id, total_price, paypal_order_id, status
        FROM shop_orders
        WHERE ${whereClause}
    `, whereParams, async (err, order) => {
        if (err) {
            return res.status(500).json({ error: 'Erreur lors de la lecture de la commande' });
        }

        if (!order) {
            return res.status(404).json({ error: 'Commande non trouvée ou déjà traitée' });
        }

        const effectivePaymentOrderId = paypalOrderId || order.paypal_order_id;
        const effectiveOrderId = orderId || order.id;

        if (!effectivePaymentOrderId) {
            return res.status(400).json({ error: 'Identifiant de paiement manquant pour cette commande' });
        }

        if (paypalOrderId && order.paypal_order_id !== paypalOrderId) {
            return res.status(400).json({ error: 'Identifiant de paiement invalide pour cette commande' });
        }

        db.run(`
            UPDATE shop_orders
            SET status = 'completed', completed_at = datetime('now')
            WHERE id = ? AND user_id = ? AND status = 'pending'
        `, [effectiveOrderId, userId], function(updateErr) {
            if (updateErr) {
                return res.status(500).json({ error: 'Erreur lors de la confirmation' });
            }

            if (this.changes === 0) {
                return res.status(404).json({ error: 'Commande non trouvée ou déjà traitée' });
            }

            logAdminAction(null, 'order_completed', userId, 'order', effectiveOrderId, {
                paymentOrderId: effectivePaymentOrderId,
                paymentMethod: 'local'
            }, req.ip);

            res.json({
                success: true,
                orderId: effectiveOrderId,
                message: 'Paiement confirmé avec succès'
            });
        });
    });
});

// Webhook paiement conservé pour compatibilité
router.post('/webhook', express.raw({type: 'application/json'}), (req, res) => {
    res.json({ received: true });
});

// ============ ROUTES UTILISATEUR ============

// Récupérer l'historique des commandes de l'utilisateur
router.get('/orders/my', isAuthenticated, (req, res) => {
    const userId = req.user.id;

    db.all(`
        SELECT 
            o.id, oi.item_id, oi.quantity, o.total_price, o.status,
            i.name as item_name, i.image_url,
            c.name as category_name,
            o.created_at, o.completed_at
        FROM shop_orders o
        JOIN shop_order_items oi ON oi.order_id = o.id
        JOIN shop_items i ON oi.item_id = i.id
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
    if (!adminId) {
        return;
    }

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
