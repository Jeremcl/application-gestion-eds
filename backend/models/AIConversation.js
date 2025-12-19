const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  role: {
    type: String,
    enum: ['user', 'assistant'],
    required: true
  },
  content: {
    type: String,
    required: true
  },
  timestamp: {
    type: Date,
    default: Date.now
  },
  contexte: mongoose.Schema.Types.Mixed
}, { _id: false });

const aiConversationSchema = new mongoose.Schema({
  sessionId: {
    type: String,
    unique: true,
    required: true
  },
  utilisateur: String,
  messages: [messageSchema],
  contextePrincipal: {
    type: {
      type: String
    },
    entityId: mongoose.Schema.Types.ObjectId
  },
  dateCreation: {
    type: Date,
    default: Date.now
  },
  derniereActivite: {
    type: Date,
    default: Date.now
  },
  active: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

aiConversationSchema.pre('save', function(next) {
  this.derniereActivite = Date.now();
  next();
});

module.exports = mongoose.model('AIConversation', aiConversationSchema);
