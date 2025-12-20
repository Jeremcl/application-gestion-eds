const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Maintenance = require('../models/Maintenance');

// Login
router.post('/login', async (req, res) => {
  try {
    // Vérifier le mode maintenance (sauf pour l'admin)
    const maintenance = await Maintenance.getMaintenance();
    if (maintenance.isActive && maintenance.endDate && new Date() <= maintenance.endDate) {
      const { email } = req.body;
      const user = await User.findOne({ email });
      
      // L'admin peut toujours se connecter même en maintenance
      if (!user || user.role !== 'admin') {
        return res.status(503).json({ 
          message: maintenance.message || 'L\'application est en maintenance',
          maintenance: {
            isActive: true,
            endDate: maintenance.endDate
          }
        });
      }
    }

    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ message: 'Email ou mot de passe incorrect' });
    }

    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      return res.status(401).json({ message: 'Email ou mot de passe incorrect' });
    }

    const token = jwt.sign(
      { userId: user._id, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      token,
      user: {
        id: user._id,
        email: user.email,
        nom: user.nom,
        role: user.role
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
});

// Register (optionnel, pour créer de nouveaux utilisateurs)
router.post('/register', async (req, res) => {
  try {
    const { email, password, nom, role } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'Un utilisateur avec cet email existe déjà' });
    }

    const user = new User({ email, password, nom, role });
    await user.save();

    res.status(201).json({
      message: 'Utilisateur créé avec succès',
      user: {
        id: user._id,
        email: user.email,
        nom: user.nom,
        role: user.role
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
});

module.exports = router;
