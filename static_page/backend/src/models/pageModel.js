const db = require('../config/db');

function getPageByKey(pageKey) {
  return new Promise((resolve, reject) => {
    db.get(
      'SELECT page_key, title, content, updated_at FROM site_pages WHERE page_key = ?',
      [pageKey],
      (err, row) => {
        if (err) return reject(err);
        resolve(row || null);
      }
    );
  });
}

function upsertPage(pageKey, title, content) {
  return new Promise((resolve, reject) => {
    db.run(
      `
      INSERT INTO site_pages (page_key, title, content)
      VALUES (?, ?, ?)
      ON CONFLICT(page_key) DO UPDATE SET
        title = excluded.title,
        content = excluded.content,
        updated_at = CURRENT_TIMESTAMP
      `,
      [pageKey, title, content],
      function (err) {
        if (err) return reject(err);
        resolve(true);
      }
    );
  });
}

module.exports = { getPageByKey, upsertPage };