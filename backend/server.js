require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');

const app = express();

// Configuration CORS pour autoriser le frontend
const corsOptions = {
  origin: [
    'https://eds.srv1068230.hstgr.cloud',
    'http://localhost:3000'
  ],
  credentials: true,
  optionsSuccessStatus: 200
};

// Middleware
app.use(cors(corsOptions));
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
app.use('/api/appareils-pret', require('./routes/appareilsPret'));
app.use('/api/prets', require('./routes/prets'));
app.use('/api/fiches-internes', require('./routes/fichesInternes'));
app.use('/api/vehicules', require('./routes/vehicules'));
app.use('/api/uploads', require('./routes/uploads'));

// Servir les fichiers uploadés (photos)
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Connexion MongoDB
mongoose.connect(process.env.MONGODB_URI)
.then(() => console.log('✅ MongoDB connecté'))
.catch(err => console.error('❌ Erreur MongoDB:', err));

// Route de test
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'EDS22 API is running' });
});

// Démarrage du serveur
const PORT = process.env.PORT || 5001;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Serveur EDS22 démarré sur le port ${PORT}`);
});

module.exports = app;
