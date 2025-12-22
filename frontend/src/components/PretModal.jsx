import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { appareilsPret as appareilsPretAPI, prets as pretsAPI, clients as clientsAPI, interventions as interventionsAPI } from '../services/api';

const PretModal = ({ show, onClose, onSuccess, prefilledData = {} }) => {
  const [loading, setLoading] = useState(false);
  const [appareilsDisponibles, setAppareilsDisponibles] = useState([]);
  const [clients, setClients] = useState([]);
  const [interventions, setInterventions] = useState([]);

  const [formData, setFormData] = useState({
    appareilPretId: '',
    clientId: prefilledData.clientId || '',
    interventionId: prefilledData.interventionId || '',
    dateRetourPrevue: '',
    notes: ''
  });

  useEffect(() => {
    if (show) {
      loadAppareilsDisponibles();
      loadClients();
      if (prefilledData.clientId) {
        loadInterventionsByClient(prefilledData.clientId);
      }
    }
  }, [show, prefilledData.clientId]);

  useEffect(() => {
    if (formData.clientId && formData.clientId !== prefilledData.clientId) {
      loadInterventionsByClient(formData.clientId);
    }
  }, [formData.clientId]);

  const loadAppareilsDisponibles = async () => {
    try {
      const { data } = await appareilsPretAPI.getDisponibles();
      setAppareilsDisponibles(data);
    } catch (error) {
      console.error('Erreur chargement appareils disponibles:', error);
    }
  };

  const loadClients = async () => {
    try {
      const { data } = await clientsAPI.getAll({});
      setClients(data.clients);
    } catch (error) {
      console.error('Erreur chargement clients:', error);
    }
  };

  const loadInterventionsByClient = async (clientId) => {
    try {
      const { data } = await interventionsAPI.getAll({});
      const filtered = data.interventions.filter(i => {
        const cId = i.clientId._id || i.clientId;
        return cId === clientId;
      });
      setInterventions(filtered);
    } catch (error) {
      console.error('Erreur chargement interventions:', error);
      setInterventions([]);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await pretsAPI.create(formData);
      onSuccess?.();
      handleClose();
    } catch (error) {
      console.error('Erreur création prêt:', error);
      alert(`Erreur lors de la création du prêt: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setFormData({
      appareilPretId: '',
      clientId: '',
      interventionId: '',
      dateRetourPrevue: '',
      notes: ''
    });
    setInterventions([]);
    onClose();
  };

  if (!show) return null;

  const isClientLocked = !!prefilledData.clientId;

  return (
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
        overflowY: 'auto',
        overflowX: 'hidden',
        paddingRight: 'calc(var(--space-6) + 8px)'
      }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 'var(--space-6)'
        }}>
          <h2>Prêter un appareil</h2>
          <button
            onClick={handleClose}
            style={{
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              padding: 'var(--space-2)',
              color: 'var(--neutral-600)'
            }}
          >
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          {/* Sélection appareil */}
          <div className="form-group">
            <label className="form-label">Appareil à prêter *</label>
            <select
              className="form-input"
              value={formData.appareilPretId}
              onChange={(e) => setFormData({ ...formData, appareilPretId: e.target.value })}
              required
            >
              <option value="">Sélectionner un appareil</option>
              {appareilsDisponibles.map(appareil => (
                <option key={appareil._id} value={appareil._id}>
                  {appareil.type} - {appareil.marque} {appareil.modele}
                  {appareil.emplacement && ` (${appareil.emplacement})`}
                </option>
              ))}
            </select>
            {appareilsDisponibles.length === 0 && (
              <div style={{ fontSize: '0.875rem', color: 'var(--yellow-600)', marginTop: 'var(--space-2)' }}>
                ⚠️ Aucun appareil disponible pour le moment
              </div>
            )}
          </div>

          {/* Sélection client */}
          <div className="form-group">
            <label className="form-label">Client *</label>
            {isClientLocked ? (
              <input
                type="text"
                className="form-input"
                value={clients.find(c => c._id === formData.clientId)?.nom + ' ' + clients.find(c => c._id === formData.clientId)?.prenom || 'Client'}
                disabled
                style={{ background: 'var(--neutral-100)' }}
              />
            ) : (
              <select
                className="form-input"
                value={formData.clientId}
                onChange={(e) => setFormData({ ...formData, clientId: e.target.value, interventionId: '' })}
                required
              >
                <option value="">Sélectionner un client</option>
                {clients.map(client => (
                  <option key={client._id} value={client._id}>
                    {client.nom} {client.prenom} - {client.telephone}
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Sélection intervention (optionnel) */}
          {formData.clientId && (
            <div className="form-group">
              <label className="form-label">Intervention liée (optionnel)</label>
              <select
                className="form-input"
                value={formData.interventionId}
                onChange={(e) => setFormData({ ...formData, interventionId: e.target.value })}
              >
                <option value="">Aucune intervention</option>
                {interventions.map(intervention => (
                  <option key={intervention._id} value={intervention._id}>
                    {intervention.numero} - {intervention.appareil?.type} ({intervention.statut})
                  </option>
                ))}
              </select>
              {interventions.length === 0 && (
                <div style={{ fontSize: '0.875rem', color: 'var(--neutral-500)', marginTop: 'var(--space-2)' }}>
                  Aucune intervention pour ce client
                </div>
              )}
            </div>
          )}

          {/* Date retour prévue */}
          <div className="form-group">
            <label className="form-label">Date de retour prévue</label>
            <input
              type="date"
              className="form-input"
              value={formData.dateRetourPrevue}
              onChange={(e) => setFormData({ ...formData, dateRetourPrevue: e.target.value })}
              min={new Date().toISOString().split('T')[0]}
            />
          </div>

          {/* Notes */}
          <div className="form-group">
            <label className="form-label">Notes</label>
            <textarea
              className="form-textarea"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              rows={3}
              placeholder="Notes concernant le prêt..."
            />
          </div>

          <div style={{ display: 'flex', gap: 'var(--space-3)', justifyContent: 'flex-end', marginTop: 'var(--space-6)' }}>
            <button type="button" className="btn btn-secondary" onClick={handleClose} disabled={loading}>
              Annuler
            </button>
            <button type="submit" className="btn btn-primary" disabled={loading || appareilsDisponibles.length === 0}>
              {loading ? 'Création...' : 'Créer le prêt'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default PretModal;
