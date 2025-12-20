// API mockée pour fonctionner sans backend
import {
  mockUser,
  mockClients,
  mockInterventions,
  mockPieces,
  mockFactures,
  mockStats
} from './mockData';

// Simuler un délai réseau
const delay = (ms = 300) => new Promise(resolve => setTimeout(resolve, ms));

// Auth
export const auth = {
  login: async (email, password) => {
    await delay();
    
    // Vérifier le mode maintenance (sauf pour l'admin)
    if (mockMaintenance.isActive && mockMaintenance.endDate && new Date() <= new Date(mockMaintenance.endDate)) {
      const isAdmin = email === 'admin@eds22.com' && password === 'admin123';
      if (!isAdmin) {
        throw { 
          response: { 
            status: 503,
            data: { 
              message: mockMaintenance.message || 'L\'application est en maintenance',
              maintenance: {
                isActive: true,
                endDate: mockMaintenance.endDate
              }
            } 
          } 
        };
      }
    }
    
    // Admin
    if (email === 'admin@eds22.com' && password === 'admin123') {
      return { data: { token: 'mock-token-admin', user: { ...mockUser, nom: 'Administrateur EDS22', role: 'admin' } } };
    }
    // Jérémy
    if (email === 'jeremy@eds22.com' && password === 'jeremy123') {
      return { data: { token: 'mock-token-jeremy', user: { ...mockUser, nom: 'Jérémy', role: 'tech' } } };
    }
    // Stéphane
    if (email === 'stephane@eds22.com' && password === 'stephane123') {
      return { data: { token: 'mock-token-stephane', user: { ...mockUser, nom: 'Stéphane', role: 'tech' } } };
    }
    // Anne Laure
    if (email === 'annelaure@eds22.com' && password === 'annelaure123') {
      return { data: { token: 'mock-token-annelaure', user: { ...mockUser, nom: 'Anne Laure', role: 'tech' } } };
    }
    throw { response: { data: { message: 'Email ou mot de passe incorrect' } } };
  },
  register: async (data) => {
    await delay();
    return { data: { message: 'Utilisateur créé avec succès', user: mockUser } };
  }
};

// Clients
export const clients = {
  getAll: async (params) => {
    await delay();
    let filtered = [...mockClients];
    if (params?.search) {
      const search = params.search.toLowerCase();
      filtered = filtered.filter(c =>
        c.nom.toLowerCase().includes(search) ||
        c.prenom.toLowerCase().includes(search) ||
        c.telephone.includes(search) ||
        c.email?.toLowerCase().includes(search)
      );
    }
    return {
      data: {
        clients: filtered,
        totalPages: 1,
        currentPage: 1,
        total: filtered.length
      }
    };
  },
  getById: async (id) => {
    await delay();
    const client = mockClients.find(c => c._id === id);
    return { data: client };
  },
  create: async (data) => {
    await delay();
    const newClient = { _id: Date.now().toString(), ...data };
    mockClients.push(newClient);
    return { data: newClient };
  },
  update: async (id, data) => {
    await delay();
    const index = mockClients.findIndex(c => c._id === id);
    if (index !== -1) {
      mockClients[index] = { ...mockClients[index], ...data };
      return { data: mockClients[index] };
    }
    throw new Error('Client non trouvé');
  },
  delete: async (id) => {
    await delay();
    const index = mockClients.findIndex(c => c._id === id);
    if (index !== -1) {
      mockClients.splice(index, 1);
      return { data: { message: 'Client supprimé' } };
    }
    throw new Error('Client non trouvé');
  },
  getDevices: async (clientId) => {
    await delay();
    const client = mockClients.find(c => c._id === clientId);
    if (!client) throw new Error('Client non trouvé');

    // Compter les interventions par appareil
    const appareilsWithCounts = (client.appareils || []).map(appareil => {
      const count = mockInterventions.filter(i =>
        i.clientId === clientId && i.appareilId === appareil._id
      ).length;
      return { ...appareil, interventionCount: count };
    });

    return { data: appareilsWithCounts };
  },
  getDevice: async (clientId, appareilId) => {
    await delay();
    const client = mockClients.find(c => c._id === clientId);
    if (!client) throw new Error('Client non trouvé');

    const appareil = (client.appareils || []).find(a => a._id === appareilId);
    if (!appareil) throw new Error('Appareil non trouvé');

    return {
      data: {
        appareil,
        client: {
          _id: client._id,
          nom: client.nom,
          prenom: client.prenom,
          telephone: client.telephone,
          email: client.email
        }
      }
    };
  },
  updateDevice: async (clientId, appareilId, data) => {
    await delay();
    const client = mockClients.find(c => c._id === clientId);
    if (!client) throw new Error('Client non trouvé');

    const appareilIndex = (client.appareils || []).findIndex(a => a._id === appareilId);
    if (appareilIndex === -1) throw new Error('Appareil non trouvé');

    client.appareils[appareilIndex] = { ...client.appareils[appareilIndex], ...data };
    return { data: client.appareils[appareilIndex] };
  },
  deleteDevice: async (clientId, appareilId) => {
    await delay();
    const client = mockClients.find(c => c._id === clientId);
    if (!client) throw new Error('Client non trouvé');

    // Vérifier s'il y a des interventions liées
    const interventionCount = mockInterventions.filter(i => i.appareilId === appareilId).length;
    if (interventionCount > 0) {
      throw new Error(`Impossible de supprimer l'appareil. ${interventionCount} intervention(s) y sont liées.`);
    }

    client.appareils = (client.appareils || []).filter(a => a._id !== appareilId);
    return { data: { message: 'Appareil supprimé' } };
  },
  getDeviceInterventions: async (clientId, appareilId, params) => {
    await delay();
    let filtered = mockInterventions.filter(i =>
      i.clientId === clientId && i.appareilId === appareilId
    );

    if (params?.statut) {
      filtered = filtered.filter(i => i.statut === params.statut);
    }

    return {
      data: {
        interventions: filtered,
        totalPages: 1,
        currentPage: 1,
        total: filtered.length
      }
    };
  }
};

