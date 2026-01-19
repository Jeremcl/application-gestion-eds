const express = require('express');
const router = express.Router();
const axios = require('axios');
const AIConversation = require('../models/AIConversation');
const Intervention = require('../models/Intervention');
const Client = require('../models/Client');
const Piece = require('../models/Piece');
const Facture = require('../models/Facture');
const AppareilPret = require('../models/AppareilPret');
const authMiddleware = require('../middleware/auth');

router.use(authMiddleware);

// ========== FONCTIONS UTILITAIRES D'EXTRACTION ==========

// Extraire une date du message
const extractDate = (message) => {
  const msg = message.toLowerCase();

  // Mois spécifiques
  const moisMap = {
    'janvier': 0, 'février': 1, 'mars': 2, 'avril': 3, 'mai': 4, 'juin': 5,
    'juillet': 6, 'août': 7, 'septembre': 8, 'octobre': 9, 'novembre': 10, 'décembre': 11
  };

  // Chercher "en juin 2024", "juin 2024", etc.
  for (const [mois, index] of Object.entries(moisMap)) {
    if (msg.includes(mois)) {
      const yearMatch = msg.match(/202[0-9]/);
      const year = yearMatch ? parseInt(yearMatch[0]) : new Date().getFullYear();
      return {
        start: new Date(year, index, 1),
        end: new Date(year, index + 1, 0, 23, 59, 59)
      };
    }
  }

  // Chercher "2024", "en 2023", etc.
  const yearOnlyMatch = msg.match(/(?:en |année )?202[0-9]/);
  if (yearOnlyMatch) {
    const year = parseInt(yearOnlyMatch[0].replace(/[^0-9]/g, ''));
    return {
      start: new Date(year, 0, 1),
      end: new Date(year, 11, 31, 23, 59, 59)
    };
  }

  return null;
};

// Extraire un nom de personne
const extractName = (message) => {
  // Patterns courants
  const patterns = [
    /(?:client|technicien|pour)\s+([A-ZÉÈÊËÀÂÔÛÇ][a-zéèêëàâôûç]+(?:\s+[A-ZÉÈÊËÀÂÔÛÇ][a-zéèêëàâôûç]+)?)/,
    /([A-ZÉÈÊËÀÂÔÛÇ][a-zéèêëàâôûç]+(?:\s+[A-ZÉÈÊËÀÂÔÛÇ][a-zéèêëàâôûç]+)?)/
  ];

  for (const pattern of patterns) {
    const match = message.match(pattern);
    if (match) return match[1];
  }

  return null;
};

