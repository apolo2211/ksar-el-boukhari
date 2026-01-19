const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const app = express();
const SECRET = process.env.JWT_SECRET || 'ksar_secret_2026';

// Base de données
const dbPath = path.join(__dirname, 'database.sqlite');
const db = new sqlite3.Database(dbPath);

app.use(cors());
app.use(express.json());

// SERVIR LE FRONTEND : C'est ici que la magie opère pour Render
app.use(express.static(path.join(__dirname, '../frontend/build')));

// Initialisation de la table utilisateurs
db.serialize(() => {
  db.run("CREATE TABLE IF NOT EXISTS users (id INTEGER PRIMARY KEY AUTOINCREMENT, email TEXT UNIQUE, password TEXT, role TEXT, isPremium INTEGER DEFAULT 0)");
});

// --- ROUTES API ---

app.post('/api/auth/register', async (req, res) => {
  const { email, password } = req.body;
  try {
    const hash = await bcrypt.hash(password, 10);
    db.run("INSERT INTO users (email, password, role) VALUES (?, ?, 'user')", [email, hash], function(err) {
      if (err) return res.status(400).json({ message: "Email déjà utilisé" });
      const token = jwt.sign({ id: this.lastID }, SECRET);
      res.json({ token });
    });
  } catch (e) { res.status(500).json({ message: "Erreur serveur" }); }
});

app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;
  db.get("SELECT * FROM users WHERE email = ?", [email], async (err, user) => {
    if (user && await bcrypt.compare(password, user.password)) {
      const token = jwt.sign({ id: user.id }, SECRET);
      res.json({ token });
    } else { res.status(400).json({ message: "Identifiants incorrects" }); }
  });
});

app.get('/api/auth/me', (req, res) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).send();
  jwt.verify(token, SECRET, (err, decoded) => {
    if (err) return res.status(401).send();
    db.get("SELECT id, email, isPremium FROM users WHERE id = ?", [decoded.id], (err, user) => {
      if (!user) return res.status(404).send();
      res.json(user);
    });
  });
});

app.post('/api/auth/make-premium', (req, res) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).send();
  jwt.verify(token, SECRET, (err, decoded) => {
    if (err) return res.status(401).send();
    db.run("UPDATE users SET isPremium = 1 WHERE id = ?", [decoded.id], (err) => {
      if (err) return res.status(500).send();
      res.json({ success: true });
    });
  });
});

// REDIRECTION : Pour que React gère les routes
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/build', 'index.html'));
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Serveur actif sur le port ${PORT}`);
});