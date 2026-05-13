const db = require('./src/config/db');

console.log('🚀 Démarrage du nettoyage des sanctions levées...');

db.serialize(() => {
    // Compter d'abord pour le rapport
    db.get('SELECT COUNT(*) as count FROM sanctions WHERE is_active = 0', (err, row) => {
        if (err) {
            console.error('❌ Erreur lors du comptage:', err.message);
            return;
        }

        const count = row.count;

        if (count === 0) {
            console.log('✨ Aucune sanction levée à supprimer.');
            return;
        }

        // Supprimer les sanctions
        db.run('DELETE FROM sanctions WHERE is_active = 0', function(err) {
            if (err) {
                console.error('❌ Erreur lors de la suppression:', err.message);
            } else {
                console.log(`✅ Nettoyage terminé : ${count} sanction(s) archivée(s) ont été supprimées de la base de données.`);
            }
        });
    });
});