// Extraire une référence/numéro
const extractReference = (message) => {
  // INT-2024-0123, FAC-2024-0045, etc.
  const refMatch = message.match(/([A-Z]{3}-202[0-9]-[0-9]{4})/);
  if (refMatch) return refMatch[1];

  // Numéros simples
  const numMatch = message.match(/(?:numéro|n°|num|#)\s*([0-9]+)/i);
  if (numMatch) return numMatch[1];

  return null;
};

// ========== CONTEXTE APPLICATION ==========

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

    const parStatut = await Intervention.aggregate([
      { $group: { _id: '$statut', count: { $sum: 1 } } }
    ]);

    const parType = await Intervention.aggregate([
      { $group: { _id: '$typeIntervention', count: { $sum: 1 } } }
    ]);

    const parTechnicien = await Intervention.aggregate([
      { $match: { technicien: { $ne: null } } },
      { $group: { _id: '$technicien', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);

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

    // ========== APPAREILS DE PRÊT ==========
    const totalAppareilsPret = await AppareilPret.countDocuments();
    const appareilsDisponibles = await AppareilPret.countDocuments({ statut: 'Disponible' });
    const appareilsPretes = await AppareilPret.countDocuments({ statut: 'Prêté' });
    const appareilsMaintenance = await AppareilPret.countDocuments({ statut: 'En maintenance' });

    const derniersAppareilsPret = await AppareilPret.find({ statut: 'Prêté' })
      .sort({ dateModification: -1 })
      .limit(5)
      .select('reference type marque modele statut');

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
        facturesPayees,
        totalAppareilsPret,
        appareilsDisponibles,
        appareilsPretes,
        appareilsMaintenance
      },
      parStatut,
      parType,
      parTechnicien,
      clientsParVille,
      piecesEnAlerte,
      derniersClients,
      dernieresInterventions,
      interventionsUrgentes,
      derniersAppareilsPret
    };
  } catch (error) {
    console.error('Erreur récupération contexte:', error);
    return null;
  }
};

// ========== DÉTECTION D'INTENTION AMÉLIORÉE ==========

const detectIntent = (message) => {
  const msg = message.toLowerCase();

  // Recherche d'intervention spécifique
  if (msg.match(/(?:trouve|cherche|montre|affiche|liste).*intervention/i) ||
      msg.match(/intervention.*(?:de|du|pour|chez)/i) ||
      msg.match(/INT-202[0-9]/)) {
    return { action: 'SEARCH_INTERVENTION', confidence: 0.9 };
  }

  // Recherche de stock critique / alertes
  if (msg.match(/(?:pi[èe]ces?|stock).*(?:critique|alerte|minimum|rupture)/i) ||
      msg.match(/(?:critique|alerte|rupture).*(?:pi[èe]ces?|stock)/i) ||
      msg.match(/(?:liste|voir|affiche|montre).*(?:alertes?|stock critique)/i) ||
      msg.match(/quelles?.*pi[èe]ces?.*(?:critique|alerte|minimum)/i)) {
    return { action: 'SEARCH_STOCK_CRITIQUE', confidence: 0.95 };
  }

  // Recherche de pièce spécifique (amélioration pour marques)
  if (msg.match(/(?:trouve|cherche|montre|affiche|liste).*pi[èe]ce/i) ||
      msg.match(/pi[èe]ce.*(?:référence|ref|marque)/i) ||
      msg.match(/pi[èe]ces?\s+(?:samsung|whirlpool|bosch|siemens|lg|electrolux|miele)/i)) {
    return { action: 'SEARCH_PIECE', confidence: 0.9 };
  }

  // Recherche de facture
  if (msg.match(/(?:trouve|cherche|montre|affiche).*facture/i) ||
      msg.match(/FAC-202[0-9]/)) {
    return { action: 'SEARCH_FACTURE', confidence: 0.9 };
  }

  // Recherche d'appareil de prêt
  if (msg.match(/(?:trouve|cherche|montre|affiche).*appareil.*pr[êe]t/i)) {
    return { action: 'SEARCH_APPAREIL_PRET', confidence: 0.9 };
  }

  // Créer une intervention
  if (msg.match(/cr[ée]e|ajoute|nouvelle.*intervention|planifier|planifie/)) {
    return { action: 'CREATE_INTERVENTION', confidence: 0.8 };
  }

  // Rechercher un client
  if (msg.match(/(?:cherche|trouve|recherche).*client|qui est.*client|connais.*client/)) {
    return { action: 'SEARCH_CLIENT', confidence: 0.7 };
  }

  // Modifier stock
  if (msg.match(/augmente|diminue|modifie.*stock|ajoute.*pi[èe]ces|retire.*pi[èe]ces/)) {
    return { action: 'UPDATE_STOCK', confidence: 0.8 };
  }

  // Salutations
  if (msg.match(/^(salut|bonjour|hello|hey|coucou|hi|bonsoir)$/)) {
    return { action: 'GREETING', confidence: 1.0 };
  }

  // Analyse / Question
  return { action: 'QUERY', confidence: 1.0 };
};

// ========== FONCTIONS D'ACTION COMPLÈTES ==========

const executeAction = async (intent, message, context, req) => {
  switch (intent.action) {
    case 'GREETING':
      const userName = req.user?.nom || 'Admin';
      return {
        success: true,
        message: `Bonjour ${userName} ! 👋\n\nJe suis l'assistant IA d'EDS22. Je peux vous aider à :\n\n✅ Rechercher des interventions, clients, pièces, factures\n✅ Consulter les statistiques de l'entreprise\n✅ Analyser les interventions et identifier les urgences\n✅ Vérifier le stock et les alertes\n✅ Accéder à TOUTES les données historiques\n\nExemples de requêtes :\n• "Trouve l'intervention du client Dupont en juin 2024"\n• "Liste les pièces WHIRLPOOL"\n• "Combien d'interventions a fait Jérémy en 2024 ?"\n\nQue puis-je faire pour vous aujourd'hui ?`
      };

    case 'SEARCH_INTERVENTION':
      const dateRange = extractDate(message);
      const clientName = extractName(message);
      const refIntervention = extractReference(message);
      const technicienName = message.match(/technicien\s+(\w+)/i)?.[1];

      // Construire la requête MongoDB
      const queryIntervention = {};

      if (refIntervention) {
        queryIntervention.numero = new RegExp(refIntervention, 'i');
      }

      if (dateRange) {
        queryIntervention.dateCreation = { $gte: dateRange.start, $lte: dateRange.end };
      }

      if (technicienName) {
        queryIntervention.technicien = new RegExp(technicienName, 'i');
      }

      // Si client mentionné, chercher d'abord le client
      let clientIds = [];
      if (clientName) {
        const clients = await Client.find({
          $or: [
            { nom: new RegExp(clientName, 'i') },
            { prenom: new RegExp(clientName, 'i') }
          ]
        }).select('_id');
        clientIds = clients.map(c => c._id);
        if (clientIds.length > 0) {
          queryIntervention.clientId = { $in: clientIds };
        }
      }

      console.log('🔍 Recherche interventions avec:', queryIntervention);

      const interventions = await Intervention.find(queryIntervention)
        .sort({ dateCreation: -1 })
        .limit(20)
        .populate('clientId', 'nom prenom telephone ville')
        .select('numero description statut dateCreation technicien typeIntervention coutTotal appareil');

      if (interventions.length > 0) {
        const interventionList = interventions.map(i =>
          `• **${i.numero}**\n` +
          `  📅 ${new Date(i.dateCreation).toLocaleDateString('fr-FR')}\n` +
          `  👤 ${i.clientId?.nom || 'N/A'} ${i.clientId?.prenom || ''} (${i.clientId?.ville || 'N/A'})\n` +
          `  🔧 ${i.description.substring(0, 80)}${i.description.length > 80 ? '...' : ''}\n` +
          `  📊 Statut: ${i.statut}${i.technicien ? ` | Tech: ${i.technicien}` : ''}${i.coutTotal ? ` | ${i.coutTotal}€` : ''}`
        ).join('\n\n');

        return {
          success: true,
          message: `🔍 **${interventions.length} intervention(s) trouvée(s)** :\n\n${interventionList}${interventions.length === 20 ? '\n\n_Affichage limité aux 20 premières. Précisez votre recherche pour affiner les résultats._' : ''}`
        };
      } else {
        return {
          success: false,
          message: `❌ Aucune intervention trouvée avec ces critères.\n\nEssayez de reformuler votre recherche ou donnez plus de détails.`
        };
      }

    case 'SEARCH_PIECE':
      const refPiece = message.match(/(?:référence|ref)\s+(\S+)/i)?.[1] || message.match(/([0-9A-Z]{5,})/)?.[1];
      const marquePiece = message.match(/(?:marque)\s+(\w+)/i)?.[1];
      const designationPiece = message.match(/(?:désignation|type)\s+(\w+)/i)?.[1];

      const queryPiece = { actif: true };

      if (refPiece) {
        queryPiece.reference = new RegExp(refPiece, 'i');
      }

      if (marquePiece) {
        queryPiece.marque = new RegExp(marquePiece, 'i');
      }

      if (designationPiece) {
        queryPiece.designation = new RegExp(designationPiece, 'i');
      }

      // Si aucun critère spécifique, chercher dans le message
      if (!refPiece && !marquePiece && !designationPiece) {
        const searchTerm = message.replace(/(?:trouve|cherche|montre|affiche|liste|pi[èe]ce)/gi, '').trim();
        if (searchTerm) {
          queryPiece.$or = [
            { reference: new RegExp(searchTerm, 'i') },
            { marque: new RegExp(searchTerm, 'i') },
            { designation: new RegExp(searchTerm, 'i') }
          ];
        }
      }

      console.log('🔍 Recherche pièces avec:', queryPiece);

      const pieces = await Piece.find(queryPiece)
        .limit(15)
        .select('reference designation marque quantiteStock quantiteMinimum prixAchat prixVente emplacement');

      if (pieces.length > 0) {
        const pieceList = pieces.map(p => {
          const stockStatus = p.quantiteStock === 0 ? '🔴' : p.quantiteStock < p.quantiteMinimum ? '🟡' : '🟢';
          return `• **${p.reference}** ${stockStatus}\n` +
            `  📦 ${p.designation}\n` +
            `  🏭 ${p.marque || 'N/A'}\n` +
            `  📊 Stock: ${p.quantiteStock}/${p.quantiteMinimum} | Emplacement: ${p.emplacement || 'N/A'}\n` +
            `  💰 Achat: ${p.prixAchat.toFixed(2)}€ | Vente: ${p.prixVente.toFixed(2)}€`;
        }).join('\n\n');

        return {
          success: true,
          message: `🔍 **${pieces.length} pièce(s) trouvée(s)** :\n\n${pieceList}${pieces.length === 15 ? '\n\n_Affichage limité aux 15 premières. Précisez votre recherche pour affiner les résultats._' : ''}`
        };
      } else {
        return {
          success: false,
          message: `❌ Aucune pièce trouvée avec ces critères.\n\nEssayez de chercher par référence, marque ou désignation.`
        };
      }

    case 'SEARCH_STOCK_CRITIQUE':
      const piecesAlerte = await Piece.find({
        actif: true,
        $expr: { $lt: ['$quantiteStock', '$quantiteMinimum'] }
      })
        .sort({ quantiteStock: 1 })
        .limit(20)
        .select('reference designation marque quantiteStock quantiteMinimum prixAchat prixVente emplacement');

      if (piecesAlerte.length > 0) {
        const totalCritique = await Piece.countDocuments({
          actif: true,
          $expr: { $lt: ['$quantiteStock', '$quantiteMinimum'] }
        });

        const alerteList = piecesAlerte.map(p => {
          const stockStatus = p.quantiteStock === 0 ? '🔴 RUPTURE' : '🟡 CRITIQUE';
          const urgence = p.quantiteStock === 0 ? '⚠️ URGENT' : '';
          return `• **${p.reference}** ${stockStatus} ${urgence}\n` +
            `  📦 ${p.designation}\n` +
            `  🏭 ${p.marque || 'N/A'}\n` +
            `  📊 Stock: ${p.quantiteStock}/${p.quantiteMinimum} (manque: ${p.quantiteMinimum - p.quantiteStock})\n` +
            `  📍 Emplacement: ${p.emplacement || 'N/A'} | Valeur: ${(p.quantiteMinimum * p.prixAchat).toFixed(2)}€`;
        }).join('\n\n');

        const resume = totalCritique > piecesAlerte.length
          ? `\n\n⚠️ **Total: ${totalCritique} pièces en stock critique** (affichage des 20 plus urgentes)`
          : `\n\n📊 **Total: ${totalCritique} pièces en stock critique**`;

        return {
          success: true,
          message: `🚨 **PIÈCES EN STOCK CRITIQUE** 🚨\n\n${alerteList}${resume}\n\n💡 Pensez à réapprovisionner ces pièces rapidement.`
        };
      } else {
        return {
          success: true,
          message: `✅ **Excellent !** Aucune pièce en stock critique actuellement.\n\nToutes les pièces sont au-dessus du seuil minimum.`
        };
      }

    case 'SEARCH_FACTURE':
      const refFacture = extractReference(message);
      const dateRangeFacture = extractDate(message);
      const clientNameFacture = extractName(message);

      const queryFacture = {};

      if (refFacture) {
        queryFacture.numeroFacture = new RegExp(refFacture, 'i');
      }

      if (dateRangeFacture) {
        queryFacture.dateFacture = { $gte: dateRangeFacture.start, $lte: dateRangeFacture.end };
      }

      // Si client mentionné, chercher d'abord le client
      if (clientNameFacture) {
        const clientsFacture = await Client.find({
          $or: [
            { nom: new RegExp(clientNameFacture, 'i') },
            { prenom: new RegExp(clientNameFacture, 'i') }
          ]
        }).select('_id');
        const clientIdsFacture = clientsFacture.map(c => c._id);
        if (clientIdsFacture.length > 0) {
          queryFacture.clientId = { $in: clientIdsFacture };
        }
      }

      console.log('🔍 Recherche factures avec:', queryFacture);

      const factures = await Facture.find(queryFacture)
        .sort({ dateFacture: -1 })
        .limit(15)
        .populate('clientId', 'nom prenom')
        .select('numeroFacture dateFacture statut montantTotal montantTTC clientId');

      if (factures.length > 0) {
        const factureList = factures.map(f =>
          `• **${f.numeroFacture}**\n` +
          `  📅 ${new Date(f.dateFacture).toLocaleDateString('fr-FR')}\n` +
          `  👤 ${f.clientId?.nom || 'N/A'} ${f.clientId?.prenom || ''}\n` +
          `  💰 ${f.montantTTC.toFixed(2)}€ | Statut: ${f.statut}`
        ).join('\n\n');

        return {
          success: true,
          message: `🔍 **${factures.length} facture(s) trouvée(s)** :\n\n${factureList}`
        };
      } else {
        return {
          success: false,
          message: `❌ Aucune facture trouvée avec ces critères.\n\nEssayez de préciser le numéro de facture ou le nom du client.`
        };
      }

    case 'SEARCH_APPAREIL_PRET':
      const typeAppareil = message.match(/(?:type|appareil)\s+(\w+)/i)?.[1];
      const marqueAppareil = message.match(/(?:marque)\s+(\w+)/i)?.[1];

      const queryAppareil = {};

      if (typeAppareil) {
        queryAppareil.type = new RegExp(typeAppareil, 'i');
      }

      if (marqueAppareil) {
        queryAppareil.marque = new RegExp(marqueAppareil, 'i');
      }

      // Si aucun critère, chercher dans tout le message
      if (!typeAppareil && !marqueAppareil) {
        const searchTermAppareil = message.replace(/(?:trouve|cherche|montre|affiche|liste|appareil|pr[êe]t)/gi, '').trim();
        if (searchTermAppareil) {
          queryAppareil.$or = [
            { type: new RegExp(searchTermAppareil, 'i') },
            { marque: new RegExp(searchTermAppareil, 'i') },
            { modele: new RegExp(searchTermAppareil, 'i') }
          ];
        }
      }

      console.log('🔍 Recherche appareils avec:', queryAppareil);

      const appareils = await AppareilPret.find(queryAppareil)
        .limit(15)
        .select('reference type marque modele statut numeroSerie valeur');

      if (appareils.length > 0) {
        const appareilList = appareils.map(a => {
          const statutIcon = a.statut === 'Disponible' ? '🟢' : a.statut === 'Prêté' ? '🟡' : '🔴';
          return `• **${a.reference}** ${statutIcon}\n` +
            `  📱 ${a.type} ${a.marque} ${a.modele}\n` +
            `  📊 Statut: ${a.statut}${a.numeroSerie ? ` | S/N: ${a.numeroSerie}` : ''}${a.valeur ? ` | Valeur: ${a.valeur}€` : ''}`;
        }).join('\n\n');

        return {
          success: true,
          message: `🔍 **${appareils.length} appareil(s) trouvé(s)** :\n\n${appareilList}`
        };
      } else {
        return {
          success: false,
          message: `❌ Aucun appareil de prêt trouvé avec ces critères.\n\nEssayez de chercher par type ou marque.`
        };
      }

    case 'CREATE_INTERVENTION':
      return {
        success: false,
        message: `🚧 **Fonctionnalité en développement**\n\nLa création d'interventions via l'assistant arrive prochainement !\n\nPour le moment, vous pouvez :\n• Utiliser le bouton "Nouvelle intervention" dans l'interface\n• Rechercher des interventions existantes\n• Analyser les interventions urgentes\n\nSouhaitez-vous que je vous aide à chercher une intervention ?`
      };

    case 'SEARCH_CLIENT':
      const nameMatchClient = message.match(/(?:client|cherche|trouve|recherche)\s+(\w+)/i);
      if (nameMatchClient) {
        const searchName = nameMatchClient[1];
        const clients = await Client.find({
          $or: [
            { nom: new RegExp(searchName, 'i') },
            { prenom: new RegExp(searchName, 'i') }
          ]
        }).limit(10).select('nom prenom telephone ville email');

        if (clients.length > 0) {
          const clientList = clients.map(c =>
            `• **${c.nom} ${c.prenom}**\n  📞 ${c.telephone}\n  📍 ${c.ville}${c.email ? `\n  ✉️ ${c.email}` : ''}`
          ).join('\n\n');

          return {
            success: true,
            message: `📋 **${clients.length} client(s) trouvé(s)** :\n\n${clientList}`
          };
        } else {
          return {
            success: false,
            message: `❌ Aucun client trouvé avec le nom "${searchName}".\n\nVoulez-vous que je liste les derniers clients enregistrés ?`
          };
        }
      }

      return {
        success: false,
        message: `🔍 Pour rechercher un client, précisez son nom.\n\nExemple : "Recherche le client Dupont"`
      };

    case 'UPDATE_STOCK':
      return {
        success: false,
        message: `🚧 **Fonctionnalité en développement**\n\nLa modification du stock via l'assistant arrive prochainement !\n\nPour le moment, vous pouvez :\n• Consulter l'état du stock actuel\n• Rechercher des pièces spécifiques\n• Voir les pièces en alerte\n\nSouhaitez-vous rechercher une pièce ?`
      };

    default:
      return null;
  }
};

// ========== GÉNÉRATION RÉPONSE IA ==========

const generateAIResponse = async (userMessage, conversationHistory, context, req) => {
  const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;

  if (!OPENROUTER_API_KEY || OPENROUTER_API_KEY === 'ta_clé_openrouter_ici') {
    console.error('OPENROUTER_API_KEY non configurée');
    return "⚠️ L'assistant IA n'est pas encore configuré. Veuillez ajouter votre clé OpenRouter dans le fichier .env du backend.";
  }

  // Détecter l'intention
  const intent = detectIntent(userMessage);
  console.log('🎯 Intention détectée:', intent);

  // Si intention spécifique, exécuter l'action
  if (intent.confidence >= 0.7 && intent.action !== 'QUERY') {
    const actionResult = await executeAction(intent, userMessage, context, req);
    if (actionResult) {
      return actionResult.message;
    }
  }

  try {
    const systemPrompt = `Tu es l'assistant IA intelligent d'EDS22, une entreprise de réparation d'électroménager basée à Guingamp (22200).

═══════════════════════════════════════════════════════════════
🎯 SYSTÈME DE RECHERCHE AVANCÉ DISPONIBLE
═══════════════════════════════════════════════════════════════

TU AS ACCÈS À TOUTES LES DONNÉES HISTORIQUES via des recherches :

🔍 RECHERCHES DISPONIBLES :
• **Interventions** : Par client, date (mois/année), technicien, numéro
• **Pièces** : Par référence, marque, désignation
• **Stock critique** : Liste des pièces en alerte ou rupture
• **Clients** : Par nom, prénom
• **Factures** : Par numéro, client, date
• **Appareils de prêt** : Par type, marque

💡 EXEMPLES DE REQUÊTES QUI FONCTIONNENT :
• "Trouve l'intervention du client Dupont en juin 2024"
• "Liste les pièces SAMSUNG" ← Marche avec toutes les marques !
• "Quelles sont les pièces en stock critique ?" ← Affiche les 20 plus urgentes
• "Combien d'interventions a fait Jérémy en 2024 ?"
• "Cherche la facture FAC-2024-0045"

⚠️ IMPORTANT - GUIDE L'UTILISATEUR :
• Si l'utilisateur demande une recherche vague, ORIENTE-LE vers une formulation spécifique
• Exemple : "Liste toutes les pièces" → Suggère : "Liste les pièces [MARQUE]" ou "Quelles pièces en stock critique ?"
• NE DIS JAMAIS "Je ne peux pas" SANS proposer une alternative concrète

═══════════════════════════════════════════════════════════════
📊 DONNÉES EN TEMPS RÉEL (${new Date().toLocaleDateString('fr-FR')})
═══════════════════════════════════════════════════════════════

🔢 STATISTIQUES GLOBALES :
• Interventions ce mois : ${context.stats.interventionsMois}
• Interventions cette semaine : ${context.stats.interventionsSemaine}
• Interventions en cours : ${context.stats.interventionsEnCours}
• CA mensuel : ${context.stats.caMensuel}€
• Total clients : ${context.stats.totalClients}
• Pièces référencées : ${context.stats.totalPieces}
• Valeur stock : ${context.stats.valeurStock}€
• Factures en attente : ${context.stats.facturesEnAttente}

🏠 APPAREILS DE PRÊT :
• Total : ${context.stats.totalAppareilsPret}
• Disponibles : ${context.stats.appareilsDisponibles}
• Prêtés : ${context.stats.appareilsPretes}
• En maintenance : ${context.stats.appareilsMaintenance}

${context.stats.stockCritique > 0 ? `⚠️ ALERTES STOCK : ${context.stats.stockCritique} pièce(s)` : '✅ STOCK OK'}

═══════════════════════════════════════════════════════════════
💡 DIRECTIVES
═══════════════════════════════════════════════════════════════

1. CONVERSATIONNEL : Ton naturel et accessible
2. PRÉCISION : Base-toi sur les données ci-dessus
3. CONCISION : 2-5 phrases sauf si détails demandés
4. PROACTIVITÉ : Suggère des recherches si pertinent
5. CLARTÉ : Utilise des emojis (📊 📈 ⚠️ ✅)

Réponds maintenant :`;

    const messages = [
      { role: 'system', content: systemPrompt },
      ...conversationHistory.slice(-10).map(msg => ({
        role: msg.role,
        content: msg.content
      })),
      { role: 'user', content: userMessage }
    ];

    console.log('🤖 Envoi requête à OpenRouter...');

    const response = await axios.post(
      'https://openrouter.ai/api/v1/chat/completions',
      {
        model: 'google/gemini-2.0-flash-exp:free',
        messages: messages,
        temperature: 0.7,
        max_tokens: 1500
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

    return `Je suis désolé, je rencontre un problème technique. Voici ce que je peux vous dire :

📊 Stats : ${context.stats.interventionsMois} interventions ce mois, ${context.stats.caMensuel}€ de CA
🏠 Appareils : ${context.stats.appareilsDisponibles} disponibles, ${context.stats.appareilsPretes} prêtés
${context.stats.stockCritique > 0 ? `⚠️ ${context.stats.stockCritique} pièces en alerte` : '✅ Stock OK'}

💡 Vous pouvez faire des recherches spécifiques :
• "Trouve l'intervention du client [nom]"
• "Liste les pièces [marque]"`;
  }
};

// ========== ROUTES API ==========

router.post('/chat', async (req, res) => {
  try {
    const { message, sessionId } = req.body;

    if (!message || !message.trim()) {
      return res.status(400).json({ message: 'Message vide' });
    }

    const context = await getApplicationContext();

    if (!context) {
      return res.status(500).json({ message: 'Erreur lors de la récupération du contexte' });
    }

    let conversation = await AIConversation.findOne({ sessionId });

    if (!conversation) {
      conversation = new AIConversation({
        sessionId,
        utilisateur: req.user.email,
        messages: []
      });
    }

    conversation.messages.push({
      role: 'user',
      content: message,
      timestamp: new Date()
    });

    const assistantResponse = await generateAIResponse(
      message,
      conversation.messages,
      context,
      req
    );

    conversation.messages.push({
      role: 'assistant',
      content: assistantResponse,
      timestamp: new Date(),
      contexte: context.stats
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
