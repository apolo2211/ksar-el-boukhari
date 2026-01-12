const express = require('express');
const cors = require('cors');

const app = express();
const PORT = 10000;

app.use(cors());

app.get('/api/status', (req, res) => {
  res.json({ message: 'Backend Express fonctionne !' });
});

app.listen(PORT, () => {
  console.log(`Serveur démarré sur le port ${PORT}`);
});
