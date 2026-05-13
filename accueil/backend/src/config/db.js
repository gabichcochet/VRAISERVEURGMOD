const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, '../../db.sqlite');

// ✅ Instance SQLite correcte (avec .get, .all, .run)
const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('❌ Erreur connexion SQLite:', err);
    } else {
        console.log('✅ Connecté à la base de données SQLite');

        db.run('PRAGMA foreign_keys = ON'); // 👈 ICI

        initializeDatabase();
    }
});

function initializeDatabase() {
    db.serialize(() => {
        console.log('🚀 Initialisation de la base de données...');

        // ================= USERS =================
        db.run(`
            CREATE TABLE IF NOT EXISTS users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                steam_id TEXT NOT NULL UNIQUE,
                username TEXT,
                avatar_url TEXT,
                rank TEXT DEFAULT 'user',
                playtime_seconds INTEGER DEFAULT 0,
                last_seen TEXT,
                created_at TEXT DEFAULT CURRENT_TIMESTAMP,
                updated_at TEXT DEFAULT CURRENT_TIMESTAMP
            )
        `, (err) => {
            if (err) console.error('❌ Table users:', err);
            else console.log('✅ Table users prête');
        });

        // ================= SHOP CATEGORIES =================
        db.run(`
            CREATE TABLE IF NOT EXISTS shop_categories (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL UNIQUE,
                description TEXT,
                icon TEXT,
                order_index INTEGER,
                created_at TEXT DEFAULT CURRENT_TIMESTAMP
            )
        `);

        // ================= SHOP ITEMS =================
        db.run(`
            CREATE TABLE IF NOT EXISTS shop_items (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                category_id INTEGER NOT NULL,
                name TEXT NOT NULL,
                description TEXT,
                price REAL NOT NULL,
                image_url TEXT,
                in_stock BOOLEAN DEFAULT 1,
                order_index INTEGER,
                created_at TEXT DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (category_id) REFERENCES shop_categories(id) ON DELETE CASCADE
            )
        `);

        // ================= SHOP ORDERS =================
        db.run(`
        CREATE TABLE IF NOT EXISTS shop_orders (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            total_price REAL NOT NULL,
            paypal_order_id TEXT UNIQUE,
            status TEXT DEFAULT 'pending',
            created_at TEXT DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        );
    )
`);
        db.run(`
            CREATE TABLE IF NOT EXISTS shop_order_items (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                order_id INTEGER NOT NULL,
                item_id INTEGER NOT NULL,
                quantity INTEGER DEFAULT 1,
                price REAL,
                FOREIGN KEY (order_id) REFERENCES shop_orders(id) ON DELETE CASCADE,
                FOREIGN KEY (item_id) REFERENCES shop_items(id)
                );
            )
        `);
        // ================= SHOP CART =================
        db.run(`
            CREATE TABLE IF NOT EXISTS shop_cart (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER NOT NULL,
                item_id INTEGER NOT NULL,
                quantity INTEGER DEFAULT 1,
                created_at TEXT DEFAULT CURRENT_TIMESTAMP,
                UNIQUE(user_id, item_id),
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
                FOREIGN KEY (item_id) REFERENCES shop_items(id) ON DELETE CASCADE
            )
        `, (err) => {
            if (err) console.error('❌ shop_cart:', err);
            else console.log('✅ Table shop_cart prête');
        });

        // ================= PROMO CODES =================
        db.run(`
            CREATE TABLE IF NOT EXISTS promo_codes (
                code TEXT PRIMARY KEY,
                discount_type TEXT NOT NULL,
                discount_value REAL NOT NULL,
                max_uses INTEGER,
                current_uses INTEGER DEFAULT 0,
                min_purchase_amount REAL DEFAULT 0,
                expiry_date TEXT,
                is_active BOOLEAN DEFAULT 1,
                created_by_user_id INTEGER,
                created_at TEXT DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (created_by_user_id) REFERENCES users(id)
            )
        `);

        // ================= SANCTIONS =================
        db.run(`
        CREATE TABLE IF NOT EXISTS sanctions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            sanction_type TEXT NOT NULL,
            reason TEXT NOT NULL,
            duration_days INTEGER,
            issued_by_user_id INTEGER NOT NULL,
            is_active INTEGER DEFAULT 1,
            lifted_by_user_id INTEGER,
            lifted_at TEXT,
            created_at TEXT DEFAULT CURRENT_TIMESTAMP,
            expires_at TEXT,
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        )
        `);
        db.run(`
        CREATE TABLE IF NOT EXISTS user_inventory (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            item_id INTEGER NOT NULL,
            quantity INTEGER DEFAULT 1,
            source_order_id INTEGER,
            created_at TEXT DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
            FOREIGN KEY (item_id) REFERENCES shop_items(id),
            FOREIGN KEY (source_order_id) REFERENCES shop_orders(id)
        );`)


        // ================= ADMIN LOGS =================
        db.run(`
            CREATE TABLE IF NOT EXISTS admin_logs (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                admin_user_id INTEGER NOT NULL,
                action TEXT NOT NULL,
                target_user_id INTEGER,
                target_resource_type TEXT,
                target_resource_id INTEGER,
                details TEXT,
                ip_address TEXT,
                created_at TEXT DEFAULT CURRENT_TIMESTAMP
            )
        `);

        // ================= SERVER SETTINGS =================
        db.run(`
            CREATE TABLE IF NOT EXISTS server_settings (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                setting_key TEXT NOT NULL UNIQUE,
                setting_value TEXT NOT NULL,
                setting_type TEXT DEFAULT 'string',
                description TEXT,
                updated_by_user_id INTEGER,
                updated_at TEXT DEFAULT CURRENT_TIMESTAMP
            )
        `);

        // ================= INDEXES =================
        db.run(`CREATE INDEX IF NOT EXISTS idx_shop_orders_user_id ON shop_orders(user_id)`);
        db.run(`CREATE INDEX IF NOT EXISTS idx_users_steam_id ON users(steam_id)`);
        db.run(`CREATE INDEX IF NOT EXISTS idx_users_rank ON users(rank)`);
        db.run(`CREATE INDEX IF NOT EXISTS idx_sanctions_user_id ON sanctions(user_id)`);
        db.run(`CREATE INDEX IF NOT EXISTS idx_sanctions_active ON sanctions(is_active)`);

        console.log('✅ Base de données initialisée');
    });
}

// ================= UTILS =================

// ⚠️ Version SAFE de suppression (NE PAS appeler au boot)
function clearUserPurchases(userId, cb) {
    db.serialize(() => {
        db.run('BEGIN TRANSACTION');

        db.run(
            `DELETE FROM shop_order_items 
             WHERE order_id IN (SELECT id FROM shop_orders WHERE user_id = ?)`,
            [userId],
            (err) => {
                if (err) {
                    db.run('ROLLBACK');
                    return cb?.(err);
                }

                db.run(
                    `DELETE FROM shop_orders WHERE user_id = ?`,
                    [userId],
                    (err2) => {
                        if (err2) {
                            db.run('ROLLBACK');
                            return cb?.(err2);
                        }

                        db.run('COMMIT', cb);
                    }
                );
            }
        );
    });
}
module.exports = db;