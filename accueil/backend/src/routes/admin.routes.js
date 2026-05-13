const express = require('express');
const router = express.Router();
const db = require('../config/db');

/* =========================
   RANK SYSTEM
========================= */

const RANKS = Object.freeze({
    user: 0,
    helper: 1,
    moderator: 2,
    admin: 3,
    responsable: 4,
    superadmin: 5,
    owner: 6
});

/* =========================
   MIDDLEWARE AUTH
========================= */

const isAuthenticated = (req, res, next) => {
    if (req.isAuthenticated()) return next();
    return res.status(401).json({ error: 'Non authentifié' });
};

/* =========================
   MIDDLEWARE RANK
========================= */

const requireRank = (minRank) => {
    return (req, res, next) => {
        if (!req.user || !RANKS.hasOwnProperty(req.user.rank)) {
            return res.status(403).json({ error: 'Rang invalide' });
        }

        const userLevel = RANKS[req.user.rank];
        const requiredLevel = RANKS[minRank];

        if (userLevel < requiredLevel) {
            return res.status(403).json({
                error: `Accès refusé - Rang requis: ${minRank}`
            });
        }

        next();
    };
};

/* =========================
   DASHBOARD
========================= */

router.get('/dashboard/stats', isAuthenticated, requireRank('helper'), (req, res) => {
    const admin = req.user;

    Promise.all([
        new Promise((resolve) => {
            db.get('SELECT COUNT(*) as total FROM users', (err, row) => {
                resolve(err ? 0 : row?.total || 0);
            });
        }),
        new Promise((resolve) => {
            db.get('SELECT COUNT(*) as total FROM shop_orders WHERE status="completed"', (err, row) => {
                resolve(err ? 0 : row?.total || 0);
            });
        }),
        new Promise((resolve) => {
            db.get('SELECT SUM(total_price) as revenue FROM shop_orders WHERE status="completed"', (err, row) => {
                resolve(err ? 0 : row?.revenue || 0);
            });
        }),
        new Promise((resolve) => {
            db.get('SELECT COUNT(*) as total FROM sanctions WHERE is_active=1', (err, row) => {
                resolve(err ? 0 : row?.total || 0);
            });
        })
    ]).then(([totalUsers, totalOrders, totalRevenue, activeSanctions]) => {
        res.json({
            totalUsers,
            totalOrders,
            totalRevenue: parseFloat(totalRevenue || 0).toFixed(2),
            activeSanctions,
            adminRank: admin.rank
        });
    });
});

/* =========================
   USERS
========================= */

