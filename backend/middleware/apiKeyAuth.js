/**
 * Middleware d'authentification par clé API
 * Utilisé pour les endpoints publics /api/v1/products
 * Le site web doit envoyer : Authorization: Bearer <API_SECRET_KEY>
 */
const apiKeyAuth = (req, res, next) => {
  const authHeader = req.header('Authorization');

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Clé API manquante. Header requis : Authorization: Bearer <API_KEY>' });
  }

  const key = authHeader.replace('Bearer ', '').trim();

  if (!process.env.API_SECRET_KEY) {
    console.error('❌ API_SECRET_KEY non définie dans les variables d\'environnement');
    return res.status(500).json({ message: 'Configuration serveur manquante' });
  }

  if (key !== process.env.API_SECRET_KEY) {
    return res.status(403).json({ message: 'Clé API invalide' });
  }

  next();
};

module.exports = apiKeyAuth;
