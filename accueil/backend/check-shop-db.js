const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('db.sqlite', sqlite3.OPEN_READONLY, (err) => {
  if (err) {
    console.error('DB open error:', err);
    process.exit(1);
  }
});

function query(sql, cb) {
  db.all(sql, (err, rows) => {
    if (err) {
      console.error('Query error:', err);
      process.exit(1);
    }
    cb(rows);
  });
}

query('SELECT id, name, category_id, price, in_stock FROM shop_items', (items) => {
  console.log('ITEMS:', JSON.stringify(items, null, 2));
  query('SELECT id, name, description, icon, order_index FROM shop_categories', (cats) => {
    console.log('CATEGORIES:', JSON.stringify(cats, null, 2));
    db.close();
  });
});
