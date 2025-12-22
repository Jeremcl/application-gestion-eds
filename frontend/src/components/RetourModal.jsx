import { useState } from 'react';
import { X } from 'lucide-react';
import { prets as pretsAPI } from '../services/api';

const RetourModal = ({ show, onClose, onSuccess, pret }) => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    etatRetour: pret?.etatDepart || 'Bon',
    notes: ''
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await pretsAPI.retour(pret._id, formData);
      onSuccess?.();
      handleClose();
    } catch (error) {
      console.error('Erreur retour appareil:', error);
      alert(`Erreur lors du retour de l'appareil: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setFormData({
      etatRetour: pret?.etatDepart || 'Bon',
      notes: ''
    });
    onClose();
  };

  if (!show || !pret) return null;

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
        maxWidth: '500px',
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
          <h2>Retour d'appareil</h2>
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

        {/* Informations du prêt (lecture seule) */}
        <div style={{
          background: 'var(--neutral-50)',
          padding: 'var(--space-4)',
          borderRadius: 'var(--radius-md)',
          marginBottom: 'var(--space-6)'
        }}>
          <h3 style={{ fontSize: '1rem', marginBottom: 'var(--space-3)' }}>Informations du prêt</h3>
          <div style={{ fontSize: '0.875rem', color: 'var(--neutral-700)' }}>
            <div style={{ marginBottom: 'var(--space-2)' }}>
              <strong>Appareil:</strong> {pret.appareilPretId?.type} - {pret.appareilPretId?.marque} {pret.appareilPretId?.modele}
            </div>
            <div style={{ marginBottom: 'var(--space-2)' }}>
              <strong>Client:</strong> {pret.clientId?.nom} {pret.clientId?.prenom}
            </div>
            <div style={{ marginBottom: 'var(--space-2)' }}>
              <strong>Date de prêt:</strong> {new Date(pret.datePret).toLocaleDateString('fr-FR')}
            </div>
            {pret.dateRetourPrevue && (
              <div style={{ marginBottom: 'var(--space-2)' }}>
                <strong>Retour prévu:</strong> {new Date(pret.dateRetourPrevue).toLocaleDateString('fr-FR')}
              </div>
            )}
            <div>
              <strong>État au départ:</strong> {pret.etatDepart}
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          {/* État au retour */}
          <div className="form-group">
            <label className="form-label">État au retour *</label>
            <select
              className="form-input"
              value={formData.etatRetour}
              onChange={(e) => setFormData({ ...formData, etatRetour: e.target.value })}
              required
            >
              <option value="Neuf">Neuf</option>
              <option value="Bon">Bon</option>
              <option value="Moyen">Moyen</option>
              <option value="À réparer">À réparer</option>
            </select>
          </div>

          {/* Notes de retour */}
          <div className="form-group">
            <label className="form-label">Notes de retour</label>
            <textarea
              className="form-textarea"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              rows={3}
              placeholder="Notes sur l'état de l'appareil au retour, dommages éventuels..."
            />
          </div>

          <div style={{ display: 'flex', gap: 'var(--space-3)', justifyContent: 'flex-end', marginTop: 'var(--space-6)' }}>
            <button type="button" className="btn btn-secondary" onClick={handleClose} disabled={loading}>
              Annuler
            </button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Traitement...' : 'Confirmer le retour'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default RetourModal;