router.get('/users', isAuthenticated, requireRank('moderator'), (req, res) => {
    const { search, limit = 50, offset = 0 } = req.query;

    let query = `
        SELECT u.*,
        (SELECT COUNT(*) FROM sanctions WHERE user_id=u.id AND is_active=1) as active_sanctions
        FROM users u
        WHERE 1=1
    `;

    const params = [];

    if (search) {
        query += ` AND (username LIKE ? OR steam_id LIKE ?)`;
        params.push(`%${search}%`, `%${search}%`);
    }

    query += ` ORDER BY created_at DESC LIMIT ? OFFSET ?`;
    params.push(limit, offset);

    db.all(query, params, (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

/* =========================
   CHANGE RANK (IMPORTANT FIX)
========================= */

router.put('/users/:userId/rank', isAuthenticated, requireRank('admin'), (req, res) => {
    const { userId } = req.params;
    const { rank } = req.body;
    const admin = req.user;

    if (!RANKS.hasOwnProperty(rank)) {
        return res.status(400).json({ error: 'Rang invalide' });
    }

    // OWNER bypass total
    if (admin.rank !== 'owner') {
        if (RANKS[rank] >= RANKS[admin.rank]) {
            return res.status(403).json({
                error: 'Impossible de donner un rang égal ou supérieur au tien'
            });
        }
    }

    db.run(
        `UPDATE users SET rank=?, updated_at=datetime('now') WHERE id=?`,
        [rank, userId],
        function (err) {
            if (err) return res.status(500).json({ error: err.message });

            logAdminAction(
                admin.id,
                'user_rank_changed',
                userId,
                'user',
                userId,
                { new_rank: rank },
                req.ip
            );

            res.json({ message: 'Rang mis à jour' });
        }
    );
});

/* =========================
   SANCTIONS
========================= */

router.post('/sanctions', isAuthenticated, requireRank('moderator'), (req, res) => {
    const { user_id, sanction_type, reason, duration_days } = req.body;
    const admin = req.user;

    const valid = ['ban', 'mute', 'warning'];
    if (!valid.includes(sanction_type)) {
        return res.status(400).json({ error: 'Type invalide' });
    }

    const days = Number.isFinite(parseInt(duration_days))
    ? parseInt(duration_days)
    : null;

    const expires_at = days
        ? new Date(Date.now() + days * 86400000).toISOString()
        : null;

    // 1️⃣ cleanup expirées
    db.run(`
        UPDATE sanctions
        SET is_active = 0
        WHERE is_active = 1
        AND expires_at IS NOT NULL
        AND expires_at < datetime('now')
    `, [], (err) => {
        if (err) return res.status(500).json({ error: err.message });

        // 2️⃣ insert sanction
        db.run(
            `INSERT INTO sanctions 
            (user_id, sanction_type, reason, duration_days, expires_at, is_active, issued_by_user_id)
            VALUES (?, ?, ?, ?, ?, 1, ?)`,
            [user_id, sanction_type, reason, days, expires_at, admin.id],
            function (err) {
                if (err) return res.status(500).json({ error: err.message });

                logAdminAction(
                    admin.id,
                    'sanction_issued',
                    user_id,
                    'sanction',
                    this.lastID,
                    {},
                    req.ip
                );

                res.json({ message: 'Sanction ajoutée' });
            }
        );
    });
});

/* =========================
   SHOP (exemple clean)
========================= */

router.get('/shop/items', isAuthenticated, requireRank('helper'), (req, res) => {
    db.all(`SELECT * FROM shop_items`, (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

/* =========================
   LOG FUNCTION
========================= */

function logAdminAction(adminId, action, targetUserId, type, resourceId, details, ip) {
    db.run(
        `INSERT INTO admin_logs 
        (admin_user_id, action, target_user_id, target_resource_type, target_resource_id, details, ip_address)
        VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
            adminId,
            action,
            targetUserId,
            type,
            resourceId,
            JSON.stringify(details),
            ip
        ]
    );
}

router.get('/sanctions', isAuthenticated, requireRank('moderator'), (req, res) => {
    db.all(`
        SELECT 
            s.*,
            u.username as target_user,
            issuer.username as issued_by,
            CASE
                WHEN s.is_active = 0 THEN 'lifted'
                WHEN s.expires_at IS NOT NULL AND s.expires_at < datetime('now') THEN 'expired'
                ELSE 'active'
            END as computed_status
        FROM sanctions s
        JOIN users u ON u.id = s.user_id
        JOIN users issuer ON issuer.id = s.issued_by_user_id
        ORDER BY s.created_at DESC
    `, (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});



router.put('/sanctions/:id/lift', isAuthenticated, requireRank('moderator'), (req, res) => {
    const sanctionId = req.params.id;
    const admin = req.user;

    db.run(
        `UPDATE sanctions 
         SET is_active = 0,
             lifted_by_user_id = ?,
             lifted_at = datetime('now')
         WHERE id = ?`,
        [admin.id, sanctionId],
        function (err) {
            if (err) return res.status(500).json({ error: err.message });

            logAdminAction(
                admin.id,
                'sanction_lifted',
                null,
                'sanction',
                sanctionId,
                {},
                req.ip
            );

            res.json({ message: 'Sanction levée' });
        }
    );
});


/* =========================
   PROMO CODES LIST
========================= */

router.get('/promo-codes', isAuthenticated, requireRank('helper'), (req, res) => {
    db.all(`
        SELECT *
        FROM promo_codes
        ORDER BY created_at DESC
    `, (err, rows) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }

        res.json(rows);
    });
});

router.post('/promo-codes', isAuthenticated, requireRank('admin'), (req, res) => {
    const admin = req.user;

    const {
        code,
        discount_type,
        discount_value,
        max_uses,
        min_purchase_amount,
        expiry_date
    } = req.body;

    if (!code || !discount_type || !discount_value) {
        return res.status(400).json({
            error: 'Champs manquants'
        });
    }

    const validTypes = ['percentage', 'fixed'];

    if (!validTypes.includes(discount_type)) {
        return res.status(400).json({
            error: 'Type invalide'
        });
    }

    db.run(`
        INSERT INTO promo_codes (
            code,
            discount_type,
            discount_value,
            max_uses,
            min_purchase_amount,
            expiry_date,
            created_by_user_id
        )
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
            return res.status(500).json({
                error: err.message
            });
        }

        logAdminAction(
            admin.id,
            'promo_created',
            null,
            'promo_code',
            code,
            {},
            req.ip
        );

        res.json({
            message: 'Code promo créé'
        });
    });
});

router.delete('/promo-codes/:code', isAuthenticated, requireRank('admin'), (req, res) => {
    const { code } = req.params;

    db.run(`
        DELETE FROM promo_codes
        WHERE code = ?
    `, [code.toUpperCase()], function(err) {

        if (err) {
            return res.status(500).json({
                error: err.message
            });
        }

        if (this.changes === 0) {
            return res.status(404).json({
                error: 'Code introuvable'
            });
        }
        res.json({
            message: 'Code promo supprimé'
        });
    });
});

router.delete('/items/:itemId', isAuthenticated, requireRank('responsable'), (req, res) => {
    const { itemId } = req.params;
    const admin = req.user;

    const adminRanks = ['owner', 'superadmin', 'responsable'];
    if (!adminRanks.includes(admin.rank)) {
        return res.status(403).json({ error: 'Accès refusé' });
    }

    db.run(
        `DELETE FROM shop_items WHERE id = ?`,
        [itemId],
        function (err) {
            if (err) {
                return res.status(500).json({ error: err.message });
            }

            if (this.changes === 0) {
                return res.status(404).json({ error: 'Item introuvable' });
            }

            res.json({ message: 'Item supprimé' });
        }
    );
});

router.post('/promo-codes/validate', isAuthenticated, (req, res) => {

    const { code, parsedTotal } = req.body;

    const total = parseFloat(parsedTotal);

    if (!Number.isFinite(total) || total < 0) {
        return res.status(400).json({
            error: 'Montant invalide'
        });
    }

    if (!code) {
        return res.status(400).json({
            error: 'Code requis'
        });
    }

    db.get(`
        SELECT *
        FROM promo_codes
        WHERE code = ?
        AND is_active = 1
    `, [code.toUpperCase()], (err, promo) => {

        if (err) {
            return res.status(500).json({ error: err.message });
        }

        if (!promo) {
            return res.status(404).json({ error: 'Code invalide' });
        }

        if (promo.expiry_date && new Date(promo.expiry_date) < new Date()) {
            return res.status(400).json({ error: 'Code expiré' });
        }

        if (
            promo.max_uses !== null &&
            promo.current_uses >= promo.max_uses
        ) {
            return res.status(400).json({ error: 'Code épuisé' });
        }

        if (total < promo.min_purchase_amount) {
            return res.status(400).json({
                error: `Minimum requis: ${promo.min_purchase_amount}€`
            });
        }

        let discount = 0;

        if (promo.discount_type === 'percentage') {
            discount = total * (promo.discount_value / 100);
        } else {
            discount = promo.discount_value;
        }

        discount = Math.min(discount, total);

        const finalTotal = Math.max(total - discount, 0);

        res.json({
            valid: true,
            code: promo.code,
            discount,
            finalTotal
        });
    });
});


module.exports = router;