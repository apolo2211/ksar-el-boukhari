// app.js
// Encodage UTF-8
const express = require('express');
const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());

// Exemple de route simple
app.get('/', (req, res) => {
  res.send('Bienvenue sur Ksar El Boukhari SaaS Backend!');
});

// Démarrage serveur
app.listen(port, () => {
  console.log(`Serveur backend démarré sur le port ${port}`);
});
