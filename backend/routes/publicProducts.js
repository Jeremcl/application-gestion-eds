/**
 * API REST publique v1 — EDS22
 * Monté sur : /api/v1
 * Auth      : Authorization: Bearer <API_SECRET_KEY>
 * Usage     : Site web EDS22
 *
 * Endpoints :
 *   GET  /api/v1/categories          → liste des catégories
 *   GET  /api/v1/products            → produits publiés (paginés, filtrables)
 *   GET  /api/v1/products/:id        → détail d'un produit
 *   POST /api/v1/products            → créer un produit
 *   PATCH /api/v1/products/:id       → modifier un produit
 *   DELETE /api/v1/products/:id      → soft delete
 */
const express = require('express');
const router = express.Router();
const Produit = require('../models/Produit');
const apiKeyAuth = require('../middleware/apiKeyAuth');

// ─── Source de vérité unique pour les catégories EDS22 ───────────────────────
const CATEGORIES = [
  {
    slug: 'lavage',
    label: 'Lavage',
    description: 'Machines à laver, sèche-linge, lave-vaisselle'
  },
  {
    slug: 'cuisson',
    label: 'Cuisson',
    description: 'Fours, plaques de cuisson, hottes'
  },
  {
    slug: 'multimedia',
    label: 'Multimédia',
    description: 'TV, audio-visuel, informatique, smartphones'
  },
  {
    slug: 'appareils-reconditiones',
    label: 'Appareils Reconditionnés',
    description: 'Appareils remis en état par EDS22'
  },
  {
    slug: 'pieces-detachees',
    label: 'Pièces Détachées',
    description: 'Pièces de remplacement pour électroménager'
  }
];

const CATEGORY_LABELS = CATEGORIES.map(c => c.label);

// Tous les endpoints nécessitent la clé API
router.use(apiKeyAuth);

// ─── GET /api/v1/categories ───────────────────────────────────────────────────
/**
 * Retourne la liste complète des catégories avec slug, label et description.
 * Utilisé par le site web pour construire ses menus dynamiquement.
 */
router.get('/categories', (req, res) => {
  res.json({
    success: true,
    data: CATEGORIES
  });
});

// ─── GET /api/v1/products ─────────────────────────────────────────────────────
/**
 * Retourne uniquement les produits disponibles sur le site (disponibleSurSite = true).
 * Paramètres query : page, limit, categorie (label exact), etat
 */
router.get('/products', async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      categorie = '',
      etat = ''
    } = req.query;

    const pageNum = Math.max(1, parseInt(page));
    const limitNum = Math.min(100, Math.max(1, parseInt(limit)));

    const query = { actif: true, disponibleSurSite: true };

    if (categorie && CATEGORY_LABELS.includes(categorie)) {
      query.categorie = categorie;
    }
    if (etat) query.etat = etat;

    const produits = await Produit.find(query)
      .select('-prixAchat') // prix d'achat non exposé publiquement
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
        categories: CATEGORY_LABELS,
        etats: ['neuf', 'reconditionné', 'piece_detachee']
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Erreur serveur', error: error.message });
  }
});

// ─── GET /api/v1/products/:id ─────────────────────────────────────────────────
router.get('/products/:id', async (req, res) => {
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

// ─── POST /api/v1/products ────────────────────────────────────────────────────
router.post('/products', async (req, res) => {
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

// ─── PATCH /api/v1/products/:id ───────────────────────────────────────────────
router.patch('/products/:id', async (req, res) => {
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

// ─── DELETE /api/v1/products/:id ──────────────────────────────────────────────
router.delete('/products/:id', async (req, res) => {
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
