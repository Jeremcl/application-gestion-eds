const mongoose = require('mongoose');

const ligneSchema = new mongoose.Schema({
  description: String,
  quantite: Number,
  prixUnitaire: Number,
  total: Number
}, { _id: false });

const factureSchema = new mongoose.Schema({
  numero: {
    type: String,
    unique: true
  },
  type: {
    type: String,
    enum: ['Devis', 'Facture'],
    default: 'Facture'
  },
  interventionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Intervention'
  },
  clientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Client',
    required: true
  },
  dateEmission: {
    type: Date,
    default: Date.now
  },
  dateEcheance: Date,
  lignes: [ligneSchema],
  sousTotal: {
    type: Number,
    default: 0
  },
  tva: {
    type: Number,
    default: 20
  },
  totalTTC: {
    type: Number,
    default: 0
  },
  statut: {
    type: String,
    enum: ['Brouillon', 'Émis', 'Payé'],
    default: 'Brouillon'
  },
  datePaiement: Date,
  modePaiement: String
}, {
  timestamps: true
});

// Auto-génération du numéro de facture
factureSchema.pre('save', async function(next) {
  if (!this.numero) {
    const year = new Date().getFullYear();
    const count = await mongoose.model('Facture').countDocuments();
    this.numero = `FAC-${year}-${String(count + 1).padStart(4, '0')}`;
  }

  // Calcul automatique des totaux
  this.sousTotal = this.lignes.reduce((sum, l) => sum + l.total, 0);
  this.totalTTC = this.sousTotal * (1 + this.tva / 100);

  // Date d'échéance automatique (J+30)
  if (!this.dateEcheance && this.dateEmission) {
    const echeance = new Date(this.dateEmission);
    echeance.setDate(echeance.getDate() + 30);
    this.dateEcheance = echeance;
  }

  next();
});

module.exports = mongoose.model('Facture', factureSchema);
