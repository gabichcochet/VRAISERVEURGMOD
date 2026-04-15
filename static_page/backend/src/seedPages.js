require('dotenv').config();
const { upsertPage } = require('./models/pageModel');

async function run() {
  await upsertPage('rules', 'Règlement du serveur', `# Règlement\n\n- Respect\n- Pas de triche\n- ...`);
  await upsertPage('legal', 'Mentions légales', `# Mentions légales\n\nÉditeur : ...\nHébergeur : ...`);
  await upsertPage('privacy', 'Politique de confidentialité', `# Confidentialité\n\nNous collectons : SteamID, pseudo...\n`);

  console.log('✅ Pages initialisées');
  process.exit(0);
}

run().catch(err => {
  console.error(err);
  process.exit(1);
});