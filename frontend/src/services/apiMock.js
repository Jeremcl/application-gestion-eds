// API mockée pour fonctionner sans backend
import {
  mockUser,
  mockClients,
  mockInterventions,
  mockPieces,
  mockFactures,
  mockStats,
  mockAppareilsPret,
  mockPrets
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
  completeDepotAtelier: async (id, data) => {
    await delay();
    const intervention = mockInterventions.find(i => i._id === id);
    if (!intervention) {
      throw new Error('Intervention non trouvée');
    }

    // Simuler la génération du QR code et de la fiche DA
    const mockQrCodeUrl = `data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==`;
    const mockFicheDAUrl = `/uploads/interventions/${id}/fiche-da.pdf`;

    // Mettre à jour l'intervention
    intervention.photosDepot = data.photosDepot || [];
    intervention.accessoiresDepot = data.accessoiresDepot || [];
    intervention.signature = data.signature;
    intervention.signatureUrl = data.signature; // En mock, on utilise directement la signature base64
    intervention.dateDepot = new Date().toISOString();
    intervention.qrCodeUrl = mockQrCodeUrl;
    intervention.ficheDAUrl = mockFicheDAUrl;
    intervention.statut = 'En cours';

    return {
      data: {
        message: 'Dépôt atelier enregistré avec succès',
        qrCodeUrl: mockQrCodeUrl,
        ficheDAUrl: mockFicheDAUrl,
        intervention
      }
    };
  },
  getStats: async () => {
    await delay();
    return { data: mockStats };
  },
  getEmailDepotUrl: (id) => {
    return `http://localhost:5001/api/interventions/${id}/email-depot`;
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
// ⚠️ IMPORTANT : Le chatbot AI utilise toujours l'API RÉELLE (backend + OpenRouter)
// même en mode Mock, pour avoir des réponses vraiment conversationnelles
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001';

// Instance axios pour les appels AI uniquement
const aiApi = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Intercepteur pour ajouter le token
aiApi.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

export const ai = {
  // Le chatbot utilise TOUJOURS l'API réelle avec OpenRouter
  chat: async (message, sessionId) => {
    try {
      const response = await aiApi.post('/api/ai/chat', { message, sessionId });
      return response;
    } catch (error) {
      console.error('❌ Erreur chatbot AI:', error);
      // Fallback en cas d'erreur backend
      return {
        data: {
          message: "Désolé, je rencontre un problème de connexion avec le serveur. Assurez-vous que le backend est démarré et que MongoDB fonctionne.",
          conversation: { sessionId, messages: [] }
        }
      };
    }
  },
  getConversation: async (sessionId) => {
    try {
      const response = await aiApi.get(`/api/ai/chat/${sessionId}`);
      return response;
    } catch (error) {
      console.error('❌ Erreur récupération conversation:', error);
      return {
        data: {
          sessionId,
          messages: []
        }
      };
    }
  }
};

// Maintenance
// Pour réinitialiser le mode maintenance, changez isActive à false
let mockMaintenance = {
  isActive: false, // Mettre à false si vous n'avez plus accès
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

// Appareils de Prêt
export const appareilsPret = {
  getAll: async (params) => {
    await delay();
    let filtered = [...mockAppareilsPret];
    if (params?.statut) {
      filtered = filtered.filter(a => a.statut === params.statut);
    }
    if (params?.search) {
      const search = params.search.toLowerCase();
      filtered = filtered.filter(a =>
        a.type.toLowerCase().includes(search) ||
        a.marque.toLowerCase().includes(search) ||
        a.modele.toLowerCase().includes(search) ||
        a.numeroSerie?.toLowerCase().includes(search)
      );
    }
    return {
      data: {
        appareils: filtered,
        totalPages: 1,
        currentPage: 1,
        total: filtered.length
      }
    };
  },

  getStats: async () => {
    await delay();
    const total = mockAppareilsPret.length;
    const disponibles = mockAppareilsPret.filter(a => a.statut === 'Disponible').length;
    const pretes = mockAppareilsPret.filter(a => a.statut === 'Prêté').length;
    const enMaintenance = mockAppareilsPret.filter(a => a.statut === 'En maintenance').length;
    const valeurTotale = mockAppareilsPret.reduce((sum, a) => sum + (a.valeur || 0), 0);

    return {
      data: {
        total,
        disponibles,
        pretes,
        enMaintenance,
        valeurTotale
      }
    };
  },

  getDisponibles: async () => {
    await delay();
    return {
      data: mockAppareilsPret.filter(a => a.statut === 'Disponible')
    };
  },

  getById: async (id) => {
    await delay();
    const appareil = mockAppareilsPret.find(a => a._id === id);
    return { data: appareil };
  },

  create: async (data) => {
    await delay();
    const newAppareil = {
      _id: 'ap' + Date.now(),
      ...data,
      dateCreation: new Date(),
      dateModification: new Date()
    };
    mockAppareilsPret.push(newAppareil);
    return { data: newAppareil };
  },

  update: async (id, data) => {
    await delay();
    const index = mockAppareilsPret.findIndex(a => a._id === id);
    if (index !== -1) {
      mockAppareilsPret[index] = {
        ...mockAppareilsPret[index],
        ...data,
        dateModification: new Date()
      };
      return { data: mockAppareilsPret[index] };
    }
    throw new Error('Appareil non trouvé');
  },

  delete: async (id) => {
    await delay();
    // Vérifier si prêté
    const pretActif = mockPrets.find(p => p.appareilPretId === id && p.statut === 'En cours');
    if (pretActif) {
      throw new Error('Impossible de supprimer un appareil actuellement prêté');
    }
    const index = mockAppareilsPret.findIndex(a => a._id === id);
    if (index !== -1) {
      mockAppareilsPret.splice(index, 1);
      return { data: { message: 'Appareil supprimé' } };
    }
    throw new Error('Appareil non trouvé');
  },

  getPrets: async (id) => {
    await delay();
    const prets = mockPrets.filter(p => p.appareilPretId === id);
    // Populate client et intervention
    const populated = prets.map(p => ({
      ...p,
      clientId: mockClients.find(c => c._id === p.clientId),
      interventionId: mockInterventions.find(i => i._id === p.interventionId),
      appareilPretId: mockAppareilsPret.find(a => a._id === p.appareilPretId)
    }));
    return { data: populated };
  }
};

// Prêts
export const prets = {
  create: async (data) => {
    await delay();
    const appareil = mockAppareilsPret.find(a => a._id === data.appareilPretId);
    if (!appareil) {
      throw new Error('Appareil non trouvé');
    }
    if (appareil.statut !== 'Disponible') {
      throw new Error('Appareil non disponible');
    }

    const newPret = {
      _id: 'pr' + Date.now(),
      ...data,
      datePret: new Date(),
      statut: 'En cours',
      etatDepart: appareil.etat
    };
    mockPrets.push(newPret);

    // Mettre à jour le statut de l'appareil
    const appareilIndex = mockAppareilsPret.findIndex(a => a._id === data.appareilPretId);
    if (appareilIndex !== -1) {
      mockAppareilsPret[appareilIndex].statut = 'Prêté';
    }

    // Populate pour le retour
    return {
      data: {
        ...newPret,
        clientId: mockClients.find(c => c._id === data.clientId),
        interventionId: data.interventionId ? mockInterventions.find(i => i._id === data.interventionId) : null,
        appareilPretId: appareil
      }
    };
  },

  retour: async (id, data) => {
    await delay();
    const pretIndex = mockPrets.findIndex(p => p._id === id);
    if (pretIndex === -1) {
      throw new Error('Prêt non trouvé');
    }

    mockPrets[pretIndex].dateRetourEffectif = new Date();
    mockPrets[pretIndex].etatRetour = data.etatRetour || mockPrets[pretIndex].etatDepart;
    mockPrets[pretIndex].statut = 'Retourné';
    if (data.notes) mockPrets[pretIndex].notes = data.notes;

    // Libérer l'appareil
    const appareilIndex = mockAppareilsPret.findIndex(a => a._id === mockPrets[pretIndex].appareilPretId);
    if (appareilIndex !== -1) {
      mockAppareilsPret[appareilIndex].statut = 'Disponible';
      mockAppareilsPret[appareilIndex].etat = data.etatRetour || mockAppareilsPret[appareilIndex].etat;
    }

    // Populate pour le retour
    return {
      data: {
        ...mockPrets[pretIndex],
        clientId: mockClients.find(c => c._id === mockPrets[pretIndex].clientId),
        interventionId: mockPrets[pretIndex].interventionId ? mockInterventions.find(i => i._id === mockPrets[pretIndex].interventionId) : null,
        appareilPretId: mockAppareilsPret[appareilIndex]
      }
    };
  },

  getAll: async (params) => {
    await delay();
    let filtered = [...mockPrets];
    if (params?.statut) {
      filtered = filtered.filter(p => p.statut === params.statut);
    }
    if (params?.clientId) {
      filtered = filtered.filter(p => p.clientId === params.clientId);
    }
    if (params?.appareilPretId) {
      filtered = filtered.filter(p => p.appareilPretId === params.appareilPretId);
    }

    // Populate
    const populated = filtered.map(p => ({
      ...p,
      clientId: mockClients.find(c => c._id === p.clientId),
      interventionId: p.interventionId ? mockInterventions.find(i => i._id === p.interventionId) : null,
      appareilPretId: mockAppareilsPret.find(a => a._id === p.appareilPretId)
    }));

    return { data: populated };
  }
};

// Fiches Internes
let mockFichesInternes = [];

export const fichesInternes = {
  getAll: async (params) => {
    await delay();
    let filtered = [...mockFichesInternes];
    if (params?.type) {
      filtered = filtered.filter(f => f.type === params.type);
    }
    return {
      data: {
        fiches: filtered,
        totalPages: 1,
        currentPage: 1,
        total: filtered.length
      }
    };
  },

  getById: async (id) => {
    await delay();
    const fiche = mockFichesInternes.find(f => f._id === id);
    if (!fiche) throw new Error('Fiche non trouvée');
    return { data: fiche };
  },

  generer: async (payload) => {
    await delay(500);
    const { type, data, clientId, appareilPretId } = payload;

    // Générer un numéro de fiche
    const count = mockFichesInternes.filter(f => f.type === type).length;
    const prefix = type.replace('.', '');
    const numero = `${prefix}-${String(count + 1).padStart(6, '0')}`;

    const newFiche = {
      _id: 'fiche' + Date.now(),
      type,
      numero,
      data,
      clientId,
      appareilPretId,
      dateGeneration: new Date(),
      generePar: mockUser._id
    };

    mockFichesInternes.push(newFiche);

    // Simuler le téléchargement d'un PDF
    // En production, cette fonction retournerait un blob PDF
    return {
      data: newFiche,
      pdfUrl: `mock-pdf-${numero}.pdf`
    };
  },

  preview: async (id) => {
    await delay(300);
    const fiche = mockFichesInternes.find(f => f._id === id);
    if (!fiche) throw new Error('Fiche non trouvée');

    // En mode mock, on retourne juste l'URL de l'API qui servira le PDF
    // En production, cela pointera vers l'API réelle
    return {
      data: fiche,
      previewUrl: `/api/fiches-internes/${id}/preview`
    };
  },

  regenerer: async (id) => {
    await delay(500);
    const fiche = mockFichesInternes.find(f => f._id === id);
    if (!fiche) throw new Error('Fiche non trouvée');

    // Simuler la régénération du PDF
    return {
      data: fiche,
      pdfUrl: `mock-pdf-${fiche.numero}.pdf`
    };
  },

  delete: async (id) => {
    await delay();
    const index = mockFichesInternes.findIndex(f => f._id === id);
    if (index !== -1) {
      mockFichesInternes.splice(index, 1);
      return { data: { message: 'Fiche supprimée' } };
    }
    throw new Error('Fiche non trouvée');
  },

  getStats: async () => {
    await delay();
    const stats = {
      'DA1.1': mockFichesInternes.filter(f => f.type === 'DA1.1').length,
      'AEA1.1': mockFichesInternes.filter(f => f.type === 'AEA1.1').length,
      'AP1.1': mockFichesInternes.filter(f => f.type === 'AP1.1').length,
      total: mockFichesInternes.length
    };
    return { data: stats };
  }
};

// Vehicules (stub pour mock)
export const vehicules = {
  getAll: async () => { await delay(); return { data: { vehicules: [], totalPages: 1, currentPage: 1, total: 0 } }; },
  getStats: async () => { await delay(); return { data: { total: 0, enService: 0, enMaintenance: 0 } }; },
  getAlertesDocuments: async () => { await delay(); return { data: [] }; },
  getById: async () => { await delay(); return { data: null }; },
  create: async (data) => { await delay(); return { data: { _id: Date.now().toString(), ...data } }; },
  update: async (id, data) => { await delay(); return { data: { _id: id, ...data } }; },
  delete: async () => { await delay(); return { data: { message: 'Véhicule supprimé' } }; },
  addKilometrage: async () => { await delay(); return { data: { message: 'OK' } }; },
  addCarburant: async () => { await delay(); return { data: { message: 'OK' } }; },
  addDocument: async () => { await delay(); return { data: { message: 'OK' } }; }
};

// Users (mock)
let mockUsers = [
  { _id: '1', nom: 'Administrateur EDS22', email: 'admin@eds22.com', role: 'admin', createdAt: new Date('2024-01-01') },
  { _id: '2', nom: 'Jérémy', email: 'jeremy@eds22.com', role: 'tech', createdAt: new Date('2024-01-15') },
  { _id: '3', nom: 'Stéphane', email: 'stephane@eds22.com', role: 'tech', createdAt: new Date('2024-01-15') },
  { _id: '4', nom: 'Anne Laure', email: 'annelaure@eds22.com', role: 'tech', createdAt: new Date('2024-02-01') },
];

export const users = {
  getAll: async () => {
    await delay();
    return { data: { users: [...mockUsers] } };
  },
  create: async (data) => {
    await delay();
    const existing = mockUsers.find(u => u.email === data.email);
    if (existing) throw { response: { data: { message: 'Un utilisateur avec cet email existe déjà' } } };
    const newUser = { _id: Date.now().toString(), ...data, role: data.role || 'tech', createdAt: new Date() };
    mockUsers.push(newUser);
    return { data: { user: newUser } };
  },
  updateMe: async (data) => {
    await delay();
    const stored = JSON.parse(localStorage.getItem('user') || '{}');
    const updated = { ...stored, ...data };
    localStorage.setItem('user', JSON.stringify(updated));
    return { data: { user: updated } };
  },
  changePassword: async (data) => {
    await delay();
    return { data: { message: 'Mot de passe modifié avec succès' } };
  },
  delete: async (id) => {
    await delay();
    const index = mockUsers.findIndex(u => u._id === id);
    if (index === -1) throw new Error('Utilisateur non trouvé');
    mockUsers.splice(index, 1);
    return { data: { message: 'Utilisateur supprimé avec succès' } };
  }
};

// Uploads (stub pour mock)
export const uploads = {
  uploadPhoto: async () => { await delay(); return { data: { url: 'mock-photo-url.jpg' } }; },
  deletePhoto: async () => { await delay(); return { data: { message: 'Photo supprimée' } }; }
};

// Statistiques
export const statistiques = {
  getDashboard: async (periode) => {
    await delay(400);

    const now = new Date();
    const moisLabels = [];
    for (let i = 11; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      moisLabels.push(d.toLocaleDateString('fr-FR', { month: 'short', year: '2-digit' }));
    }

    // Générer des données réalistes pour un réparateur électroménager
    const caValues = [1850, 2100, 2400, 1900, 2600, 2200, 2800, 2350, 2150, 2500, 1950, 2300];
    const creeesValues = [12, 15, 18, 14, 20, 16, 22, 17, 15, 19, 13, 16];
    const termineesValues = [10, 13, 16, 12, 18, 14, 19, 15, 14, 17, 11, 14];

    return {
      data: {
        kpis: {
          caPeriode: periode === 'annee' ? 27100 : periode === 'trimestre' ? 6750 : 2300,
          enCours: 7,
          panierMoyen: 138,
          delaiMoyen: 4.2
        },
        revenusParMois: moisLabels.map((mois, i) => ({
          mois,
          ca: caValues[i],
          count: Math.round(caValues[i] / 130)
        })),
        pipeline: [
          { statut: 'Demande', count: 3 },
          { statut: 'Planifié', count: 2 },
          { statut: 'En cours', count: 4 },
          { statut: 'Diagnostic', count: 2 },
          { statut: 'Réparation', count: 1 },
          { statut: 'Terminé', count: 8 },
          { statut: 'Facturé', count: 15 }
        ],
        ventilationRevenus: [
          { name: "Main d'oeuvre", value: 980 },
          { name: 'Pièces', value: 720 },
          { name: 'Forfait', value: 600 }
        ],
        repartitionType: [
          { name: 'Atelier', value: 22 },
          { name: 'Domicile', value: 13 }
        ],
        topAppareils: [
          { name: 'Lave-linge', value: 12 },
          { name: 'Lave-vaisselle', value: 8 },
          { name: 'Réfrigérateur', value: 6 },
          { name: 'Sèche-linge', value: 5 },
          { name: 'Four', value: 4 }
        ],
        activiteParMois: moisLabels.map((mois, i) => ({
          mois,
          creees: creeesValues[i],
          terminees: termineesValues[i]
        })),
        facturesImpayees: {
          aging: [
            { tranche: '0-30 jours', count: 3, montant: 420 },
            { tranche: '30-60 jours', count: 1, montant: 200 },
            { tranche: '60+ jours', count: 1, montant: 185 }
          ],
          total: 5,
          montantTotal: 805
        },
        topClients: [
          { nom: 'Dupont Marie', totalCA: 580, count: 4 },
          { nom: 'Martin Jean', totalCA: 420, count: 3 },
          { nom: 'Bernard Sophie', totalCA: 350, count: 3 },
          { nom: 'Petit Alain', totalCA: 290, count: 2 },
          { nom: 'Leroy Catherine', totalCA: 260, count: 2 }
        ],
        qualite: {
          tauxRetour: 2.8,
          topPieces: [
            { nom: 'Pompe de vidange', reference: 'POM-002', quantite: 12 },
            { nom: 'Filtre peluches', reference: 'FIL-001', quantite: 9 },
            { nom: 'Résistance 2000W', reference: 'RES-003', quantite: 7 },
            { nom: 'Courroie tambour', reference: 'COU-004', quantite: 6 },
            { nom: 'Joint de hublot', reference: 'JOI-005', quantite: 5 }
          ],
          stockCritique: [
            { reference: 'POM-002', designation: 'Pompe de vidange lave-vaisselle', stock: 3, minimum: 5 }
          ]
        }
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
  maintenance,
  appareilsPret,
  prets,
  fichesInternes,
  vehicules,
  uploads,
  statistiques
};
