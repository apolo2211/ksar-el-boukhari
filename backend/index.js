const express = require('express');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

// CORS (local + prod)
app.use(cors({
  origin: '*'
}));

app.use(express.json());

// Route racine
app.get('/', (req, res) => {
  res.send('Bienvenue sur Ksar El Boukhari SaaS Backend!');
});

// ✅ ROUTE API STATUS (MANQUANTE AVANT)
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
