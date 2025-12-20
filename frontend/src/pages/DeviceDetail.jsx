import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Monitor, User, Plus } from 'lucide-react';
import { clients as clientsAPI } from '../services/api';
import Breadcrumb from '../components/Breadcrumb';
import InterventionModal from '../components/InterventionModal';

const statusColors = {
  'Demande': 'var(--blue-500)',
  'Planifié': 'var(--purple-500)',
  'En cours': 'var(--yellow-500)',
  'Diagnostic': 'var(--orange-500)',
  'Réparation': 'var(--pink-500)',
  'Terminé': 'var(--green-500)',
  'Facturé': 'var(--primary-600)'
};

const DeviceDetail = () => {
  const { clientId, appareilId } = useParams();
  const navigate = useNavigate();
  const [client, setClient] = useState(null);
  const [device, setDevice] = useState(null);
  const [interventions, setInterventions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterStatut, setFilterStatut] = useState('');
  const [showInterventionModal, setShowInterventionModal] = useState(false);

  const statuses = ['Demande', 'Planifié', 'En cours', 'Diagnostic', 'Réparation', 'Terminé', 'Facturé'];

  useEffect(() => {
    loadDeviceData();
  }, [clientId, appareilId, filterStatut]);

  const loadDeviceData = async () => {
    setLoading(true);
    try {
      const [deviceResponse, interventionsResponse] = await Promise.all([
        clientsAPI.getDevice(clientId, appareilId),
        clientsAPI.getDeviceInterventions(clientId, appareilId, { statut: filterStatut })
      ]);
      setDevice(deviceResponse.data.appareil);
      setClient(deviceResponse.data.client);
      setInterventions(interventionsResponse.data.interventions);
    } catch (error) {
      console.error('Erreur chargement données appareil:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (date) => {
    if (!date) return '-';
    return new Date(date).toLocaleDateString('fr-FR');
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

  if (!device || !client) {
    return (
      <div className="animate-fade-in">
        <div className="card" style={{ padding: 'var(--space-8)', textAlign: 'center' }}>
          Appareil non trouvé
        </div>
      </div>
    );
  }

  return (
    <div className="animate-fade-in">
      <Breadcrumb items={[
        { label: 'Clients', path: '/clients' },
        { label: `${client.nom} ${client.prenom}`, path: `/clients/${clientId}` },
        { label: device.type || 'Appareil' }
      ]} />

      {/* Device Info Card */}
      <div className="card" style={{ marginBottom: 'var(--space-6)' }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          marginBottom: 'var(--space-4)'
        }}>
          <div style={{ display: 'flex', gap: 'var(--space-4)', alignItems: 'flex-start' }}>
            {/* Device Icon */}
            <div style={{
              width: '64px',
              height: '64px',
              borderRadius: 'var(--radius-lg)',
              background: 'linear-gradient(135deg, var(--primary-100), var(--primary-200))',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <Monitor size={32} style={{ color: 'var(--primary-600)' }} />
            </div>

            {/* Device Info */}
            <div>
              <h1 style={{
                fontSize: '1.875rem',
                fontWeight: 700,
                color: 'var(--neutral-900)',
                marginBottom: 'var(--space-2)'
              }}>
                {device.type}
              </h1>
              <div style={{
                fontSize: '1.125rem',
                color: 'var(--neutral-600)',
                marginBottom: 'var(--space-2)'
              }}>
                {device.marque} {device.modele && `- ${device.modele}`}
              </div>
              {device.numeroSerie && (
                <div style={{
                  fontSize: '0.875rem',
                  color: 'var(--neutral-500)',
                  fontFamily: 'monospace',
                  background: 'var(--neutral-100)',
                  padding: 'var(--space-1) var(--space-3)',
                  borderRadius: 'var(--radius-sm)',
                  display: 'inline-block'
                }}>
                  N° de série: {device.numeroSerie}
                </div>
              )}
            </div>
          </div>

          <button
            className="btn btn-secondary"
            onClick={() => navigate(`/clients/${clientId}`)}
          >
            Retour au client
          </button>
        </div>

        {/* Client Context */}
        <div style={{
          padding: 'var(--space-3)',
          background: 'var(--neutral-50)',
          borderRadius: 'var(--radius-md)',
          display: 'flex',
          alignItems: 'center',
          gap: 'var(--space-2)',
          cursor: 'pointer',
          transition: 'all 0.2s'
        }}
        onClick={() => navigate(`/clients/${clientId}`)}
        onMouseOver={(e) => {
          e.currentTarget.style.background = 'var(--neutral-100)';
        }}
        onMouseOut={(e) => {
          e.currentTarget.style.background = 'var(--neutral-50)';
        }}>
          <User size={18} style={{ color: 'var(--neutral-600)' }} />
          <span style={{ fontSize: '0.875rem', color: 'var(--neutral-700)' }}>
            Propriétaire: <strong>{client.nom} {client.prenom}</strong> - {client.telephone}
          </span>
        </div>
      </div>

      {/* Interventions Section */}
      <div className="page-header" style={{ marginBottom: 'var(--space-4)' }}>
        <div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 600 }}>Interventions</h2>
          <p style={{ color: 'var(--neutral-600)', marginTop: 'var(--space-1)' }}>
            {interventions.length} intervention{interventions.length !== 1 ? 's' : ''}
          </p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowInterventionModal(true)}>
          <Plus size={18} />
          Nouvelle intervention
        </button>
      </div>

      {/* Status Filters */}
      <div style={{
        display: 'flex',
        gap: 'var(--space-2)',
        marginBottom: 'var(--space-4)',
        flexWrap: 'wrap'
      }}>
        <button
          className={`btn ${filterStatut === '' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => setFilterStatut('')}
          style={{ fontSize: '0.875rem' }}
        >
          Tous
        </button>
        {statuses.map(status => (
          <button
            key={status}
            className={`btn ${filterStatut === status ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setFilterStatut(status)}
            style={{ fontSize: '0.875rem' }}
          >
            {status}
          </button>
        ))}
      </div>

      {/* Interventions Table */}
      {interventions.length === 0 ? (
        <div className="card" style={{
          padding: 'var(--space-8)',
          textAlign: 'center'
        }}>
          <h3 style={{ color: 'var(--neutral-600)', marginBottom: 'var(--space-2)' }}>
            Aucune intervention
          </h3>
          <p style={{ color: 'var(--neutral-500)', fontSize: '0.875rem', marginBottom: 'var(--space-4)' }}>
            {filterStatut ? `Aucune intervention avec le statut "${filterStatut}"` : 'Aucune intervention pour cet appareil'}
          </p>
        </div>
      ) : (
        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>N° Intervention</th>
                <th>Description</th>
                <th>Statut</th>
                <th>Technicien</th>
                <th>Date création</th>
                <th>Coût total</th>
              </tr>
            </thead>
            <tbody>
              {interventions.map((intervention) => (
                <tr key={intervention._id}>
                  <td>
                    <div style={{ fontWeight: 600, fontFamily: 'monospace' }}>
                      {intervention.numero}
                    </div>
                  </td>
                  <td>
                    <div style={{
                      maxWidth: '300px',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap'
                    }}>
                      {intervention.description || '-'}
                    </div>
                  </td>
                  <td>
                    <span style={{
                      padding: 'var(--space-1) var(--space-3)',
                      borderRadius: 'var(--radius-full)',
                      fontSize: '0.75rem',
                      fontWeight: 600,
                      background: `${statusColors[intervention.statut]}20`,
                      color: statusColors[intervention.statut]
                    }}>
                      {intervention.statut}
                    </span>
                  </td>
                  <td>{intervention.technicien || '-'}</td>
                  <td>{formatDate(intervention.dateCreation)}</td>
                  <td>
                    <div style={{ fontWeight: 600 }}>
                      {intervention.coutTotal ? `${intervention.coutTotal}€` : '-'}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Intervention Modal */}
      <InterventionModal
        show={showInterventionModal}
        onClose={() => setShowInterventionModal(false)}
        onSuccess={() => {
          loadDeviceData();
          setShowInterventionModal(false);
        }}
        prefilledData={{
          clientId: clientId,
          appareilId: appareilId,
          appareil: device
        }}
      />
    </div>
  );
};

export default DeviceDetail;
