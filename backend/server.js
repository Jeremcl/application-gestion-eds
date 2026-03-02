require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const path = require('path');

const app = express();

// ─── CORS ────────────────────────────────────────────────────────────────────

// CORS avec credentials pour le site web (espace membre, cookies httpOnly)
const clientSiteUrl = process.env.CLIENT_SITE_URL || 'http://localhost:3001';

const corsWithCredentials = cors({
  origin: [clientSiteUrl],
  credentials: true,
  optionsSuccessStatus: 200
});

// Preflight pour les routes membre (cookies cross-domain)
app.options('/api/v1/auth/*', corsWithCredentials);
app.options('/api/v1/me/*', corsWithCredentials);
app.use('/api/v1/auth', corsWithCredentials);
app.use('/api/v1/me', corsWithCredentials);

// CORS ouvert pour le reste de l'API publique v1 (clé API, pas de cookies)
// Doit être déclaré AVANT le cors global pour intercepter les preflight OPTIONS
app.use('/api/v1', cors());
app.options('/api/v1/*', cors());

// Configuration CORS pour autoriser le frontend interne (appli de gestion)
const corsOptions = {
  origin: [
    'https://eds.srv1068230.hstgr.cloud',
    'http://localhost:3000'
  ],
  credentials: true,
  optionsSuccessStatus: 200
};

// ─── Middleware ───────────────────────────────────────────────────────────────
app.use(cors(corsOptions));
app.use(cookieParser());
// Augmenter la limite pour les photos en base64 du dépôt atelier
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// ─── Routes internes (appli de gestion) ──────────────────────────────────────
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
app.use('/api/statistiques', require('./routes/statistiques'));
app.use('/api/users', require('./routes/users'));
app.use('/api/produits', require('./routes/produits'));

// ─── API publique v1 (site web) ───────────────────────────────────────────────
app.use('/api/v1/auth', require('./routes/clientAuth'));   // Authentification membre
app.use('/api/v1/me', require('./routes/clientMe'));       // Espace membre protégé
app.use('/api/v1', require('./routes/publicProducts'));    // Produits / réservations publics

// ─── Fichiers statiques ───────────────────────────────────────────────────────
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// ─── Connexion MongoDB ────────────────────────────────────────────────────────
mongoose.connect(process.env.MONGODB_URI)
.then(() => console.log('✅ MongoDB connecté'))
.catch(err => console.error('❌ Erreur MongoDB:', err));

// ─── Route de santé ───────────────────────────────────────────────────────────
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'EDS22 API is running' });
});

// ─── Démarrage ────────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 5001;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Serveur EDS22 démarré sur le port ${PORT}`);
});

module.exports = app;
