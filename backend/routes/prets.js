const express = require('express');
const router = express.Router();
const Pret = require('../models/Pret');
const AppareilPret = require('../models/AppareilPret');
const authMiddleware = require('../middleware/auth');

router.use(authMiddleware);

// POST créer un prêt
router.post('/', async (req, res) => {
  try {
    const { appareilPretId, clientId, interventionId, dateRetourPrevue, notes } = req.body;

    // Vérifier que l'appareil est disponible
    const appareil = await AppareilPret.findById(appareilPretId);
    if (!appareil) {
      return res.status(404).json({ message: 'Appareil non trouvé' });
    }
    if (appareil.statut !== 'Disponible') {
      return res.status(400).json({ message: 'Appareil non disponible' });
    }

    // Créer le prêt
    const pret = new Pret({
      appareilPretId,
      clientId,
      interventionId,
      dateRetourPrevue,
      etatDepart: appareil.etat,
      notes
    });
    await pret.save();

    // Mettre à jour le statut de l'appareil
    appareil.statut = 'Prêté';
    await appareil.save();

    await pret.populate([
      { path: 'clientId', select: 'nom prenom telephone' },
      { path: 'interventionId', select: 'numero' },
      { path: 'appareilPretId' }
    ]);

    res.status(201).json(pret);
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
});

// PUT retourner un appareil
router.put('/:id/retour', async (req, res) => {
  try {
    const { etatRetour, notes } = req.body;

    const pret = await Pret.findById(req.params.id);
    if (!pret) {
      return res.status(404).json({ message: 'Prêt non trouvé' });
    }

    // Mettre à jour le prêt
    pret.dateRetourEffectif = new Date();
    pret.etatRetour = etatRetour || pret.etatDepart;
    if (notes) pret.notes = notes;
    await pret.save();  // Le middleware calculera le statut

    // Libérer l'appareil
    const appareil = await AppareilPret.findById(pret.appareilPretId);
    if (appareil) {
      appareil.statut = 'Disponible';
      appareil.etat = etatRetour || appareil.etat;
      await appareil.save();
    }

    await pret.populate([
      { path: 'clientId', select: 'nom prenom telephone' },
      { path: 'interventionId', select: 'numero' },
      { path: 'appareilPretId' }
    ]);

    res.json(pret);
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
});

// GET tous les prêts avec filtres
router.get('/', async (req, res) => {
  try {
    const { statut, clientId, appareilPretId } = req.query;

    let query = {};
    if (statut) query.statut = statut;
    if (clientId) query.clientId = clientId;
    if (appareilPretId) query.appareilPretId = appareilPretId;

    const prets = await Pret.find(query)
      .populate('clientId', 'nom prenom telephone')
      .populate('interventionId', 'numero statut')
      .populate('appareilPretId')
      .sort({ datePret: -1 });

    res.json(prets);
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
});

module.exports = router;
