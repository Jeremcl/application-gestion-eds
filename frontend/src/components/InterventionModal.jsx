import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { clients as clientsAPI, interventions as interventionsAPI, appareilsPret as appareilsPretAPI } from '../services/api';

const InterventionModal = ({ show, onClose, onSuccess, prefilledData = {}, editingIntervention = null }) => {
  const [clients, setClients] = useState([]);
  const [clientDevices, setClientDevices] = useState([]);
  const [appareilsDisponibles, setAppareilsDisponibles] = useState([]);
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    clientId: prefilledData.clientId || '',
    appareilId: prefilledData.appareilId || '',
    appareil: prefilledData.appareil || { type: '', marque: '', modele: '', numeroSerie: '' },
    appareilPretId: '',
    description: '',
    statut: 'Demande',
    typeIntervention: 'Atelier',
    technicien: '',
    datePrevue: prefilledData.datePrevue || '',
    dateRealisation: '',
    diagnostic: '',
    tempsMainOeuvre: 0,
    tauxHoraire: 45,
    forfaitApplique: 0,
    notes: ''
  });

  const statuts = ['Demande', 'Planifié', 'En cours', 'Diagnostic', 'Réparation', 'Terminé', 'Facturé'];

  useEffect(() => {
    if (show) {
      loadClients();
      loadAppareilsDisponibles();

      // Si on est en mode édition, charger les données
      if (editingIntervention) {
        const clientId = editingIntervention.clientId?._id || editingIntervention.clientId;
        setFormData({
          clientId: clientId,
          appareilId: editingIntervention.appareilId || '',
          appareil: editingIntervention.appareil || { type: '', marque: '', modele: '', numeroSerie: '' },
          appareilPretId: editingIntervention.appareilPretId || '',
          description: editingIntervention.description || '',
          statut: editingIntervention.statut || 'Demande',
          typeIntervention: editingIntervention.typeIntervention || 'Atelier',
          technicien: editingIntervention.technicien || '',
          datePrevue: editingIntervention.datePrevue ? new Date(editingIntervention.datePrevue).toISOString().split('T')[0] : '',
          dateRealisation: editingIntervention.dateRealisation ? new Date(editingIntervention.dateRealisation).toISOString().split('T')[0] : '',
          diagnostic: editingIntervention.diagnostic || '',
          tempsMainOeuvre: editingIntervention.tempsMainOeuvre || 0,
          tauxHoraire: editingIntervention.tauxHoraire || 45,
          forfaitApplique: editingIntervention.forfaitApplique || 0,
          notes: editingIntervention.notes || ''
        });
        if (clientId) {
          loadClientDevices(clientId);
        }
      } else if (prefilledData.clientId || prefilledData.datePrevue) {
        // Réinitialiser le formData avec les données préfixées
        setFormData(prev => ({
          ...prev,
          clientId: prefilledData.clientId || '',
          appareilId: prefilledData.appareilId || '',
          appareil: prefilledData.appareil || { type: '', marque: '', modele: '', numeroSerie: '' },
          datePrevue: prefilledData.datePrevue || ''
        }));
        if (prefilledData.clientId) {
          loadClientDevices(prefilledData.clientId);
        }
      }
    }
  }, [show, prefilledData.clientId, prefilledData.datePrevue, prefilledData.appareilId, editingIntervention]);

  useEffect(() => {
    if (formData.clientId && formData.clientId !== prefilledData.clientId) {
      loadClientDevices(formData.clientId);
    }
  }, [formData.clientId]);

  const loadClients = async () => {
    try {
      const { data } = await clientsAPI.getAll({});
      setClients(data.clients);
    } catch (error) {
      console.error('Erreur chargement clients:', error);
    }
  };

  const loadClientDevices = async (clientId) => {
    try {
      const { data } = await clientsAPI.getDevices(clientId);
      setClientDevices(data);
    } catch (error) {
      console.error('Erreur chargement appareils:', error);
      setClientDevices([]);
    }
  };

  const loadAppareilsDisponibles = async () => {
    try {
      const { data } = await appareilsPretAPI.getDisponibles();
      setAppareilsDisponibles(data);
    } catch (error) {
      console.error('Erreur chargement appareils disponibles:', error);
      setAppareilsDisponibles([]);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      // Nettoyer les données avant envoi
      const dataToSend = { ...formData };

      // Si appareilId est vide, ne pas l'envoyer
      if (!dataToSend.appareilId) {
        delete dataToSend.appareilId;
      }

      // Si appareilPretId est vide, ne pas l'envoyer
      if (!dataToSend.appareilPretId) {
        delete dataToSend.appareilPretId;
      }

      if (editingIntervention) {
        await interventionsAPI.update(editingIntervention._id, dataToSend);
      } else {
        await interventionsAPI.create(dataToSend);
      }
      onSuccess?.();
      handleClose();
    } catch (error) {
      console.error(`Erreur ${editingIntervention ? 'modification' : 'création'} intervention:`, error);
      alert(`Erreur lors de la ${editingIntervention ? 'modification' : 'création'} de l'intervention`);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setFormData({
      clientId: '',
      appareilId: '',
      appareil: { type: '', marque: '', modele: '', numeroSerie: '' },
      appareilPretId: '',
      description: '',
      statut: 'Demande',
      typeIntervention: 'Atelier',
      technicien: '',
      datePrevue: '',
      dateRealisation: '',
      diagnostic: '',
      tempsMainOeuvre: 0,
      tauxHoraire: 45,
      forfaitApplique: 0,
      notes: ''
    });
    onClose();
  };

  const handleDeviceSelect = (e) => {
    const appareilId = e.target.value;
    setFormData({ ...formData, appareilId });
  };

  if (!show) return null;

  const isClientLocked = !!prefilledData.clientId;
  const isDeviceLocked = !!prefilledData.appareilId;

  return (
    <div className="modal-container" onClick={handleClose}>
      <div className="card modal-content animate-slide-in" style={{
        width: '100%',
        maxWidth: '700px',
        maxHeight: '90vh',
        overflowY: 'auto',
        overflowX: 'hidden',
        paddingRight: 'calc(var(--space-6) + 8px)'
      }} onClick={(e) => e.stopPropagation()}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 'var(--space-6)'
        }}>
          <h2>{editingIntervention ? 'Modifier l\'intervention' : 'Nouvelle intervention'}</h2>
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
          {/* Client Selection */}
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
                onChange={(e) => setFormData({ ...formData, clientId: e.target.value, appareilId: '' })}
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

          {/* Device Selection */}
          {formData.clientId && (
            <div className="form-group">
              <label className="form-label">Appareil</label>
              {isDeviceLocked ? (
                <input
                  type="text"
                  className="form-input"
                  value={`${prefilledData.appareil?.type || ''} ${prefilledData.appareil?.marque || ''}`}
                  disabled
                  style={{ background: 'var(--neutral-100)' }}
                />
              ) : (
                <>
                  {clientDevices.length > 0 ? (
                    <select
                      className="form-input"
                      value={formData.appareilId}
                      onChange={handleDeviceSelect}
                    >
                      <option value="">Sélectionner un appareil ou saisir manuellement</option>
                      {clientDevices.map(device => (
                        <option key={device._id} value={device._id}>
                          {device.type} - {device.marque} {device.modele}
                          {device.numeroSerie && ` (${device.numeroSerie})`}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <div style={{ fontSize: '0.875rem', color: 'var(--neutral-600)', marginBottom: 'var(--space-2)' }}>
                      Aucun appareil enregistré - Saisie manuelle
                    </div>
                  )}

                  {/* Manual device entry if no device selected */}
                  {!formData.appareilId && (
                    <div style={{ marginTop: 'var(--space-3)', padding: 'var(--space-3)', background: 'var(--neutral-50)', borderRadius: 'var(--radius-md)' }}>
                      <div className="grid grid-2 mb-3">
                        <div>
                          <label className="form-label" style={{ fontSize: '0.875rem' }}>Type</label>
                          <input
                            type="text"
                            className="form-input"
                            value={formData.appareil.type}
                            onChange={(e) => setFormData({ ...formData, appareil: { ...formData.appareil, type: e.target.value } })}
                            placeholder="Ex: PC Portable"
                          />
                        </div>
                        <div>
                          <label className="form-label" style={{ fontSize: '0.875rem' }}>Marque</label>
                          <input
                            type="text"
                            className="form-input"
                            value={formData.appareil.marque}
                            onChange={(e) => setFormData({ ...formData, appareil: { ...formData.appareil, marque: e.target.value } })}
                            placeholder="Ex: HP"
                          />
                        </div>
                      </div>
                      <div className="grid grid-2">
                        <div>
                          <label className="form-label" style={{ fontSize: '0.875rem' }}>Modèle</label>
                          <input
                            type="text"
                            className="form-input"
                            value={formData.appareil.modele}
                            onChange={(e) => setFormData({ ...formData, appareil: { ...formData.appareil, modele: e.target.value } })}
                            placeholder="Ex: EliteBook 840"
                          />
                        </div>
                        <div>
                          <label className="form-label" style={{ fontSize: '0.875rem' }}>N° série</label>
                          <input
                            type="text"
                            className="form-input"
                            value={formData.appareil.numeroSerie}
                            onChange={(e) => setFormData({ ...formData, appareil: { ...formData.appareil, numeroSerie: e.target.value } })}
                            placeholder="Ex: ABC123456"
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          {/* Appareil de prêt */}
          <div className="form-group">
            <label className="form-label">Appareil de prêt (optionnel)</label>
            <select
              className="form-input"
              value={formData.appareilPretId}
              onChange={(e) => setFormData({ ...formData, appareilPretId: e.target.value })}
            >
              <option value="">Aucun appareil de prêt</option>
              {appareilsDisponibles.map(appareil => (
                <option key={appareil._id} value={appareil._id}>
                  {appareil.type} - {appareil.marque} {appareil.modele}
                  {appareil.numeroSerie && ` (${appareil.numeroSerie})`}
                </option>
              ))}
            </select>
            <div style={{ fontSize: '0.75rem', color: 'var(--neutral-600)', marginTop: 'var(--space-1)' }}>
              Prêtez un appareil au client pendant la réparation
            </div>
          </div>

          {/* Description */}
          <div className="form-group">
            <label className="form-label">Description du problème *</label>
            <textarea
              className="form-textarea"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={4}
              required
              placeholder="Décrivez le problème rencontré..."
            />
          </div>

          <div className="grid grid-2 mb-4">
            {/* Status */}
            <div className="form-group">
              <label className="form-label">Statut</label>
              <select
                className="form-input"
                value={formData.statut}
                onChange={(e) => setFormData({ ...formData, statut: e.target.value })}
              >
                {statuts.map(statut => (
                  <option key={statut} value={statut}>{statut}</option>
                ))}
              </select>
            </div>

            {/* Type */}
            <div className="form-group">
              <label className="form-label">Type d'intervention</label>
              <select
                className="form-input"
                value={formData.typeIntervention}
                onChange={(e) => setFormData({ ...formData, typeIntervention: e.target.value })}
              >
                <option value="Atelier">Atelier</option>
                <option value="Domicile">Domicile</option>
              </select>
            </div>
          </div>

          <div className="grid grid-2 mb-4">
            {/* Technician */}
            <div className="form-group">
              <label className="form-label">Technicien</label>
              <input
                type="text"
                className="form-input"
                value={formData.technicien}
                onChange={(e) => setFormData({ ...formData, technicien: e.target.value })}
                placeholder="Nom du technicien"
              />
            </div>

            {/* Date prévue */}
            <div className="form-group">
              <label className="form-label">Date prévue</label>
              <input
                type="date"
                className="form-input"
                value={formData.datePrevue}
                onChange={(e) => setFormData({ ...formData, datePrevue: e.target.value })}
              />
            </div>
          </div>

          {/* Notes */}
          <div className="form-group">
            <label className="form-label">Notes</label>
            <textarea
              className="form-textarea"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              rows={2}
              placeholder="Notes additionnelles..."
            />
          </div>

          <div style={{ display: 'flex', gap: 'var(--space-3)', justifyContent: 'flex-end', marginTop: 'var(--space-6)' }}>
            <button type="button" className="btn btn-secondary" onClick={handleClose} disabled={loading}>
              Annuler
            </button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? (editingIntervention ? 'Modification...' : 'Création...') : (editingIntervention ? 'Mettre à jour' : 'Créer l\'intervention')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default InterventionModal;
