const mongoose = require('mongoose');

const vehiculeSchema = new mongoose.Schema({
  nom: {
    type: String,
    required: true
  },
  marque: String,
  typeVehicule: {
    type: String,
    enum: ['Utilitaire', 'Fourgon'],
    default: 'Utilitaire'
  },
  immatriculation: {
    type: String,
    unique: true,
    sparse: true
  },
  statut: {
    type: String,
    enum: ['Disponible', 'En utilisation', 'En maintenance'],
    default: 'Disponible'
  },
  kilometrageActuel: {
    type: Number,
    default: 0
  },

  // Historique des relevés kilométriques
  historiqueKilometrage: [{
    date: {
      type: Date,
      default: Date.now
    },
    valeur: {
      type: Number,
      required: true
    },
    notes: String
  }],

  // Historique des pleins de carburant
  historiqueCarburant: [{
    date: {
      type: Date,
      default: Date.now
    },
    litres: Number,
    montant: Number,
    prixLitre: Number,
    ticketUrl: String,
    notes: String
  }],

  // Documents du véhicule
  documents: [{
    type: {
      type: String,
      enum: ['Carte grise', 'Assurance', 'Controle technique', 'Autre']
    },
    dateExpiration: Date,
    urlDocument: String,
    notes: String
  }],

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

// Middleware pre-save pour mettre à jour le kilométrage actuel
vehiculeSchema.pre('save', function(next) {
  this.dateModification = Date.now();

  // Mettre à jour le kilométrage actuel avec la dernière valeur de l'historique
  if (this.historiqueKilometrage && this.historiqueKilometrage.length > 0) {
    // Trier par date décroissante et prendre le plus récent
    const sorted = [...this.historiqueKilometrage].sort((a, b) =>
      new Date(b.date) - new Date(a.date)
    );
    this.kilometrageActuel = sorted[0].valeur;
  }

  next();
});

module.exports = mongoose.model('Vehicule', vehiculeSchema);
