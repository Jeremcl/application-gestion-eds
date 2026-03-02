const jwt = require('jsonwebtoken');
const Client = require('../models/Client');

/**
 * Middleware d'authentification pour l'espace membre client.
 * Lit le JWT depuis le cookie httpOnly `eds_token` (distinct du JWT interne des users).
 */
const clientAuthMiddleware = async (req, res, next) => {
  try {
    const token = req.cookies?.eds_token;

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
