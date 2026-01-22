import axios from 'axios';

// Configuration de l'URL de base de l'API
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001';

// Debug: Log de l'URL utilisée
console.log('🔧 API Configuration:', {
  VITE_API_URL: import.meta.env.VITE_API_URL,
  API_URL: API_URL,
  MODE: import.meta.env.MODE,
  timestamp: new Date().toISOString()
});

// Instance axios avec configuration
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Intercepteur pour ajouter le token d'authentification
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Intercepteur pour gérer les erreurs d'authentification
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expiré ou invalide
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth
export const auth = {
  login: async (email, password) => {
    const response = await api.post('/api/auth/login', { email, password });
    if (response.data.token) {
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.user));
    }
    return response;
  },
  register: async (data) => {
    return await api.post('/api/auth/register', data);
  }
};

// Clients
export const clients = {
  getAll: async (params) => {
    const response = await api.get('/api/clients', { params });
    return response;
  },
  getById: async (id) => {
    const response = await api.get(`/api/clients/${id}`);
    return response;
  },
  create: async (data) => {
    const response = await api.post('/api/clients', data);
    return response;
  },
  update: async (id, data) => {
    const response = await api.put(`/api/clients/${id}`, data);
    return response;
  },
  delete: async (id) => {
    const response = await api.delete(`/api/clients/${id}`);
    return response;
  },
  addAppareil: async (id, data) => {
    const response = await api.post(`/api/clients/${id}/appareils`, data);
    return response;
  },
  updateAppareil: async (id, appareilId, data) => {
    const response = await api.put(`/api/clients/${id}/appareils/${appareilId}`, data);
    return response;
  },
  deleteAppareil: async (id, appareilId) => {
    const response = await api.delete(`/api/clients/${id}/appareils/${appareilId}`);
    return response;
  },
  getInterventions: async (id) => {
    const response = await api.get(`/api/clients/${id}/interventions`);
    return response;
  },
  // Alias pour compatibilité avec le frontend
  getDevices: async (clientId) => {
    const response = await api.get(`/api/clients/${clientId}/appareils`);
    return response;
  },
  getDevice: async (clientId, appareilId) => {
    const response = await api.get(`/api/clients/${clientId}/appareils/${appareilId}`);
    return response;
  },
  updateDevice: async (clientId, appareilId, data) => {
    const response = await api.put(`/api/clients/${clientId}/appareils/${appareilId}`, data);
    return response;
  },
  deleteDevice: async (clientId, appareilId) => {
    const response = await api.delete(`/api/clients/${clientId}/appareils/${appareilId}`);
    return response;
  },
  getDeviceInterventions: async (clientId, appareilId, params) => {
    const response = await api.get(`/api/clients/${clientId}/appareils/${appareilId}/interventions`, { params });
    return response;
  }
};

// Interventions
export const interventions = {
  getAll: async (params) => {
    const response = await api.get('/api/interventions', { params });
    return response;
  },
  getById: async (id) => {
    const response = await api.get(`/api/interventions/${id}`);
    return response;
  },
  create: async (data) => {
    const response = await api.post('/api/interventions', data);
    return response;
  },
  update: async (id, data) => {
    const response = await api.put(`/api/interventions/${id}`, data);
    return response;
  },
  delete: async (id) => {
    const response = await api.delete(`/api/interventions/${id}`);
    return response;
  },
  updateStatut: async (id, statut) => {
    const response = await api.patch(`/api/interventions/${id}/statut`, { statut });
    return response;
  },
  getStats: async () => {
    const response = await api.get('/api/interventions/stats/dashboard');
    return response;
  }
};

// Pièces
export const pieces = {
  getAll: async (params) => {
    const response = await api.get('/api/pieces', { params });
    return response;
  },
  getById: async (id) => {
    const response = await api.get(`/api/pieces/${id}`);
    return response;
  },
  create: async (data) => {
    const response = await api.post('/api/pieces', data);
    return response;
  },
  update: async (id, data) => {
    const response = await api.put(`/api/pieces/${id}`, data);
    return response;
  },
  delete: async (id) => {
    const response = await api.delete(`/api/pieces/${id}`);
    return response;
  },
  getAlertes: async () => {
    const response = await api.get('/api/pieces/alertes');
    return response;
  }
};

// Factures
export const factures = {
  getAll: async (params) => {
    const response = await api.get('/api/factures', { params });
    return response;
  },
  getById: async (id) => {
    const response = await api.get(`/api/factures/${id}`);
    return response;
  },
  create: async (data) => {
    const response = await api.post('/api/factures', data);
    return response;
  },
  update: async (id, data) => {
    const response = await api.put(`/api/factures/${id}`, data);
    return response;
  },
  delete: async (id) => {
    const response = await api.delete(`/api/factures/${id}`);
    return response;
  },
  genererPDF: async (id) => {
    const response = await api.get(`/api/factures/${id}/pdf`, {
      responseType: 'blob'
    });
    return response;
  },
  updateStatut: async (id, statut) => {
    const response = await api.patch(`/api/factures/${id}/statut`, { statut });
    return response;
  }
};

