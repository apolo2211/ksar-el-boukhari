const express = require('express');
const cors = require('cors');
const path = require('path');
const jwt = require('jsonwebtoken');

const app = express();
const PORT = process.env.PORT || 10000;
const SECRET = 'KSAR_SECRET_KEY';

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '../frontend/build')));

// Base utilisateurs simple (temporaire)
const users = [];

/* REGISTER */
app.post('/api/auth/register', (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: 'Champs manquants' });
  }

  const exists = users.find(u => u.email === email);
  if (exists) {
    return res.status(400).json({ message: 'Utilisateur existe déjà' });
  }

  const user = { id: Date.now(), email, password, role: 'user' };
  users.push(user);

  res.json({ message: 'Compte créé avec succès' });
});

/* LOGIN */
app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;

  const user = users.find(u => u.email === email && u.password === password);
  if (!user) {
    return res.status(401).json({ message: 'Identifiants incorrects' });
  }

  const token = jwt.sign(
    { id: user.id, email: user.email, role: user.role },
    SECRET,
    { expiresIn: '1d' }
  );

  res.json({ token });
});

/* PROFIL */
app.get('/api/auth/me', (req, res) => {
  const auth = req.headers.authorization;
  if (!auth) return res.sendStatus(401);

  const token = auth.split(' ')[1];

  try {
    const decoded = jwt.verify(token, SECRET);
    res.json(decoded);
  } catch {
    res.sendStatus(403);
  }
});

/* STATUS */
app.get('/api/status', (req, res) => {
  res.json({ message: 'Backend Express fonctionne !' });
});

/* REACT PROD */
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/build/index.html'));
});

app.listen(PORT, () => {
  console.log(`Serveur démarré sur le port ${PORT}`);
});
