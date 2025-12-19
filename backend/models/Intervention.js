const mongoose = require('mongoose');

const pieceUtiliseeSchema = new mongoose.Schema({
  pieceId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Piece'
  },
  quantite: Number,
  prixUnitaire: Number
}, { _id: false });

const interventionSchema = new mongoose.Schema({
  numero: {
    type: String,
    unique: true
  },
  clientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Client',
    required: true
  },
  appareil: {
    type: {
      type: String
    },
    marque: String,
    modele: String,
    numeroSerie: String
  },
  description: String,
  statut: {
    type: String,
    enum: ['Demande', 'Planifié', 'En cours', 'Diagnostic', 'Réparation', 'Terminé', 'Facturé'],
    default: 'Demande'
  },
  dateCreation: {
    type: Date,
    default: Date.now
  },
  datePrevue: Date,
  dateRealisation: Date,
  technicien: String,
  diagnostic: String,
  piecesUtilisees: [pieceUtiliseeSchema],
  tempsMainOeuvre: {
    type: Number,
    default: 0
  },
  tauxHoraire: {
    type: Number,
    default: 45
  },
  typeIntervention: {
    type: String,
    enum: ['Atelier', 'Domicile'],
    default: 'Atelier'
  },
  forfaitApplique: {
    type: Number,
    default: 0
  },
  coutTotal: {
    type: Number,
    default: 0
  },
  coutPieces: {
    type: Number,
    default: 0
  },
  coutMainOeuvre: {
    type: Number,
    default: 0
  },
  photos: [String],
  garantieJusquau: Date,
  notes: String,
  dateModification: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Auto-génération du numéro d'intervention
interventionSchema.pre('save', async function(next) {
  if (!this.numero) {
    const year = new Date().getFullYear();
    const count = await mongoose.model('Intervention').countDocuments();
    this.numero = `INT-${year}-${String(count + 1).padStart(4, '0')}`;
  }

  // Calcul automatique des coûts
  this.coutPieces = this.piecesUtilisees.reduce((sum, p) => sum + (p.quantite * p.prixUnitaire), 0);
  this.coutMainOeuvre = this.tempsMainOeuvre * this.tauxHoraire;
  this.coutTotal = this.forfaitApplique + this.coutPieces + this.coutMainOeuvre;

  // Garantie automatique (3 mois après réalisation)
  if (this.dateRealisation && !this.garantieJusquau) {
    const garantie = new Date(this.dateRealisation);
    garantie.setMonth(garantie.getMonth() + 3);
    this.garantieJusquau = garantie;
  }

  this.dateModification = Date.now();
  next();
});

module.exports = mongoose.model('Intervention', interventionSchema);
