const mongoose = require('mongoose');

const pretSchema = new mongoose.Schema({
  appareilPretId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'AppareilPret',
    required: true
  },
  clientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Client',
    required: true
  },
  interventionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Intervention',
    required: false  // Optionnel
  },

  // Dates
  datePret: {
    type: Date,
    default: Date.now,
    required: true
  },
  dateRetourPrevue: Date,
  dateRetourEffectif: Date,

  // Informations
  statut: {
    type: String,
    enum: ['En cours', 'Retourné', 'Retard'],
    default: 'En cours'
  },
  etatDepart: String,  // État à la sortie
  etatRetour: String,  // État au retour
  notes: String,

  // Métadonnées
  dateCreation: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Calculer automatiquement le statut en fonction des dates
pretSchema.pre('save', function(next) {
  if (this.dateRetourEffectif) {
    this.statut = 'Retourné';
  } else if (this.dateRetourPrevue && new Date() > new Date(this.dateRetourPrevue)) {
    this.statut = 'Retard';
  } else {
    this.statut = 'En cours';
  }
  next();
});

module.exports = mongoose.model('Pret', pretSchema);
