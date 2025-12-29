const express = require('express');
const router = express.Router();
const axios = require('axios');
const AIConversation = require('../models/AIConversation');
const Intervention = require('../models/Intervention');
const Client = require('../models/Client');
const Piece = require('../models/Piece');
const Facture = require('../models/Facture');
const authMiddleware = require('../middleware/auth');

router.use(authMiddleware);

// Fonction pour récupérer toutes les données de contexte de l'application
const getApplicationContext = async () => {
  try {
    const today = new Date();
    const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
    const weekStart = new Date(today);
    weekStart.setDate(weekStart.getDate() - 7);

    // Récupérer les statistiques des interventions
    const interventionsMois = await Intervention.countDocuments({ dateCreation: { $gte: monthStart } });
    const interventionsSemaine = await Intervention.countDocuments({ dateCreation: { $gte: weekStart } });
    const interventionsEnCours = await Intervention.countDocuments({
      statut: { $in: ['En cours', 'Diagnostic', 'Réparation'] }
    });

    // CA du mois
    const caResult = await Intervention.aggregate([
      { $match: { dateCreation: { $gte: monthStart }, statut: 'Facturé' } },
      { $group: { _id: null, total: { $sum: '$coutTotal' } } }
    ]);
    const caMensuel = caResult.length > 0 ? caResult[0].total : 0;

    // Stock critique
    const stockCritique = await Piece.countDocuments({
      actif: true,
      $expr: { $lt: ['$quantiteStock', '$quantiteMinimum'] }
    });

    const piecesEnAlerte = await Piece.find({
      actif: true,
      $expr: { $lt: ['$quantiteStock', '$quantiteMinimum'] }
    }).limit(10).select('reference designation quantiteStock quantiteMinimum');

    // Clients
    const totalClients = await Client.countDocuments();
    const derniersClients = await Client.find().sort({ dateCreation: -1 }).limit(5)
      .select('nom prenom telephone ville');

    // Dernières interventions
    const dernieresInterventions = await Intervention.find()
      .sort({ dateCreation: -1 })
      .limit(10)
      .populate('clientId', 'nom prenom telephone')
      .select('numero description statut dateCreation technicien typeIntervention');

    // Interventions urgentes (statut critique)
    const interventionsUrgentes = await Intervention.find({
      statut: { $in: ['Demande', 'Planifié'] },
      dateCreation: { $lt: weekStart }
    }).populate('clientId', 'nom prenom telephone')
      .select('numero description statut dateCreation');

    return {
      stats: {
        interventionsMois,
        interventionsSemaine,
        interventionsEnCours,
        caMensuel: caMensuel.toFixed(2),
        stockCritique,
        totalClients
      },
      piecesEnAlerte,
      derniersClients,
      dernieresInterventions,
      interventionsUrgentes
    };
  } catch (error) {
    console.error('Erreur récupération contexte:', error);
    return null;
  }
};

