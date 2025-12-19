const mongoose = require('mongoose');

const pieceSchema = new mongoose.Schema({
  reference: {
    type: String,
    required: true,
    unique: true
  },
  designation: {
    type: String,
    required: true
  },
  marque: String,
  modelesCompatibles: [String],
  emplacement: String, // Code A1-B2, Z2C3...
  quantiteStock: {
    type: Number,
    default: 0
  },
  quantiteMinimum: {
    type: Number,
    default: 5
  },
  prixAchat: {
    type: Number,
    required: true
  },
  prixVente: {
    type: Number,
    required: true
  },
  fournisseur: String,
  fournisseurRef: String,
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

pieceSchema.pre('save', function(next) {
  this.dateModification = Date.now();
  next();
});

module.exports = mongoose.model('Piece', pieceSchema);
