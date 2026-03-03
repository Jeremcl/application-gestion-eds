/**
 * Routes protégées de l'espace membre client
 * Montées sur : /api/v1/me
 * Auth : cookie httpOnly `eds_token` OU header Authorization: Bearer <token>
 *
 * GET   /api/v1/me/interventions  → historique des interventions du client connecté
 * POST  /api/v1/me/reservations   → nouvelle demande (supporte appareilId)
 * GET   /api/v1/me/profile        → profil complet (appareils inclus)
 * PATCH /api/v1/me/profile        → mise à jour du profil (adresseRue, codePostal, ville, telephoneSecondaire)
 * GET   /api/v1/me/appareils      → liste des appareils enregistrés
 * POST  /api/v1/me/appareils      → ajouter un appareil
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

// ─── PATCH /api/v1/me/profile ────────────────────────────────────────────────
/**
 * Met à jour le profil du client connecté.
 * Champs autorisés : adresseRue, codePostal, ville, telephoneSecondaire
 * Les champs sensibles (email, telephone, nom, passwordHash) ne sont pas modifiables ici.
 */
router.patch('/profile', async (req, res) => {
  try {
    const CHAMPS_AUTORISES = ['adresseRue', 'codePostal', 'ville', 'telephoneSecondaire'];
    const updates = {};

    for (const champ of CHAMPS_AUTORISES) {
      if (req.body[champ] !== undefined) {
        updates[champ] = typeof req.body[champ] === 'string' ? req.body[champ].trim() : req.body[champ];
      }
    }

    const client = await Client.findByIdAndUpdate(
      req.client._id,
      { ...updates, dateModification: Date.now() },
      { new: true, runValidators: true }
    ).select('-passwordHash');

    res.json({ success: true, data: client });
  } catch (error) {
    console.error('Erreur mise à jour profil membre:', error);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
});

// ─── GET /api/v1/me/appareils ────────────────────────────────────────────────
/**
 * Retourne la liste des appareils enregistrés pour le client connecté.
 * Réponse : { success: true, data: [ { _id, type, marque, modele }, ... ] }
 */
router.get('/appareils', async (req, res) => {
  try {
    const client = await Client.findById(req.client._id).select('appareils');
    res.json({ success: true, data: client.appareils || [] });
  } catch (error) {
    console.error('Erreur appareils membre:', error);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
});

// ─── POST /api/v1/me/appareils ───────────────────────────────────────────────
/**
 * Ajoute un appareil au profil du client connecté.
 * Body : { type: string, marque?: string, modele?: string }
 * Réponse : { success: true, data: { _id, type, marque, modele } }
 */
router.post('/appareils', async (req, res) => {
  try {
    const { type, marque = '', modele = '' } = req.body;

    if (!type || !type.trim()) {
      return res.status(400).json({ success: false, message: 'Le type d\'appareil est requis' });
    }

    const client = await Client.findById(req.client._id);

    const nouvelAppareil = {
      type: type.trim(),
      marque: marque.trim() || undefined,
      modele: modele.trim() || undefined
    };

    client.appareils.push(nouvelAppareil);
    await client.save();

    // Récupérer l'appareil avec son _id généré par Mongoose
    const appareilAjoute = client.appareils[client.appareils.length - 1];

    res.status(201).json({
      success: true,
      data: {
        _id: appareilAjoute._id,
        type: appareilAjoute.type,
        marque: appareilAjoute.marque,
        modele: appareilAjoute.modele
      }
    });
  } catch (error) {
    console.error('Erreur ajout appareil membre:', error);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
});

// ─── POST /api/v1/me/reservations ────────────────────────────────────────────
/**
 * Crée une demande d'intervention pour le client connecté.
 * Ses infos sont récupérées automatiquement depuis son compte.
 *
 * Body :
 *   description*       — description du problème (obligatoire)
 *   appareilId?        — _id d'un appareil existant du client (optionnel)
 *   appareilType?      — type libre si pas d'appareilId
 *   appareilMarque?    — marque libre si pas d'appareilId
 *   appareilModele?    — modele libre si pas d'appareilId
 *   dateSouhaitee?     — date souhaitée d'intervention
 *   notes?             — notes complémentaires
 */
router.post('/reservations', async (req, res) => {
  try {
    const {
      appareilId,
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

    // Si appareilId fourni, récupérer les infos depuis le profil client
    let appareilData = {
      type: appareilType.trim() || undefined,
      marque: appareilMarque.trim() || undefined,
      modele: appareilModele.trim() || undefined
    };

    if (appareilId) {
      const client = await Client.findById(req.client._id).select('appareils');
      const appareil = client.appareils.id(appareilId);
      if (appareil) {
        appareilData = {
          type: appareil.type,
          marque: appareil.marque,
          modele: appareil.modele
        };
      }
    }

    const intervention = new Intervention({
      clientId: req.client._id,
      appareilId: appareilId || undefined,
      statut: 'Demande',
      description: description.trim(),
      appareil: appareilData,
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
