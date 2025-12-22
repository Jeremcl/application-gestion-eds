const mongoose = require('mongoose');

const appareilPretSchema = new mongoose.Schema({
  // Informations de base
  type: {
    type: String,
    required: true
  },
  marque: String,
  modele: String,
  numeroSerie: {
    type: String,
    unique: true,
    sparse: true  // Permet null mais unique si défini
  },

  // Gestion statut
  statut: {
    type: String,
    enum: ['Disponible', 'Prêté', 'En maintenance'],
    default: 'Disponible'
  },

  // Informations détaillées
  etat: String,  // Neuf, Bon, Moyen, À réparer
  valeur: {
    type: Number,
    default: 0
  },
  dateAchat: Date,
  emplacement: String,  // Où est stocké l'appareil

  // Photo et accessoires
  photo: String,  // URL ou path de la photo
  accessoiresInclus: [String],  // ['Chargeur', 'Housse', 'Cable']
  conditionsPret: String,  // Conditions particulières

  // Métadonnées
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

// Middleware pour mise à jour automatique
appareilPretSchema.pre('save', function(next) {
  this.dateModification = Date.now();
  next();
});

module.exports = mongoose.model('AppareilPret', appareilPretSchema);