// Interventions
export const interventions = {
  getAll: async (params) => {
    await delay();
    let filtered = [...mockInterventions];
    if (params?.statut) {
      filtered = filtered.filter(i => i.statut === params.statut);
    }
    return {
      data: {
        interventions: filtered,
        totalPages: 1,
        currentPage: 1,
        total: filtered.length
      }
    };
  },
  getById: async (id) => {
    await delay();
    const intervention = mockInterventions.find(i => i._id === id);
    return { data: intervention };
  },
  create: async (data) => {
    await delay();
    const newIntervention = { _id: Date.now().toString(), ...data };
    mockInterventions.push(newIntervention);
    return { data: newIntervention };
  },
  update: async (id, data) => {
    await delay();
    const index = mockInterventions.findIndex(i => i._id === id);
    if (index !== -1) {
      mockInterventions[index] = { ...mockInterventions[index], ...data };
      return { data: mockInterventions[index] };
    }
    throw new Error('Intervention non trouvée');
  },
  delete: async (id) => {
    await delay();
    const index = mockInterventions.findIndex(i => i._id === id);
    if (index !== -1) {
      mockInterventions.splice(index, 1);
      return { data: { message: 'Intervention supprimée' } };
    }
    throw new Error('Intervention non trouvée');
  },
  getStats: async () => {
    await delay();
    return { data: mockStats };
  }
};

// Pièces
export const pieces = {
  getAll: async (params) => {
    await delay();
    let filtered = [...mockPieces];
    if (params?.search) {
      const search = params.search.toLowerCase();
      filtered = filtered.filter(p =>
        p.reference.toLowerCase().includes(search) ||
        p.designation.toLowerCase().includes(search) ||
        p.marque?.toLowerCase().includes(search)
      );
    }
    if (params?.stockCritique === 'true') {
      filtered = filtered.filter(p => p.quantiteStock < p.quantiteMinimum);
    }
    return {
      data: {
        pieces: filtered,
        totalPages: 1,
        currentPage: 1,
        total: filtered.length
      }
    };
  },
  getById: async (id) => {
    await delay();
    const piece = mockPieces.find(p => p._id === id);
    return { data: piece };
  },
  create: async (data) => {
    await delay();
    const newPiece = { _id: Date.now().toString(), ...data };
    mockPieces.push(newPiece);
    return { data: newPiece };
  },
  update: async (id, data) => {
    await delay();
    const index = mockPieces.findIndex(p => p._id === id);
    if (index !== -1) {
      mockPieces[index] = { ...mockPieces[index], ...data };
      return { data: mockPieces[index] };
    }
    throw new Error('Pièce non trouvée');
  },
  delete: async (id) => {
    await delay();
    const index = mockPieces.findIndex(p => p._id === id);
    if (index !== -1) {
      mockPieces.splice(index, 1);
      return { data: { message: 'Pièce supprimée' } };
    }
    throw new Error('Pièce non trouvée');
  },
  getAlertes: async () => {
    await delay();
    const alertes = mockPieces.filter(p => p.quantiteStock < p.quantiteMinimum);
    return {
      data: {
        count: alertes.length,
        pieces: alertes
      }
    };
  }
};

