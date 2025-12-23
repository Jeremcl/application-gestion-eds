import { useState, useEffect } from 'react';
import { Plus, FileText, Download, X, Search, Eye } from 'lucide-react';
import { fichesInternes as fichesAPI, clients as clientsAPI, appareilsPret as appareilsPretAPI } from '../services/api';

const FichesInternes = () => {
  const [fiches, setFiches] = useState([]);
  const [stats, setStats] = useState({ 'DA1.1': 0, 'AEA1.1': 0, 'AP1.1': 0, total: 0 });
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [previewUrl, setPreviewUrl] = useState('');
  const [previewFicheId, setPreviewFicheId] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [loadingPreview, setLoadingPreview] = useState(false);

  useEffect(() => {
    loadFiches();
    loadStats();
  }, [typeFilter]);

  // Nettoyer le blob URL quand le modal se ferme
  useEffect(() => {
    if (!showPreviewModal && previewUrl && previewUrl.startsWith('blob:')) {
      URL.revokeObjectURL(previewUrl);
      setPreviewUrl('');
    }
  }, [showPreviewModal]);

  const loadFiches = async () => {
    setLoading(true);
    try {
      const params = typeFilter ? { type: typeFilter } : {};
      const { data } = await fichesAPI.getAll(params);
      setFiches(data.fiches);
    } catch (error) {
      console.error('Erreur chargement fiches:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const { data } = await fichesAPI.getStats();
      setStats(data);
    } catch (error) {
      console.error('Erreur chargement stats:', error);
    }
  };

  const handleDeleteFiche = async (id) => {
    if (window.confirm('Voulez-vous vraiment supprimer cette fiche ?')) {
      try {
        await fichesAPI.delete(id);
        loadFiches();
        loadStats();
      } catch (error) {
        console.error('Erreur suppression fiche:', error);
        alert('Erreur lors de la suppression');
      }
    }
  };

  const handlePreviewFiche = async (id) => {
    setLoadingPreview(true);
    setPreviewFicheId(id);
    setShowPreviewModal(true);

    try {
      // Récupérer le token d'authentification
      const token = localStorage.getItem('token');

      // Télécharger le PDF avec authentification
      const response = await fetch(`/api/fiches-internes/${id}/preview`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Erreur lors du chargement du PDF');
      }

      // Créer un blob URL pour l'afficher dans l'iframe
      const blob = await response.blob();
      const blobUrl = URL.createObjectURL(blob);
      setPreviewUrl(blobUrl);
    } catch (error) {
      console.error('Erreur prévisualisation:', error);
      alert('Erreur lors de la prévisualisation du PDF');
      setShowPreviewModal(false);
    } finally {
      setLoadingPreview(false);
    }
  };

  const handleDownloadFiche = async (id) => {
    try {
      // Télécharger le PDF
      window.open(`/api/fiches-internes/${id}/regenerer`, '_blank');
    } catch (error) {
      console.error('Erreur téléchargement:', error);
      alert('Erreur lors du téléchargement');
    }
  };

  const typeLabels = {
    'DA1.1': 'Fiche de dépôt',
    'AEA1.1': 'Attestation enlèvement',
    'AP1.1': 'Attestation de prêt'
  };

  const typeColors = {
    'DA1.1': 'info',
    'AEA1.1': 'warning',
    'AP1.1': 'success'
  };

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Fiches Internes</h1>
          <p className="page-subtitle">{fiches.length} fiche(s) générée(s)</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>
          <Plus size={18} />
          Nouvelle Fiche
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-4" style={{ marginBottom: 'var(--space-6)' }}>
        <div className="card" style={{ padding: 'var(--space-4)' }}>
          <div style={{ fontSize: '0.75rem', color: 'var(--neutral-600)', marginBottom: 'var(--space-2)' }}>
            Total
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 700, color: 'var(--primary-600)' }}>
            {stats.total}
          </div>
        </div>
        <div className="card" style={{ padding: 'var(--space-4)' }}>
          <div style={{ fontSize: '0.75rem', color: 'var(--neutral-600)', marginBottom: 'var(--space-2)' }}>
            Fiches de dépôt (DA1.1)
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 700, color: 'var(--info-600)' }}>
            {stats['DA1.1']}
          </div>
        </div>
        <div className="card" style={{ padding: 'var(--space-4)' }}>
          <div style={{ fontSize: '0.75rem', color: 'var(--neutral-600)', marginBottom: 'var(--space-2)' }}>
            Attestations enlèvement (AEA1.1)
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 700, color: 'var(--amber-600)' }}>
            {stats['AEA1.1']}
          </div>
        </div>
        <div className="card" style={{ padding: 'var(--space-4)' }}>
          <div style={{ fontSize: '0.75rem', color: 'var(--neutral-600)', marginBottom: 'var(--space-2)' }}>
            Attestations de prêt (AP1.1)
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 700, color: 'var(--success-600)' }}>
            {stats['AP1.1']}
          </div>
        </div>
      </div>

      {/* Filtres */}
      <div style={{ marginBottom: 'var(--space-4)' }}>
        <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
          <button
            className={`btn ${!typeFilter ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setTypeFilter('')}
          >
            Toutes
          </button>
          <button
            className={`btn ${typeFilter === 'DA1.1' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setTypeFilter('DA1.1')}
          >
            DA1.1
          </button>
          <button
            className={`btn ${typeFilter === 'AEA1.1' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setTypeFilter('AEA1.1')}
          >
            AEA1.1
          </button>
          <button
            className={`btn ${typeFilter === 'AP1.1' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setTypeFilter('AP1.1')}
          >
            AP1.1
          </button>
        </div>
      </div>

      {/* Table */}
      {loading ? (
        <div className="card" style={{ padding: 'var(--space-8)', textAlign: 'center' }}>
          Chargement...
        </div>
      ) : fiches.length === 0 ? (
        <div className="card" style={{ padding: 'var(--space-8)', textAlign: 'center' }}>
          <p style={{ color: 'var(--neutral-600)' }}>Aucune fiche générée</p>
        </div>
      ) : (
        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>Numéro</th>
                <th>Type</th>
                <th>Client</th>
                <th>Date de génération</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {fiches.map((fiche) => (
                <tr key={fiche._id}>
                  <td style={{ fontWeight: 600, color: 'var(--primary-600)' }}>
                    {fiche.numero}
                  </td>
                  <td>
                    <span className={`badge badge-${typeColors[fiche.type]}`}>
                      {typeLabels[fiche.type]}
                    </span>
                  </td>
                  <td>
                    {fiche.data?.client?.nom ? `${fiche.data.client.nom} ${fiche.data.client.prenom}` : '-'}
                  </td>
                  <td style={{ fontSize: '0.875rem' }}>
                    {new Date(fiche.dateGeneration).toLocaleDateString('fr-FR')} à {new Date(fiche.dateGeneration).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
                      <button
                        className="btn btn-primary btn-sm"
                        onClick={() => handlePreviewFiche(fiche._id)}
                        title="Visualiser le PDF"
                      >
                        <Eye size={16} />
                      </button>
                      <button
                        className="btn btn-secondary btn-sm"
                        onClick={() => handleDownloadFiche(fiche._id)}
                        title="Télécharger le PDF"
                      >
                        <Download size={16} />
                      </button>
                      <button
                        className="btn btn-danger btn-sm"
                        onClick={() => handleDeleteFiche(fiche._id)}
                        title="Supprimer"
                      >
                        <X size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal création */}
      {showModal && (
        <ModalCreationFiche
          onClose={() => setShowModal(false)}
          onSuccess={() => {
            setShowModal(false);
            loadFiches();
            loadStats();
          }}
        />
      )}

      {/* Modal prévisualisation */}
      {showPreviewModal && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0, 0, 0, 0.7)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 2000,
            padding: 'var(--space-4)'
          }}
          onClick={() => setShowPreviewModal(false)}
        >
          <div
            style={{
              background: 'white',
              borderRadius: 'var(--radius-xl)',
              width: '90%',
              height: '90%',
              maxWidth: '1200px',
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden',
              boxShadow: 'var(--shadow-xl)'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header du modal */}
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: 'var(--space-4)',
              borderBottom: '1px solid var(--neutral-200)',
              background: 'var(--neutral-50)'
            }}>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 600 }}>Prévisualisation de la fiche</h2>
              <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
                <button
                  className="btn btn-secondary btn-sm"
                  onClick={() => handleDownloadFiche(previewFicheId)}
                >
                  <Download size={16} />
                  Télécharger
                </button>
                <button
                  className="btn btn-secondary btn-sm"
                  onClick={() => setShowPreviewModal(false)}
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            {/* Viewer PDF */}
            <div style={{ flex: 1, position: 'relative' }}>
              {loadingPreview ? (
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  height: '100%',
                  color: 'var(--neutral-600)'
                }}>
                  Chargement du PDF...
                </div>
              ) : (
                <iframe
                  src={previewUrl}
                  style={{
                    width: '100%',
                    height: '100%',
                    border: 'none'
                  }}
                  title="Prévisualisation PDF"
                />
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Modal de création de fiche
const ModalCreationFiche = ({ onClose, onSuccess }) => {
  const [step, setStep] = useState(1);
  const [typeFiche, setTypeFiche] = useState('');
  const [formData, setFormData] = useState({});
  const [clients, setClients] = useState([]);
  const [appareilsPret, setAppareilsPret] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchClient, setSearchClient] = useState('');

  useEffect(() => {
    loadClients();
    loadAppareilsPret();
  }, []);

  const loadClients = async () => {
    try {
      const { data } = await clientsAPI.getAll();
      setClients(data.clients);
    } catch (error) {
      console.error('Erreur chargement clients:', error);
    }
  };

  const loadAppareilsPret = async () => {
    try {
      const { data } = await appareilsPretAPI.getDisponibles();
      setAppareilsPret(data);
    } catch (error) {
      console.error('Erreur chargement appareils:', error);
    }
  };

  const handleSelectType = (type) => {
    setTypeFiche(type);
    setStep(2);
  };

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSelectClient = (client) => {
    setFormData(prev => ({
      ...prev,
      client: {
        nom: client.nom,
        prenom: client.prenom,
        adresse: client.adresse,
        codePostal: client.codePostal,
        ville: client.ville,
        telephone: client.telephone,
        email: client.email
      },
      clientId: client._id
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await fichesAPI.generer({
        type: typeFiche,
        data: formData,
        clientId: formData.clientId,
        appareilPretId: formData.appareilPretId
      });
      alert('Fiche générée avec succès');
      onSuccess();
    } catch (error) {
      console.error('Erreur génération fiche:', error);
      alert('Erreur lors de la génération de la fiche');
    } finally {
      setLoading(false);
    }
  };

  const filteredClients = clients.filter(c =>
    searchClient === '' ||
    c.nom.toLowerCase().includes(searchClient.toLowerCase()) ||
    c.prenom.toLowerCase().includes(searchClient.toLowerCase()) ||
    c.telephone.includes(searchClient)
  );

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0, 0, 0, 0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 2000,
      padding: 'var(--space-4)'
    }} onClick={onClose}>
      <div className="card" style={{
        maxWidth: '800px',
        width: '100%',
        maxHeight: '90vh',
        overflowY: 'auto',
        padding: 'var(--space-6)'
      }} onClick={(e) => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-6)' }}>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 700 }}>
            {step === 1 ? 'Sélectionner le type de fiche' : `Créer une ${typeFiche === 'DA1.1' ? 'Fiche de dépôt' : typeFiche === 'AEA1.1' ? 'Attestation d\'enlèvement' : 'Attestation de prêt'}`}
          </h2>
          <button className="btn btn-secondary btn-sm" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        {step === 1 && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 'var(--space-4)' }}>
            <button
              className="card"
              style={{
                padding: 'var(--space-6)',
                cursor: 'pointer',
                border: '2px solid var(--info-200)',
                transition: 'all var(--transition-fast)'
              }}
              onClick={() => handleSelectType('DA1.1')}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = 'var(--info-500)';
                e.currentTarget.style.background = 'var(--info-50)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = 'var(--info-200)';
                e.currentTarget.style.background = 'white';
              }}
            >
              <FileText size={32} style={{ color: 'var(--info-600)', marginBottom: 'var(--space-2)' }} />
              <h3 style={{ fontSize: '1.125rem', fontWeight: 600, marginBottom: 'var(--space-1)' }}>DA1.1</h3>
              <p style={{ color: 'var(--neutral-600)', fontSize: '0.875rem' }}>Fiche de dépôt</p>
            </button>

            <button
              className="card"
              style={{
                padding: 'var(--space-6)',
                cursor: 'pointer',
                border: '2px solid var(--amber-200)',
                transition: 'all var(--transition-fast)'
              }}
              onClick={() => handleSelectType('AEA1.1')}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = 'var(--amber-500)';
                e.currentTarget.style.background = 'var(--amber-50)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = 'var(--amber-200)';
                e.currentTarget.style.background = 'white';
              }}
            >
              <FileText size={32} style={{ color: 'var(--amber-600)', marginBottom: 'var(--space-2)' }} />
              <h3 style={{ fontSize: '1.125rem', fontWeight: 600, marginBottom: 'var(--space-1)' }}>AEA1.1</h3>
              <p style={{ color: 'var(--neutral-600)', fontSize: '0.875rem' }}>Attestation d'enlèvement</p>
            </button>

            <button
              className="card"
              style={{
                padding: 'var(--space-6)',
                cursor: 'pointer',
                border: '2px solid var(--success-200)',
                transition: 'all var(--transition-fast)'
              }}
              onClick={() => handleSelectType('AP1.1')}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = 'var(--success-500)';
                e.currentTarget.style.background = 'var(--success-50)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = 'var(--success-200)';
                e.currentTarget.style.background = 'white';
              }}
            >
              <FileText size={32} style={{ color: 'var(--success-600)', marginBottom: 'var(--space-2)' }} />
              <h3 style={{ fontSize: '1.125rem', fontWeight: 600, marginBottom: 'var(--space-1)' }}>AP1.1</h3>
              <p style={{ color: 'var(--neutral-600)', fontSize: '0.875rem' }}>Attestation de prêt</p>
            </button>
          </div>
        )}

        {step === 2 && (
          <form onSubmit={handleSubmit}>
            {/* Sélection client */}
            <div className="form-group">
              <label className="form-label">Rechercher un client</label>
              <div style={{ position: 'relative' }}>
                <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--neutral-500)' }} />
                <input
                  type="text"
                  className="form-input"
                  style={{ paddingLeft: '40px' }}
                  placeholder="Nom, prénom ou téléphone..."
                  value={searchClient}
                  onChange={(e) => setSearchClient(e.target.value)}
                />
              </div>
            </div>

            {searchClient && filteredClients.length > 0 && (
              <div style={{
                border: '1px solid var(--neutral-200)',
                borderRadius: 'var(--radius-lg)',
                maxHeight: '200px',
                overflowY: 'auto',
                marginBottom: 'var(--space-4)'
              }}>
                {filteredClients.slice(0, 5).map(client => (
                  <div
                    key={client._id}
                    style={{
                      padding: 'var(--space-3)',
                      cursor: 'pointer',
                      borderBottom: '1px solid var(--neutral-100)',
                      background: formData.clientId === client._id ? 'var(--primary-50)' : 'white'
                    }}
                    onClick={() => {
                      handleSelectClient(client);
                      setSearchClient('');
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.background = 'var(--neutral-50)'}
                    onMouseLeave={(e) => e.currentTarget.style.background = formData.clientId === client._id ? 'var(--primary-50)' : 'white'}
                  >
                    <div style={{ fontWeight: 600 }}>{client.nom} {client.prenom}</div>
                    <div style={{ fontSize: '0.875rem', color: 'var(--neutral-600)' }}>{client.telephone}</div>
                  </div>
                ))}
              </div>
            )}

            {formData.client && (
              <div className="card" style={{ padding: 'var(--space-4)', marginBottom: 'var(--space-4)', background: 'var(--primary-50)' }}>
                <div style={{ fontWeight: 600, marginBottom: 'var(--space-2)' }}>Client sélectionné</div>
                <div>{formData.client.nom} {formData.client.prenom}</div>
                <div style={{ fontSize: '0.875rem', color: 'var(--neutral-600)' }}>{formData.client.telephone}</div>
              </div>
            )}

            {/* Formulaire spécifique selon le type */}
            {typeFiche === 'DA1.1' && (
              <>
                <div className="form-group">
                  <label className="form-label">Type d'appareil</label>
                  <input
                    type="text"
                    className="form-input"
                    value={formData.appareil?.type || ''}
                    onChange={(e) => handleChange('appareil', { ...formData.appareil, type: e.target.value })}
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Marque</label>
                  <input
                    type="text"
                    className="form-input"
                    value={formData.appareil?.marque || ''}
                    onChange={(e) => handleChange('appareil', { ...formData.appareil, marque: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Modèle</label>
                  <input
                    type="text"
                    className="form-input"
                    value={formData.appareil?.modele || ''}
                    onChange={(e) => handleChange('appareil', { ...formData.appareil, modele: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Numéro de série</label>
                  <input
                    type="text"
                    className="form-input"
                    value={formData.appareil?.numeroSerie || ''}
                    onChange={(e) => handleChange('appareil', { ...formData.appareil, numeroSerie: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Description de la panne</label>
                  <textarea
                    className="form-input"
                    rows="4"
                    value={formData.description || ''}
                    onChange={(e) => handleChange('description', e.target.value)}
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Accessoires déposés (optionnel)</label>
                  <textarea
                    className="form-input"
                    rows="2"
                    value={formData.accessoires || ''}
                    onChange={(e) => handleChange('accessoires', e.target.value)}
                  />
                </div>
              </>
            )}

            {typeFiche === 'AEA1.1' && (
              <>
                <div className="form-group">
                  <label className="form-label">Type d'appareil</label>
                  <input
                    type="text"
                    className="form-input"
                    value={formData.appareil?.type || ''}
                    onChange={(e) => handleChange('appareil', { ...formData.appareil, type: e.target.value })}
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Marque</label>
                  <input
                    type="text"
                    className="form-input"
                    value={formData.appareil?.marque || ''}
                    onChange={(e) => handleChange('appareil', { ...formData.appareil, marque: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Modèle</label>
                  <input
                    type="text"
                    className="form-input"
                    value={formData.appareil?.modele || ''}
                    onChange={(e) => handleChange('appareil', { ...formData.appareil, modele: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Date d'enlèvement</label>
                  <input
                    type="date"
                    className="form-input"
                    value={formData.dateEnlevement || ''}
                    onChange={(e) => handleChange('dateEnlevement', e.target.value)}
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Date de restitution prévue (optionnel)</label>
                  <input
                    type="date"
                    className="form-input"
                    value={formData.dateRestitutionPrevue || ''}
                    onChange={(e) => handleChange('dateRestitutionPrevue', e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Notes (optionnel)</label>
                  <textarea
                    className="form-input"
                    rows="3"
                    value={formData.notes || ''}
                    onChange={(e) => handleChange('notes', e.target.value)}
                  />
                </div>
              </>
            )}

            {typeFiche === 'AP1.1' && (
              <>
                <div className="form-group">
                  <label className="form-label">Appareil de prêt</label>
                  <select
                    className="form-input"
                    value={formData.appareilPretId || ''}
                    onChange={(e) => {
                      const appareil = appareilsPret.find(a => a._id === e.target.value);
                      handleChange('appareilPretId', e.target.value);
                      if (appareil) {
                        handleChange('appareilPret', {
                          type: appareil.type,
                          marque: appareil.marque,
                          modele: appareil.modele,
                          numeroSerie: appareil.numeroSerie
                        });
                      }
                    }}
                    required
                  >
                    <option value="">Sélectionner un appareil</option>
                    {appareilsPret.map(appareil => (
                      <option key={appareil._id} value={appareil._id}>
                        {appareil.type} - {appareil.marque} {appareil.modele} ({appareil.numeroSerie})
                      </option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Date de prêt</label>
                  <input
                    type="date"
                    className="form-input"
                    value={formData.datePret || ''}
                    onChange={(e) => handleChange('datePret', e.target.value)}
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Date de retour prévue (optionnel)</label>
                  <input
                    type="date"
                    className="form-input"
                    value={formData.dateRetourPrevue || ''}
                    onChange={(e) => handleChange('dateRetourPrevue', e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">État de l'appareil</label>
                  <textarea
                    className="form-input"
                    rows="3"
                    value={formData.etat || ''}
                    onChange={(e) => handleChange('etat', e.target.value)}
                    placeholder="Bon état général, aucune rayure visible..."
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Notes (optionnel)</label>
                  <textarea
                    className="form-input"
                    rows="2"
                    value={formData.notes || ''}
                    onChange={(e) => handleChange('notes', e.target.value)}
                  />
                </div>
              </>
            )}

            <div style={{ display: 'flex', gap: 'var(--space-3)', justifyContent: 'flex-end', marginTop: 'var(--space-6)' }}>
              <button type="button" className="btn btn-secondary" onClick={() => setStep(1)}>
                Retour
              </button>
              <button type="submit" className="btn btn-primary" disabled={loading || !formData.client}>
                {loading ? 'Génération...' : 'Générer la fiche'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default FichesInternes;
