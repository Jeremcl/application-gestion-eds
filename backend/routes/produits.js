const express = require('express');
const router = express.Router();
const Produit = require('../models/Produit');
const authMiddleware = require('../middleware/auth');

// Toutes les routes internes nécessitent un JWT valide
router.use(authMiddleware);

// GET tous les produits avec pagination et filtres
router.get('/', async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      search = '',
      categorie = '',
      etat = '',
      disponibleSurSite = '',
      stockFaible = false
    } = req.query;

    let query = { actif: true };

    if (search) {
      query.$or = [
        { nom: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { sku: { $regex: search, $options: 'i' } }
      ];
    }

    if (categorie) query.categorie = categorie;
    if (etat) query.etat = etat;
    if (disponibleSurSite === 'true') query.disponibleSurSite = true;
    if (disponibleSurSite === 'false') query.disponibleSurSite = false;

    if (stockFaible === 'true') {
      query.$expr = { $lt: ['$stockDisponible', '$stockMinimum'] };
    }

    const produits = await Produit.find(query)
      .sort({ dateCreation: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const count = await Produit.countDocuments(query);

    res.json({
      produits,
      totalPages: Math.ceil(count / limit),
      currentPage: Number(page),
      total: count
    });
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
});

// GET alertes stock faible
router.get('/alertes-stock', async (req, res) => {
  try {
    const produits = await Produit.find({
      actif: true,
      $expr: { $lt: ['$stockDisponible', '$stockMinimum'] }
    }).sort({ stockDisponible: 1 });

    res.json({ count: produits.length, produits });
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
});

// GET un produit par ID
router.get('/:id', async (req, res) => {
  try {
    const produit = await Produit.findById(req.params.id);
    if (!produit || !produit.actif) {
      return res.status(404).json({ message: 'Produit non trouvé' });
    }
    res.json(produit);
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
});

// POST créer un produit
router.post('/', async (req, res) => {
  try {
    const produit = new Produit(req.body);
    await produit.save();
    res.status(201).json(produit);
  } catch (error) {
    if (error.name === 'ValidationError') {
      return res.status(400).json({ message: 'Données invalides', error: error.message });
    }
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
});

// PUT mettre à jour un produit
router.put('/:id', async (req, res) => {
  try {
    const produit = await Produit.findByIdAndUpdate(
      req.params.id,
      { ...req.body, dateModification: Date.now() },
      { new: true, runValidators: true }
    );
    if (!produit) {
      return res.status(404).json({ message: 'Produit non trouvé' });
    }
    res.json(produit);
  } catch (error) {
    if (error.name === 'ValidationError') {
      return res.status(400).json({ message: 'Données invalides', error: error.message });
    }
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
});

// PATCH toggle visibilité sur le site
router.patch('/:id/visibilite', async (req, res) => {
  try {
    const produit = await Produit.findById(req.params.id);
    if (!produit) {
      return res.status(404).json({ message: 'Produit non trouvé' });
    }
    produit.disponibleSurSite = !produit.disponibleSurSite;
    produit.dateModification = Date.now();
    await produit.save();
    res.json({ disponibleSurSite: produit.disponibleSurSite, produit });
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
});

// DELETE supprimer un produit (soft delete)
router.delete('/:id', async (req, res) => {
  try {
    const produit = await Produit.findByIdAndUpdate(
      req.params.id,
      { actif: false, disponibleSurSite: false, dateModification: Date.now() },
      { new: true }
    );
    if (!produit) {
      return res.status(404).json({ message: 'Produit non trouvé' });
    }
    res.json({ message: 'Produit supprimé avec succès' });
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
});

module.exports = router;