// Factures
export const factures = {
  getAll: async (params) => {
    await delay();
    let filtered = [...mockFactures];
    if (params?.type) {
      filtered = filtered.filter(f => f.type === params.type);
    }
    if (params?.statut) {
      filtered = filtered.filter(f => f.statut === params.statut);
    }
    return {
      data: {
        factures: filtered,
        totalPages: 1,
        currentPage: 1,
        total: filtered.length
      }
    };
  },
  getById: async (id) => {
    await delay();
    const facture = mockFactures.find(f => f._id === id);
    return { data: facture };
  },
  create: async (data) => {
    await delay();
    const newFacture = { _id: Date.now().toString(), ...data };
    mockFactures.push(newFacture);
    return { data: newFacture };
  },
  update: async (id, data) => {
    await delay();
    const index = mockFactures.findIndex(f => f._id === id);
    if (index !== -1) {
      mockFactures[index] = { ...mockFactures[index], ...data };
      return { data: mockFactures[index] };
    }
    throw new Error('Facture non trouvée');
  },
  delete: async (id) => {
    await delay();
    const index = mockFactures.findIndex(f => f._id === id);
    if (index !== -1) {
      mockFactures.splice(index, 1);
      return { data: { message: 'Facture supprimée' } };
    }
    throw new Error('Facture non trouvée');
  }
};

// AI Assistant
export const ai = {
  chat: async (message, sessionId) => {
    await delay(500);

    const msg = message.toLowerCase();
    let response = '';

    if (msg.includes('stat') || msg.includes('chiffre')) {
      response = `📊 Voici les statistiques du mois :\n\n• ${mockStats.interventionsMois} interventions réalisées\n• Chiffre d'affaires : ${mockStats.caMensuel.toFixed(2)}€\n• Taux de satisfaction : 94%\n\nVoulez-vous plus de détails ?`;
    } else if (msg.includes('stock') || msg.includes('pièce')) {
      const stockCritique = mockPieces.filter(p => p.quantiteStock < p.quantiteMinimum).length;
      if (stockCritique > 0) {
        response = `⚠️ Attention ! ${stockCritique} pièce${stockCritique > 1 ? 's' : ''} en stock critique.\n\nJe vous recommande de passer une commande rapidement pour éviter toute rupture.`;
      } else {
        response = `✅ Le stock est bien approvisionné ! Toutes les pièces sont au-dessus du seuil minimum.`;
      }
    } else if (msg.includes('client')) {
      response = `👥 Vous avez actuellement ${mockClients.length} clients dans votre base.\n\nQue souhaitez-vous faire ?\n• Rechercher un client\n• Créer une nouvelle fiche\n• Voir les derniers ajouts`;
    } else if (msg.includes('intervention') || msg.includes('réparation')) {
      const enCours = mockInterventions.filter(i => ['En cours', 'Diagnostic', 'Réparation'].includes(i.statut)).length;
      response = `🔧 ${enCours} intervention${enCours > 1 ? 's' : ''} en cours actuellement.\n\nVoulez-vous :\n• Voir le planning\n• Créer une nouvelle intervention\n• Consulter les urgences`;
    } else {
      response = `Je suis l'assistant EDS22. Je peux vous aider à :\n\n• 📊 Consulter vos statistiques\n• 👥 Gérer vos clients\n• 🔧 Suivre vos interventions\n• 📦 Contrôler votre stock\n• 💰 Générer des factures\n\nQue puis-je faire pour vous ?`;
    }

    return {
      data: {
        message: response,
        conversation: { sessionId, messages: [] }
      }
    };
  },
  getConversation: async (sessionId) => {
    await delay();
    return {
      data: {
        sessionId,
        messages: []
      }
    };
  }
};

// Maintenance
let mockMaintenance = {
  isActive: false,
  endDate: null,
  message: 'L\'application est actuellement en maintenance. Veuillez réessayer plus tard.'
};

export const maintenance = {
  getStatus: async () => {
    await delay();
    // Vérifier si la date de fin est dépassée
    if (mockMaintenance.isActive && mockMaintenance.endDate && new Date() > new Date(mockMaintenance.endDate)) {
      mockMaintenance.isActive = false;
    }
    return { data: mockMaintenance };
  },
  toggle: async (data) => {
    await delay();
    mockMaintenance = {
      ...mockMaintenance,
      isActive: data.isActive,
      endDate: data.endDate ? new Date(data.endDate).toISOString() : null,
      message: data.message || mockMaintenance.message
    };
    return { 
      data: { 
        message: mockMaintenance.isActive ? 'Mode maintenance activé' : 'Mode maintenance désactivé',
        maintenance: mockMaintenance
      } 
    };
  }
};

export default {
  auth,
  clients,
  interventions,
  pieces,
  factures,
  ai,
  maintenance
};
