import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { vehicules as vehiculesAPI } from '../services/api';

const VehiculeModal = ({ show, onClose, onSuccess, editingVehicule = null }) => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    nom: '',
    marque: '',
    typeVehicule: 'Utilitaire',
    immatriculation: '',
    statut: 'Disponible',
    notes: ''
  });

  useEffect(() => {
    if (show && editingVehicule) {
      setFormData({
        nom: editingVehicule.nom || '',
        marque: editingVehicule.marque || '',
        typeVehicule: editingVehicule.typeVehicule || 'Utilitaire',
        immatriculation: editingVehicule.immatriculation || '',
        statut: editingVehicule.statut || 'Disponible',
        notes: editingVehicule.notes || ''
      });
    }
  }, [show, editingVehicule]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (editingVehicule) {
        await vehiculesAPI.update(editingVehicule._id, formData);
      } else {
        await vehiculesAPI.create(formData);
      }
      onSuccess?.();
      handleClose();
    } catch (error) {
      console.error(`Erreur ${editingVehicule ? 'modification' : 'creation'} vehicule:`, error);
      alert(error.response?.data?.message || `Erreur lors de la ${editingVehicule ? 'modification' : 'creation'} du vehicule`);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setFormData({
      nom: '',
      marque: '',
      typeVehicule: 'Utilitaire',
      immatriculation: '',
      statut: 'Disponible',
      notes: ''
    });
    onClose();
  };

  if (!show) return null;

  return (
    <div className="modal-container" onClick={handleClose}>
      <div className="card modal-content animate-slide-in" style={{
        width: '100%',
        maxWidth: '600px',
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
          <h2>{editingVehicule ? 'Modifier le vehicule' : 'Nouveau vehicule'}</h2>
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
          {/* Informations de base */}
          <h3 style={{ marginBottom: 'var(--space-4)', fontSize: '1.125rem' }}>Informations de base</h3>

          <div className="grid grid-2 mb-4">
            <div className="form-group">
              <label className="form-label">Nom *</label>
              <input
                type="text"
                className="form-input"
                value={formData.nom}
                onChange={(e) => setFormData({ ...formData, nom: e.target.value })}
                required
                placeholder="Berlingo, Ducato..."
              />
            </div>
            <div className="form-group">
              <label className="form-label">Marque</label>
              <input
                type="text"
                className="form-input"
                value={formData.marque}
                onChange={(e) => setFormData({ ...formData, marque: e.target.value })}
                placeholder="Citroen, Fiat..."
              />
            </div>
          </div>

          <div className="grid grid-2 mb-4">
            <div className="form-group">
              <label className="form-label">Type de vehicule</label>
              <select
                className="form-input"
                value={formData.typeVehicule}
                onChange={(e) => setFormData({ ...formData, typeVehicule: e.target.value })}
              >
                <option value="Utilitaire">Utilitaire</option>
                <option value="Fourgon">Fourgon</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Immatriculation</label>
              <input
                type="text"
                className="form-input"
                value={formData.immatriculation}
                onChange={(e) => setFormData({ ...formData, immatriculation: e.target.value.toUpperCase() })}
                placeholder="AB-123-CD"
              />
            </div>
          </div>

          {/* Statut */}
          <h3 style={{ marginBottom: 'var(--space-4)', marginTop: 'var(--space-6)', fontSize: '1.125rem' }}>Statut</h3>

          <div className="form-group">
            <label className="form-label">Statut actuel</label>
            <select
              className="form-input"
              value={formData.statut}
              onChange={(e) => setFormData({ ...formData, statut: e.target.value })}
            >
              <option value="Disponible">Disponible</option>
              <option value="En utilisation">En utilisation</option>
              <option value="En maintenance">En maintenance</option>
            </select>
          </div>

          {/* Notes */}
          <div className="form-group">
            <label className="form-label">Notes</label>
            <textarea
              className="form-textarea"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              rows={3}
              placeholder="Notes additionnelles..."
            />
          </div>

          <div style={{ display: 'flex', gap: 'var(--space-3)', justifyContent: 'flex-end', marginTop: 'var(--space-6)' }}>
            <button type="button" className="btn btn-secondary" onClick={handleClose} disabled={loading}>
              Annuler
            </button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? (editingVehicule ? 'Modification...' : 'Creation...') : (editingVehicule ? 'Mettre a jour' : 'Creer le vehicule')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default VehiculeModal;
