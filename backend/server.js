require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/clients', require('./routes/clients'));
app.use('/api/interventions', require('./routes/interventions'));
app.use('/api/pieces', require('./routes/pieces'));
app.use('/api/factures', require('./routes/factures'));
app.use('/api/ai', require('./routes/ai'));
app.use('/api/maintenance', require('./routes/maintenance'));

// Connexion MongoDB
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => console.log('✅ MongoDB connecté'))
.catch(err => console.error('❌ Erreur MongoDB:', err));

// Route de test
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'EDS22 API is running' });
});

// Démarrage du serveur
const PORT = process.env.PORT || 5001;
app.listen(PORT, () => {
  console.log(`🚀 Serveur EDS22 démarré sur le port ${PORT}`);
});

module.exports = app;
