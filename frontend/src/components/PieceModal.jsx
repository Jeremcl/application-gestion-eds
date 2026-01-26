import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { pieces as piecesAPI } from '../services/api';

const PieceModal = ({ piece, onClose, onSave }) => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    reference: '',
    designation: '',
    marque: '',
    modelesCompatibles: '',
    emplacement: '',
    quantiteStock: 0,
    quantiteMinimum: 5,
    prixAchat: 0,
    prixVente: 0,
    fournisseur: '',
    fournisseurRef: '',
    actif: true
  });

  useEffect(() => {
    if (piece) {
      setFormData({
        reference: piece.reference || '',
        designation: piece.designation || '',
        marque: piece.marque || '',
        modelesCompatibles: piece.modelesCompatibles?.join(', ') || '',
        emplacement: piece.emplacement || '',
        quantiteStock: piece.quantiteStock || 0,
        quantiteMinimum: piece.quantiteMinimum || 5,
        prixAchat: piece.prixAchat || 0,
        prixVente: piece.prixVente || 0,
        fournisseur: piece.fournisseur || '',
        fournisseurRef: piece.fournisseurRef || '',
        actif: piece.actif !== undefined ? piece.actif : true
      });
    }
  }, [piece]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      // Convertir modelesCompatibles de string à array
      const dataToSend = {
        ...formData,
        modelesCompatibles: formData.modelesCompatibles
          ? formData.modelesCompatibles.split(',').map(m => m.trim()).filter(m => m)
          : [],
        quantiteStock: Number(formData.quantiteStock),
        quantiteMinimum: Number(formData.quantiteMinimum),
        prixAchat: Number(formData.prixAchat),
        prixVente: Number(formData.prixVente)
      };

      if (piece) {
        await piecesAPI.update(piece._id, dataToSend);
      } else {
        await piecesAPI.create(dataToSend);
      }
      onSave?.();
    } catch (error) {
      console.error(`Erreur ${piece ? 'modification' : 'création'} pièce:`, error);
      alert(`Erreur lors de la ${piece ? 'modification' : 'création'} de la pièce`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-container" onClick={onClose}>
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
          <h2>{piece ? 'Modifier la pièce' : 'Nouvelle pièce'}</h2>
          <button
            onClick={onClose}
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
          {/* Reference & Designation */}
          <div className="grid grid-2 mb-4">
            <div className="form-group">
              <label className="form-label">Référence *</label>
              <input
                type="text"
                className="form-input"
                value={formData.reference}
                onChange={(e) => setFormData({ ...formData, reference: e.target.value })}
                required
                placeholder="Ex: 481010438414"
              />
            </div>
            <div className="form-group">
              <label className="form-label">Marque</label>
              <input
                type="text"
                className="form-input"
                value={formData.marque}
                onChange={(e) => setFormData({ ...formData, marque: e.target.value })}
                placeholder="Ex: WHIRLPOOL"
              />
            </div>
          </div>

          {/* Designation */}
          <div className="form-group">
            <label className="form-label">Désignation *</label>
            <input
              type="text"
              className="form-input"
              value={formData.designation}
              onChange={(e) => setFormData({ ...formData, designation: e.target.value })}
              required
              placeholder="Ex: Résistance - WHIRLPOOL"
            />
          </div>

          {/* Modèles compatibles */}
          <div className="form-group">
            <label className="form-label">Modèles compatibles</label>
            <input
              type="text"
              className="form-input"
              value={formData.modelesCompatibles}
              onChange={(e) => setFormData({ ...formData, modelesCompatibles: e.target.value })}
              placeholder="Ex: AWM8143, AWM8163, etc. (séparés par des virgules)"
            />
            <div style={{ fontSize: '0.75rem', color: 'var(--neutral-600)', marginTop: 'var(--space-1)' }}>
              Séparez les modèles par des virgules
            </div>
          </div>

          {/* Stock & Minimum */}
          <div className="grid grid-3 mb-4">
            <div className="form-group">
              <label className="form-label">Quantité en stock *</label>
              <input
                type="number"
                className="form-input"
                value={formData.quantiteStock}
                onChange={(e) => setFormData({ ...formData, quantiteStock: e.target.value })}
                required
                min="0"
              />
            </div>
            <div className="form-group">
              <label className="form-label">Quantité minimum *</label>
              <input
                type="number"
                className="form-input"
                value={formData.quantiteMinimum}
                onChange={(e) => setFormData({ ...formData, quantiteMinimum: e.target.value })}
                required
                min="0"
              />
            </div>
            <div className="form-group">
              <label className="form-label">Emplacement</label>
              <input
                type="text"
                className="form-input"
                value={formData.emplacement}
                onChange={(e) => setFormData({ ...formData, emplacement: e.target.value })}
                placeholder="Ex: A1-B2"
              />
            </div>
          </div>

          {/* Prix */}
          <div className="grid grid-2 mb-4">
            <div className="form-group">
              <label className="form-label">Prix d'achat (€) *</label>
              <input
                type="number"
                className="form-input"
                value={formData.prixAchat}
                onChange={(e) => setFormData({ ...formData, prixAchat: e.target.value })}
                required
                min="0"
                step="0.01"
              />
            </div>
            <div className="form-group">
              <label className="form-label">Prix de vente (€) *</label>
              <input
                type="number"
                className="form-input"
                value={formData.prixVente}
                onChange={(e) => setFormData({ ...formData, prixVente: e.target.value })}
                required
                min="0"
                step="0.01"
              />
            </div>
          </div>

          {/* Fournisseur */}
          <div className="grid grid-2 mb-4">
            <div className="form-group">
              <label className="form-label">Fournisseur</label>
              <input
                type="text"
                className="form-input"
                value={formData.fournisseur}
                onChange={(e) => setFormData({ ...formData, fournisseur: e.target.value })}
                placeholder="Ex: Darty"
              />
            </div>
            <div className="form-group">
              <label className="form-label">Référence fournisseur</label>
              <input
                type="text"
                className="form-input"
                value={formData.fournisseurRef}
                onChange={(e) => setFormData({ ...formData, fournisseurRef: e.target.value })}
                placeholder="Ex: 481010438414"
              />
            </div>
          </div>

          {/* Actif */}
          <div className="form-group">
            <label style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={formData.actif}
                onChange={(e) => setFormData({ ...formData, actif: e.target.checked })}
                style={{ width: '18px', height: '18px', cursor: 'pointer' }}
              />
              <span className="form-label" style={{ marginBottom: 0 }}>Pièce active</span>
            </label>
            <div style={{ fontSize: '0.75rem', color: 'var(--neutral-600)', marginTop: 'var(--space-1)' }}>
              Les pièces inactives ne seront pas affichées dans la liste
            </div>
          </div>

          <div style={{ display: 'flex', gap: 'var(--space-3)', justifyContent: 'flex-end', marginTop: 'var(--space-6)' }}>
            <button type="button" className="btn btn-secondary" onClick={onClose} disabled={loading}>
              Annuler
            </button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? (piece ? 'Modification...' : 'Création...') : (piece ? 'Mettre à jour' : 'Créer la pièce')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default PieceModal;
