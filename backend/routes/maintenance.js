const express = require('express');
const router = express.Router();
const Maintenance = require('../models/Maintenance');
const auth = require('../middleware/auth');

// Obtenir l'état de maintenance
router.get('/status', async (req, res) => {
  try {
    const maintenance = await Maintenance.getMaintenance();
    
    // Vérifier si la maintenance est toujours active (date de fin dépassée)
    if (maintenance.isActive && maintenance.endDate && new Date() > maintenance.endDate) {
      maintenance.isActive = false;
      await maintenance.save();
    }
    
    res.json({
      isActive: maintenance.isActive,
      endDate: maintenance.endDate,
      message: maintenance.message
    });
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
});

// Activer/désactiver le mode maintenance (admin seulement)
router.post('/toggle', auth, async (req, res) => {
  try {
    // Vérifier que l'utilisateur est admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Accès refusé. Administrateur requis.' });
    }

    const { isActive, endDate, message } = req.body;
    const maintenance = await Maintenance.getMaintenance();
    
    maintenance.isActive = isActive || false;
    if (endDate) {
      maintenance.endDate = new Date(endDate);
    }
    if (message) {
      maintenance.message = message;
    }
    
    await maintenance.save();
    
    res.json({
      message: maintenance.isActive ? 'Mode maintenance activé' : 'Mode maintenance désactivé',
      maintenance: {
        isActive: maintenance.isActive,
        endDate: maintenance.endDate,
        message: maintenance.message
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
});

module.exports = router;

