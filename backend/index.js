const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const sqlite3 = require('sqlite3').verbose();
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const path = require('path');

const app = express();
const db = new sqlite3.Database(process.env.DATABASE_URL || './database.sqlite');

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '../frontend/build')));

const SECRET = process.env.JWT_SECRET || 'ksar_secret_2026';

// Création des tables
db.serialize(() => {
  db.run("CREATE TABLE IF NOT EXISTS users (id INTEGER PRIMARY KEY AUTOINCREMENT, email TEXT UNIQUE, password TEXT, role TEXT, isPremium INTEGER DEFAULT 0)");
});

// --- ROUTES AUTH ---
app.post('/api/auth/register', async (req, res) => {
  const { email, password } = req.body;
  const hash = await bcrypt.hash(password, 10);
  db.run("INSERT INTO users (email, password, role) VALUES (?, ?, 'user')", [email, hash], function(err) {
    if (err) return res.status(400).json({ message: "Email déjà utilisé" });
    const token = jwt.sign({ id: this.lastID, role: 'user' }, SECRET);
    res.json({ token });
  });
});

app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;
  db.get("SELECT * FROM users WHERE email = ?", [email], async (err, user) => {
    if (user && await bcrypt.compare(password, user.password)) {
      const token = jwt.sign({ id: user.id, role: user.role }, SECRET);
      res.json({ token });
    } else {
      res.status(400).json({ message: "Identifiants incorrects" });
    }
  });
});

app.get('/api/auth/me', (req, res) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ message: "Non connecté" });
  jwt.verify(token, SECRET, (err, decoded) => {
    if (err) return res.status(401).json({ message: "Session expirée" });
    db.get("SELECT id, email, role, isPremium FROM users WHERE id = ?", [decoded.id], (err, user) => {
      res.json(user);
    });
  });
});

// --- ROUTE PAIEMENT STRIPE ---
app.post('/api/checkout', async (req, res) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).send();

  const session = await stripe.checkout.sessions.create({
    payment_method_types: ['card'],
    line_items: [{
      price_data: {
        currency: 'eur',
        product_data: { name: 'Accès Premium Ksar El Boukhari' },
        unit_amount: 2000, // 20.00€
      },
      quantity: 1,
    }],
    mode: 'payment',
    success_url: `${process.env.FRONTEND_URL}/?payment=success`,
    cancel_url: `${process.env.FRONTEND_URL}/?payment=cancel`,
  });
  res.json({ url: session.url });
});

// Stats Admin
app.get('/api/admin/stats', (req, res) => {
  db.get("SELECT COUNT(*) as users, (SELECT COUNT(*) FROM users WHERE role='admin') as admins FROM users", (err, row) => {
    res.json(row);
  });
});

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/build', 'index.html'));
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => console.log(`🚀 Serveur prêt sur le port ${PORT}`));