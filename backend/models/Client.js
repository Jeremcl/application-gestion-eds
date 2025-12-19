const mongoose = require('mongoose');

const appareilSchema = new mongoose.Schema({
  type: String,
  marque: String,
  modele: String,
  numeroSerie: String
}, { _id: true });

const clientSchema = new mongoose.Schema({
  nom: {
    type: String,
    required: true
  },
  prenom: {
    type: String,
    required: true
  },
  adresse: String,
  codePostal: String,
  ville: String,
  telephone: {
    type: String,
    required: true
  },
  email: String,
  appareils: [appareilSchema],
  notes: String,
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

// Mise à jour automatique de dateModification
clientSchema.pre('save', function(next) {
  this.dateModification = Date.now();
  next();
});

module.exports = mongoose.model('Client', clientSchema);
