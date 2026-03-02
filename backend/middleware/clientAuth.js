const jwt = require('jsonwebtoken');
const Client = require('../models/Client');

/**
 * Middleware d'authentification pour l'espace membre client.
 * Accepte le JWT depuis :
 *   1. Cookie httpOnly `eds_token` (appel direct navigateur)
 *   2. Header `Authorization: Bearer <token>` (appel serveur Next.js proxy)
 */
const clientAuthMiddleware = async (req, res, next) => {
  try {
    // Priorité : cookie (navigateur) → Bearer header (proxy Next.js)
    const token = req.cookies?.eds_token
      || req.headers.authorization?.replace('Bearer ', '');

    if (!token) {
      return res.status(401).json({ success: false, message: 'Connexion requise' });
    }

    const decoded = jwt.verify(token, process.env.JWT_CLIENT_SECRET);

    const client = await Client.findById(decoded.clientId).select('-passwordHash');

    if (!client || !client.compteActif) {
      return res.status(401).json({ success: false, message: 'Session invalide' });
    }

    req.client = client;
    next();
  } catch (error) {
    return res.status(401).json({ success: false, message: 'Session expirée, veuillez vous reconnecter' });
  }
};

module.exports = clientAuthMiddleware;
