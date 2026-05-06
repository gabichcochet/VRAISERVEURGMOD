const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, 'db.sqlite');

const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('❌ Erreur connexion DB:', err);
        process.exit(1);
    }

    console.log('✅ Connecté à la base de données');

    // Ajouter des données de test
    const categories = [
        { name: 'Armes', description: 'Armes et équipements de combat', icon: '🔫' },
        { name: 'Véhicules', description: 'Véhicules terrestres et aériens', icon: '🚗' },
        { name: 'Cosmétiques', description: 'Skins et apparences personnalisées', icon: '🎨' }
    ];

    const items = [
        { category_id: 1, name: 'AK-47 Gold', description: 'Arme légendaire avec finition dorée', price: 29.99, image_url: null, in_stock: 1 },
        { category_id: 1, name: 'Sniper Elite', description: 'Fusil de précision haute performance', price: 49.99, image_url: null, in_stock: 1 },
        { category_id: 2, name: 'Lamborghini Diablo', description: 'Voiture de sport italienne', price: 99.99, image_url: null, in_stock: 1 },
        { category_id: 2, name: 'Hélicoptère Apache', description: 'Véhicule aérien militaire', price: 149.99, image_url: null, in_stock: 1 },
        { category_id: 3, name: 'Skin Dragon Rouge', description: 'Apparence épique avec effets de feu', price: 19.99, image_url: null, in_stock: 1 },
        { category_id: 3, name: 'Pack VIP Premium', description: 'Pack complet avec tous les cosmétiques', price: 79.99, image_url: null, in_stock: 1 }
    ];

    // Insérer les catégories
    let catIndex = 0;
    categories.forEach(cat => {
        db.run(
            'INSERT OR IGNORE INTO shop_categories (name, description, icon, order_index) VALUES (?, ?, ?, ?)',
            [cat.name, cat.description, cat.icon, catIndex + 1],
            function(err) {
                if (err) {
                    console.error('❌ Erreur insertion catégorie:', err);
                } else {
                    console.log(`✅ Catégorie ajoutée: ${cat.name}`);
                }
                catIndex++;
                if (catIndex === categories.length) {
                    insertItems();
                }
            }
        );
    });

    function insertItems() {
        let itemIndex = 0;
        items.forEach(item => {
            db.run(
                'INSERT OR IGNORE INTO shop_items (category_id, name, description, price, image_url, in_stock, order_index) VALUES (?, ?, ?, ?, ?, ?, ?)',
                [item.category_id, item.name, item.description, item.price, item.image_url, item.in_stock, itemIndex + 1],
                function(err) {
                    if (err) {
                        console.error('❌ Erreur insertion item:', err);
                    } else {
                        console.log(`✅ Item ajouté: ${item.name} - ${item.price}€`);
                    }
                    itemIndex++;
                    if (itemIndex === items.length) {
                        console.log('\n🎉 Données de test ajoutées avec succès!');
                        console.log('Vous pouvez maintenant tester la boutique et le paiement.');
                        db.close();
                        process.exit(0);
                    }
                }
            );
        });
    }
});
