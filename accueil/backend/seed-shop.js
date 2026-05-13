const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, 'db.sqlite');

const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('❌ Erreur connexion DB:', err);
        process.exit(1);
    }

    console.log('✅ Connecté à la base de données');

    // Configuration des catégories Jujutsu Kaisen
    const categories = [
        { name: 'Grades & VIP', description: 'Améliorez votre statut sur le serveur', icon: '👑' },
        { name: 'Techniques Maudites', description: 'Maîtrisez l\'énergie occulte', icon: '✨' },
        { name: 'Objets Maudits', description: 'Reliques et armes de puissance', icon: '🗡️' },
        { name: 'Cosmétiques', description: 'Apparences et effets visuels', icon: '🎭' }
    ];

    const items = [
        // Grades
        { category_id: 1, name: 'VIP Premium', description: 'Accès exclusif, salaire augmenté et slot réservé.', price: 19.99, image_url: null, in_stock: 1 },
        { category_id: 1, name: 'Grade: Exorciste Classe S', description: 'Le rang le plus élevé pour les exorcistes d\'élite.', price: 49.99, image_url: null, in_stock: 1 },

        // Techniques
        { category_id: 2, name: 'Technique: Pourpre (Hollow Purple)', description: 'Fusion de l\'Infini et du Néant. Dégâts colossaux.', price: 34.99, image_url: null, in_stock: 1 },
        { category_id: 2, name: 'Extension du Territoire', description: 'Capacité à déployer votre propre domaine occulte.', price: 24.99, image_url: null, in_stock: 1 },
        { category_id: 2, name: 'Rayon Noir (Black Flash)', description: 'Augmente drastiquement vos chances de coups critiques.', price: 14.99, image_url: null, in_stock: 1 },

        // Objets
        { category_id: 3, name: 'Doigt de Sukuna', description: 'Objet maudit de classe spéciale. Augmente l\'énergie occulte.', price: 9.99, image_url: null, in_stock: 1 },
        { category_id: 3, name: 'Katana Inversé (Toji)', description: 'Arme capable de neutraliser les techniques maudites.', price: 29.99, image_url: null, in_stock: 1 },
        { category_id: 3, name: 'Lisière du Supplice (Prison Realm)', description: 'Relique capable de sceller n\'importe quel joueur.', price: 59.99, image_url: null, in_stock: 1 },

        // Cosmétiques
        { category_id: 4, name: 'Aura de l\'Infini', description: 'Effet visuel de distorsion autour de votre personnage.', price: 7.99, image_url: null, in_stock: 1 },
        { category_id: 4, name: 'Skin: Sukuna (Forme Originelle)', description: 'Apparence exclusive du Roi des Fléaux.', price: 15.99, image_url: null, in_stock: 1 }
    ];

    db.serialize(() => {
        // Nettoyer les anciennes données pour éviter les doublons ou conflits lors du test
        db.run('DELETE FROM shop_items');
        db.run('DELETE FROM shop_categories');

        // Réinitialiser les auto-incréments
        db.run('DELETE FROM sqlite_sequence WHERE name="shop_items"');
        db.run('DELETE FROM sqlite_sequence WHERE name="shop_categories"');

        console.log('🧹 Anciennes données supprimées.');

        // Insérer les catégories
        const insertCategory = db.prepare('INSERT INTO shop_categories (name, description, icon, order_index) VALUES (?, ?, ?, ?)');
        categories.forEach((cat, i) => {
            insertCategory.run(cat.name, cat.description, cat.icon, i + 1);
        });
        insertCategory.finalize();
        console.log('✅ Catégories Jujutsu Kaisen ajoutées.');

        // Insérer les items
        const insertItem = db.prepare('INSERT INTO shop_items (category_id, name, description, price, image_url, in_stock, order_index) VALUES (?, ?, ?, ?, ?, ?, ?)');
        items.forEach((item, i) => {
            insertItem.run(item.category_id, item.name, item.description, item.price, item.image_url, item.in_stock, i + 1);
        });
        insertItem.finalize();
        console.log('✅ Articles Jujutsu Kaisen ajoutés.');

        console.log('\n🎉 Boutique mise à jour avec l\'univers Jujutsu Kaisen !');
        db.close();
    });
});
