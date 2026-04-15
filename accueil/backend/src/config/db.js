const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, '../../db.sqlite');

const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('Erreur de connexion à la base de données:', err);
    } else {
        console.log('Connecté à la base de données SQLite');
        initializeDatabase();
    }
});

function initializeDatabase() {
    db.serialize(() => {
        console.log('Initialisation de la base de données...');
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
            if (err) console.error('Erreur création table users:', err);
            else console.log('Table users prête');
        });

        // Table catégories de boutique
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

        // Table articles de boutique
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

        // Table commandes
        db.run(`
            CREATE TABLE IF NOT EXISTS shop_orders (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER NOT NULL,
                item_id INTEGER NOT NULL,
                quantity INTEGER DEFAULT 1,
                total_price REAL NOT NULL,
                stripe_payment_intent_id TEXT UNIQUE,
                promo_code_used TEXT,
                status TEXT DEFAULT 'pending',
                created_at TEXT DEFAULT CURRENT_TIMESTAMP,
                completed_at TEXT,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
                FOREIGN KEY (item_id) REFERENCES shop_items(id) ON DELETE CASCADE
            )
        `);

        // Table codes promo
        db.run(`
            CREATE TABLE IF NOT EXISTS promo_codes (
                code TEXT PRIMARY KEY,
                discount_type TEXT NOT NULL,
                discount_value REAL NOT NULL,
                max_uses INTEGER,
                current_uses INTEGER DEFAULT 0,
                min_purchase_amount REAL DEFAULT 0,
                applicable_categories TEXT,
                expiry_date TEXT,
                is_active BOOLEAN DEFAULT 1,
                created_by_user_id INTEGER,
                created_at TEXT DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (created_by_user_id) REFERENCES users(id)
            )
        `);

        // Table stats des joueurs
        db.run(`
            CREATE TABLE IF NOT EXISTS player_stats (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER NOT NULL UNIQUE,
                playtime_seconds INTEGER DEFAULT 0,
                session_count INTEGER DEFAULT 0,
                last_session_start TEXT,
                last_session_end TEXT,
                updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
            )
        `);

        // Table sanctions
        db.run(`
            CREATE TABLE IF NOT EXISTS sanctions (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER NOT NULL,
                sanction_type TEXT NOT NULL,
                reason TEXT NOT NULL,
                duration_seconds INTEGER,
                issued_by_user_id INTEGER NOT NULL,
                is_active BOOLEAN DEFAULT 1,
                lifted_by_user_id INTEGER,
                lifted_at TEXT,
                created_at TEXT DEFAULT CURRENT_TIMESTAMP,
                expires_at TEXT,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
                FOREIGN KEY (issued_by_user_id) REFERENCES users(id),
                FOREIGN KEY (lifted_by_user_id) REFERENCES users(id)
            )
        `);

        // Table logs admin
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
                created_at TEXT DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (admin_user_id) REFERENCES users(id),
                FOREIGN KEY (target_user_id) REFERENCES users(id)
            )
        `);

        // Table paramètres serveur
        db.run(`
            CREATE TABLE IF NOT EXISTS server_settings (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                setting_key TEXT NOT NULL UNIQUE,
                setting_value TEXT NOT NULL,
                setting_type TEXT DEFAULT 'string',
                description TEXT,
                updated_by_user_id INTEGER,
                updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (updated_by_user_id) REFERENCES users(id)
            )
        `);

        // Créer les indexes
        db.run(`CREATE INDEX IF NOT EXISTS idx_users_steam_id ON users(steam_id)`);
        db.run(`CREATE INDEX IF NOT EXISTS idx_users_rank ON users(rank)`);
        db.run(`CREATE INDEX IF NOT EXISTS idx_shop_orders_user_id ON shop_orders(user_id)`);
        db.run(`CREATE INDEX IF NOT EXISTS idx_shop_orders_status ON shop_orders(status)`);
        db.run(`CREATE INDEX IF NOT EXISTS idx_sanctions_user_id ON sanctions(user_id)`);
        db.run(`CREATE INDEX IF NOT EXISTS idx_sanctions_active ON sanctions(is_active)`);
    });
}

module.exports = db;