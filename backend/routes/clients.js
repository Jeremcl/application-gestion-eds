const express = require('express');
const router = express.Router();
const Client = require('../models/Client');
const Intervention = require('../models/Intervention');
const authMiddleware = require('../middleware/auth');

// Toutes les routes nécessitent l'authentification
router.use(authMiddleware);

// GET tous les clients avec pagination et recherche
router.get('/', async (req, res) => {
  try {
    const { page = 1, limit = 20, search = '' } = req.query;

    const query = search ? {
      $or: [
        { nom: { $regex: search, $options: 'i' } },
        { prenom: { $regex: search, $options: 'i' } },
        { telephone: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ]
    } : {};

    const clients = await Client.find(query)
      .sort({ dateCreation: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const count = await Client.countDocuments(query);

    res.json({
      clients,
      totalPages: Math.ceil(count / limit),
      currentPage: page,
      total: count
    });
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
});

// GET un client par ID
router.get('/:id', async (req, res) => {
  try {
    console.log('📋 Récupération client avec ID:', req.params.id);

    // Vérifier si l'ID est un ObjectId valide
    if (!req.params.id.match(/^[0-9a-fA-F]{24}$/)) {
      console.log('❌ ID invalide (pas un ObjectId):', req.params.id);
      return res.status(400).json({ message: 'ID client invalide' });
    }

    const client = await Client.findById(req.params.id);
    if (!client) {
      console.log('❌ Client non trouvé avec ID:', req.params.id);
      return res.status(404).json({ message: 'Client non trouvé' });
    }

    console.log('✅ Client trouvé:', client.nom, client.prenom);
    res.json(client);
  } catch (error) {
    console.error('💥 Erreur lors de la récupération du client:', error);
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
});

// POST créer un nouveau client
router.post('/', async (req, res) => {
  try {
    const client = new Client(req.body);
    await client.save();
    res.status(201).json(client);
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
});

// PUT mettre à jour un client
router.put('/:id', async (req, res) => {
  try {
    const client = await Client.findByIdAndUpdate(
      req.params.id,
      { ...req.body, dateModification: Date.now() },
      { new: true, runValidators: true }
    );
    if (!client) {
      return res.status(404).json({ message: 'Client non trouvé' });
    }
    res.json(client);
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
});

// DELETE supprimer un client
router.delete('/:id', async (req, res) => {
  try {
    const client = await Client.findByIdAndDelete(req.params.id);
    if (!client) {
      return res.status(404).json({ message: 'Client non trouvé' });
    }
    res.json({ message: 'Client supprimé avec succès' });
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
});

// GET tous les appareils d'un client avec le nombre d'interventions
router.get('/:id/appareils', async (req, res) => {
  try {
    const client = await Client.findById(req.params.id);
    if (!client) {
      return res.status(404).json({ message: 'Client non trouvé' });
    }

    // Compter les interventions par appareil
    const appareilsWithCounts = await Promise.all(
      client.appareils.map(async (appareil) => {
        const count = await Intervention.countDocuments({
          clientId: client._id,
          appareilId: appareil._id
        });
        return {
          ...appareil.toObject(),
          interventionCount: count
        };
      })
    );

    res.json(appareilsWithCounts);
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
});

// GET un appareil spécifique d'un client
router.get('/:clientId/appareils/:appareilId', async (req, res) => {
  try {
    const client = await Client.findById(req.params.clientId);
    if (!client) {
      return res.status(404).json({ message: 'Client non trouvé' });
    }

    const appareil = client.appareils.id(req.params.appareilId);
    if (!appareil) {
      return res.status(404).json({ message: 'Appareil non trouvé' });
    }

    res.json({
      appareil: appareil,
      client: {
        _id: client._id,
        nom: client.nom,
        prenom: client.prenom,
        telephone: client.telephone,
        email: client.email
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
});

// GET les interventions d'un appareil spécifique
router.get('/:clientId/appareils/:appareilId/interventions', async (req, res) => {
  try {
    const { page = 1, limit = 100, statut } = req.query;

    // Construire la requête
    const query = {
      clientId: req.params.clientId,
      $or: [
        { appareilId: req.params.appareilId },
        // Fallback pour interventions legacy sans appareilId
        {
          appareilId: { $exists: false },
          $and: await (async () => {
            const client = await Client.findById(req.params.clientId);
            if (!client) return [];
            const appareil = client.appareils.id(req.params.appareilId);
            if (!appareil) return [];

            const conditions = [];
            if (appareil.type) conditions.push({ 'appareil.type': appareil.type });
            if (appareil.marque) conditions.push({ 'appareil.marque': appareil.marque });
            if (appareil.modele) conditions.push({ 'appareil.modele': appareil.modele });
            if (appareil.numeroSerie) conditions.push({ 'appareil.numeroSerie': appareil.numeroSerie });

            return conditions.length > 0 ? conditions : [{ _id: null }];
          })()
        }
      ]
    };

    if (statut) {
      query.statut = statut;
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

// PUT mettre à jour un appareil
router.put('/:clientId/appareils/:appareilId', async (req, res) => {
  try {
    const client = await Client.findById(req.params.clientId);
    if (!client) {
      return res.status(404).json({ message: 'Client non trouvé' });
    }

    const appareil = client.appareils.id(req.params.appareilId);
    if (!appareil) {
      return res.status(404).json({ message: 'Appareil non trouvé' });
    }

    // Mettre à jour les champs de l'appareil
    Object.assign(appareil, req.body);
    client.dateModification = Date.now();

    await client.save();

    res.json(appareil);
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
});

// DELETE supprimer un appareil
router.delete('/:clientId/appareils/:appareilId', async (req, res) => {
  try {
    const client = await Client.findById(req.params.clientId);
    if (!client) {
      return res.status(404).json({ message: 'Client non trouvé' });
    }

    // Vérifier s'il y a des interventions liées
    const interventionCount = await Intervention.countDocuments({
      appareilId: req.params.appareilId
    });

    if (interventionCount > 0) {
      return res.status(400).json({
        message: `Impossible de supprimer l'appareil. ${interventionCount} intervention(s) y sont liées.`
      });
    }

    // Supprimer l'appareil
    client.appareils.pull(req.params.appareilId);
    client.dateModification = Date.now();
    await client.save();

    res.json({ message: 'Appareil supprimé avec succès' });
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
});

module.exports = router;
