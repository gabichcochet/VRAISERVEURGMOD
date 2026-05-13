const db = require('./src/config/db');

const userId = 2;

db.serialize(() => {
    db.run("DELETE FROM shop_order_items WHERE order_id IN (SELECT id FROM shop_orders WHERE user_id = ?)", [userId]);
    db.run("DELETE FROM shop_orders WHERE user_id = ?", [userId]);

    db.all("SELECT * FROM shop_orders WHERE user_id = ?", [userId], (err, rows) => {
        console.log("ORDERS AFTER WIPE:", rows);
    });

    db.all("SELECT * FROM shop_order_items", [], (err, rows) => {
        console.log("ITEMS AFTER WIPE:", rows);
    });
});