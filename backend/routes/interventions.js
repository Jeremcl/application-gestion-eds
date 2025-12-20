const express = require('express');
const router = express.Router();
const Intervention = require('../models/Intervention');
const Client = require('../models/Client');
const authMiddleware = require('../middleware/auth');

router.use(authMiddleware);

// GET toutes les interventions avec filtres
router.get('/', async (req, res) => {
  try {
    const { page = 1, limit = 20, statut, technicien, dateDebut, dateFin } = req.query;

    let query = {};
    if (statut) query.statut = statut;
    if (technicien) query.technicien = technicien;
    if (dateDebut || dateFin) {
      query.dateCreation = {};
      if (dateDebut) query.dateCreation.$gte = new Date(dateDebut);
      if (dateFin) query.dateCreation.$lte = new Date(dateFin);
    }

    const interventions = await Intervention.find(query)
      .populate('clientId', 'nom prenom telephone')
      .sort({ dateCreation: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const count = await Intervention.countDocuments(query);

    res.json({
      interventions,
      totalPages: Math.ceil(count / limit),
      currentPage: page,
      total: count
    });
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
});

// GET une intervention par ID
router.get('/:id', async (req, res) => {
  try {
    const intervention = await Intervention.findById(req.params.id)
      .populate('clientId')
      .populate('piecesUtilisees.pieceId');
    if (!intervention) {
      return res.status(404).json({ message: 'Intervention non trouvée' });
    }
    res.json(intervention);
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
});

// POST créer une nouvelle intervention
router.post('/', async (req, res) => {
  try {
    // Si appareilId est fourni, synchroniser les données de l'appareil
    if (req.body.appareilId && req.body.clientId) {
      const client = await Client.findById(req.body.clientId);
      if (client) {
        const appareil = client.appareils.id(req.body.appareilId);
        if (appareil) {
          req.body.appareil = {
            type: appareil.type,
            marque: appareil.marque,
            modele: appareil.modele,
            numeroSerie: appareil.numeroSerie
          };
        }
      }
    }

    const intervention = new Intervention(req.body);
    await intervention.save();
    await intervention.populate('clientId', 'nom prenom telephone');
    res.status(201).json(intervention);
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
});

// PUT mettre à jour une intervention
router.put('/:id', async (req, res) => {
  try {
    // Si appareilId est fourni, synchroniser les données de l'appareil
    if (req.body.appareilId && req.body.clientId) {
      const client = await Client.findById(req.body.clientId);
      if (client) {
        const appareil = client.appareils.id(req.body.appareilId);
        if (appareil) {
          req.body.appareil = {
            type: appareil.type,
            marque: appareil.marque,
            modele: appareil.modele,
            numeroSerie: appareil.numeroSerie
          };
        }
      }
    }

    const intervention = await Intervention.findByIdAndUpdate(
      req.params.id,
      { ...req.body, dateModification: Date.now() },
      { new: true, runValidators: true }
    ).populate('clientId', 'nom prenom telephone');

    if (!intervention) {
      return res.status(404).json({ message: 'Intervention non trouvée' });
    }
    res.json(intervention);
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
});

// DELETE supprimer une intervention
router.delete('/:id', async (req, res) => {
  try {
    const intervention = await Intervention.findByIdAndDelete(req.params.id);
    if (!intervention) {
      return res.status(404).json({ message: 'Intervention non trouvée' });
    }
    res.json({ message: 'Intervention supprimée avec succès' });
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
});

// GET statistiques pour le dashboard
router.get('/stats/dashboard', async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const weekAgo = new Date(today);
    weekAgo.setDate(weekAgo.getDate() - 7);

    const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);

    const stats = {
      interventionsJour: await Intervention.countDocuments({ dateCreation: { $gte: today } }),
      interventionsSemaine: await Intervention.countDocuments({ dateCreation: { $gte: weekAgo } }),
      interventionsMois: await Intervention.countDocuments({ dateCreation: { $gte: monthStart } }),
      parStatut: await Intervention.aggregate([
        { $group: { _id: '$statut', count: { $sum: 1 } } }
      ]),
      caMensuel: await Intervention.aggregate([
        { $match: { dateCreation: { $gte: monthStart }, statut: 'Facturé' } },
        { $group: { _id: null, total: { $sum: '$coutTotal' } } }
      ])
    };

    res.json(stats);
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
});

module.exports = router;
