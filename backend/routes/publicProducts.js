/**
 * API REST publique v1 — Produits EDS22
 * Préfixe : /api/v1/products
 * Auth    : Authorization: Bearer <API_SECRET_KEY>
 * Usage   : Site web EDS22 pour afficher la boutique
 */
const express = require('express');
const router = express.Router();
const Produit = require('../models/Produit');
const apiKeyAuth = require('../middleware/apiKeyAuth');

// Tous les endpoints de cette route nécessitent la clé API
router.use(apiKeyAuth);

/**
 * GET /api/v1/products
 * Retourne uniquement les produits disponibles sur le site (disponibleSurSite = true)
 * Supporte : pagination, filtres categorie et etat
 */
router.get('/', async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      categorie = '',
      etat = ''
    } = req.query;

    const pageNum = Math.max(1, parseInt(page));
    const limitNum = Math.min(100, Math.max(1, parseInt(limit)));

    let query = {
      actif: true,
      disponibleSurSite: true
    };

    if (categorie) query.categorie = categorie;
    if (etat) query.etat = etat;

    const produits = await Produit.find(query)
      .select('-prixAchat') // Ne pas exposer le prix d'achat publiquement
      .sort({ dateCreation: -1 })
      .limit(limitNum)
      .skip((pageNum - 1) * limitNum);

    const count = await Produit.countDocuments(query);

    res.json({
      success: true,
      data: produits,
      pagination: {
        total: count,
        totalPages: Math.ceil(count / limitNum),
        currentPage: pageNum,
        limit: limitNum
      },
      filters: {
        categories: ['Téléphones', 'Tablettes', 'Ordinateurs', 'Électroménager', 'TV/Écrans', 'Consoles', 'Accessoires', 'Autre'],
        etats: ['neuf', 'reconditionné', 'piece_detachee']
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Erreur serveur', error: error.message });
  }
});

/**
 * GET /api/v1/products/:id
 * Détail d'un produit (uniquement s'il est disponible sur le site)
 */
router.get('/:id', async (req, res) => {
  try {
    const produit = await Produit.findOne({
      _id: req.params.id,
      actif: true,
      disponibleSurSite: true
    }).select('-prixAchat');

    if (!produit) {
      return res.status(404).json({ success: false, message: 'Produit non trouvé' });
    }

    res.json({ success: true, data: produit });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Erreur serveur', error: error.message });
  }
});

/**
 * POST /api/v1/products
 * Créer un produit (usage interne/admin via API externe)
 */
router.post('/', async (req, res) => {
  try {
    const produit = new Produit(req.body);
    await produit.save();
    res.status(201).json({ success: true, data: produit });
  } catch (error) {
    if (error.name === 'ValidationError') {
      return res.status(400).json({ success: false, message: 'Données invalides', error: error.message });
    }
    res.status(500).json({ success: false, message: 'Erreur serveur', error: error.message });
  }
});

/**
 * PATCH /api/v1/products/:id
 * Modifier un produit
 */
router.patch('/:id', async (req, res) => {
  try {
    const produit = await Produit.findByIdAndUpdate(
      req.params.id,
      { ...req.body, dateModification: Date.now() },
      { new: true, runValidators: true }
    );
    if (!produit) {
      return res.status(404).json({ success: false, message: 'Produit non trouvé' });
    }
    res.json({ success: true, data: produit });
  } catch (error) {
    if (error.name === 'ValidationError') {
      return res.status(400).json({ success: false, message: 'Données invalides', error: error.message });
    }
    res.status(500).json({ success: false, message: 'Erreur serveur', error: error.message });
  }
});

/**
 * DELETE /api/v1/products/:id
 * Supprimer un produit (soft delete — le retire du site et désactive)
 */
router.delete('/:id', async (req, res) => {
  try {
    const produit = await Produit.findByIdAndUpdate(
      req.params.id,
      { actif: false, disponibleSurSite: false, dateModification: Date.now() },
      { new: true }
    );
    if (!produit) {
      return res.status(404).json({ success: false, message: 'Produit non trouvé' });
    }
    res.json({ success: true, message: 'Produit supprimé (soft delete)' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Erreur serveur', error: error.message });
  }
});

module.exports = router;
