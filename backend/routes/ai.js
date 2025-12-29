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

    // ========== INTERVENTIONS ==========
    const interventionsMois = await Intervention.countDocuments({ dateCreation: { $gte: monthStart } });
    const interventionsSemaine = await Intervention.countDocuments({ dateCreation: { $gte: weekStart } });
    const interventionsEnCours = await Intervention.countDocuments({
      statut: { $in: ['En cours', 'Diagnostic', 'Réparation'] }
    });

    // Répartition par statut
    const parStatut = await Intervention.aggregate([
      { $group: { _id: '$statut', count: { $sum: 1 } } }
    ]);

    // Répartition par type
    const parType = await Intervention.aggregate([
      { $group: { _id: '$typeIntervention', count: { $sum: 1 } } }
    ]);

    // Répartition par technicien
    const parTechnicien = await Intervention.aggregate([
      { $match: { technicien: { $ne: null } } },
      { $group: { _id: '$technicien', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);

    // CA du mois
    const caResult = await Intervention.aggregate([
      { $match: { dateCreation: { $gte: monthStart }, statut: 'Facturé' } },
      { $group: { _id: null, total: { $sum: '$coutTotal' } } }
    ]);
    const caMensuel = caResult.length > 0 ? caResult[0].total : 0;

    // ========== STOCK ==========
    const stockCritique = await Piece.countDocuments({
      actif: true,
      $expr: { $lt: ['$quantiteStock', '$quantiteMinimum'] }
    });

    const piecesEnAlerte = await Piece.find({
      actif: true,
      $expr: { $lt: ['$quantiteStock', '$quantiteMinimum'] }
    }).limit(10).select('reference designation quantiteStock quantiteMinimum prixAchat');

    const totalPieces = await Piece.countDocuments({ actif: true });
    const valeurStock = await Piece.aggregate([
      { $match: { actif: true } },
      { $group: { _id: null, total: { $sum: { $multiply: ['$quantiteStock', '$prixAchat'] } } } }
    ]);

    // ========== CLIENTS ==========
    const totalClients = await Client.countDocuments();
    const derniersClients = await Client.find().sort({ dateCreation: -1 }).limit(5)
      .select('nom prenom telephone ville email');

    const clientsParVille = await Client.aggregate([
      { $group: { _id: '$ville', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 5 }
    ]);

    // ========== INTERVENTIONS DÉTAILLÉES ==========
    const dernieresInterventions = await Intervention.find()
      .sort({ dateCreation: -1 })
      .limit(10)
      .populate('clientId', 'nom prenom telephone ville')
      .select('numero description statut dateCreation technicien typeIntervention coutTotal');

    const interventionsUrgentes = await Intervention.find({
      statut: { $in: ['Demande', 'Planifié'] },
      dateCreation: { $lt: weekStart }
    }).populate('clientId', 'nom prenom telephone')
      .select('numero description statut dateCreation technicien');

    // ========== FACTURES ==========
    const facturesEnAttente = await Facture.countDocuments({ statut: 'En attente' });
    const facturesPayees = await Facture.countDocuments({ statut: 'Payée', dateFacture: { $gte: monthStart } });

    return {
      stats: {
        interventionsMois,
        interventionsSemaine,
        interventionsEnCours,
        caMensuel: caMensuel.toFixed(2),
        stockCritique,
        totalClients,
        totalPieces,
        valeurStock: valeurStock.length > 0 ? valeurStock[0].total.toFixed(2) : 0,
        facturesEnAttente,
        facturesPayees
      },
      parStatut,
      parType,
      parTechnicien,
      clientsParVille,
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
    return "⚠️ L'assistant IA n'est pas encore configuré. Veuillez ajouter votre clé OpenRouter dans le fichier .env du backend.";
  }

  try {
    // Construire le prompt système enrichi
    const systemPrompt = `Tu es l'assistant IA intelligent d'EDS22, une entreprise de réparation d'électroménager basée à Guingamp (22200).

═══════════════════════════════════════════════════════════════
📋 ARCHITECTURE DE L'APPLICATION EDS22
═══════════════════════════════════════════════════════════════

L'APPLICATION GÈRE 5 MODULES PRINCIPAUX :

1. 👥 CLIENTS
   - Base de données complète des clients avec coordonnées
   - Historique d'interventions par client
   - Appareils enregistrés par client
   - Géolocalisation par ville

2. 🔧 INTERVENTIONS
   - Cycle de vie complet : Demande → Planifié → En cours → Diagnostic → Réparation → Terminé → Facturé
   - Types : Réparation, Dépannage, Entretien, Devis, Installation
   - Assignation aux techniciens (Jérémy, Stéphane, etc.)
   - Suivi détaillé avec pièces utilisées et main d'œuvre

3. 📦 STOCK & PIÈCES DÉTACHÉES
   - Inventaire de pièces détachées avec références
   - Gestion des quantités (stock actuel vs minimum)
   - Alertes automatiques si stock < minimum
   - Prix d'achat et prix de vente

4. 💰 FACTURATION
   - Génération automatique de factures depuis les interventions
   - Statuts : En attente, Payée, Annulée
   - Suivi des paiements

5. 🏠 APPAREILS DE PRÊT
   - Gestion des appareils prêtés aux clients pendant les réparations
   - Suivi des retours et disponibilités

═══════════════════════════════════════════════════════════════
📊 DONNÉES EN TEMPS RÉEL (${new Date().toLocaleDateString('fr-FR')})
═══════════════════════════════════════════════════════════════

🔢 STATISTIQUES GLOBALES :
• Interventions ce mois : ${context.stats.interventionsMois}
• Interventions cette semaine : ${context.stats.interventionsSemaine}
• Interventions en cours actuellement : ${context.stats.interventionsEnCours}
• Chiffre d'affaires mensuel : ${context.stats.caMensuel}€
• Total clients dans la base : ${context.stats.totalClients}
• Pièces détachées référencées : ${context.stats.totalPieces}
• Valeur totale du stock : ${context.stats.valeurStock}€
• Factures en attente de paiement : ${context.stats.facturesEnAttente}
• Factures payées ce mois : ${context.stats.facturesPayees}

📍 RÉPARTITION PAR STATUT :
${context.parStatut.map(s => `• ${s._id || 'Non défini'} : ${s.count} intervention(s)`).join('\n')}

🛠️ RÉPARTITION PAR TYPE :
${context.parType.map(t => `• ${t._id || 'Non défini'} : ${t.count} intervention(s)`).join('\n')}

👨‍🔧 CHARGE PAR TECHNICIEN :
${context.parTechnicien.length > 0 ? context.parTechnicien.map(t => `• ${t._id} : ${t.count} intervention(s)`).join('\n') : '• Aucune intervention assignée'}

🌍 TOP 5 VILLES :
${context.clientsParVille.map(v => `• ${v._id} : ${v.count} client(s)`).join('\n')}

${context.stats.stockCritique > 0 ? `
⚠️ ALERTES STOCK CRITIQUE (${context.stats.stockCritique} pièce(s)) :
${context.piecesEnAlerte.map(p => `• ${p.reference} - "${p.designation}" : ${p.quantiteStock}/${p.quantiteMinimum} unités (Prix: ${p.prixAchat}€)`).join('\n')}
` : '✅ STOCK : Toutes les pièces sont au-dessus du seuil minimum'}

👥 DERNIERS CLIENTS ENREGISTRÉS :
${context.derniersClients.map(c => `• ${c.nom} ${c.prenom} (${c.ville}) - ${c.telephone}${c.email ? ' - ' + c.email : ''}`).join('\n')}

🔧 DERNIÈRES INTERVENTIONS :
${context.dernieresInterventions.map(i => `• ${i.numero} - ${i.description} [${i.statut}] - Client: ${i.clientId?.nom || 'N/A'} ${i.clientId?.prenom || ''} (${i.clientId?.ville || 'N/A'}) - Tech: ${i.technicien || 'Non assigné'}${i.coutTotal ? ' - Coût: ' + i.coutTotal + '€' : ''}`).join('\n')}

${context.interventionsUrgentes.length > 0 ? `
🚨 INTERVENTIONS URGENTES (en attente > 7 jours) :
${context.interventionsUrgentes.map(i => `• ${i.numero} - ${i.description} [${i.statut}] - Client: ${i.clientId?.nom} ${i.clientId?.prenom} - Tech: ${i.technicien || 'Non assigné'}`).join('\n')}
` : '✅ Aucune intervention en retard'}

═══════════════════════════════════════════════════════════════
🎯 TES CAPACITÉS & INSTRUCTIONS
═══════════════════════════════════════════════════════════════

MODE ACTUEL : LECTURE SEULE (Consultation uniquement)

TU PEUX :
✅ Analyser les statistiques et identifier les tendances
✅ Répondre aux questions sur les interventions, clients, stock
✅ Calculer des métriques (taux, moyennes, totaux)
✅ Détecter les problèmes (stock faible, interventions urgentes, surcharge technicien)
✅ Donner des recommandations basées sur les données réelles
✅ Faire des comparaisons et des analyses croisées
✅ Répondre aux salutations de manière chaleureuse et professionnelle

TU NE PEUX PAS (ENCORE) :
❌ Créer, modifier ou supprimer des données
❌ Effectuer des actions dans l'application
→ Si demandé, explique que cette fonctionnalité arrive prochainement

═══════════════════════════════════════════════════════════════
📖 EXEMPLES DE RAISONNEMENT
═══════════════════════════════════════════════════════════════

Exemple 1 - Salutation :
Q: "Salut"
R: "Bonjour ! 👋 Je suis l'assistant intelligent d'EDS22. Comment puis-je vous aider aujourd'hui ? Je peux vous donner des statistiques, analyser vos interventions, vérifier votre stock ou répondre à toute question sur l'activité de l'entreprise."

Exemple 2 - Analyse de charge :
Q: "Quel technicien est le plus chargé ?"
R: Analyser context.parTechnicien, identifier celui avec le plus d'interventions, donner le nombre exact et suggérer une répartition si déséquilibrée

Exemple 3 - Analyse financière :
Q: "Comment va le CA ?"
R: Analyser context.stats.caMensuel, comparer avec le nombre d'interventions, calculer le panier moyen si possible, donner un avis contextualisé

Exemple 4 - Stock critique :
Q: "Des problèmes de stock ?"
R: Si context.stats.stockCritique > 0, lister les pièces concernées avec recommandation de commande urgente. Sinon, confirmer que tout va bien.

═══════════════════════════════════════════════════════════════
💡 DIRECTIVES DE RÉPONSE
═══════════════════════════════════════════════════════════════

1. PRÉCISION : Base-toi UNIQUEMENT sur les données réelles ci-dessus
2. CONCISION : Réponds en 2-4 phrases maximum sauf si plus de détails sont demandés
3. CLARTÉ : Utilise des emojis pour structurer (📊 📈 ⚠️ ✅ etc.)
4. PROACTIVITÉ : Si tu détectes un problème dans les données, mentionne-le
5. CONTEXTE : Relie les données entre elles pour donner du sens
6. TON : Professionnel mais accessible, comme un vrai collègue expert

Réponds maintenant à la question de l'utilisateur :`;

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

    // Appel à l'API OpenRouter avec Gemini 2.0 Flash (meilleur modèle gratuit)
    const response = await axios.post(
      'https://openrouter.ai/api/v1/chat/completions',
      {
        model: 'google/gemini-2.0-flash-exp:free', // Gemini 2.0 Flash - Meilleur que Llama, toujours gratuit
        messages: messages,
        temperature: 0.7,
        max_tokens: 1000 // Augmenté pour des réponses plus détaillées
      },
      {
        headers: {
          'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': 'https://api-eds.srv1068230.hstgr.cloud',
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
