const express = require('express');
const app = express();

const db = require('./src/config/db');

const userId = 2;

console.log("=== SHOP ORDERS ===");

db.all(
  "SELECT * FROM shop_orders WHERE user_id = ?",
  [userId],
  (err, rows) => {
    if (err) return console.error(err);
    console.log(rows);
  }
);

console.log("=== SHOP ORDER ITEMS ===");

db.all(
  `SELECT * FROM shop_order_items WHERE order_id IN (
    SELECT id FROM shop_orders WHERE user_id = ?
  )`,
  [userId],
  (err, rows) => {
    if (err) return console.error(err);
    console.log(rows);
  }
);

app.use((req, res, next) => {
    console.log('REQ:', req.method, req.url);
    next();
});