const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const app = express();

// Utilise le disque Render si présent, sinon un fichier local
const dbPath = process.env.DATABASE_URL || path.join(__dirname, 'database.sqlite');
const db = new sqlite3.Database(dbPath);

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '../frontend/build')));

const SECRET = process.env.JWT_SECRET || 'ksar_secret_2026';

db.serialize(() => {
  db.run("CREATE TABLE IF NOT EXISTS users (id INTEGER PRIMARY KEY AUTOINCREMENT, email TEXT UNIQUE, password TEXT, role TEXT, isPremium INTEGER DEFAULT 0)");
});

// --- ROUTES ---
app.post('/api/auth/register', async (req, res) => {
  const { email, password } = req.body;
  try {
    const hash = await bcrypt.hash(password, 10);
    db.run("INSERT INTO users (email, password, role) VALUES (?, ?, 'user')", [email, hash], function(err) {
      if (err) return res.status(400).json({ message: "Email déjà utilisé" });
      const token = jwt.sign({ id: this.lastID, role: 'user' }, SECRET);
      res.json({ token });
    });
  } catch (e) { res.status(500).send(); }
});

app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;
  db.get("SELECT * FROM users WHERE email = ?", [email], async (err, user) => {
    if (user && await bcrypt.compare(password, user.password)) {
      const token = jwt.sign({ id: user.id, role: user.role }, SECRET);
      res.json({ token });
    } else { res.status(400).json({ message: "Identifiants incorrects" }); }
  });
});

app.get('/api/auth/me', (req, res) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).send();
  jwt.verify(token, SECRET, (err, decoded) => {
    if (err) return res.status(401).send();
    db.get("SELECT id, email, role, isPremium FROM users WHERE id = ?", [decoded.id], (err, user) => {
      res.json(user);
    });
  });
});

app.post('/api/checkout', async (req, res) => {
  try {
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [{
        price_data: { currency: 'eur', product_data: { name: 'SaaS Premium' }, unit_amount: 2000 },
        quantity: 1,
      }],
      mode: 'payment',
      success_url: `${req.headers.origin}/?payment=success`,
      cancel_url: `${req.headers.origin}/?payment=cancel`,
    });
    res.json({ url: session.url });
  } catch (e) { res.status(500).json({ message: e.message }); }
});

app.get('/api/admin/stats', (req, res) => {
  db.get("SELECT (SELECT COUNT(*) FROM users) as users, (SELECT COUNT(*) FROM users WHERE role='admin') as admins", (err, row) => {
    res.json(row || { users: 0, admins: 0 });
  });
});

app.get('*', (req, res) => { res.sendFile(path.join(__dirname, '../frontend/build', 'index.html')); });

app.listen(process.env.PORT || 10000, '0.0.0.0');