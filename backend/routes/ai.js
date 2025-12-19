const express = require('express');
const router = express.Router();
const AIConversation = require('../models/AIConversation');
const Intervention = require('../models/Intervention');
const Client = require('../models/Client');
const Piece = require('../models/Piece');
const authMiddleware = require('../middleware/auth');

router.use(authMiddleware);

// Fonction pour générer une réponse mockée de l'assistant IA
const generateMockResponse = async (userMessage) => {
  const message = userMessage.toLowerCase();

  // Réponses pour les statistiques
  if (message.includes('stat') || message.includes('chiffre')) {
    const today = new Date();
    const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
    const interventionsMois = await Intervention.countDocuments({ dateCreation: { $gte: monthStart } });
    const caResult = await Intervention.aggregate([
      { $match: { dateCreation: { $gte: monthStart }, statut: 'Facturé' } },
      { $group: { _id: null, total: { $sum: '$coutTotal' } } }
    ]);
    const ca = caResult.length > 0 ? caResult[0].total : 0;

    return `📊 Voici les statistiques du mois :\n\n• ${interventionsMois} interventions réalisées\n• Chiffre d'affaires : ${ca.toFixed(2)}€\n• Taux de satisfaction : 94%\n\nVoulez-vous plus de détails ?`;
  }

  // Réponses pour le stock
  if (message.includes('stock') || message.includes('pièce')) {
    const stockCritique = await Piece.countDocuments({
      actif: true,
      $expr: { $lt: ['$quantiteStock', '$quantiteMinimum'] }
    });

    if (stockCritique > 0) {
      return `⚠️ Attention ! ${stockCritique} pièce${stockCritique > 1 ? 's' : ''} en stock critique.\n\nJe vous recommande de passer une commande rapidement pour éviter toute rupture.`;
    } else {
      return `✅ Le stock est bien approvisionné ! Toutes les pièces sont au-dessus du seuil minimum.`;
    }
  }

  // Réponses pour les clients
  if (message.includes('client')) {
    const totalClients = await Client.countDocuments();
    return `👥 Vous avez actuellement ${totalClients} clients dans votre base.\n\nQue souhaitez-vous faire ?\n• Rechercher un client\n• Créer une nouvelle fiche\n• Voir les derniers ajouts`;
  }

  // Réponses pour les interventions
  if (message.includes('intervention') || message.includes('réparation')) {
    const enCours = await Intervention.countDocuments({ statut: { $in: ['En cours', 'Diagnostic', 'Réparation'] } });
    return `🔧 ${enCours} intervention${enCours > 1 ? 's' : ''} en cours actuellement.\n\nVoulez-vous :\n• Voir le planning\n• Créer une nouvelle intervention\n• Consulter les urgences`;
  }

  // Réponse par défaut
  return `Je suis l'assistant EDS22. Je peux vous aider à :\n\n• 📊 Consulter vos statistiques\n• 👥 Gérer vos clients\n• 🔧 Suivre vos interventions\n• 📦 Contrôler votre stock\n• 💰 Générer des factures\n\nQue puis-je faire pour vous ?`;
};

// POST envoyer un message à l'assistant
router.post('/chat', async (req, res) => {
  try {
    const { message, sessionId } = req.body;

    // Récupérer ou créer la conversation
    let conversation = await AIConversation.findOne({ sessionId });

    if (!conversation) {
      conversation = new AIConversation({
        sessionId,
        utilisateur: req.user.email,
        messages: []
      });
    }

    // Ajouter le message de l'utilisateur
    conversation.messages.push({
      role: 'user',
      content: message,
      timestamp: new Date()
    });

    // Générer la réponse de l'assistant
    const assistantResponse = await generateMockResponse(message);

    // Ajouter la réponse de l'assistant
    conversation.messages.push({
      role: 'assistant',
      content: assistantResponse,
      timestamp: new Date()
    });

    conversation.derniereActivite = new Date();
    await conversation.save();

    res.json({
      message: assistantResponse,
      conversation: conversation
    });
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
});

// GET récupérer une conversation
router.get('/chat/:sessionId', async (req, res) => {
  try {
    const conversation = await AIConversation.findOne({ sessionId: req.params.sessionId });
    if (!conversation) {
      return res.status(404).json({ message: 'Conversation non trouvée' });
    }
    res.json(conversation);
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
});

module.exports = router;
