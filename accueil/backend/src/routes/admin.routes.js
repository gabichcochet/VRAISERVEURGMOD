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

// Middleware pour vérifier les permissions admin
const requireAdminRank = (minRank = 'admin') => (req, res, next) => {
    const rankHierarchy = {
        'user': 0,
        'helper': 1,
        'moderator': 2,
        'admin': 3,
        'responsable': 4,
        'superadmin': 5,
        'owner': 6
    };

    if (!req.user || !rankHierarchy.hasOwnProperty(req.user.rank)) {
        return res.status(403).json({ error: 'Accès refusé - Rang invalide' });
    }

    if (rankHierarchy[req.user.rank] < rankHierarchy[minRank]) {
        return res.status(403).json({ error: `Accès refusé - Rang requis: ${minRank}` });
    }

    next();
};

// ============ TABLEAU DE BORD ============

// Récupérer les stats du serveur
router.get('/dashboard/stats', isAuthenticated, requireAdminRank('helper'), (req, res) => {
    const admin = req.user;

    Promise.all([
        new Promise((resolve) => {
            db.get('SELECT COUNT(*) as total FROM users', (err, row) => {
                resolve(err ? 0 : row?.total || 0);
            });
        }),
        new Promise((resolve) => {
            db.get('SELECT COUNT(*) as total FROM shop_orders WHERE status = "completed"', (err, row) => {
                resolve(err ? 0 : row?.total || 0);
            });
        }),
        new Promise((resolve) => {
            db.get('SELECT SUM(total_price) as revenue FROM shop_orders WHERE status = "completed"', (err, row) => {
                resolve(err ? 0 : row?.revenue || 0);
            });
        }),
        new Promise((resolve) => {
            db.get('SELECT COUNT(*) as total FROM sanctions WHERE is_active = 1', (err, row) => {
                resolve(err ? 0 : row?.total || 0);
            });
        })
    ]).then(([totalUsers, totalOrders, totalRevenue, activeSanctions]) => {
        res.json({
            totalUsers,
            totalOrders,
            totalRevenue: parseFloat(totalRevenue).toFixed(2),
            activeSanctions,
            adminRank: admin.rank
        });
    });
});

// Récupérer les logs admin récents
router.get('/dashboard/logs', isAuthenticated, requireAdminRank('admin'), (req, res) => {
    const limit = req.query.limit || 50;

    db.all(`
        SELECT 
            al.id, al.action, al.target_resource_type, al.created_at,
            (SELECT username FROM users WHERE id = al.admin_user_id) as admin_username,
            (SELECT username FROM users WHERE id = al.target_user_id) as target_username
        FROM admin_logs al
        ORDER BY al.created_at DESC
        LIMIT ?
    `, [limit], (err, logs) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        res.json(logs || []);
    });
});

// ============ GESTION DES UTILISATEURS ============

// Lister tous les utilisateurs
router.get('/users', isAuthenticated, requireAdminRank('moderator'), (req, res) => {
    const { rank, search, limit = 50, offset = 0 } = req.query;

    let query = `
        SELECT 
            u.id, u.steam_id, u.username, u.rank, u.playtime_seconds,
            u.last_seen, u.created_at,
            (SELECT COUNT(*) FROM sanctions WHERE user_id = u.id AND is_active = 1) as active_sanctions
        FROM users u
        WHERE 1=1
    `;
    const params = [];

    if (rank) {
        query += ` AND u.rank = ?`;
        params.push(rank);
    }

    if (search) {
        query += ` AND (u.username LIKE ? OR u.steam_id LIKE ?)`;
        params.push(`%${search}%`, `%${search}%`);
    }

    query += ` ORDER BY u.created_at DESC LIMIT ? OFFSET ?`;
    params.push(limit, offset);

    db.all(query, params, (err, users) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        res.json(users || []);
    });
});

// Récupérer les détails d'un utilisateur
router.get('/users/:userId', isAuthenticated, requireAdminRank('helper'), (req, res) => {
    const { userId } = req.params;

    db.get(`
        SELECT 
            u.id, u.steam_id, u.username, u.avatar_url, u.rank,
            u.playtime_seconds, u.last_seen, u.created_at,
            ps.session_count,
            (SELECT COUNT(*) FROM sanctions WHERE user_id = u.id AND is_active = 1) as active_sanctions,
            (SELECT COUNT(*) FROM shop_orders WHERE user_id = u.id AND status = 'completed') as total_purchases,
            (SELECT SUM(total_price) FROM shop_orders WHERE user_id = u.id AND status = 'completed') as total_spent
        FROM users u
        LEFT JOIN player_stats ps ON u.id = ps.user_id
        WHERE u.id = ?
    `, [userId], (err, user) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }

        if (!user) {
            return res.status(404).json({ error: 'Utilisateur non trouvé' });
        }

        res.json(user);
    });
});

