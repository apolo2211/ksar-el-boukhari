require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');

// Importation de la base de données et des modèles
const { sequelize } = require('./config/database'); 
const User = require('./models/User');

const app = express();
const PORT = process.env.PORT || 10000;
const SECRET = process.env.JWT_SECRET || 'ksar_secret_default_2025';

// --- Middlewares ---
app.use(cors());
app.use(express.json());

// Servir les fichiers statiques du frontend (dossier build)
app.use(express.static(path.join(__dirname, '../frontend/build')));

/* ------------------------------
    🔹 AUTH : REGISTER
------------------------------- */
app.post('/api/auth/register', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ message: 'Champs manquants' });

    const exists = await User.findOne({ where: { email } });
    if (exists) return res.status(400).json({ message: 'L\'utilisateur existe déjà' });

    const hashedPassword = await bcrypt.hash(password, 10);
    await User.create({ email, password: hashedPassword, role: 'user' });

    res.status(201).json({ message: 'Compte créé avec succès' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erreur serveur lors de l\'inscription' });
  }
});

/* ------------------------------
    🔹 AUTH : LOGIN
------------------------------- */
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ where: { email } });

    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({ message: 'Identifiants incorrects' });
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      SECRET,
      { expiresIn: '7d' }
    );

    res.json({ token, user: { email: user.email, role: user.role } });
  } catch (error) {
    res.status(500).json({ message: 'Erreur lors de la connexion' });
  }
});

/* ------------------------------
    🔹 AUTH : ME (Profil)
------------------------------- */
app.get('/api/auth/me', (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ message: 'Non autorisé' });

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, SECRET);
    res.json(decoded);
  } catch (error) {
    res.status(403).json({ message: 'Session expirée' });
  }
});

/* ------------------------------
    🔹 ADMIN : STATS (Pour votre Dashboard)
------------------------------- */
app.get('/api/admin/stats', async (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.sendStatus(401);

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, SECRET);
    if (decoded.role !== 'admin') return res.status(403).json({ message: 'Accès réservé aux admins' });

    // Compter les utilisateurs en base
    const userCount = await User.count({ where: { role: 'user' } });
    const adminCount = await User.count({ where: { role: 'admin' } });

    res.json({ users: userCount, admins: adminCount });
  } catch (error) {
    res.sendStatus(403);
  }
});

/* ------------------------------
    🔹 STATUS
------------------------------- */
app.get('/api/status', (req, res) => {
  res.json({ message: 'Backend Express fonctionne !' });
});

/* ------------------------------
    🔹 FRONTEND : CATCH-ALL
------------------------------- */
// Cette route doit rester en DERNIER
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/build/index.html'));
});

/* ------------------------------
    🔹 LANCEMENT DU SERVEUR
------------------------------- */
sequelize.sync({ force: false }).then(() => {
  app.listen(PORT, () => {
    console.log(`🚀 Serveur actif sur le port ${PORT}`);
  });
}).catch(err => console.error('Erreur DB:', err));