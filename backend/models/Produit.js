const mongoose = require('mongoose');

const produitSchema = new mongoose.Schema({
  nom: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    default: ''
  },
  categorie: {
    type: String,
    enum: ['Téléphones', 'Tablettes', 'Ordinateurs', 'Électroménager', 'TV/Écrans', 'Consoles', 'Accessoires', 'Autre'],
    default: 'Autre'
  },
  prixVente: {
    type: Number,
    required: true,
    min: 0
  },
  prixAchat: {
    type: Number,
    default: 0,
    min: 0
  },
  stockDisponible: {
    type: Number,
    default: 0,
    min: 0
  },
  stockMinimum: {
    type: Number,
    default: 2
  },
  images: [{
    type: String
  }],
  etat: {
    type: String,
    enum: ['neuf', 'reconditionné', 'piece_detachee'],
    default: 'reconditionné'
  },
  disponibleSurSite: {
    type: Boolean,
    default: false
  },
  sku: {
    type: String,
    default: '',
    trim: true
  },
  actif: {
    type: Boolean,
    default: true
  },
  dateCreation: {
    type: Date,
    default: Date.now
  },
  dateModification: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

produitSchema.pre('save', function(next) {
  this.dateModification = Date.now();
  next();
});

// Index pour la recherche full-text
produitSchema.index({ nom: 'text', description: 'text', sku: 'text' });

module.exports = mongoose.model('Produit', produitSchema);
