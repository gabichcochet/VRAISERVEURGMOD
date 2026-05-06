const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, 'db.sqlite');

const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('❌ Erreur connexion DB:', err);
        process.exit(1);
    }

    console.log('✅ Connecté à la base de données');

    // Vérifier les tables nécessaires
    const tables = [
        'shop_categories',
        'shop_items',
        'shop_orders',
        'shop_order_items',
        'promo_codes'
    ];

    let checked = 0;
    tables.forEach(table => {
        db.get(`SELECT name FROM sqlite_master WHERE type='table' AND name='${table}'`, (err, row) => {
            if (err) {
                console.error(`❌ Erreur vérification table ${table}:`, err);
            } else if (row) {
                console.log(`✅ Table ${table} existe`);
            } else {
                console.log(`❌ Table ${table} manquante`);
            }
            checked++;
            if (checked === tables.length) {
                console.log('\n📋 Vérification terminée');
                db.close();
                process.exit(0);
            }
        });
    });
});
