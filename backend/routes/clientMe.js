/**
 * Routes protégées de l'espace membre client
 * Montées sur : /api/v1/me
 * Auth : cookie httpOnly `eds_token`
 *
 * GET  /api/v1/me/interventions  → historique des interventions du client connecté
 * POST /api/v1/me/reservations   → nouvelle demande sans re-saisir ses infos
 * GET  /api/v1/me/profile        → profil complet (appareils inclus)
 */
const express = require('express');
const router = express.Router();
const clientAuth = require('../middleware/clientAuth');
const Intervention = require('../models/Intervention');
const Client = require('../models/Client');

// Toutes ces routes nécessitent d'être connecté
router.use(clientAuth);

// ─── GET /api/v1/me/interventions ────────────────────────────────────────────
/**
 * Retourne l'historique des interventions du client connecté.
 * Triées par date de création décroissante. Paginées.
 */
router.get('/interventions', async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(20, Math.max(1, parseInt(req.query.limit) || 10));

    const query = { clientId: req.client._id };

    const interventions = await Intervention.find(query)
      .select('numero statut description appareil datePrevue dateCreation typeIntervention coutTotal')
      .sort({ dateCreation: -1 })
      .limit(limit)
      .skip((page - 1) * limit);

    const total = await Intervention.countDocuments(query);

    res.json({
      success: true,
      data: interventions,
      pagination: {
        total,
        totalPages: Math.ceil(total / limit),
        currentPage: page,
        limit
      }
    });
  } catch (error) {
    console.error('Erreur interventions membre:', error);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
});

// ─── GET /api/v1/me/profile ──────────────────────────────────────────────────
/**
 * Profil complet du client : infos + appareils enregistrés.
 */
router.get('/profile', async (req, res) => {
  try {
    const client = await Client.findById(req.client._id)
      .select('-passwordHash');

    res.json({ success: true, data: client });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
});

// ─── POST /api/v1/me/reservations ────────────────────────────────────────────
/**
 * Crée une demande d'intervention pour le client connecté.
 * Ses infos (nom, tel, email) sont récupérées automatiquement depuis son compte.
 *
 * Body : appareilType, appareilMarque, appareilModele, description*, dateSouhaitee, notes
 */
router.post('/reservations', async (req, res) => {
  try {
    const {
      appareilType = '',
      appareilMarque = '',
      appareilModele = '',
      description = '',
      dateSouhaitee,
      notes = ''
    } = req.body;

    if (!description.trim()) {
      return res.status(400).json({
        success: false,
        message: 'La description du problème est requise'
      });
    }

    const intervention = new (require('../models/Intervention'))({
      clientId: req.client._id,
      statut: 'Demande',
      description: description.trim(),
      appareil: {
        type: appareilType.trim() || undefined,
        marque: appareilMarque.trim() || undefined,
        modele: appareilModele.trim() || undefined
      },
      datePrevue: dateSouhaitee ? new Date(dateSouhaitee) : undefined,
      notes: notes.trim() || undefined
    });

    await intervention.save();

    res.status(201).json({
      success: true,
      message: 'Demande envoyée avec succès',
      numero: intervention.numero
    });
  } catch (error) {
    console.error('Erreur réservation membre:', error);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
});

module.exports = router;