// AI
export const ai = {
  chat: async (message, sessionId) => {
    const response = await api.post('/api/ai/chat', { message, sessionId });
    return response;
  },
  getConversations: async () => {
    const response = await api.get('/api/ai/conversations');
    return response;
  },
  getConversation: async (id) => {
    const response = await api.get(`/api/ai/conversations/${id}`);
    return response;
  },
  deleteConversation: async (id) => {
    const response = await api.delete(`/api/ai/conversations/${id}`);
    return response;
  }
};

// Maintenance
export const maintenance = {
  getStatus: async () => {
    const response = await api.get('/api/maintenance/status');
    return response;
  },
  activate: async (data) => {
    const response = await api.post('/api/maintenance/activate', data);
    return response;
  },
  deactivate: async () => {
    const response = await api.post('/api/maintenance/deactivate');
    return response;
  }
};

// Appareils de prêt
export const appareilsPret = {
  getAll: async (params) => {
    const response = await api.get('/api/appareils-pret', { params });
    return response;
  },
  getStats: async () => {
    const response = await api.get('/api/appareils-pret/stats');
    return response;
  },
  getDisponibles: async () => {
    const response = await api.get('/api/appareils-pret/disponibles');
    return response;
  },
  getById: async (id) => {
    const response = await api.get(`/api/appareils-pret/${id}`);
    return response;
  },
  create: async (data) => {
    const response = await api.post('/api/appareils-pret', data);
    return response;
  },
  update: async (id, data) => {
    const response = await api.put(`/api/appareils-pret/${id}`, data);
    return response;
  },
  delete: async (id) => {
    const response = await api.delete(`/api/appareils-pret/${id}`);
    return response;
  },
  getPrets: async (id) => {
    const response = await api.get(`/api/appareils-pret/${id}/prets`);
    return response;
  }
};

// Prêts
export const prets = {
  getAll: async (params) => {
    const response = await api.get('/api/prets', { params });
    return response;
  },
  getActifs: async () => {
    const response = await api.get('/api/prets/actifs');
    return response;
  },
  getRetardsStats: async () => {
    const response = await api.get('/api/prets/retards/stats');
    return response;
  },
  getById: async (id) => {
    const response = await api.get(`/api/prets/${id}`);
    return response;
  },
  create: async (data) => {
    const response = await api.post('/api/prets', data);
    return response;
  },
  update: async (id, data) => {
    const response = await api.put(`/api/prets/${id}`, data);
    return response;
  },
  retour: async (id, data) => {
    const response = await api.post(`/api/prets/${id}/retour`, data);
    return response;
  },
  delete: async (id) => {
    const response = await api.delete(`/api/prets/${id}`);
    return response;
  }
};

// Fiches internes
export const fichesInternes = {
  getAll: async (params) => {
    const response = await api.get('/api/fiches-internes', { params });
    return response;
  },
  getById: async (id) => {
    const response = await api.get(`/api/fiches-internes/${id}`);
    return response;
  },
  getStats: async () => {
    const response = await api.get('/api/fiches-internes/stats/count');
    return response;
  },
  generer: async (payload) => {
    const response = await api.post('/api/fiches-internes/generer', payload);
    return response;
  },
  create: async (data) => {
    const response = await api.post('/api/fiches-internes', data);
    return response;
  },
  update: async (id, data) => {
    const response = await api.put(`/api/fiches-internes/${id}`, data);
    return response;
  },
  delete: async (id) => {
    const response = await api.delete(`/api/fiches-internes/${id}`);
    return response;
  },
  preview: async (id) => {
    const response = await api.get(`/api/fiches-internes/${id}/preview`, {
      responseType: 'blob'
    });
    return response;
  },
  regenerer: async (id) => {
    const response = await api.post(`/api/fiches-internes/${id}/regenerer`, {}, {
      responseType: 'blob'
    });
    return response;
  },
  updateStatut: async (id, statut) => {
    const response = await api.patch(`/api/fiches-internes/${id}/statut`, { statut });
    return response;
  },
  assignerTechnicien: async (id, technicienId) => {
    const response = await api.patch(`/api/fiches-internes/${id}/technicien`, { technicienId });
    return response;
  }
};

// Vehicules
export const vehicules = {
  getAll: async (params) => {
    const response = await api.get('/api/vehicules', { params });
    return response;
  },
  getStats: async () => {
    const response = await api.get('/api/vehicules/stats');
    return response;
  },
  getAlertesDocuments: async () => {
    const response = await api.get('/api/vehicules/alertes-documents');
    return response;
  },
  getById: async (id) => {
    const response = await api.get(`/api/vehicules/${id}`);
    return response;
  },
  create: async (data) => {
    const response = await api.post('/api/vehicules', data);
    return response;
  },
  update: async (id, data) => {
    const response = await api.put(`/api/vehicules/${id}`, data);
    return response;
  },
  delete: async (id) => {
    const response = await api.delete(`/api/vehicules/${id}`);
    return response;
  },
  addKilometrage: async (id, data) => {
    const response = await api.post(`/api/vehicules/${id}/kilometrage`, data);
    return response;
  },
  addCarburant: async (id, data) => {
    const response = await api.post(`/api/vehicules/${id}/carburant`, data);
    return response;
  },
  addDocument: async (id, data) => {
    const response = await api.post(`/api/vehicules/${id}/documents`, data);
    return response;
  }
};

export default api;
