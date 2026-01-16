require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');

// CHEMINS CORRIGÉS SELON VOTRE LISTING :
const { sequelize } = require('./config/database'); 
const User = require('./models/User');

const app = express();
// ... la suite de votre code app.post, app.get, etc.
const PORT = process.env.PORT || 10000;
const SECRET = process.env.JWT_SECRET; // Utilise la clé du .env

// --- Middlewares ---
app.use(cors());
app.use(express.json());

// Servir les fichiers statiques du frontend (si le dossier build existe)
app.use(express.static(path.join(__dirname, '../frontend/build')));

/* ------------------------------
    🔹 REGISTER (Inscription)
------------------------------- */
app.post('/api/auth/register', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Email et mot de passe requis' });
    }

    const exists = await User.findOne({ where: { email } });
    if (exists) {
      return res.status(400).json({ message: 'Cet utilisateur existe déjà' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Création de l'utilisateur (on s'assure que le modèle User est bien défini)
    await User.create({ 
      email, 
      password: hashedPassword, 
      role: 'user' 
    });

    res.status(201).json({ message: 'Compte créé avec succès' });
  } catch (error) {
    console.error('Erreur REGISTER:', error);
    res.status(500).json({ message: 'Erreur lors de l\'inscription' });
  }
});

/* ------------------------------
    🔹 LOGIN (Connexion)
------------------------------- */
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ where: { email } });
    if (!user) {
      return res.status(401).json({ message: 'Identifiants incorrects' });
    }

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) {
      return res.status(401).json({ message: 'Identifiants incorrects' });
    }

    // Génération du token avec les infos du .env
    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      SECRET,
      { expiresIn: '24h' }
    );

    res.json({ 
        message: 'Connexion réussie',
        token, 
        user: { email: user.email, role: user.role } 
    });
  } catch (error) {
    console.error('Erreur LOGIN:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

/* ------------------------------
    🔹 PROFIL (Vérification Token)
------------------------------- */
app.get('/api/auth/me', (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'Non autorisé' });
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, SECRET);
    res.json(decoded);
  } catch (error) {
    res.status(403).json({ message: 'Token invalide ou expiré' });
  }
});

/* ------------------------------
    🔹 STATUS
------------------------------- */
app.get('/api/status', (req, res) => {
  res.json({ 
      status: '✅ Online', 
      db: 'SQLite Connected',
      time: new Date()
  });
});

/* ------------------------------
    🔹 FRONTEND (Fallback)
------------------------------- */
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/build/index.html'));
});

/* ------------------------------
    🔹 LANCEMENT
------------------------------- */
// .sync() assure que la table User est créée dans database.sqlite
sequelize.sync({ force: false }).then(() => {
  app.listen(PORT, () => {
    console.log(`🚀 Serveur ksar-el-boukhari lancé sur le port ${PORT}`);
  });
}).catch(err => {
  console.error('❌ Erreur critique base de données :', err);
});
/* ------------------------------
    🔹 SERVER START
------------------------------- */
sequelize.sync({ force: false }).then(() => {
  app.listen(PORT, () => {
    console.log(`✅ Base de données connectée`);
    console.log(`🚀 Serveur démarré sur : http://localhost:${PORT}`);
  });
}).catch(err => {
  console.error('❌ Erreur de connexion à la base de données :', err);
});