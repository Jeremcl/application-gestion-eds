/**
 * Routes d'authentification de l'espace membre client
 * Montées sur : /api/v1/auth
 *
 * POST /api/v1/auth/register  → inscription (lie aux données existantes si email/tel trouvé)
 * POST /api/v1/auth/login     → connexion, pose le cookie httpOnly
 * POST /api/v1/auth/logout    → supprime le cookie
 * GET  /api/v1/auth/me        → profil du client connecté
 */
const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const Client = require('../models/Client');
const clientAuth = require('../middleware/clientAuth');
const apiKeyAuth = require('../middleware/apiKeyAuth');

// ─── Helpers ─────────────────────────────────────────────────────────────────

const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: process.env.NODE_ENV === 'production' ? 'None' : 'Lax',
  maxAge: 30 * 24 * 60 * 60 * 1000 // 30 jours
};

const signToken = (clientId) => {
  return jwt.sign(
    { clientId: clientId.toString() },
    process.env.JWT_CLIENT_SECRET,
    { expiresIn: '30d' }
  );
};

// ─── POST /api/v1/auth/register ──────────────────────────────────────────────
/**
 * Inscription d'un client.
 * Cherche d'abord un Client existant par email (puis téléphone).
 * Si trouvé → lie le compte. Si non trouvé → crée un nouveau Client.
 * Retourne une erreur si un compte existe déjà pour cet email.
 */
router.post('/register', apiKeyAuth, async (req, res) => {
  try {
    const { email, password, nom, prenom = '', telephone = '' } = req.body;

    if (!email || !password || !nom) {
      return res.status(400).json({
        success: false,
        message: 'Champs requis manquants : email, password, nom'
      });
    }

    if (password.length < 8) {
      return res.status(400).json({
        success: false,
        message: 'Le mot de passe doit contenir au moins 8 caractères'
      });
    }

    const emailNorm = email.toLowerCase().trim();

    // Vérifier si un compte existe déjà
    const existingWithAccount = await Client.findOne({
      email: emailNorm,
      compteActif: true
    });

    if (existingWithAccount) {
      return res.status(409).json({
        success: false,
        message: 'Un compte existe déjà pour cet email'
      });
    }

    // Chercher un Client existant (sans compte) par email ou téléphone
    let client = await Client.findOne({ email: emailNorm, compteActif: { $ne: true } });
    if (!client && telephone) {
      client = await Client.findOne({ telephone: telephone.trim(), compteActif: { $ne: true } });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    if (client) {
      // Lier le compte aux données existantes
      client.passwordHash = passwordHash;
      client.compteActif = true;
      client.dateInscription = new Date();
      // Compléter les infos manquantes si besoin
      if (!client.email) client.email = emailNorm;
      if (!client.prenom && prenom) client.prenom = prenom.trim();
      if (!client.telephone && telephone) client.telephone = telephone.trim();
      await client.save();
    } else {
      // Nouveau client
      client = new Client({
        nom: nom.trim(),
        prenom: prenom.trim(),
        email: emailNorm,
        telephone: telephone.trim(),
        passwordHash,
        compteActif: true,
        dateInscription: new Date()
      });
      await client.save();
    }

    const token = signToken(client._id);
    res.cookie('eds_token', token, COOKIE_OPTIONS);

    res.status(201).json({
      success: true,
      message: 'Compte créé avec succès',
      token, // Retourné pour l'architecture proxy Next.js
      client: {
        id: client._id,
        nom: client.nom,
        prenom: client.prenom,
        email: client.email,
        telephone: client.telephone
      }
    });
  } catch (error) {
    console.error('Erreur register:', error);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
});

// ─── POST /api/v1/auth/login ─────────────────────────────────────────────────
router.post('/login', apiKeyAuth, async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email et mot de passe requis' });
    }

    const client = await Client.findOne({
      email: email.toLowerCase().trim(),
      compteActif: true
    });

    if (!client || !client.passwordHash) {
      return res.status(401).json({ success: false, message: 'Email ou mot de passe incorrect' });
    }

    const valid = await bcrypt.compare(password, client.passwordHash);
    if (!valid) {
      return res.status(401).json({ success: false, message: 'Email ou mot de passe incorrect' });
    }

    const token = signToken(client._id);
    res.cookie('eds_token', token, COOKIE_OPTIONS);

    res.json({
      success: true,
      token, // Retourné pour l'architecture proxy Next.js
      client: {
        id: client._id,
        nom: client.nom,
        prenom: client.prenom,
        email: client.email,
        telephone: client.telephone
      }
    });
  } catch (error) {
    console.error('Erreur login:', error);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
});

// ─── POST /api/v1/auth/logout ────────────────────────────────────────────────
router.post('/logout', (req, res) => {
  res.clearCookie('eds_token', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'None' : 'Lax'
  });
  res.json({ success: true, message: 'Déconnecté' });
});

// ─── GET /api/v1/auth/me ─────────────────────────────────────────────────────
router.get('/me', clientAuth, (req, res) => {
  const { _id, nom, prenom, email, telephone, adresse, codePostal, ville, dateInscription } = req.client;
  res.json({
    success: true,
    client: { id: _id, nom, prenom, email, telephone, adresse, codePostal, ville, dateInscription }
  });
});

module.exports = router;
