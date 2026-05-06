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

// ============ PROFIL UTILISATEUR ============

// Récupérer le profil de l'utilisateur connecté
router.get('/profile/me', isAuthenticated, (req, res) => {
    const userId = req.user.id;

    db.get(`
        SELECT 
            u.id, u.steam_id, u.username, u.avatar_url, u.rank,
            u.playtime_seconds, u.last_seen, u.created_at,
            ps.session_count,
            (SELECT COUNT(*) FROM sanctions WHERE user_id = u.id AND is_active = 1) as active_sanctions
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

// Mettre à jour le profil utilisateur (pseudo, avatar)
router.put('/profile/me', isAuthenticated, (req, res) => {
    const { username, avatar_url } = req.body;
    const userId = req.user.id;

    db.run(`
        UPDATE users 
        SET username = ?, avatar_url = ?, updated_at = datetime('now')
        WHERE id = ?
    `, [username || null, avatar_url || null, userId], function(err) {
        if (err) {
            return res.status(500).json({ error: err.message });
        }

        res.json({ 
            message: 'Profil mis à jour',
            username,
            avatar_url
        });
    });
});

// ============ STATS UTILISATEUR ============

// Récupérer les stats détaillées de l'utilisateur
router.get('/stats/me', isAuthenticated, (req, res) => {
    const userId = req.user.id;

    db.get(`
        SELECT 
            ps.user_id,
            ps.playtime_seconds,
            ps.session_count,
            ps.last_session_start,
            ps.last_session_end,
            (SELECT COUNT(*) FROM shop_orders WHERE user_id = ? AND status = 'completed') as purchases_count,
            (SELECT COUNT(*) FROM sanctions WHERE user_id = ? AND is_active = 1) as active_sanctions_count
        FROM player_stats ps
        WHERE ps.user_id = ?
    `, [userId, userId, userId], (err, stats) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }

        if (!stats) {
            // Créer une entrée si elle n'existe pas
            db.run(`
                INSERT INTO player_stats (user_id, playtime_seconds, session_count)
                VALUES (?, 0, 0)
            `, [userId], (err) => {
                if (!err) {
                    return res.json({
                        user_id: userId,
                        playtime_seconds: 0,
                        session_count: 0,
                        purchases_count: 0,
                        active_sanctions_count: 0
                    });
                }
            });
        } else {
            res.json(stats);
        }
    });
});

// Récupérer les stats formatées pour affichage
router.get('/stats/me/formatted', isAuthenticated, (req, res) => {
    const userId = req.user.id;

    db.get(`
        SELECT 
            ps.playtime_seconds,
            ps.session_count,
            ps.last_session_start,
            ps.last_session_end,
            (SELECT COUNT(*) FROM shop_orders WHERE user_id = ? AND status = 'completed') as purchases_count,
            (SELECT COUNT(*) FROM sanctions WHERE user_id = ? AND is_active = 1) as active_sanctions_count,
            u.created_at as member_since
        FROM player_stats ps
        JOIN users u ON ps.user_id = u.id
        WHERE ps.user_id = ?
    `, [userId, userId, userId], (err, data) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }

        // Formater le temps de jeu
        const hours = Math.floor((data?.playtime_seconds || 0) / 3600);
        const minutes = Math.floor(((data?.playtime_seconds || 0) % 3600) / 60);

        res.json({
            playtime: {
                seconds: data?.playtime_seconds || 0,
                formatted: `${hours}h ${minutes}m`
            },
            sessions: data?.session_count || 0,
            purchases: data?.purchases_count || 0,
            activeSanctions: data?.active_sanctions_count || 0,
            memberSince: data?.member_since || new Date().toISOString(),
            lastSession: {
                start: data?.last_session_start,
                end: data?.last_session_end
            }
        });
    });
});

// ============ SANCTIONS ============

// Récupérer les sanctions de l'utilisateur
router.get('/sanctions/me', isAuthenticated, (req, res) => {
    const userId = req.user.id;

    db.all(`
        SELECT 
            id, sanction_type, reason, duration_seconds, is_active,
            expires_at, created_at,
            (SELECT username FROM users WHERE id = sanctions.issued_by_user_id) as issued_by
        FROM sanctions
        WHERE user_id = ?
        ORDER BY created_at DESC
    `, [userId], (err, sanctions) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }

        const formatted = (sanctions || []).map(s => ({
            id: s.id,
            type: s.sanction_type,
            reason: s.reason,
            isActive: s.is_active,
            issuedBy: s.issued_by || 'Admin',
            issuedAt: s.created_at,
            expiresAt: s.expires_at,
            durationDays: s.duration_seconds ? Math.floor(s.duration_seconds / 86400) : 'Permanent'
        }));

        res.json(formatted);
    });
});

// ============ HISTORIQUE ============

// Récupérer l'historique des commandes avec détails
router.get('/history/purchases', isAuthenticated, (req, res) => {
    const userId = req.user.id;
    const limit = req.query.limit || 20;

    db.all(`
        SELECT 
            o.id, oi.item_id, oi.quantity, o.total_price, o.status,
            i.name as item_name, i.image_url,
            c.name as category_name,
            o.created_at, o.completed_at,
            CASE WHEN o.status = 'completed' THEN 'Complétée'
                 WHEN o.status = 'pending' THEN 'En attente'
                 WHEN o.status = 'failed' THEN 'Échouée'
                 WHEN o.status = 'refunded' THEN 'Remboursée'
                 ELSE o.status END as status_label
        FROM shop_orders o
        JOIN shop_order_items oi ON oi.order_id = o.id
        JOIN shop_items i ON oi.item_id = i.id
        JOIN shop_categories c ON i.category_id = c.id
        WHERE o.user_id = ?
        ORDER BY o.created_at DESC
        LIMIT ?
    `, [userId, limit], (err, rows) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        res.json(rows || []);
    });
});

// ============ ROUTES ADMIN - GESTION UTILISATEURS ============

// Récupérer les infos d'un utilisateur (admin only)
router.get('/admin/users/:userId', isAuthenticated, (req, res) => {
    const { userId } = req.params;
    const admin = req.user;

    // Vérifier permission
    const adminRanks = ['owner', 'superadmin', 'responsable', 'admin', 'moderator'];
    if (!adminRanks.includes(admin.rank)) {
        return res.status(403).json({ error: 'Accès refusé' });
    }

    db.get(`
        SELECT 
            u.id, u.steam_id, u.username, u.avatar_url, u.rank,
            u.playtime_seconds, u.last_seen, u.created_at,
            ps.session_count,
            (SELECT COUNT(*) FROM sanctions WHERE user_id = u.id AND is_active = 1) as active_sanctions,
            (SELECT COUNT(*) FROM shop_orders WHERE user_id = u.id AND status = 'completed') as total_purchases
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

// Lister tous les utilisateurs avec filtres
router.get('/admin/users', isAuthenticated, (req, res) => {
    const admin = req.user;
    const { rank, search, limit = 50, offset = 0 } = req.query;

    const adminRanks = ['owner', 'superadmin', 'responsable', 'admin', 'moderator'];
    if (!adminRanks.includes(admin.rank)) {
        return res.status(403).json({ error: 'Accès refusé' });
    }

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

// Changer le rang d'un utilisateur (Propriétaire/SuperAdmin)
router.put('/admin/users/:userId/rank', isAuthenticated, (req, res) => {
    const { userId } = req.params;
    const { rank } = req.body;
    const admin = req.user;

    const adminRanks = ['owner', 'superadmin'];
    if (!adminRanks.includes(admin.rank)) {
        return res.status(403).json({ error: 'Accès refusé' });
    }

    const validRanks = ['user', 'helper', 'moderator', 'admin', 'responsable', 'superadmin', 'owner'];
    if (!validRanks.includes(rank)) {
        return res.status(400).json({ error: 'Rang invalide' });
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

// Émettre une sanction (Admin+)
router.post('/admin/sanctions', isAuthenticated, (req, res) => {
    const { user_id, sanction_type, reason, duration_days } = req.body;
    const admin = req.user;

    const adminRanks = ['owner', 'superadmin', 'responsable', 'admin', 'moderator'];
    if (!adminRanks.includes(admin.rank)) {
        return res.status(403).json({ error: 'Accès refusé' });
    }

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
router.put('/admin/sanctions/:sanctionId/lift', isAuthenticated, (req, res) => {
    const { sanctionId } = req.params;
    const admin = req.user;

    const adminRanks = ['owner', 'superadmin', 'responsable', 'admin'];
    if (!adminRanks.includes(admin.rank)) {
        return res.status(403).json({ error: 'Accès refusé' });
    }

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

// Fonction auxiliaire
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
