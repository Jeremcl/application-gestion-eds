const express = require('express');
const router = express.Router();
const FicheInterne = require('../models/FicheInterne');
const Client = require('../models/Client');
const authMiddleware = require('../middleware/auth');
const {
  genererFicheDepot,
  genererAttestationEnlevement,
  genererAttestationPret
} = require('../utils/pdfGenerator');

router.use(authMiddleware);

// GET toutes les fiches internes
router.get('/', async (req, res) => {
  try {
    const { page = 1, limit = 20, type } = req.query;

    let query = {};
    if (type) query.type = type;

    const fiches = await FicheInterne.find(query)
      .populate('clientId', 'nom prenom telephone')
      .populate('appareilPretId', 'type marque modele')
      .populate('generePar', 'nom email')
      .sort({ dateGeneration: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const count = await FicheInterne.countDocuments(query);

    res.json({
      fiches,
      totalPages: Math.ceil(count / limit),
      currentPage: page,
      total: count
    });
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
});

// GET une fiche par ID
router.get('/:id', async (req, res) => {
  try {
    const fiche = await FicheInterne.findById(req.params.id)
      .populate('clientId')
      .populate('appareilPretId')
      .populate('generePar', 'nom email');

    if (!fiche) {
      return res.status(404).json({ message: 'Fiche non trouvée' });
    }
    res.json(fiche);
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
});

// POST créer et générer une fiche
router.post('/generer', async (req, res) => {
  try {
    const { type, data, clientId, appareilPretId } = req.body;

    if (!type || !['DA1.1', 'AEA1.1', 'AP1.1'].includes(type)) {
      return res.status(400).json({ message: 'Type de fiche invalide' });
    }

    // Créer la fiche en base de données
    const fiche = new FicheInterne({
      type,
      data,
      clientId,
      appareilPretId,
      generePar: req.user?.id
    });

    await fiche.save();

    // Peupler les références pour la génération du PDF
    await fiche.populate('clientId');
    await fiche.populate('appareilPretId');

    // Préparer les données enrichies pour le PDF
    const pdfData = {
      ...data,
      numero: fiche.numero,
      client: fiche.clientId || data.client,
      appareilPret: fiche.appareilPretId || data.appareilPret
    };

    // Générer le PDF
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=fiche-${type}-${fiche.numero}.pdf`);

    switch (type) {
      case 'DA1.1':
        genererFicheDepot(pdfData, res);
        break;
      case 'AEA1.1':
        genererAttestationEnlevement(pdfData, res);
        break;
      case 'AP1.1':
        genererAttestationPret(pdfData, res);
        break;
    }
  } catch (error) {
    console.error('Erreur génération fiche:', error);
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
});

// GET prévisualiser une fiche existante (pour affichage dans le navigateur)
router.get('/:id/preview', async (req, res) => {
  try {
    const fiche = await FicheInterne.findById(req.params.id)
      .populate('clientId')
      .populate('appareilPretId');

    if (!fiche) {
      return res.status(404).json({ message: 'Fiche non trouvée' });
    }

    const pdfData = {
      ...fiche.data,
      numero: fiche.numero,
      client: fiche.clientId,
      appareilPret: fiche.appareilPretId
    };

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename=fiche-${fiche.type}-${fiche.numero}.pdf`);

    switch (fiche.type) {
      case 'DA1.1':
        genererFicheDepot(pdfData, res);
        break;
      case 'AEA1.1':
        genererAttestationEnlevement(pdfData, res);
        break;
      case 'AP1.1':
        genererAttestationPret(pdfData, res);
        break;
    }
  } catch (error) {
    console.error('Erreur prévisualisation fiche:', error);
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
});

// POST régénérer une fiche existante (téléchargement)
router.post('/:id/regenerer', async (req, res) => {
  try {
    const fiche = await FicheInterne.findById(req.params.id)
      .populate('clientId')
      .populate('appareilPretId');

    if (!fiche) {
      return res.status(404).json({ message: 'Fiche non trouvée' });
    }

    const pdfData = {
      ...fiche.data,
      numero: fiche.numero,
      client: fiche.clientId,
      appareilPret: fiche.appareilPretId
    };

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=fiche-${fiche.type}-${fiche.numero}.pdf`);

    switch (fiche.type) {
      case 'DA1.1':
        genererFicheDepot(pdfData, res);
        break;
      case 'AEA1.1':
        genererAttestationEnlevement(pdfData, res);
        break;
      case 'AP1.1':
        genererAttestationPret(pdfData, res);
        break;
    }
  } catch (error) {
    console.error('Erreur régénération fiche:', error);
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
});

// DELETE supprimer une fiche
router.delete('/:id', async (req, res) => {
  try {
    const fiche = await FicheInterne.findByIdAndDelete(req.params.id);
    if (!fiche) {
      return res.status(404).json({ message: 'Fiche non trouvée' });
    }
    res.json({ message: 'Fiche supprimée avec succès' });
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
});

// GET statistiques des fiches
router.get('/stats/count', async (req, res) => {
  try {
    const stats = await FicheInterne.aggregate([
      {
        $group: {
          _id: '$type',
          count: { $sum: 1 }
        }
      }
    ]);

    const result = {
      'DA1.1': 0,
      'AEA1.1': 0,
      'AP1.1': 0,
      total: 0
    };

    stats.forEach(stat => {
      result[stat._id] = stat.count;
      result.total += stat.count;
    });

    res.json(result);
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
});

module.exports = router;
