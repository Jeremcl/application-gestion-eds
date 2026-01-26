import { useState, useEffect } from 'react';
import { X, Plus, Trash2 } from 'lucide-react';
import { appareilsPret as appareilsPretAPI } from '../services/api';

const AppareilPretModal = ({ show, onClose, onSuccess, editingAppareil = null }) => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    type: '',
    marque: '',
    modele: '',
    numeroSerie: '',
    statut: 'Disponible',
    etat: 'Bon',
    valeur: 0,
    dateAchat: '',
    emplacement: '',
    photo: '',
    accessoiresInclus: [],
    conditionsPret: '',
    notes: ''
  });
  const [newAccessoire, setNewAccessoire] = useState('');

  useEffect(() => {
    if (show && editingAppareil) {
      setFormData({
        type: editingAppareil.type || '',
        marque: editingAppareil.marque || '',
        modele: editingAppareil.modele || '',
        numeroSerie: editingAppareil.numeroSerie || '',
        statut: editingAppareil.statut || 'Disponible',
        etat: editingAppareil.etat || 'Bon',
        valeur: editingAppareil.valeur || 0,
        dateAchat: editingAppareil.dateAchat ? new Date(editingAppareil.dateAchat).toISOString().split('T')[0] : '',
        emplacement: editingAppareil.emplacement || '',
        photo: editingAppareil.photo || '',
        accessoiresInclus: editingAppareil.accessoiresInclus || [],
        conditionsPret: editingAppareil.conditionsPret || '',
        notes: editingAppareil.notes || ''
      });
    }
  }, [show, editingAppareil]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (editingAppareil) {
        await appareilsPretAPI.update(editingAppareil._id, formData);
      } else {
        await appareilsPretAPI.create(formData);
      }
      onSuccess?.();
      handleClose();
    } catch (error) {
      console.error(`Erreur ${editingAppareil ? 'modification' : 'création'} appareil:`, error);
      alert(`Erreur lors de la ${editingAppareil ? 'modification' : 'création'} de l'appareil`);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setFormData({
      type: '',
      marque: '',
      modele: '',
      numeroSerie: '',
      statut: 'Disponible',
      etat: 'Bon',
      valeur: 0,
      dateAchat: '',
      emplacement: '',
      photo: '',
      accessoiresInclus: [],
      conditionsPret: '',
      notes: ''
    });
    setNewAccessoire('');
    onClose();
  };

  const addAccessoire = () => {
    if (newAccessoire.trim()) {
      setFormData({
        ...formData,
        accessoiresInclus: [...formData.accessoiresInclus, newAccessoire.trim()]
      });
      setNewAccessoire('');
    }
  };

  const removeAccessoire = (index) => {
    setFormData({
      ...formData,
      accessoiresInclus: formData.accessoiresInclus.filter((_, i) => i !== index)
    });
  };

  if (!show) return null;

  return (
    <div className="modal-container" onClick={handleClose}>
      <div className="card modal-content animate-slide-in" style={{
        width: '100%',
        maxWidth: '800px',
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
          <h2>{editingAppareil ? 'Modifier l\'appareil de prêt' : 'Nouvel appareil de prêt'}</h2>
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
              <label className="form-label">Type *</label>
              <input
                type="text"
                className="form-input"
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                required
                placeholder="PC Portable, Smartphone, Tablette..."
              />
            </div>
            <div className="form-group">
              <label className="form-label">Marque</label>
              <input
                type="text"
                className="form-input"
                value={formData.marque}
                onChange={(e) => setFormData({ ...formData, marque: e.target.value })}
                placeholder="HP, Samsung, Apple..."
              />
            </div>
          </div>

          <div className="grid grid-2 mb-4">
            <div className="form-group">
              <label className="form-label">Modèle</label>
              <input
                type="text"
                className="form-input"
                value={formData.modele}
                onChange={(e) => setFormData({ ...formData, modele: e.target.value })}
                placeholder="EliteBook 840, Galaxy A52..."
              />
            </div>
            <div className="form-group">
              <label className="form-label">Numéro de série</label>
              <input
                type="text"
                className="form-input"
                value={formData.numeroSerie}
                onChange={(e) => setFormData({ ...formData, numeroSerie: e.target.value })}
                placeholder="ABC123456..."
              />
            </div>
          </div>

          {/* Statut et État */}
          <h3 style={{ marginBottom: 'var(--space-4)', marginTop: 'var(--space-6)', fontSize: '1.125rem' }}>Statut et État</h3>

          <div className="grid grid-2 mb-4">
            <div className="form-group">
              <label className="form-label">Statut</label>
              <select
                className="form-input"
                value={formData.statut}
                onChange={(e) => setFormData({ ...formData, statut: e.target.value })}
              >
                <option value="Disponible">Disponible</option>
                <option value="Prêté">Prêté</option>
                <option value="En maintenance">En maintenance</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">État</label>
              <select
                className="form-input"
                value={formData.etat}
                onChange={(e) => setFormData({ ...formData, etat: e.target.value })}
              >
                <option value="Neuf">Neuf</option>
                <option value="Bon">Bon</option>
                <option value="Moyen">Moyen</option>
                <option value="À réparer">À réparer</option>
              </select>
            </div>
          </div>

          {/* Détails */}
          <h3 style={{ marginBottom: 'var(--space-4)', marginTop: 'var(--space-6)', fontSize: '1.125rem' }}>Détails</h3>

          <div className="grid grid-2 mb-4">
            <div className="form-group">
              <label className="form-label">Valeur (€)</label>
              <input
                type="number"
                className="form-input"
                value={formData.valeur}
                onChange={(e) => setFormData({ ...formData, valeur: parseFloat(e.target.value) || 0 })}
                min="0"
                step="0.01"
              />
            </div>
            <div className="form-group">
              <label className="form-label">Date d'achat</label>
              <input
                type="date"
                className="form-input"
                value={formData.dateAchat}
                onChange={(e) => setFormData({ ...formData, dateAchat: e.target.value })}
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Emplacement</label>
            <input
              type="text"
              className="form-input"
              value={formData.emplacement}
              onChange={(e) => setFormData({ ...formData, emplacement: e.target.value })}
              placeholder="Étagère A3, Tiroir B1..."
            />
          </div>

          {/* Accessoires */}
          <h3 style={{ marginBottom: 'var(--space-4)', marginTop: 'var(--space-6)', fontSize: '1.125rem' }}>Accessoires inclus</h3>

          <div className="form-group">
            <div style={{ display: 'flex', gap: 'var(--space-2)', marginBottom: 'var(--space-3)' }}>
              <input
                type="text"
                className="form-input"
                value={newAccessoire}
                onChange={(e) => setNewAccessoire(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addAccessoire())}
                placeholder="Nom de l'accessoire"
                style={{ flex: 1 }}
              />
              <button
                type="button"
                className="btn btn-secondary"
                onClick={addAccessoire}
              >
                <Plus size={18} />
                Ajouter
              </button>
            </div>
            {formData.accessoiresInclus.length > 0 && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-2)' }}>
                {formData.accessoiresInclus.map((acc, index) => (
                  <div
                    key={index}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 'var(--space-2)',
                      padding: 'var(--space-2) var(--space-3)',
                      background: 'var(--primary-100)',
                      color: 'var(--primary-700)',
                      borderRadius: 'var(--radius-full)',
                      fontSize: '0.875rem'
                    }}
                  >
                    {acc}
                    <button
                      type="button"
                      onClick={() => removeAccessoire(index)}
                      style={{
                        background: 'transparent',
                        border: 'none',
                        cursor: 'pointer',
                        padding: 0,
                        color: 'inherit'
                      }}
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Conditions et Notes */}
          <div className="form-group">
            <label className="form-label">Conditions de prêt</label>
            <textarea
              className="form-textarea"
              value={formData.conditionsPret}
              onChange={(e) => setFormData({ ...formData, conditionsPret: e.target.value })}
              rows={2}
              placeholder="Retour sous 15 jours, avec coque de protection..."
            />
          </div>

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
              {loading ? (editingAppareil ? 'Modification...' : 'Création...') : (editingAppareil ? 'Mettre à jour' : 'Créer l\'appareil')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AppareilPretModal;
