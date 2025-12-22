const express = require('express');
const router = express.Router();
const AppareilPret = require('../models/AppareilPret');
const Pret = require('../models/Pret');
const authMiddleware = require('../middleware/auth');

router.use(authMiddleware);

// GET tous les appareils avec filtres
router.get('/', async (req, res) => {
  try {
    const { page = 1, limit = 20, search = '', statut } = req.query;

    let query = {};
    if (statut) query.statut = statut;
    if (search) {
      query.$or = [
        { type: { $regex: search, $options: 'i' } },
        { marque: { $regex: search, $options: 'i' } },
        { modele: { $regex: search, $options: 'i' } },
        { numeroSerie: { $regex: search, $options: 'i' } }
      ];
    }

    const appareils = await AppareilPret.find(query)
      .sort({ dateCreation: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const count = await AppareilPret.countDocuments(query);

    res.json({
      appareils,
      totalPages: Math.ceil(count / limit),
      currentPage: page,
      total: count
    });
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
});

// GET statistiques
router.get('/stats', async (req, res) => {
  try {
    const total = await AppareilPret.countDocuments();
    const disponibles = await AppareilPret.countDocuments({ statut: 'Disponible' });
    const pretes = await AppareilPret.countDocuments({ statut: 'Prêté' });
    const enMaintenance = await AppareilPret.countDocuments({ statut: 'En maintenance' });

    const valeurTotale = await AppareilPret.aggregate([
      { $group: { _id: null, total: { $sum: '$valeur' } } }
    ]);

    res.json({
      total,
      disponibles,
      pretes,
      enMaintenance,
      valeurTotale: valeurTotale[0]?.total || 0
    });
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
});

// GET appareils disponibles
router.get('/disponibles', async (req, res) => {
  try {
    const appareils = await AppareilPret.find({ statut: 'Disponible' })
      .sort({ type: 1, marque: 1 });
    res.json(appareils);
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
});

// GET un appareil par ID
router.get('/:id', async (req, res) => {
  try {
    const appareil = await AppareilPret.findById(req.params.id);
    if (!appareil) {
      return res.status(404).json({ message: 'Appareil non trouvé' });
    }
    res.json(appareil);
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
});

// POST créer un appareil
router.post('/', async (req, res) => {
  try {
    const appareil = new AppareilPret(req.body);
    await appareil.save();
    res.status(201).json(appareil);
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
});

// PUT mettre à jour un appareil
router.put('/:id', async (req, res) => {
  try {
    const appareil = await AppareilPret.findByIdAndUpdate(
      req.params.id,
      { ...req.body, dateModification: Date.now() },
      { new: true, runValidators: true }
    );
    if (!appareil) {
      return res.status(404).json({ message: 'Appareil non trouvé' });
    }
    res.json(appareil);
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
});

// DELETE supprimer un appareil
router.delete('/:id', async (req, res) => {
  try {
    // Vérifier s'il y a des prêts actifs
    const pretActif = await Pret.findOne({
      appareilPretId: req.params.id,
      statut: 'En cours'
    });

    if (pretActif) {
      return res.status(400).json({
        message: 'Impossible de supprimer un appareil actuellement prêté'
      });
    }

    const appareil = await AppareilPret.findByIdAndDelete(req.params.id);
    if (!appareil) {
      return res.status(404).json({ message: 'Appareil non trouvé' });
    }
    res.json({ message: 'Appareil supprimé avec succès' });
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
});

// GET historique des prêts d'un appareil
router.get('/:id/prets', async (req, res) => {
  try {
    const prets = await Pret.find({ appareilPretId: req.params.id })
      .populate('clientId', 'nom prenom telephone')
      .populate('interventionId', 'numero statut')
      .sort({ datePret: -1 });

    res.json(prets);
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
});

module.exports = router;