// Fonction pour générer une réponse avec OpenRouter
const generateAIResponse = async (userMessage, conversationHistory, context) => {
  const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;

  if (!OPENROUTER_API_KEY || OPENROUTER_API_KEY === 'ta_clé_openrouter_ici') {
    console.error('OPENROUTER_API_KEY non configurée');
    // Fallback sur réponse simple si pas de clé
    return "⚠️ L'assistant IA n'est pas encore configuré. Veuillez ajouter votre clé OpenRouter dans le fichier .env du backend.";
  }

  try {
    // Préparer le prompt système avec tout le contexte
    const systemPrompt = `Tu es l'assistant intelligent d'EDS22, une entreprise de réparation d'électroménager à Guingamp (22).

Tu as accès en LECTURE SEULE aux données suivantes en temps réel :

📊 STATISTIQUES :
- Interventions ce mois : ${context.stats.interventionsMois}
- Interventions cette semaine : ${context.stats.interventionsSemaine}
- Interventions en cours : ${context.stats.interventionsEnCours}
- CA mensuel : ${context.stats.caMensuel}€
- Total clients : ${context.stats.totalClients}
- Pièces en stock critique : ${context.stats.stockCritique}

${context.stats.stockCritique > 0 ? `⚠️ PIÈCES EN ALERTE STOCK :
${context.piecesEnAlerte.map(p => `- ${p.reference} "${p.designation}" : ${p.quantiteStock}/${p.quantiteMinimum}`).join('\n')}` : ''}

👥 DERNIERS CLIENTS :
${context.derniersClients.map(c => `- ${c.nom} ${c.prenom} (${c.ville}) - ${c.telephone}`).join('\n')}

🔧 DERNIÈRES INTERVENTIONS :
${context.dernieresInterventions.map(i => `- ${i.numero} : ${i.description} [${i.statut}] - Technicien: ${i.technicien || 'Non assigné'}`).join('\n')}

${context.interventionsUrgentes.length > 0 ? `🚨 INTERVENTIONS URGENTES (en attente > 7 jours) :
${context.interventionsUrgentes.map(i => `- ${i.numero} : ${i.description} [Client: ${i.clientId?.nom} ${i.clientId?.prenom}]`).join('\n')}` : ''}

TES CAPACITÉS (LECTURE SEULE POUR L'INSTANT) :
- Consulter les statistiques et tendances
- Rechercher des informations sur les clients, interventions, pièces
- Identifier les problèmes (stock faible, interventions en retard)
- Donner des recommandations basées sur les données
- Répondre aux questions sur l'activité de l'entreprise

IMPORTANT :
- Tu peux CONSULTER toutes les données ci-dessus
- Tu NE PEUX PAS encore créer, modifier ou supprimer des données (en lecture seule)
- Sois concis et précis dans tes réponses
- Utilise des emojis pour rendre tes réponses plus lisibles
- Si on te demande de faire une action (créer, modifier), explique que cette fonctionnalité arrive bientôt

Réponds de manière professionnelle, utile et concise.`;

    // Préparer l'historique des messages pour l'API
    const messages = [
      { role: 'system', content: systemPrompt },
      ...conversationHistory.map(msg => ({
        role: msg.role,
        content: msg.content
      })),
      { role: 'user', content: userMessage }
    ];

    console.log('🤖 Envoi requête à OpenRouter...');

    // Appel à l'API OpenRouter
    const response = await axios.post(
      'https://openrouter.ai/api/v1/chat/completions',
      {
        model: 'meta-llama/llama-3.2-3b-instruct:free', // Modèle gratuit
        messages: messages,
        temperature: 0.7,
        max_tokens: 500
      },
      {
        headers: {
          'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': 'http://localhost:5001',
          'X-Title': 'EDS22 - Assistant IA'
        },
        timeout: 30000
      }
    );

    const aiResponse = response.data.choices[0].message.content.trim();
    console.log('✅ Réponse reçue d\'OpenRouter');

    return aiResponse;

  } catch (error) {
    console.error('❌ Erreur OpenRouter:', error.response?.data || error.message);

    // Fallback sur réponse simple en cas d'erreur
    return `Je suis désolé, je rencontre un problème technique. Voici ce que je peux vous dire :

📊 Stats du mois : ${context.stats.interventionsMois} interventions, ${context.stats.caMensuel}€ de CA
${context.stats.stockCritique > 0 ? `⚠️ ${context.stats.stockCritique} pièce(s) en stock critique` : '✅ Stock OK'}
${context.interventionsUrgentes.length > 0 ? `🚨 ${context.interventionsUrgentes.length} intervention(s) urgente(s)` : ''}

Que puis-je faire pour vous ?`;
  }
};

// POST envoyer un message à l'assistant
router.post('/chat', async (req, res) => {
  try {
    const { message, sessionId } = req.body;

    if (!message || !message.trim()) {
      return res.status(400).json({ message: 'Message vide' });
    }

    // Récupérer le contexte de l'application
    const context = await getApplicationContext();

    if (!context) {
      return res.status(500).json({ message: 'Erreur lors de la récupération du contexte' });
    }

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

    // Générer la réponse de l'assistant avec OpenRouter
    const assistantResponse = await generateAIResponse(
      message,
      conversation.messages.slice(-10), // Garder seulement les 10 derniers messages pour le contexte
      context
    );

    // Ajouter la réponse de l'assistant
    conversation.messages.push({
      role: 'assistant',
      content: assistantResponse,
      timestamp: new Date(),
      contexte: context.stats // Sauvegarder les stats au moment de la réponse
    });

    conversation.derniereActivite = new Date();
    await conversation.save();

    res.json({
      message: assistantResponse,
      conversation: conversation
    });
  } catch (error) {
    console.error('Erreur chat:', error);
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
