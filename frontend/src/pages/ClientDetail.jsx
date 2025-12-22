import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Phone, Mail, MapPin, Plus, Edit, Monitor, X, Wrench, MonitorSmartphone } from 'lucide-react';
import { clients as clientsAPI } from '../services/api';
import Breadcrumb from '../components/Breadcrumb';
import DeviceCard from '../components/DeviceCard';
import InterventionModal from '../components/InterventionModal';
import PretModal from '../components/PretModal';

const ClientDetail = () => {
  const { clientId } = useParams();
  const navigate = useNavigate();
  const [client, setClient] = useState(null);
  const [devices, setDevices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showDeviceModal, setShowDeviceModal] = useState(false);
  const [showInterventionModal, setShowInterventionModal] = useState(false);
  const [showPretModal, setShowPretModal] = useState(false);
  const [editingDevice, setEditingDevice] = useState(null);
  const [deviceFormData, setDeviceFormData] = useState({
    type: '',
    marque: '',
    modele: '',
    numeroSerie: ''
  });

  useEffect(() => {
    loadClientData();
  }, [clientId]);

  const loadClientData = async () => {
    setLoading(true);
    try {
      const [clientResponse, devicesResponse] = await Promise.all([
        clientsAPI.getById(clientId),
        clientsAPI.getDevices(clientId)
      ]);
      setClient(clientResponse.data);
      setDevices(devicesResponse.data);
    } catch (error) {
      console.error('Erreur chargement données client:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeviceClick = (device) => {
    navigate(`/clients/${clientId}/appareils/${device._id}`);
  };

  const handleAddDevice = () => {
    setEditingDevice(null);
    setDeviceFormData({ type: '', marque: '', modele: '', numeroSerie: '' });
    setShowDeviceModal(true);
  };

  const handleEditDevice = (device) => {
    setEditingDevice(device);
    setDeviceFormData({
      type: device.type || '',
      marque: device.marque || '',
      modele: device.modele || '',
      numeroSerie: device.numeroSerie || ''
    });
    setShowDeviceModal(true);
  };

  const handleDeleteDevice = async (device) => {
    if (window.confirm(`Êtes-vous sûr de vouloir supprimer cet appareil ?`)) {
      try {
        await clientsAPI.deleteDevice(clientId, device._id);
        loadClientData();
      } catch (error) {
        alert(error.message || 'Erreur lors de la suppression de l\'appareil');
        console.error('Erreur suppression appareil:', error);
      }
    }
  };

  const handleDeviceSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingDevice) {
        await clientsAPI.updateDevice(clientId, editingDevice._id, deviceFormData);
      } else {
        // Ajouter un nouvel appareil au client
        const clientData = await clientsAPI.getById(clientId);
        const updatedAppareils = [...(clientData.data.appareils || []), {
          _id: Date.now().toString(),
          ...deviceFormData
        }];
        await clientsAPI.update(clientId, { appareils: updatedAppareils });
      }
      setShowDeviceModal(false);
      loadClientData();
    } catch (error) {
      console.error('Erreur sauvegarde appareil:', error);
    }
  };

  const handleCloseModal = () => {
    setShowDeviceModal(false);
    setEditingDevice(null);
  };

  if (loading) {
    return (
      <div className="animate-fade-in">
        <div className="card" style={{ padding: 'var(--space-8)', textAlign: 'center' }}>
          Chargement...
        </div>
      </div>
    );
  }

  if (!client) {
    return (
      <div className="animate-fade-in">
        <div className="card" style={{ padding: 'var(--space-8)', textAlign: 'center' }}>
          Client non trouvé
        </div>
      </div>
    );
  }

  return (
    <div className="animate-fade-in">
      <Breadcrumb items={[
        { label: 'Clients', path: '/clients' },
        { label: `${client.nom} ${client.prenom}` }
      ]} />

      {/* Client Info Card */}
      <div className="card" style={{ marginBottom: 'var(--space-6)' }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          marginBottom: 'var(--space-4)'
        }}>
          <div>
            <h1 style={{
              fontSize: '1.875rem',
              fontWeight: 700,
              color: 'var(--neutral-900)',
              marginBottom: 'var(--space-2)'
            }}>
              {client.nom} {client.prenom}
            </h1>
          </div>
          <div style={{ display: 'flex', gap: 'var(--space-3)' }}>
            <button
              className="btn btn-primary"
              onClick={() => setShowInterventionModal(true)}
            >
              <Wrench size={18} />
              Nouvelle intervention
            </button>
            <button
              className="btn btn-secondary"
              onClick={() => setShowPretModal(true)}
            >
              <MonitorSmartphone size={18} />
              Prêter un appareil
            </button>
            <button
              className="btn btn-secondary"
              onClick={() => navigate('/clients')}
            >
              Retour à la liste
            </button>
          </div>
        </div>

        <div className="grid grid-2" style={{ gap: 'var(--space-4)' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', marginBottom: 'var(--space-3)' }}>
              <Phone size={18} style={{ color: 'var(--neutral-500)' }} />
              <span>{client.telephone}</span>
            </div>
            {client.email && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', marginBottom: 'var(--space-3)' }}>
                <Mail size={18} style={{ color: 'var(--neutral-500)' }} />
                <span>{client.email}</span>
              </div>
            )}
          </div>
          <div>
            {client.adresse && (
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 'var(--space-2)' }}>
                <MapPin size={18} style={{ color: 'var(--neutral-500)', marginTop: '2px' }} />
                <div>
                  <div>{client.adresse}</div>
                  <div>{client.codePostal} {client.ville}</div>
                </div>
              </div>
            )}
          </div>
        </div>

        {client.notes && (
          <div style={{
            marginTop: 'var(--space-4)',
            padding: 'var(--space-3)',
            background: 'var(--neutral-50)',
            borderRadius: 'var(--radius-md)',
            fontSize: '0.875rem',
            color: 'var(--neutral-700)'
          }}>
            <strong>Notes:</strong> {client.notes}
          </div>
        )}
      </div>

      {/* Devices Section */}
      <div className="page-header" style={{ marginBottom: 'var(--space-4)' }}>
        <div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 600 }}>Appareils</h2>
          <p style={{ color: 'var(--neutral-600)', marginTop: 'var(--space-1)' }}>
            {devices.length} appareil{devices.length !== 1 ? 's' : ''}
          </p>
        </div>
        <button className="btn btn-primary" onClick={handleAddDevice}>
          <Plus size={18} />
          Ajouter un appareil
        </button>
      </div>

      {devices.length === 0 ? (
        <div className="card" style={{
          padding: 'var(--space-8)',
          textAlign: 'center'
        }}>
          <Monitor size={48} style={{
            color: 'var(--neutral-400)',
            margin: '0 auto var(--space-4)'
          }} />
          <h3 style={{ color: 'var(--neutral-600)', marginBottom: 'var(--space-2)' }}>
            Aucun appareil
          </h3>
          <p style={{ color: 'var(--neutral-500)', fontSize: '0.875rem', marginBottom: 'var(--space-4)' }}>
            Ajoutez le premier appareil de ce client
          </p>
          <button className="btn btn-primary" onClick={handleAddDevice}>
            <Plus size={18} />
            Ajouter un appareil
          </button>
        </div>
      ) : (
        <div className="grid grid-3" style={{ gap: 'var(--space-4)' }}>
          {devices.map((device) => (
            <DeviceCard
              key={device._id}
              device={device}
              onClick={() => handleDeviceClick(device)}
              onEdit={handleEditDevice}
              onDelete={handleDeleteDevice}
            />
          ))}
        </div>
      )}

      {/* Device Modal */}
      {showDeviceModal && (
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
            maxWidth: '500px'
          }}>
            <h2 style={{ marginBottom: 'var(--space-6)' }}>
              {editingDevice ? 'Modifier l\'appareil' : 'Nouvel appareil'}
            </h2>

            <form onSubmit={handleDeviceSubmit}>
              <div className="form-group">
                <label className="form-label">Type d'appareil</label>
                <input
                  type="text"
                  className="form-input"
                  value={deviceFormData.type}
                  onChange={(e) => setDeviceFormData({ ...deviceFormData, type: e.target.value })}
                  placeholder="Ex: PC Portable, Smartphone, Tablette..."
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Marque</label>
                <input
                  type="text"
                  className="form-input"
                  value={deviceFormData.marque}
                  onChange={(e) => setDeviceFormData({ ...deviceFormData, marque: e.target.value })}
                  placeholder="Ex: Apple, Samsung, HP..."
                />
              </div>

              <div className="form-group">
                <label className="form-label">Modèle</label>
                <input
                  type="text"
                  className="form-input"
                  value={deviceFormData.modele}
                  onChange={(e) => setDeviceFormData({ ...deviceFormData, modele: e.target.value })}
                  placeholder="Ex: iPhone 12, Galaxy S21..."
                />
              </div>

              <div className="form-group">
                <label className="form-label">Numéro de série</label>
                <input
                  type="text"
                  className="form-input"
                  value={deviceFormData.numeroSerie}
                  onChange={(e) => setDeviceFormData({ ...deviceFormData, numeroSerie: e.target.value })}
                  placeholder="Ex: ABC123456..."
                />
              </div>

              <div style={{ display: 'flex', gap: 'var(--space-3)', justifyContent: 'flex-end' }}>
                <button type="button" className="btn btn-secondary" onClick={handleCloseModal}>
                  Annuler
                </button>
                <button type="submit" className="btn btn-primary">
                  {editingDevice ? 'Mettre à jour' : 'Ajouter'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Intervention Modal */}
      <InterventionModal
        show={showInterventionModal}
        onClose={() => setShowInterventionModal(false)}
        onSuccess={() => {
          loadClientData();
          setShowInterventionModal(false);
        }}
        prefilledData={{
          clientId: clientId
        }}
      />

      {/* Pret Modal */}
      <PretModal
        show={showPretModal}
        onClose={() => setShowPretModal(false)}
        onSuccess={() => {
          loadClientData();
          setShowPretModal(false);
        }}
        prefilledData={{
          clientId: clientId
        }}
      />
    </div>
  );
};

export default ClientDetail;
