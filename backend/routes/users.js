const express = require('express');
const router = express.Router();
const User = require('../models/User');
const auth = require('../middleware/auth');

// GET /api/users - Liste tous les utilisateurs (admin)
router.get('/', auth, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Accès refusé. Administrateur requis.' });
    }
    const users = await User.find({}, '-password').sort({ createdAt: 1 });
    res.json({ users });
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
});

// POST /api/users - Créer un utilisateur (admin)
router.post('/', auth, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Accès refusé. Administrateur requis.' });
    }
    const { nom, email, password, role } = req.body;
    if (!nom || !email || !password) {
      return res.status(400).json({ message: 'Nom, email et mot de passe requis' });
    }
    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(400).json({ message: 'Un utilisateur avec cet email existe déjà' });
    }
    const user = new User({ nom, email, password, role: role || 'tech' });
    await user.save();
    res.status(201).json({
      user: { id: user._id, email: user.email, nom: user.nom, role: user.role }
    });
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
});

// PUT /api/users/me - Modifier son propre profil
router.put('/me', auth, async (req, res) => {
  try {
    const { nom, email } = req.body;
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: 'Utilisateur non trouvé' });

    if (nom) user.nom = nom;
    if (email && email !== user.email) {
      const existing = await User.findOne({ email });
      if (existing) return res.status(400).json({ message: 'Cet email est déjà utilisé' });
      user.email = email;
    }
    await user.save();
    res.json({
      user: { id: user._id, email: user.email, nom: user.nom, role: user.role }
    });
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
});

// PUT /api/users/me/password - Changer son mot de passe
router.put('/me/password', auth, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: 'Mot de passe actuel et nouveau mot de passe requis' });
    }
    if (newPassword.length < 6) {
      return res.status(400).json({ message: 'Le nouveau mot de passe doit faire au moins 6 caractères' });
    }
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: 'Utilisateur non trouvé' });

    const isValid = await user.comparePassword(currentPassword);
    if (!isValid) return res.status(400).json({ message: 'Mot de passe actuel incorrect' });

    user.password = newPassword;
    await user.save();
    res.json({ message: 'Mot de passe modifié avec succès' });
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
});

// DELETE /api/users/:id - Supprimer un utilisateur (admin)
router.delete('/:id', auth, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Accès refusé. Administrateur requis.' });
    }
    if (req.params.id === req.user._id.toString()) {
      return res.status(400).json({ message: 'Vous ne pouvez pas supprimer votre propre compte' });
    }
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) return res.status(404).json({ message: 'Utilisateur non trouvé' });
    res.json({ message: 'Utilisateur supprimé avec succès' });
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
});

module.exports = router;
