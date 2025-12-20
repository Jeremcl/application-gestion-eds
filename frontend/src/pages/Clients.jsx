import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Search, Edit, Trash2, Phone, Mail, MapPin, Monitor, X } from 'lucide-react';
import { clients as clientsAPI } from '../services/api';

const Clients = () => {
  const navigate = useNavigate();
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingClient, setEditingClient] = useState(null);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0 });

  const [formData, setFormData] = useState({
    nom: '',
    prenom: '',
    adresse: '',
    codePostal: '',
    ville: '',
    telephone: '',
    email: '',
    notes: '',
    appareils: []
  });

  useEffect(() => {
    loadClients();
  }, [pagination.page, searchTerm]);

  const loadClients = async () => {
    setLoading(true);
    try {
      const { data } = await clientsAPI.getAll({
        page: pagination.page,
        limit: 20,
        search: searchTerm
      });
      setClients(data.clients);
      setPagination({
        page: data.currentPage,
        totalPages: data.totalPages,
        total: data.total
      });
    } catch (error) {
      console.error('Erreur chargement clients:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingClient) {
        await clientsAPI.update(editingClient._id, formData);
      } else {
        await clientsAPI.create(formData);
      }
      setShowModal(false);
      resetForm();
      loadClients();
    } catch (error) {
      console.error('Erreur sauvegarde client:', error);
    }
  };

  const handleEdit = (client) => {
    setEditingClient(client);
    setFormData({
      nom: client.nom,
      prenom: client.prenom,
      adresse: client.adresse || '',
      codePostal: client.codePostal || '',
      ville: client.ville || '',
      telephone: client.telephone,
      email: client.email || '',
      notes: client.notes || '',
      appareils: client.appareils || []
    });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer ce client ?')) {
      try {
        await clientsAPI.delete(id);
        loadClients();
      } catch (error) {
        console.error('Erreur suppression client:', error);
      }
    }
  };

  const resetForm = () => {
    setFormData({
      nom: '',
      prenom: '',
      adresse: '',
      codePostal: '',
      ville: '',
      telephone: '',
      email: '',
      notes: '',
      appareils: []
    });
    setEditingClient(null);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    resetForm();
  };

  const handleAddAppareil = () => {
    setFormData({
      ...formData,
      appareils: [
        ...formData.appareils,
        { type: '', marque: '', modele: '', numeroSerie: '' }
      ]
    });
  };

  const handleRemoveAppareil = (index) => {
    setFormData({
      ...formData,
      appareils: formData.appareils.filter((_, i) => i !== index)
    });
  };

  const handleAppareilChange = (index, field, value) => {
    const updatedAppareils = [...formData.appareils];
    updatedAppareils[index][field] = value;
    setFormData({
      ...formData,
      appareils: updatedAppareils
    });
  };

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Clients</h1>
          <p className="page-subtitle">{pagination.total} client(s) au total</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>
          <Plus size={18} />
          Nouveau Client
        </button>
      </div>

      {/* Barre de recherche */}
      <div className="card mb-6" style={{ padding: 'var(--space-4)' }}>
        <div style={{ position: 'relative' }}>
          <Search size={18} style={{
            position: 'absolute',
            left: '12px',
            top: '50%',
            transform: 'translateY(-50%)',
            color: 'var(--neutral-400)'
          }} />
          <input
            type="text"
            placeholder="Rechercher par nom, prénom, téléphone, email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              width: '100%',
              padding: 'var(--space-3) var(--space-4) var(--space-3) 40px',
              border: '1px solid var(--neutral-300)',
              borderRadius: 'var(--radius-md)',
              fontSize: '0.875rem'
            }}
          />
        </div>
      </div>

      {/* Table des clients */}
      {loading ? (
        <div className="card" style={{ padding: 'var(--space-8)', textAlign: 'center' }}>
          Chargement...
        </div>
      ) : (
        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>Nom & Prénom</th>
                <th>Contact</th>
                <th>Adresse</th>
                <th>Appareils</th>
                <th style={{ width: '120px', textAlign: 'center' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {clients.map((client) => (
                <tr
                  key={client._id}
                  onClick={() => navigate(`/clients/${client._id}`)}
                  style={{ cursor: 'pointer' }}
                >
                  <td>
                    <div style={{ fontWeight: 600 }}>
                      {client.nom} {client.prenom}
                    </div>
                  </td>
                  <td>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.875rem' }}>
                        <Phone size={14} style={{ color: 'var(--neutral-500)' }} />
                        {client.telephone}
                      </div>
                      {client.email && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.875rem' }}>
                          <Mail size={14} style={{ color: 'var(--neutral-500)' }} />
                          {client.email}
                        </div>
                      )}
                    </div>
                  </td>
                  <td>
                    {client.adresse && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.875rem' }}>
                        <MapPin size={14} style={{ color: 'var(--neutral-500)' }} />
                        {client.adresse}, {client.codePostal} {client.ville}
                      </div>
                    )}
                  </td>
                  <td>
                    <div style={{ fontSize: '0.875rem' }}>
                      {client.appareils?.length > 0 ? (
                        client.appareils.map((app, idx) => (
                          <div key={idx} style={{ color: 'var(--neutral-600)' }}>
                            {app.type} {app.marque}
                          </div>
                        ))
                      ) : (
                        <span style={{ color: 'var(--neutral-400)' }}>Aucun</span>
                      )}
                    </div>
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                      <button className="btn-icon" onClick={(e) => { e.stopPropagation(); handleEdit(client); }}>
                        <Edit size={16} />
                      </button>
                      <button
                        className="btn-icon"
                        onClick={(e) => { e.stopPropagation(); handleDelete(client._id); }}
                        style={{ color: 'var(--red-500)' }}
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div style={{
              padding: 'var(--space-4)',
              display: 'flex',
              justifyContent: 'center',
              gap: 'var(--space-2)',
              borderTop: '1px solid var(--neutral-200)'
            }}>
              <button
                className="btn btn-secondary"
                onClick={() => setPagination({ ...pagination, page: pagination.page - 1 })}
                disabled={pagination.page === 1}
              >
                Précédent
              </button>
              <span style={{ padding: 'var(--space-3)', color: 'var(--neutral-600)' }}>
                Page {pagination.page} sur {pagination.totalPages}
              </span>
              <button
                className="btn btn-secondary"
                onClick={() => setPagination({ ...pagination, page: pagination.page + 1 })}
                disabled={pagination.page === pagination.totalPages}
              >
                Suivant
              </button>
            </div>
          )}
        </div>
      )}

      {/* Modal formulaire */}
      {showModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.5)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: 'var(--space-4)'
        }}>
          <div className="card animate-slide-in" style={{
            width: '100%',
            maxWidth: '600px',
            maxHeight: '90vh',
            overflowY: 'auto'
          }}>
            <h2 style={{ marginBottom: 'var(--space-6)' }}>
              {editingClient ? 'Modifier le client' : 'Nouveau client'}
            </h2>

            <form onSubmit={handleSubmit}>
              <div className="grid grid-2 mb-4">
                <div className="form-group">
                  <label className="form-label">Nom *</label>
                  <input
                    type="text"
                    className="form-input"
                    value={formData.nom}
                    onChange={(e) => setFormData({ ...formData, nom: e.target.value })}
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Prénom *</label>
                  <input
                    type="text"
                    className="form-input"
                    value={formData.prenom}
                    onChange={(e) => setFormData({ ...formData, prenom: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Adresse</label>
                <input
                  type="text"
                  className="form-input"
                  value={formData.adresse}
                  onChange={(e) => setFormData({ ...formData, adresse: e.target.value })}
                />
              </div>

              <div className="grid grid-2 mb-4">
                <div className="form-group">
                  <label className="form-label">Code Postal</label>
                  <input
                    type="text"
                    className="form-input"
                    value={formData.codePostal}
                    onChange={(e) => setFormData({ ...formData, codePostal: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Ville</label>
                  <input
                    type="text"
                    className="form-input"
                    value={formData.ville}
                    onChange={(e) => setFormData({ ...formData, ville: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid grid-2 mb-4">
                <div className="form-group">
                  <label className="form-label">Téléphone *</label>
                  <input
                    type="tel"
                    className="form-input"
                    value={formData.telephone}
                    onChange={(e) => setFormData({ ...formData, telephone: e.target.value })}
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Email</label>
                  <input
                    type="email"
                    className="form-input"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Notes</label>
                <textarea
                  className="form-textarea"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  rows={3}
                />
              </div>

              {/* Section Appareils */}
              <div className="form-group">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-3)' }}>
                  <label className="form-label" style={{ marginBottom: 0 }}>Appareils</label>
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={handleAddAppareil}
                    style={{ fontSize: '0.875rem', padding: 'var(--space-2) var(--space-3)' }}
                  >
                    <Monitor size={14} style={{ marginRight: '4px' }} />
                    Ajouter un appareil
                  </button>
                </div>

                {formData.appareils.length === 0 ? (
                  <div style={{
                    padding: 'var(--space-4)',
                    textAlign: 'center',
                    color: 'var(--neutral-400)',
                    border: '1px dashed var(--neutral-300)',
                    borderRadius: 'var(--radius-md)',
                    fontSize: '0.875rem'
                  }}>
                    Aucun appareil ajouté
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
                    {formData.appareils.map((appareil, index) => (
                      <div
                        key={index}
                        style={{
                          padding: 'var(--space-4)',
                          border: '1px solid var(--neutral-300)',
                          borderRadius: 'var(--radius-md)',
                          position: 'relative'
                        }}
                      >
                        <button
                          type="button"
                          onClick={() => handleRemoveAppareil(index)}
                          style={{
                            position: 'absolute',
                            top: 'var(--space-2)',
                            right: 'var(--space-2)',
                            background: 'transparent',
                            border: 'none',
                            cursor: 'pointer',
                            color: 'var(--red-500)',
                            padding: 'var(--space-1)'
                          }}
                        >
                          <X size={18} />
                        </button>

                        <div className="grid grid-2 mb-3">
                          <div>
                            <label className="form-label" style={{ fontSize: '0.875rem' }}>Type</label>
                            <input
                              type="text"
                              className="form-input"
                              value={appareil.type}
                              onChange={(e) => handleAppareilChange(index, 'type', e.target.value)}
                              placeholder="Ex: PC Portable, Smartphone..."
                            />
                          </div>
                          <div>
                            <label className="form-label" style={{ fontSize: '0.875rem' }}>Marque</label>
                            <input
                              type="text"
                              className="form-input"
                              value={appareil.marque}
                              onChange={(e) => handleAppareilChange(index, 'marque', e.target.value)}
                              placeholder="Ex: Apple, Samsung..."
                            />
                          </div>
                        </div>

                        <div className="grid grid-2">
                          <div>
                            <label className="form-label" style={{ fontSize: '0.875rem' }}>Modèle</label>
                            <input
                              type="text"
                              className="form-input"
                              value={appareil.modele}
                              onChange={(e) => handleAppareilChange(index, 'modele', e.target.value)}
                              placeholder="Ex: iPhone 12, Galaxy S21..."
                            />
                          </div>
                          <div>
                            <label className="form-label" style={{ fontSize: '0.875rem' }}>N° de série</label>
                            <input
                              type="text"
                              className="form-input"
                              value={appareil.numeroSerie}
                              onChange={(e) => handleAppareilChange(index, 'numeroSerie', e.target.value)}
                              placeholder="Ex: ABC123456..."
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div style={{ display: 'flex', gap: 'var(--space-3)', justifyContent: 'flex-end' }}>
                <button type="button" className="btn btn-secondary" onClick={handleCloseModal}>
                  Annuler
                </button>
                <button type="submit" className="btn btn-primary">
                  {editingClient ? 'Mettre à jour' : 'Créer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Clients;
