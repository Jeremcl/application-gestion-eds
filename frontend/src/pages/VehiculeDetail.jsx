import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Truck, Edit, Trash2, ArrowLeft, Plus, Fuel, Gauge, FileText, X, Camera, Upload } from 'lucide-react';
import { vehicules as vehiculesAPI, uploads as uploadsAPI } from '../services/api';
import Breadcrumb from '../components/Breadcrumb';
import VehiculeModal from '../components/VehiculeModal';

const VehiculeDetail = () => {
  const { vehiculeId } = useParams();
  const navigate = useNavigate();
  const [vehicule, setVehicule] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('kilometrage');
  const [showEditModal, setShowEditModal] = useState(false);
  const [showKilometrageModal, setShowKilometrageModal] = useState(false);
  const [showCarburantModal, setShowCarburantModal] = useState(false);
  const [showDocumentModal, setShowDocumentModal] = useState(false);
  const [editingKilometrage, setEditingKilometrage] = useState(null);
  const [editingCarburant, setEditingCarburant] = useState(null);

  useEffect(() => {
    loadVehiculeData();
  }, [vehiculeId]);

  const loadVehiculeData = async () => {
    setLoading(true);
    try {
      const { data } = await vehiculesAPI.getById(vehiculeId);
      setVehicule(data);
    } catch (error) {
      console.error('Erreur chargement donnees:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (window.confirm(`Etes-vous sur de vouloir supprimer ce vehicule ?`)) {
      try {
        await vehiculesAPI.delete(vehiculeId);
        navigate('/vehicules');
      } catch (error) {
        console.error('Erreur suppression:', error);
        alert(error.response?.data?.message || 'Erreur lors de la suppression');
      }
    }
  };

  const getStatutBadgeClass = (statut) => {
    switch (statut) {
      case 'Disponible':
        return 'badge-success';
      case 'En utilisation':
        return 'badge-warning';
      case 'En maintenance':
        return 'badge-danger';
      default:
        return 'badge-neutral';
    }
  };

  if (loading) {
    return <div style={{ textAlign: 'center', padding: 'var(--space-8)' }}>Chargement...</div>;
  }

  if (!vehicule) {
    return (
      <div className="card" style={{ textAlign: 'center', padding: 'var(--space-8)' }}>
        <p>Vehicule non trouve</p>
        <button className="btn btn-secondary" onClick={() => navigate('/vehicules')} style={{ marginTop: 'var(--space-4)' }}>
          Retour a la liste
        </button>
      </div>
    );
  }

  const tabs = [
    { id: 'kilometrage', label: 'Kilometrage', icon: Gauge },
    { id: 'carburant', label: 'Carburant', icon: Fuel },
    { id: 'documents', label: 'Documents', icon: FileText }
  ];

  return (
    <div>
      {/* Breadcrumb */}
      <Breadcrumb
        items={[
          { label: 'Vehicules', path: '/vehicules' },
          { label: vehicule.nom }
        ]}
      />

      {/* Back button */}
      <button
        className="btn btn-secondary mb-4"
        onClick={() => navigate('/vehicules')}
        style={{ marginBottom: 'var(--space-4)' }}
      >
        <ArrowLeft size={18} />
        Retour a la liste
      </button>

      {/* Vehicule Info Card */}
      <div className="card" style={{ marginBottom: 'var(--space-6)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 'var(--space-6)' }}>
          <div style={{ display: 'flex', gap: 'var(--space-4)', alignItems: 'flex-start' }}>
            <div style={{
              width: '80px',
              height: '80px',
              borderRadius: 'var(--radius-lg)',
              background: 'linear-gradient(135deg, var(--primary-100), var(--primary-200))',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <Truck size={40} style={{ color: 'var(--primary-600)' }} />
            </div>
            <div>
              <h1 style={{ fontSize: '1.75rem', marginBottom: 'var(--space-2)' }}>
                {vehicule.nom}
              </h1>
              <p style={{ color: 'var(--neutral-600)', marginBottom: 'var(--space-3)' }}>
                {vehicule.marque} - {vehicule.typeVehicule}
              </p>
              <span className={`badge ${getStatutBadgeClass(vehicule.statut)}`}>
                {vehicule.statut}
              </span>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
            <button
              className="btn btn-secondary"
              onClick={() => setShowEditModal(true)}
            >
              <Edit size={18} />
              Modifier
            </button>
            <button
              className="btn btn-secondary"
              onClick={handleDelete}
              style={{ color: 'var(--red-500)' }}
            >
              <Trash2 size={18} />
              Supprimer
            </button>
          </div>
        </div>

        {/* Details Grid */}
        <div className="grid grid-2" style={{ gap: 'var(--space-4)' }}>
          <div>
            <h3 style={{ fontSize: '1rem', marginBottom: 'var(--space-3)' }}>Informations</h3>
            {vehicule.immatriculation && (
              <div style={{ marginBottom: 'var(--space-2)' }}>
                <span style={{ fontWeight: 600 }}>Immatriculation:</span> {vehicule.immatriculation}
              </div>
            )}
            <div style={{ marginBottom: 'var(--space-2)' }}>
              <span style={{ fontWeight: 600 }}>Type:</span> {vehicule.typeVehicule}
            </div>
            <div style={{ marginBottom: 'var(--space-2)' }}>
              <span style={{ fontWeight: 600 }}>Kilometrage actuel:</span> {vehicule.kilometrageActuel?.toLocaleString('fr-FR') || 0} km
            </div>
          </div>
          <div>
            <h3 style={{ fontSize: '1rem', marginBottom: 'var(--space-3)' }}>Statistiques</h3>
            <div style={{ marginBottom: 'var(--space-2)' }}>
              <span style={{ fontWeight: 600 }}>Releves km:</span> {vehicule.historiqueKilometrage?.length || 0}
            </div>
            <div style={{ marginBottom: 'var(--space-2)' }}>
              <span style={{ fontWeight: 600 }}>Pleins:</span> {vehicule.historiqueCarburant?.length || 0}
            </div>
            <div style={{ marginBottom: 'var(--space-2)' }}>
              <span style={{ fontWeight: 600 }}>Documents:</span> {vehicule.documents?.length || 0}
            </div>
          </div>
        </div>

        {vehicule.notes && (
          <div style={{ marginTop: 'var(--space-4)', padding: 'var(--space-3)', background: 'var(--neutral-50)', borderRadius: 'var(--radius-md)' }}>
            <span style={{ fontWeight: 600 }}>Notes:</span> {vehicule.notes}
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="card">
        <div style={{ display: 'flex', borderBottom: '1px solid var(--neutral-200)', marginBottom: 'var(--space-4)' }}>
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 'var(--space-2)',
                padding: 'var(--space-3) var(--space-4)',
                border: 'none',
                background: 'transparent',
                cursor: 'pointer',
                borderBottom: activeTab === tab.id ? '2px solid var(--primary-600)' : '2px solid transparent',
                color: activeTab === tab.id ? 'var(--primary-600)' : 'var(--neutral-600)',
                fontWeight: activeTab === tab.id ? 600 : 400,
                transition: 'all 0.2s'
              }}
            >
              <tab.icon size={18} />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        {activeTab === 'kilometrage' && (
          <KilometrageTab
            historique={vehicule.historiqueKilometrage || []}
            vehiculeId={vehiculeId}
            onAdd={() => { setEditingKilometrage(null); setShowKilometrageModal(true); }}
            onEdit={(entry) => { setEditingKilometrage(entry); setShowKilometrageModal(true); }}
            onDelete={loadVehiculeData}
          />
        )}
        {activeTab === 'carburant' && (
          <CarburantTab
            historique={vehicule.historiqueCarburant || []}
            vehiculeId={vehiculeId}
            onAdd={() => { setEditingCarburant(null); setShowCarburantModal(true); }}
            onEdit={(entry) => { setEditingCarburant(entry); setShowCarburantModal(true); }}
            onDelete={loadVehiculeData}
          />
        )}
        {activeTab === 'documents' && (
          <DocumentsTab
            documents={vehicule.documents || []}
            onAdd={() => setShowDocumentModal(true)}
          />
        )}
      </div>

      {/* Modals */}
      <VehiculeModal
        show={showEditModal}
        onClose={() => setShowEditModal(false)}
        onSuccess={loadVehiculeData}
        editingVehicule={vehicule}
      />

      <KilometrageModal
        show={showKilometrageModal}
        onClose={() => { setShowKilometrageModal(false); setEditingKilometrage(null); }}
        onSuccess={loadVehiculeData}
        vehiculeId={vehiculeId}
        editingEntry={editingKilometrage}
      />

      <CarburantModal
        show={showCarburantModal}
        onClose={() => { setShowCarburantModal(false); setEditingCarburant(null); }}
        onSuccess={loadVehiculeData}
        vehiculeId={vehiculeId}
        editingEntry={editingCarburant}
      />

      <DocumentModal
        show={showDocumentModal}
        onClose={() => setShowDocumentModal(false)}
        onSuccess={loadVehiculeData}
        vehiculeId={vehiculeId}
      />
    </div>
  );
};

// Helper pour construire l'URL complete des photos
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001';
const getPhotoUrl = (photoUrl) => {
  if (!photoUrl) return null;
  if (photoUrl.startsWith('http')) return photoUrl;
  return `${API_URL}${photoUrl}`;
};

// Sub-components for tabs

const KilometrageTab = ({ historique, vehiculeId, onAdd, onEdit, onDelete }) => {
  const sorted = [...historique].sort((a, b) => new Date(b.date) - new Date(a.date));
  const [previewPhoto, setPreviewPhoto] = useState(null);

  const handleDelete = async (entryId) => {
    if (!window.confirm('Supprimer ce relevé kilométrique ?')) return;
    try {
      await vehiculesAPI.deleteKilometrage(vehiculeId, entryId);
      onDelete?.();
    } catch (error) {
      alert(error.response?.data?.message || 'Erreur lors de la suppression');
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-4)' }}>
        <h3>Historique kilometrique</h3>
        <button className="btn btn-primary btn-sm" onClick={onAdd}>
          <Plus size={16} />
          Ajouter
        </button>
      </div>
      {sorted.length === 0 ? (
        <p style={{ color: 'var(--neutral-600)', textAlign: 'center', padding: 'var(--space-4)' }}>
          Aucun releve kilometrique
        </p>
      ) : (
        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Kilometrage</th>
                <th>Photo</th>
                <th>Notes</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {sorted.map((item, index) => (
                <tr key={item._id || index}>
                  <td>{new Date(item.date).toLocaleDateString('fr-FR')}</td>
                  <td style={{ fontWeight: 600 }}>{item.valeur?.toLocaleString('fr-FR')} km</td>
                  <td>
                    {item.photoUrl ? (
                      <button
                        className="btn btn-sm btn-secondary"
                        onClick={() => setPreviewPhoto(getPhotoUrl(item.photoUrl))}
                        style={{ padding: '4px 8px', fontSize: '0.75rem' }}
                      >
                        Voir photo
                      </button>
                    ) : '-'}
                  </td>
                  <td>{item.notes || '-'}</td>
                  <td>
                    <div style={{ display: 'flex', gap: 'var(--space-1)' }}>
                      <button
                        className="btn-icon"
                        onClick={() => onEdit(item)}
                        title="Modifier"
                      >
                        <Edit size={15} />
                      </button>
                      <button
                        className="btn-icon"
                        onClick={() => handleDelete(item._id)}
                        title="Supprimer"
                        style={{ color: 'var(--red-500)' }}
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal preview photo */}
      {previewPhoto && (
        <div
          style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            background: 'rgba(0, 0, 0, 0.8)', backdropFilter: 'blur(4px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000, padding: 'var(--space-4)'
          }}
          onClick={() => setPreviewPhoto(null)}
        >
          <div style={{ position: 'relative', maxWidth: '90%', maxHeight: '90%' }}>
            <img
              src={previewPhoto}
              alt="Photo ticket"
              style={{ maxWidth: '100%', maxHeight: '85vh', borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-xl)' }}
            />
            <button
              onClick={() => setPreviewPhoto(null)}
              style={{
                position: 'absolute', top: '-40px', right: 0,
                background: 'white', border: 'none', borderRadius: 'var(--radius-full)',
                width: '32px', height: '32px', cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center'
              }}
            >
              <X size={20} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

const CarburantTab = ({ historique, vehiculeId, onAdd, onEdit, onDelete }) => {
  const sorted = [...historique].sort((a, b) => new Date(b.date) - new Date(a.date));
  const [previewPhoto, setPreviewPhoto] = useState(null);

  const totalMois = sorted
    .filter(c => new Date(c.date) >= new Date(new Date().setDate(1)))
    .reduce((sum, c) => sum + (c.montant || 0), 0);

  const handleDelete = async (entryId) => {
    if (!window.confirm('Supprimer ce plein de carburant ?')) return;
    try {
      await vehiculesAPI.deleteCarburant(vehiculeId, entryId);
      onDelete?.();
    } catch (error) {
      alert(error.response?.data?.message || 'Erreur lors de la suppression');
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-4)' }}>
        <div>
          <h3>Historique carburant</h3>
          <p style={{ fontSize: '0.875rem', color: 'var(--neutral-600)' }}>
            Total ce mois: {totalMois.toFixed(2)} EUR
          </p>
        </div>
        <button className="btn btn-primary btn-sm" onClick={onAdd}>
          <Plus size={16} />
          Ajouter un plein
        </button>
      </div>
      {sorted.length === 0 ? (
        <p style={{ color: 'var(--neutral-600)', textAlign: 'center', padding: 'var(--space-4)' }}>
          Aucun plein enregistre
        </p>
      ) : (
        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Litres</th>
                <th>Montant</th>
                <th>Prix/L</th>
                <th>Ticket</th>
                <th>Notes</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {sorted.map((item, index) => (
                <tr key={item._id || index}>
                  <td>{new Date(item.date).toLocaleDateString('fr-FR')}</td>
                  <td>{item.litres?.toFixed(2) || '-'} L</td>
                  <td style={{ fontWeight: 600 }}>{item.montant?.toFixed(2) || '-'} EUR</td>
                  <td>{item.prixLitre?.toFixed(3) || '-'} EUR</td>
                  <td>
                    {item.ticketUrl ? (
                      <button
                        className="btn btn-sm btn-secondary"
                        onClick={() => setPreviewPhoto(getPhotoUrl(item.ticketUrl))}
                        style={{ padding: '4px 8px', fontSize: '0.75rem' }}
                      >
                        Voir ticket
                      </button>
                    ) : '-'}
                  </td>
                  <td>{item.notes || '-'}</td>
                  <td>
                    <div style={{ display: 'flex', gap: 'var(--space-1)' }}>
                      <button
                        className="btn-icon"
                        onClick={() => onEdit(item)}
                        title="Modifier"
                      >
                        <Edit size={15} />
                      </button>
                      <button
                        className="btn-icon"
                        onClick={() => handleDelete(item._id)}
                        title="Supprimer"
                        style={{ color: 'var(--red-500)' }}
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal preview photo ticket */}
      {previewPhoto && (
        <div
          style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            background: 'rgba(0, 0, 0, 0.8)', backdropFilter: 'blur(4px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000, padding: 'var(--space-4)'
          }}
          onClick={() => setPreviewPhoto(null)}
        >
          <div style={{ position: 'relative', maxWidth: '90%', maxHeight: '90%' }}>
            <img
              src={previewPhoto}
              alt="Photo ticket"
              style={{ maxWidth: '100%', maxHeight: '85vh', borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-xl)' }}
            />
            <button
              onClick={() => setPreviewPhoto(null)}
              style={{
                position: 'absolute', top: '-40px', right: 0,
                background: 'white', border: 'none', borderRadius: 'var(--radius-full)',
                width: '32px', height: '32px', cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center'
              }}
            >
              <X size={20} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

const DocumentsTab = ({ documents, onAdd }) => {
  const getExpirationStatus = (date) => {
    if (!date) return null;
    const expDate = new Date(date);
    const now = new Date();
    const daysUntil = Math.ceil((expDate - now) / (1000 * 60 * 60 * 24));

    if (daysUntil < 0) return { class: 'badge-danger', text: 'Expire' };
    if (daysUntil <= 30) return { class: 'badge-warning', text: `${daysUntil}j` };
    return { class: 'badge-success', text: 'Valide' };
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-4)' }}>
        <h3>Documents</h3>
        <button className="btn btn-primary btn-sm" onClick={onAdd}>
          <Plus size={16} />
          Ajouter
        </button>
      </div>
      {documents.length === 0 ? (
        <p style={{ color: 'var(--neutral-600)', textAlign: 'center', padding: 'var(--space-4)' }}>
          Aucun document
        </p>
      ) : (
        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>Type</th>
                <th>Expiration</th>
                <th>Statut</th>
                <th>Notes</th>
              </tr>
            </thead>
            <tbody>
              {documents.map((doc, index) => {
                const status = getExpirationStatus(doc.dateExpiration);
                return (
                  <tr key={doc._id || index}>
                    <td style={{ fontWeight: 600 }}>{doc.type}</td>
                    <td>{doc.dateExpiration ? new Date(doc.dateExpiration).toLocaleDateString('fr-FR') : '-'}</td>
                    <td>
                      {status && <span className={`badge ${status.class}`}>{status.text}</span>}
                    </td>
                    <td>{doc.notes || '-'}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

// Modals for adding entries

const KilometrageModal = ({ show, onClose, onSuccess, vehiculeId, editingEntry }) => {
  const isEditing = !!editingEntry;
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [photoPreview, setPhotoPreview] = useState(null);
  const fileInputRef = useRef(null);
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    valeur: '',
    photoUrl: '',
    notes: ''
  });

  useEffect(() => {
    if (editingEntry) {
      setFormData({
        date: editingEntry.date ? new Date(editingEntry.date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
        valeur: editingEntry.valeur || '',
        photoUrl: editingEntry.photoUrl || '',
        notes: editingEntry.notes || ''
      });
      setPhotoPreview(editingEntry.photoUrl ? getPhotoUrl(editingEntry.photoUrl) : null);
    } else {
      setFormData({ date: new Date().toISOString().split('T')[0], valeur: '', photoUrl: '', notes: '' });
      setPhotoPreview(null);
    }
  }, [editingEntry, show]);

  const handlePhotoCapture = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Afficher l'apercu immediatement
    const reader = new FileReader();
    reader.onload = (e) => setPhotoPreview(e.target.result);
    reader.readAsDataURL(file);

    // Upload le fichier
    setUploading(true);
    try {
      const { data } = await uploadsAPI.uploadPhoto('vehicules', file);
      setFormData(prev => ({ ...prev, photoUrl: data.url }));
    } catch (error) {
      console.error('Erreur upload photo:', error);
      alert('Erreur lors de l\'upload de la photo');
      setPhotoPreview(null);
    } finally {
      setUploading(false);
    }
  };

  const handleRemovePhoto = () => {
    setPhotoPreview(null);
    setFormData(prev => ({ ...prev, photoUrl: '' }));
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (isEditing) {
        await vehiculesAPI.updateKilometrage(vehiculeId, editingEntry._id, formData);
      } else {
        await vehiculesAPI.addKilometrage(vehiculeId, formData);
      }
      onSuccess?.();
      handleClose();
    } catch (error) {
      console.error('Erreur kilometrage:', error);
      alert(error.response?.data?.message || 'Erreur');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setFormData({ date: new Date().toISOString().split('T')[0], valeur: '', photoUrl: '', notes: '' });
    setPhotoPreview(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
    onClose();
  };

  if (!show) return null;

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      background: 'rgba(0, 0, 0, 0.5)', backdropFilter: 'blur(4px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 'var(--space-4)'
    }}>
      <div className="card animate-slide-in" style={{ width: '100%', maxWidth: '500px', maxHeight: '90vh', overflowY: 'auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-6)' }}>
          <h2>{isEditing ? 'Modifier le releve kilometrique' : 'Ajouter un releve kilometrique'}</h2>
          <button onClick={handleClose} style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: 'var(--space-2)', color: 'var(--neutral-600)' }}>
            <X size={24} />
          </button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Date *</label>
            <input type="date" className="form-input" value={formData.date} onChange={(e) => setFormData({ ...formData, date: e.target.value })} required />
          </div>
          <div className="form-group">
            <label className="form-label">Kilometrage *</label>
            <input type="number" className="form-input" value={formData.valeur} onChange={(e) => setFormData({ ...formData, valeur: parseInt(e.target.value) || '' })} required min="0" placeholder="165241" inputMode="numeric" />
          </div>
          <div className="form-group">
            <label className="form-label">Photo du compteur</label>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              onChange={handlePhotoCapture}
              style={{ display: 'none' }}
            />
            {!photoPreview && !formData.photoUrl ? (
              <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                  style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 'var(--space-2)' }}
                >
                  <Camera size={18} />
                  Prendre une photo
                </button>
              </div>
            ) : (
              <div style={{ position: 'relative' }}>
                {uploading && (
                  <div style={{
                    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
                    background: 'rgba(255,255,255,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    borderRadius: 'var(--radius-md)', zIndex: 1
                  }}>
                    <span>Upload en cours...</span>
                  </div>
                )}
                <img
                  src={photoPreview || formData.photoUrl}
                  alt="Apercu compteur"
                  style={{ width: '100%', maxHeight: '200px', objectFit: 'contain', borderRadius: 'var(--radius-md)', border: '1px solid var(--neutral-200)' }}
                />
                <button
                  type="button"
                  onClick={handleRemovePhoto}
                  style={{
                    position: 'absolute', top: '8px', right: '8px',
                    background: 'var(--red-500)', color: 'white', border: 'none', borderRadius: 'var(--radius-full)',
                    width: '28px', height: '28px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center'
                  }}
                >
                  <X size={16} />
                </button>
              </div>
            )}
          </div>
          <div className="form-group">
            <label className="form-label">Notes</label>
            <textarea className="form-textarea" value={formData.notes} onChange={(e) => setFormData({ ...formData, notes: e.target.value })} rows={2} placeholder="Notes optionnelles..." />
          </div>
          <div style={{ display: 'flex', gap: 'var(--space-3)', justifyContent: 'flex-end', marginTop: 'var(--space-6)' }}>
            <button type="button" className="btn btn-secondary" onClick={handleClose} disabled={loading || uploading}>Annuler</button>
            <button type="submit" className="btn btn-primary" disabled={loading || uploading}>{loading ? (isEditing ? 'Modification...' : 'Ajout...') : (isEditing ? 'Modifier' : 'Ajouter')}</button>
          </div>
        </form>
      </div>
    </div>
  );
};

const CarburantModal = ({ show, onClose, onSuccess, vehiculeId, editingEntry }) => {
  const isEditing = !!editingEntry;
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [photoPreview, setPhotoPreview] = useState(null);
  const fileInputRef = useRef(null);
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    litres: '',
    montant: '',
    ticketUrl: '',
    notes: ''
  });

  useEffect(() => {
    if (editingEntry) {
      setFormData({
        date: editingEntry.date ? new Date(editingEntry.date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
        litres: editingEntry.litres || '',
        montant: editingEntry.montant || '',
        ticketUrl: editingEntry.ticketUrl || '',
        notes: editingEntry.notes || ''
      });
      setPhotoPreview(editingEntry.ticketUrl ? getPhotoUrl(editingEntry.ticketUrl) : null);
    } else {
      setFormData({ date: new Date().toISOString().split('T')[0], litres: '', montant: '', ticketUrl: '', notes: '' });
      setPhotoPreview(null);
    }
  }, [editingEntry, show]);

  const handlePhotoCapture = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => setPhotoPreview(e.target.result);
    reader.readAsDataURL(file);

    setUploading(true);
    try {
      const { data } = await uploadsAPI.uploadPhoto('tickets', file);
      setFormData(prev => ({ ...prev, ticketUrl: data.url }));
    } catch (error) {
      console.error('Erreur upload photo:', error);
      alert('Erreur lors de l\'upload de la photo');
      setPhotoPreview(null);
    } finally {
      setUploading(false);
    }
  };

  const handleRemovePhoto = () => {
    setPhotoPreview(null);
    setFormData(prev => ({ ...prev, ticketUrl: '' }));
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (isEditing) {
        await vehiculesAPI.updateCarburant(vehiculeId, editingEntry._id, formData);
      } else {
        await vehiculesAPI.addCarburant(vehiculeId, formData);
      }
      onSuccess?.();
      handleClose();
    } catch (error) {
      console.error('Erreur carburant:', error);
      alert(error.response?.data?.message || 'Erreur');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setFormData({ date: new Date().toISOString().split('T')[0], litres: '', montant: '', ticketUrl: '', notes: '' });
    setPhotoPreview(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
    onClose();
  };

  if (!show) return null;

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      background: 'rgba(0, 0, 0, 0.5)', backdropFilter: 'blur(4px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 'var(--space-4)'
    }}>
      <div className="card animate-slide-in" style={{ width: '100%', maxWidth: '500px', maxHeight: '90vh', overflowY: 'auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-6)' }}>
          <h2>{isEditing ? 'Modifier le plein' : 'Ajouter un plein'}</h2>
          <button onClick={handleClose} style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: 'var(--space-2)', color: 'var(--neutral-600)' }}>
            <X size={24} />
          </button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Date *</label>
            <input type="date" className="form-input" value={formData.date} onChange={(e) => setFormData({ ...formData, date: e.target.value })} required />
          </div>
          <div className="grid grid-2 mb-4">
            <div className="form-group">
              <label className="form-label">Litres</label>
              <input type="number" className="form-input" value={formData.litres} onChange={(e) => setFormData({ ...formData, litres: parseFloat(e.target.value) || '' })} min="0" step="0.01" placeholder="45.5" inputMode="decimal" />
            </div>
            <div className="form-group">
              <label className="form-label">Montant (EUR)</label>
              <input type="number" className="form-input" value={formData.montant} onChange={(e) => setFormData({ ...formData, montant: parseFloat(e.target.value) || '' })} min="0" step="0.01" placeholder="85.50" inputMode="decimal" />
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Photo du ticket</label>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              onChange={handlePhotoCapture}
              style={{ display: 'none' }}
            />
            {!photoPreview && !formData.ticketUrl ? (
              <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                  style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 'var(--space-2)' }}
                >
                  <Camera size={18} />
                  Prendre en photo le ticket
                </button>
              </div>
            ) : (
              <div style={{ position: 'relative' }}>
                {uploading && (
                  <div style={{
                    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
                    background: 'rgba(255,255,255,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    borderRadius: 'var(--radius-md)', zIndex: 1
                  }}>
                    <span>Upload en cours...</span>
                  </div>
                )}
                <img
                  src={photoPreview || formData.ticketUrl}
                  alt="Apercu ticket"
                  style={{ width: '100%', maxHeight: '200px', objectFit: 'contain', borderRadius: 'var(--radius-md)', border: '1px solid var(--neutral-200)' }}
                />
                <button
                  type="button"
                  onClick={handleRemovePhoto}
                  style={{
                    position: 'absolute', top: '8px', right: '8px',
                    background: 'var(--red-500)', color: 'white', border: 'none', borderRadius: 'var(--radius-full)',
                    width: '28px', height: '28px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center'
                  }}
                >
                  <X size={16} />
                </button>
              </div>
            )}
          </div>
          <div className="form-group">
            <label className="form-label">Notes</label>
            <textarea className="form-textarea" value={formData.notes} onChange={(e) => setFormData({ ...formData, notes: e.target.value })} rows={2} placeholder="Station, type carburant..." />
          </div>
          <div style={{ display: 'flex', gap: 'var(--space-3)', justifyContent: 'flex-end', marginTop: 'var(--space-6)' }}>
            <button type="button" className="btn btn-secondary" onClick={handleClose} disabled={loading || uploading}>Annuler</button>
            <button type="submit" className="btn btn-primary" disabled={loading || uploading}>{loading ? (isEditing ? 'Modification...' : 'Ajout...') : (isEditing ? 'Modifier' : 'Ajouter')}</button>
          </div>
        </form>
      </div>
    </div>
  );
};

const DocumentModal = ({ show, onClose, onSuccess, vehiculeId }) => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    type: 'Carte grise',
    dateExpiration: '',
    urlDocument: '',
    notes: ''
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await vehiculesAPI.addDocument(vehiculeId, formData);
      onSuccess?.();
      onClose();
      setFormData({ type: 'Carte grise', dateExpiration: '', urlDocument: '', notes: '' });
    } catch (error) {
      console.error('Erreur ajout document:', error);
      alert(error.response?.data?.message || 'Erreur');
    } finally {
      setLoading(false);
    }
  };

  if (!show) return null;

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      background: 'rgba(0, 0, 0, 0.5)', backdropFilter: 'blur(4px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 'var(--space-4)'
    }}>
      <div className="card animate-slide-in" style={{ width: '100%', maxWidth: '500px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-6)' }}>
          <h2>Ajouter un document</h2>
          <button onClick={onClose} style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: 'var(--space-2)', color: 'var(--neutral-600)' }}>
            <X size={24} />
          </button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Type de document *</label>
            <select className="form-input" value={formData.type} onChange={(e) => setFormData({ ...formData, type: e.target.value })} required>
              <option value="Carte grise">Carte grise</option>
              <option value="Assurance">Assurance</option>
              <option value="Controle technique">Controle technique</option>
              <option value="Autre">Autre</option>
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Date d'expiration</label>
            <input type="date" className="form-input" value={formData.dateExpiration} onChange={(e) => setFormData({ ...formData, dateExpiration: e.target.value })} />
          </div>
          <div className="form-group">
            <label className="form-label">URL du document</label>
            <input type="url" className="form-input" value={formData.urlDocument} onChange={(e) => setFormData({ ...formData, urlDocument: e.target.value })} placeholder="https://..." />
          </div>
          <div className="form-group">
            <label className="form-label">Notes</label>
            <textarea className="form-textarea" value={formData.notes} onChange={(e) => setFormData({ ...formData, notes: e.target.value })} rows={2} placeholder="Notes..." />
          </div>
          <div style={{ display: 'flex', gap: 'var(--space-3)', justifyContent: 'flex-end', marginTop: 'var(--space-6)' }}>
            <button type="button" className="btn btn-secondary" onClick={onClose} disabled={loading}>Annuler</button>
            <button type="submit" className="btn btn-primary" disabled={loading}>{loading ? 'Ajout...' : 'Ajouter'}</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default VehiculeDetail;
