const express = require('express');
const router = express.Router();
const Facture = require('../models/Facture');
const authMiddleware = require('../middleware/auth');

router.use(authMiddleware);

// GET toutes les factures
router.get('/', async (req, res) => {
  try {
    const { page = 1, limit = 20, type, statut } = req.query;

    let query = {};
    if (type) query.type = type;
    if (statut) query.statut = statut;

    const factures = await Facture.find(query)
      .populate('clientId', 'nom prenom')
      .populate('interventionId', 'numero')
      .sort({ dateEmission: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const count = await Facture.countDocuments(query);

    res.json({
      factures,
      totalPages: Math.ceil(count / limit),
      currentPage: page,
      total: count
    });
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
});

// GET une facture par ID
router.get('/:id', async (req, res) => {
  try {
    const facture = await Facture.findById(req.params.id)
      .populate('clientId')
      .populate('interventionId');
    if (!facture) {
      return res.status(404).json({ message: 'Facture non trouvée' });
    }
    res.json(facture);
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
});

// POST créer une nouvelle facture
router.post('/', async (req, res) => {
  try {
    const facture = new Facture(req.body);
    await facture.save();
    await facture.populate('clientId', 'nom prenom');
    res.status(201).json(facture);
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
});

// PUT mettre à jour une facture
router.put('/:id', async (req, res) => {
  try {
    const facture = await Facture.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    ).populate('clientId', 'nom prenom');

    if (!facture) {
      return res.status(404).json({ message: 'Facture non trouvée' });
    }
    res.json(facture);
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
});

// DELETE supprimer une facture
router.delete('/:id', async (req, res) => {
  try {
    const facture = await Facture.findByIdAndDelete(req.params.id);
    if (!facture) {
      return res.status(404).json({ message: 'Facture non trouvée' });
    }
    res.json({ message: 'Facture supprimée avec succès' });
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
});

module.exports = router;
