// backend/app.js
const express = require('express');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000; // force localhost:3000 pour le local

// ✅ CORS pour frontend local et futur frontend en ligne
app.use(cors({
  origin: [
    'http://localhost:5173',
    'http://localhost:5174',
    'http://localhost:5175',
    'http://localhost:5176',
    'https://ksar-el-boukhari-frontend.vercel.app' // frontend en ligne
  ]
}));

app.use(express.json());

// Route racine
app.get('/', (req, res) => {
  res.send('Bienvenue sur Ksar El Boukhari SaaS Backend!');
});

// Route API STATUS
app.get('/api/status', (req, res) => {
  res.json({
    status: 'OK',
    message: 'Backend opérationnel 🚀'
  });
});

// Lancement serveur
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Serveur backend démarré sur le port ${PORT}`);
});