// Changer le rang d'un utilisateur
router.put('/users/:userId/rank', isAuthenticated, requireAdminRank('admin'), (req, res) => {
    const { userId } = req.params;
    const { rank } = req.body;
    const admin = req.user;

    const validRanks = ['user', 'helper', 'moderator', 'admin', 'responsable', 'superadmin', 'owner'];
    if (!validRanks.includes(rank)) {
        return res.status(400).json({ error: 'Rang invalide' });
    }

    // Vérifier que l'admin ne change pas un rang supérieur au sien
    const rankHierarchy = {
        'user': 0, 'helper': 1, 'moderator': 2, 'admin': 3,
        'responsable': 4, 'superadmin': 5, 'owner': 6
    };

    if (rankHierarchy[rank] > rankHierarchy[admin.rank]) {
        return res.status(403).json({ error: 'Impossible de donner un rang supérieur au vôtre' });
    }

    db.run(`
        UPDATE users 
        SET rank = ?, updated_at = datetime('now')
        WHERE id = ?
    `, [rank, userId], function(err) {
        if (err) {
            return res.status(500).json({ error: err.message });
        }

        logAdminAction(admin.id, 'user_rank_changed', parseInt(userId), 'user', parseInt(userId), {
            new_rank: rank
        }, req.ip);

        res.json({ message: 'Rang mis à jour', userId, rank });
    });
});

// ============ GESTION DES SANCTIONS ============

// Lister toutes les sanctions
router.get('/sanctions', isAuthenticated, requireAdminRank('moderator'), (req, res) => {
    const { type, active_only = true, limit = 100 } = req.query;

    let query = `
        SELECT 
            s.id, s.user_id, s.sanction_type, s.reason, s.is_active,
            s.expires_at, s.created_at,
            (SELECT username FROM users WHERE id = s.user_id) as target_user,
            (SELECT username FROM users WHERE id = s.issued_by_user_id) as issued_by
        FROM sanctions s
        WHERE 1=1
    `;
    const params = [];

    if (active_only === 'true') {
        query += ` AND s.is_active = 1`;
    }

    if (type) {
        query += ` AND s.sanction_type = ?`;
        params.push(type);
    }

    query += ` ORDER BY s.created_at DESC LIMIT ?`;
    params.push(limit);

    db.all(query, params, (err, sanctions) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        res.json(sanctions || []);
    });
});

// Créer une sanction
router.post('/sanctions', isAuthenticated, requireAdminRank('moderator'), (req, res) => {
    const { user_id, sanction_type, reason, duration_days } = req.body;
    const admin = req.user;

    const validTypes = ['ban', 'mute', 'warning'];
    if (!validTypes.includes(sanction_type)) {
        return res.status(400).json({ error: 'Type de sanction invalide' });
    }

    const durationSeconds = duration_days ? duration_days * 86400 : null;
    const expiresAt = durationSeconds ? new Date(Date.now() + durationSeconds * 1000).toISOString() : null;

    db.run(`
        INSERT INTO sanctions (user_id, sanction_type, reason, duration_seconds, issued_by_user_id, expires_at)
        VALUES (?, ?, ?, ?, ?, ?)
    `, [user_id, sanction_type, reason, durationSeconds, admin.id, expiresAt], function(err) {
        if (err) {
            return res.status(500).json({ error: err.message });
        }

        logAdminAction(admin.id, 'sanction_issued', parseInt(user_id), 'sanction', this.lastID, {
            type: sanction_type,
            reason,
            duration_days
        }, req.ip);

        res.json({ 
            id: this.lastID, 
            message: 'Sanction enregistrée',
            user_id,
            sanction_type,
            expires_at: expiresAt
        });
    });
});

// Lever une sanction
router.put('/sanctions/:sanctionId/lift', isAuthenticated, requireAdminRank('admin'), (req, res) => {
    const { sanctionId } = req.params;
    const admin = req.user;

    db.run(`
        UPDATE sanctions 
        SET is_active = 0, lifted_by_user_id = ?, lifted_at = datetime('now')
        WHERE id = ?
    `, [admin.id, sanctionId], function(err) {
        if (err) {
            return res.status(500).json({ error: err.message });
        }

        logAdminAction(admin.id, 'sanction_lifted', null, 'sanction', parseInt(sanctionId), {}, req.ip);

        res.json({ message: 'Sanction levée' });
    });
});

// ============ GESTION DE LA BOUTIQUE ============

// Lister tous les items
router.get('/shop/items', isAuthenticated, requireAdminRank('helper'), (req, res) => {
    db.all(`
        SELECT 
            i.id, i.category_id, i.name, i.description, i.price,
            i.image_url, i.in_stock, i.order_index, i.created_at,
            c.name as category_name
        FROM shop_items i
        JOIN shop_categories c ON i.category_id = c.id
        ORDER BY c.order_index, i.order_index
    `, (err, items) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        res.json(items || []);
    });
});

