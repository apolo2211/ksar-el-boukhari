const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs'); // ✅ Nécessaire pour créer le dossier du disque

// Initialisation de Stripe avec la clé d'environnement
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

const app = express();

// --- CONFIGURATION DE LA BASE DE DONNÉES ---
const dbPath = process.env.DATABASE_URL || './database.sqlite';

// ✅ Correction pour l'erreur SQLITE_CANTOPEN : crée le dossier si nécessaire
if (dbPath.includes('/var/lib/data')) {
    const dir = '/var/lib/data';
    if (!fs.existsSync(dir)){
        fs.mkdirSync(dir, { recursive: true });
        console.log("📁 Dossier de base de données créé sur le disque Render");
    }
}

const db = new sqlite3.Database(dbPath);

app.use(cors());
app.use(express.json());

// Servir les fichiers statiques du Frontend (React)
app.use(express.static(path.join(__dirname, '../frontend/build')));

const SECRET = process.env.JWT_SECRET || 'ksar_secret_2026';

// Initialisation des tables
db.serialize(() => {
  db.run("CREATE TABLE IF NOT EXISTS users (id INTEGER PRIMARY KEY AUTOINCREMENT, email TEXT UNIQUE, password TEXT, role TEXT, isPremium INTEGER DEFAULT 0)");
});

// --- ROUTES AUTHENTIFICATION ---

// Inscription
app.post('/api/auth/register', async (req, res) => {
  const { email, password } = req.body;
  try {
    const hash = await bcrypt.hash(password, 10);
    db.run("INSERT INTO users (email, password, role) VALUES (?, ?, 'user')", [email, hash], function(err) {
      if (err) return res.status(400).json({ message: "Email déjà utilisé" });
      const token = jwt.sign({ id: this.lastID, role: 'user' }, SECRET);
      res.json({ token });
    });
  } catch (e) { res.status(500).json({ message: "Erreur serveur" }); }
});

// Connexion
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

// Profil (Récupérer les infos de l'utilisateur connecté)
app.get('/api/auth/me', (req, res) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ message: "Non autorisé" });
  jwt.verify(token, SECRET, (err, decoded) => {
    if (err) return res.status(401).json({ message: "Token invalide" });
    db.get("SELECT id, email, role, isPremium FROM users WHERE id = ?", [decoded.id], (err, user) => {
      res.json(user);
    });
  });
});

// --- ROUTE PAIEMENT STRIPE ---
app.post('/api/checkout', async (req, res) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).send();

  try {
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
      success_url: `${req.headers.origin}/?payment=success`,
      cancel_url: `${req.headers.origin}/?payment=cancel`,
    });
    res.json({ url: session.url });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

// Stats Admin (Visible seulement par l'admin)
app.get('/api/admin/stats', (req, res) => {
  db.get("SELECT (SELECT COUNT(*) FROM users) as users, (SELECT COUNT(*) FROM users WHERE role='admin') as admins", (err, row) => {
    res.json(row);
  });
});

// Redirection vers React pour toutes les autres routes (Frontend)
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/build', 'index.html'));
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Serveur actif sur le port ${PORT}`);
});