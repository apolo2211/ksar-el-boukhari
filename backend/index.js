const express = require('express');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 10000;

// Servir les fichiers statiques du frontend build
app.use(express.static(path.join(__dirname, '../frontend/build')));

// Endpoint API pour vérifier le statut
app.get('/api/status', (req, res) => {
  res.json({ message: 'Backend Express fonctionne !' });
});

// Route catch-all pour React (production)
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/build', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Serveur démarré sur le port ${PORT}`);
});