// Créer un item
router.post('/shop/items', isAuthenticated, requireAdminRank('responsable'), (req, res) => {
    const { category_id, name, description, price, image_url, in_stock, order_index } = req.body;
    const admin = req.user;

    if (!name || !price || !category_id) {
        return res.status(400).json({ error: 'Champs requis: name, price, category_id' });
    }

    db.run(`
        INSERT INTO shop_items (category_id, name, description, price, image_url, in_stock, order_index)
        VALUES (?, ?, ?, ?, ?, ?, ?)
    `, [category_id, name, description, price, image_url, in_stock ? 1 : 0, order_index || 0], 
    function(err) {
        if (err) {
            return res.status(500).json({ error: err.message });
        }

        logAdminAction(admin.id, 'item_created', null, 'item', this.lastID, {
            name, price, category_id
        }, req.ip);

        res.json({ id: this.lastID, name, price, category_id });
    });
});

// Modifier un item
router.put('/shop/items/:itemId', isAuthenticated, requireAdminRank('responsable'), (req, res) => {
    const { itemId } = req.params;
    const { name, description, price, image_url, in_stock, order_index } = req.body;
    const admin = req.user;

    db.run(`
        UPDATE shop_items 
        SET name = ?, description = ?, price = ?, image_url = ?, in_stock = ?, order_index = ?
        WHERE id = ?
    `, [name, description, price, image_url, in_stock ? 1 : 0, order_index, itemId], function(err) {
        if (err) {
            return res.status(500).json({ error: err.message });
        }

        logAdminAction(admin.id, 'item_updated', null, 'item', parseInt(itemId), {
            name, price
        }, req.ip);

        res.json({ message: 'Item mis à jour', itemId });
    });
});

// Supprimer un item
router.delete('/shop/items/:itemId', isAuthenticated, requireAdminRank('responsable'), (req, res) => {
    const { itemId } = req.params;
    const admin = req.user;

    db.run(`DELETE FROM shop_items WHERE id = ?`, [itemId], function(err) {
        if (err) {
            return res.status(500).json({ error: err.message });
        }

        logAdminAction(admin.id, 'item_deleted', null, 'item', parseInt(itemId), {}, req.ip);

        res.json({ message: 'Item supprimé' });
    });
});

// ============ GESTION DES CODES PROMO ============

// Lister tous les codes promo
router.get('/promo-codes', isAuthenticated, requireAdminRank('responsable'), (req, res) => {
    db.all(`
        SELECT * FROM promo_codes
        ORDER BY created_at DESC
    `, (err, codes) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        res.json(codes || []);
    });
});

// Créer un code promo
router.post('/promo-codes', isAuthenticated, requireAdminRank('responsable'), (req, res) => {
    const { code, discount_type, discount_value, max_uses, min_purchase_amount, expiry_date } = req.body;
    const admin = req.user;

    if (!code || !discount_type || !discount_value) {
        return res.status(400).json({ error: 'Champs requis: code, discount_type, discount_value' });
    }

    db.run(`
        INSERT INTO promo_codes 
        (code, discount_type, discount_value, max_uses, min_purchase_amount, expiry_date, created_by_user_id)
        VALUES (?, ?, ?, ?, ?, ?, ?)
    `, [
        code.toUpperCase(),
        discount_type,
        discount_value,
        max_uses || null,
        min_purchase_amount || 0,
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

// Désactiver un code promo
router.put('/promo-codes/:code/disable', isAuthenticated, requireAdminRank('responsable'), (req, res) => {
    const { code } = req.params;
    const admin = req.user;

    db.run(`
        UPDATE promo_codes 
        SET is_active = 0
        WHERE code = ?
    `, [code.toUpperCase()], function(err) {
        if (err) {
            return res.status(500).json({ error: err.message });
        }

        logAdminAction(admin.id, 'promo_code_disabled', null, 'promo_code', 0, {
            code
        }, req.ip);

        res.json({ message: 'Code promo désactivé' });
    });
});

// ============ PARAMÈTRES SERVEUR ============

// Récupérer les paramètres du serveur
router.get('/server-settings', isAuthenticated, requireAdminRank('admin'), (req, res) => {
    db.all(`
        SELECT setting_key, setting_value, setting_type, description
        FROM server_settings
        ORDER BY setting_key
    `, (err, settings) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }

        const settingsObj = {};
        (settings || []).forEach(s => {
            settingsObj[s.setting_key] = {
                value: s.setting_value,
                type: s.setting_type,
                description: s.description
            };
        });

        res.json(settingsObj);
    });
});

// Mettre à jour un paramètre serveur
router.put('/server-settings/:key', isAuthenticated, requireAdminRank('superadmin'), (req, res) => {
    const { key } = req.params;
    const { value } = req.body;
    const admin = req.user;

    db.run(`
        INSERT INTO server_settings (setting_key, setting_value, updated_by_user_id)
        VALUES (?, ?, ?)
        ON CONFLICT(setting_key) DO UPDATE SET 
            setting_value = ?, updated_by_user_id = ?, updated_at = datetime('now')
    `, [key, value, admin.id, value, admin.id], function(err) {
        if (err) {
            return res.status(500).json({ error: err.message });
        }

        logAdminAction(admin.id, 'server_setting_updated', null, 'server_setting', 0, {
            key, value
        }, req.ip);

        res.json({ message: 'Paramètre mis à jour', key, value });
    });
});

// ============ FONCTION AUXILIAIRE ============

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
