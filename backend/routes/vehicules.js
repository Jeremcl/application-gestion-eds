const express = require('express');
const router = express.Router();
const Vehicule = require('../models/Vehicule');
const authMiddleware = require('../middleware/auth');

router.use(authMiddleware);

// GET tous les véhicules avec filtres
router.get('/', async (req, res) => {
  try {
    const { page = 1, limit = 20, search = '', statut } = req.query;

    let query = {};
    if (statut) query.statut = statut;
    if (search) {
      query.$or = [
        { nom: { $regex: search, $options: 'i' } },
        { marque: { $regex: search, $options: 'i' } },
        { immatriculation: { $regex: search, $options: 'i' } }
      ];
    }

    const vehicules = await Vehicule.find(query)
      .sort({ dateCreation: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const count = await Vehicule.countDocuments(query);

    res.json({
      vehicules,
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
    const total = await Vehicule.countDocuments();
    const disponibles = await Vehicule.countDocuments({ statut: 'Disponible' });
    const enUtilisation = await Vehicule.countDocuments({ statut: 'En utilisation' });
    const enMaintenance = await Vehicule.countDocuments({ statut: 'En maintenance' });

    // Calculer les dépenses de carburant du mois en cours
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const vehiculesWithCarburant = await Vehicule.find({
      'historiqueCarburant.date': { $gte: startOfMonth }
    });

    let depensesMois = 0;
    vehiculesWithCarburant.forEach(v => {
      v.historiqueCarburant.forEach(c => {
        if (new Date(c.date) >= startOfMonth && c.montant) {
          depensesMois += c.montant;
        }
      });
    });

    res.json({
      total,
      disponibles,
      enUtilisation,
      enMaintenance,
      depensesMois: Math.round(depensesMois * 100) / 100
    });
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
});

// GET alertes documents (expirant sous 30 jours)
router.get('/alertes-documents', async (req, res) => {
  try {
    const now = new Date();
    const in30Days = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

    const vehicules = await Vehicule.find({
      'documents.dateExpiration': { $lte: in30Days, $gte: now }
    });

    const alertes = [];
    vehicules.forEach(v => {
      v.documents.forEach(doc => {
        if (doc.dateExpiration && new Date(doc.dateExpiration) <= in30Days && new Date(doc.dateExpiration) >= now) {
          alertes.push({
            vehiculeId: v._id,
            vehiculeNom: v.nom,
            vehiculeImmatriculation: v.immatriculation,
            documentType: doc.type,
            dateExpiration: doc.dateExpiration
          });
        }
      });
    });

    // Trier par date d'expiration
    alertes.sort((a, b) => new Date(a.dateExpiration) - new Date(b.dateExpiration));

    res.json(alertes);
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
});

// GET un véhicule par ID
router.get('/:id', async (req, res) => {
  try {
    const vehicule = await Vehicule.findById(req.params.id);
    if (!vehicule) {
      return res.status(404).json({ message: 'Véhicule non trouvé' });
    }
    res.json(vehicule);
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
});

// POST créer un véhicule
router.post('/', async (req, res) => {
  try {
    const vehicule = new Vehicule(req.body);
    await vehicule.save();
    res.status(201).json(vehicule);
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ message: 'Cette immatriculation existe déjà' });
    }
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
});

// PUT mettre à jour un véhicule
router.put('/:id', async (req, res) => {
  try {
    const vehicule = await Vehicule.findByIdAndUpdate(
      req.params.id,
      { ...req.body, dateModification: Date.now() },
      { new: true, runValidators: true }
    );
    if (!vehicule) {
      return res.status(404).json({ message: 'Véhicule non trouvé' });
    }
    res.json(vehicule);
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ message: 'Cette immatriculation existe déjà' });
    }
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
});

// DELETE supprimer un véhicule
router.delete('/:id', async (req, res) => {
  try {
    const vehicule = await Vehicule.findByIdAndDelete(req.params.id);
    if (!vehicule) {
      return res.status(404).json({ message: 'Véhicule non trouvé' });
    }
    res.json({ message: 'Véhicule supprimé avec succès' });
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
});

// POST ajouter un relevé kilométrique
router.post('/:id/kilometrage', async (req, res) => {
  try {
    const { date, valeur, photoUrl, notes } = req.body;

    if (!valeur || valeur < 0) {
      return res.status(400).json({ message: 'Valeur de kilométrage invalide' });
    }

    const vehicule = await Vehicule.findById(req.params.id);
    if (!vehicule) {
      return res.status(404).json({ message: 'Véhicule non trouvé' });
    }

    vehicule.historiqueKilometrage.push({
      date: date || new Date(),
      valeur,
      photoUrl,
      notes
    });

    await vehicule.save();
    res.json(vehicule);
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
});

// PUT modifier un relevé kilométrique
router.put('/:id/kilometrage/:entryId', async (req, res) => {
  try {
    const vehicule = await Vehicule.findById(req.params.id);
    if (!vehicule) return res.status(404).json({ message: 'Véhicule non trouvé' });

    const entry = vehicule.historiqueKilometrage.id(req.params.entryId);
    if (!entry) return res.status(404).json({ message: 'Relevé non trouvé' });

    const { date, valeur, photoUrl, notes } = req.body;
    if (date) entry.date = date;
    if (valeur !== undefined) entry.valeur = valeur;
    if (photoUrl !== undefined) entry.photoUrl = photoUrl;
    if (notes !== undefined) entry.notes = notes;

    await vehicule.save();
    res.json(vehicule);
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
});

// DELETE supprimer un relevé kilométrique
router.delete('/:id/kilometrage/:entryId', async (req, res) => {
  try {
    const vehicule = await Vehicule.findById(req.params.id);
    if (!vehicule) return res.status(404).json({ message: 'Véhicule non trouvé' });

    vehicule.historiqueKilometrage = vehicule.historiqueKilometrage.filter(
      e => e._id.toString() !== req.params.entryId
    );

    await vehicule.save();
    res.json(vehicule);
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
});

// POST ajouter un plein de carburant
router.post('/:id/carburant', async (req, res) => {
  try {
    const { date, litres, montant, prixLitre, ticketUrl, notes } = req.body;

    const vehicule = await Vehicule.findById(req.params.id);
    if (!vehicule) {
      return res.status(404).json({ message: 'Véhicule non trouvé' });
    }

    // Calculer le prix au litre si non fourni
    let calculatedPrixLitre = prixLitre;
    if (!calculatedPrixLitre && litres && montant) {
      calculatedPrixLitre = Math.round((montant / litres) * 1000) / 1000;
    }

    vehicule.historiqueCarburant.push({
      date: date || new Date(),
      litres,
      montant,
      prixLitre: calculatedPrixLitre,
      ticketUrl,
      notes
    });

    await vehicule.save();
    res.json(vehicule);
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
});

// PUT modifier un plein de carburant
router.put('/:id/carburant/:entryId', async (req, res) => {
  try {
    const vehicule = await Vehicule.findById(req.params.id);
    if (!vehicule) return res.status(404).json({ message: 'Véhicule non trouvé' });

    const entry = vehicule.historiqueCarburant.id(req.params.entryId);
    if (!entry) return res.status(404).json({ message: 'Plein non trouvé' });

    const { date, litres, montant, prixLitre, ticketUrl, notes } = req.body;
    if (date) entry.date = date;
    if (litres !== undefined) entry.litres = litres;
    if (montant !== undefined) entry.montant = montant;
    if (notes !== undefined) entry.notes = notes;
    if (ticketUrl !== undefined) entry.ticketUrl = ticketUrl;

    // Recalculer prix au litre si non fourni
    if (prixLitre !== undefined) {
      entry.prixLitre = prixLitre;
    } else if (entry.litres && entry.montant) {
      entry.prixLitre = Math.round((entry.montant / entry.litres) * 1000) / 1000;
    }

    await vehicule.save();
    res.json(vehicule);
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
});

// DELETE supprimer un plein de carburant
router.delete('/:id/carburant/:entryId', async (req, res) => {
  try {
    const vehicule = await Vehicule.findById(req.params.id);
    if (!vehicule) return res.status(404).json({ message: 'Véhicule non trouvé' });

    vehicule.historiqueCarburant = vehicule.historiqueCarburant.filter(
      e => e._id.toString() !== req.params.entryId
    );

    await vehicule.save();
    res.json(vehicule);
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
});

// POST ajouter un document
router.post('/:id/documents', async (req, res) => {
  try {
    const { type, dateExpiration, urlDocument, notes } = req.body;

    const vehicule = await Vehicule.findById(req.params.id);
    if (!vehicule) {
      return res.status(404).json({ message: 'Véhicule non trouvé' });
    }

    vehicule.documents.push({
      type,
      dateExpiration,
      urlDocument,
      notes
    });

    await vehicule.save();
    res.json(vehicule);
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
});

module.exports = router;
