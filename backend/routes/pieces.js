const express = require('express');
const router = express.Router();
const Piece = require('../models/Piece');
const authMiddleware = require('../middleware/auth');

router.use(authMiddleware);

// GET toutes les pièces avec pagination et filtres
router.get('/', async (req, res) => {
  try {
    const { page = 1, limit = 20, search = '', stockCritique = false } = req.query;

    let query = { actif: true };

    if (search) {
      query.$or = [
        { reference: { $regex: search, $options: 'i' } },
        { designation: { $regex: search, $options: 'i' } },
        { marque: { $regex: search, $options: 'i' } }
      ];
    }

    if (stockCritique === 'true') {
      query.$expr = { $lt: ['$quantiteStock', '$quantiteMinimum'] };
    }

    const pieces = await Piece.find(query)
      .sort({ dateCreation: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const count = await Piece.countDocuments(query);

    res.json({
      pieces,
      totalPages: Math.ceil(count / limit),
      currentPage: page,
      total: count
    });
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
});

// GET alertes stock (pièces sous le minimum)
router.get('/alertes', async (req, res) => {
  try {
    const pieces = await Piece.find({
      actif: true,
      $expr: { $lt: ['$quantiteStock', '$quantiteMinimum'] }
    }).sort({ quantiteStock: 1 });

    res.json({
      count: pieces.length,
      pieces
    });
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
});

// GET une pièce par ID
router.get('/:id', async (req, res) => {
  try {
    const piece = await Piece.findById(req.params.id);
    if (!piece) {
      return res.status(404).json({ message: 'Pièce non trouvée' });
    }
    res.json(piece);
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
});

// POST créer une nouvelle pièce
router.post('/', async (req, res) => {
  try {
    const piece = new Piece(req.body);
    await piece.save();
    res.status(201).json(piece);
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
});

// PUT mettre à jour une pièce
router.put('/:id', async (req, res) => {
  try {
    const piece = await Piece.findByIdAndUpdate(
      req.params.id,
      { ...req.body, dateModification: Date.now() },
      { new: true, runValidators: true }
    );
    if (!piece) {
      return res.status(404).json({ message: 'Pièce non trouvée' });
    }
    res.json(piece);
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
});

// DELETE supprimer une pièce (soft delete)
router.delete('/:id', async (req, res) => {
  try {
    const piece = await Piece.findByIdAndUpdate(
      req.params.id,
      { actif: false, dateModification: Date.now() },
      { new: true }
    );
    if (!piece) {
      return res.status(404).json({ message: 'Pièce non trouvée' });
    }
    res.json({ message: 'Pièce désactivée avec succès' });
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
});

module.exports = router;
