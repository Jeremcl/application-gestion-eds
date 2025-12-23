const mongoose = require('mongoose');

const ficheInterneSchema = new mongoose.Schema({
  type: {
    type: String,
    required: true,
    enum: ['DA1.1', 'AEA1.1', 'AP1.1']
  },
  numero: {
    type: String,
    required: true,
    unique: true
  },
  clientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Client',
    required: false
  },
  appareilPretId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'AppareilPret',
    required: false
  },
  data: {
    type: mongoose.Schema.Types.Mixed,
    required: true
  },
  dateGeneration: {
    type: Date,
    default: Date.now
  },
  generePar: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: false
  }
}, {
  timestamps: true
});

// Génération automatique du numéro de fiche
ficheInterneSchema.pre('save', async function(next) {
  if (!this.numero) {
    const count = await this.constructor.countDocuments({ type: this.type });
    const prefix = this.type.replace('.', '');
    this.numero = `${prefix}-${String(count + 1).padStart(6, '0')}`;
  }
  next();
});

module.exports = mongoose.model('FicheInterne', ficheInterneSchema);
