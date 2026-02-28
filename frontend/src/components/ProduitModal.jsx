import { useState, useEffect } from 'react';
import { X, Plus, Trash2 } from 'lucide-react';
import { produits as produitsAPI } from '../services/api';

const CATEGORIES = ['Lavage', 'Cuisson', 'Multimédia', 'Appareils Reconditionnés', 'Pièces Détachées'];
const ETATS = [
  { value: 'neuf', label: 'Neuf' },
  { value: 'reconditionné', label: 'Reconditionné' },
  { value: 'piece_detachee', label: 'Pièce détachée' }
];

const ProduitModal = ({ produit, onClose, onSave }) => {
  const [loading, setLoading] = useState(false);
  const [newImageUrl, setNewImageUrl] = useState('');
  const [formData, setFormData] = useState({
    nom: '',
    description: '',
    categorie: 'Lavage',
    prixVente: 0,
    prixAchat: 0,
    stockDisponible: 0,
    stockMinimum: 2,
    images: [],
    etat: 'reconditionné',
    disponibleSurSite: false,
    sku: ''
  });

  useEffect(() => {
    if (produit) {
      setFormData({
        nom: produit.nom || '',
        description: produit.description || '',
        categorie: produit.categorie || 'Autre',
        prixVente: produit.prixVente || 0,
        prixAchat: produit.prixAchat || 0,
        stockDisponible: produit.stockDisponible || 0,
        stockMinimum: produit.stockMinimum ?? 2,
        images: produit.images || [],
        etat: produit.etat || 'reconditionné',
        disponibleSurSite: produit.disponibleSurSite || false,
        sku: produit.sku || ''
      });
    }
  }, [produit]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const dataToSend = {
        ...formData,
        prixVente: Number(formData.prixVente),
        prixAchat: Number(formData.prixAchat),
        stockDisponible: Number(formData.stockDisponible),
        stockMinimum: Number(formData.stockMinimum)
      };

      if (produit) {
        await produitsAPI.update(produit._id, dataToSend);
      } else {
        await produitsAPI.create(dataToSend);
      }
      onSave?.();
    } catch (error) {
      console.error(`Erreur ${produit ? 'modification' : 'création'} produit:`, error);
      alert(`Erreur lors de la ${produit ? 'modification' : 'création'} du produit`);
    } finally {
      setLoading(false);
    }
  };

  const handleAddImage = () => {
    if (newImageUrl.trim()) {
      setFormData({ ...formData, images: [...formData.images, newImageUrl.trim()] });
      setNewImageUrl('');
    }
  };

  const handleRemoveImage = (index) => {
    setFormData({ ...formData, images: formData.images.filter((_, i) => i !== index) });
  };

  const marge = formData.prixVente > 0 && formData.prixAchat > 0
    ? (((formData.prixVente - formData.prixAchat) / formData.prixVente) * 100).toFixed(1)
    : null;

  return (
    <div className="modal-container" onClick={onClose}>
      <div className="card modal-content animate-slide-in" style={{
        width: '100%',
        maxWidth: '750px',
        maxHeight: '92vh',
        overflowY: 'auto',
        overflowX: 'hidden',
        paddingRight: 'calc(var(--space-6) + 8px)'
      }} onClick={(e) => e.stopPropagation()}>

        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-6)' }}>
          <h2>{produit ? 'Modifier le produit' : 'Nouveau produit'}</h2>
          <button onClick={onClose} style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: 'var(--space-2)', color: 'var(--neutral-600)' }}>
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          {/* Nom & SKU */}
          <div className="grid grid-2 mb-4">
            <div className="form-group" style={{ gridColumn: 'span 2' }}>
              <label className="form-label">Nom du produit *</label>
              <input
                type="text"
                className="form-input"
                value={formData.nom}
                onChange={(e) => setFormData({ ...formData, nom: e.target.value })}
                required
                placeholder="Ex: iPhone 13 Pro Max 256Go"
              />
            </div>
          </div>

          <div className="grid grid-2 mb-4">
            <div className="form-group">
              <label className="form-label">Référence / SKU</label>
              <input
                type="text"
                className="form-input"
                value={formData.sku}
                onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                placeholder="Ex: IPH-13PM-256-BLK"
              />
            </div>
            <div className="form-group">
              <label className="form-label">Catégorie *</label>
              <select
                className="form-input"
                value={formData.categorie}
                onChange={(e) => setFormData({ ...formData, categorie: e.target.value })}
                required
              >
                {CATEGORIES.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Description */}
          <div className="form-group">
            <label className="form-label">Description</label>
            <textarea
              className="form-input"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={3}
              placeholder="Description visible sur le site web..."
            />
          </div>

          {/* État */}
          <div className="form-group">
            <label className="form-label">État *</label>
            <div style={{ display: 'flex', gap: 'var(--space-3)', flexWrap: 'wrap' }}>
              {ETATS.map(({ value, label }) => (
                <label key={value} style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 'var(--space-2)',
                  cursor: 'pointer',
                  padding: '8px 16px',
                  borderRadius: 'var(--radius-lg)',
                  border: `2px solid ${formData.etat === value ? 'var(--primary-500)' : 'var(--neutral-200)'}`,
                  background: formData.etat === value ? 'var(--primary-50)' : 'white',
                  fontWeight: formData.etat === value ? 600 : 400,
                  fontSize: '0.875rem',
                  color: formData.etat === value ? 'var(--primary-700)' : 'var(--neutral-700)',
                  transition: 'all 0.15s ease'
                }}>
                  <input
                    type="radio"
                    name="etat"
                    value={value}
                    checked={formData.etat === value}
                    onChange={(e) => setFormData({ ...formData, etat: e.target.value })}
                    style={{ display: 'none' }}
                  />
                  {label}
                </label>
              ))}
            </div>
          </div>

          {/* Prix */}
          <div className="grid grid-3 mb-4" style={{ alignItems: 'end' }}>
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
            <div className="form-group">
              <label className="form-label">Prix d'achat (€)</label>
              <input
                type="number"
                className="form-input"
                value={formData.prixAchat}
                onChange={(e) => setFormData({ ...formData, prixAchat: e.target.value })}
                min="0"
                step="0.01"
              />
            </div>
            <div style={{ paddingBottom: 'var(--space-4)' }}>
              {marge !== null && (
                <div style={{
                  padding: '10px 14px',
                  borderRadius: 'var(--radius-md)',
                  background: Number(marge) >= 30 ? 'var(--primary-50)' : 'var(--yellow-50, #fefce8)',
                  border: `1px solid ${Number(marge) >= 30 ? 'var(--primary-200)' : '#fde68a'}`,
                  fontSize: '0.875rem',
                  fontWeight: 600,
                  color: Number(marge) >= 30 ? 'var(--primary-700)' : 'var(--yellow-600)'
                }}>
                  Marge : {marge}%
                </div>
              )}
            </div>
          </div>

          {/* Stock */}
          <div className="grid grid-2 mb-4">
            <div className="form-group">
              <label className="form-label">Stock disponible *</label>
              <input
                type="number"
                className="form-input"
                value={formData.stockDisponible}
                onChange={(e) => setFormData({ ...formData, stockDisponible: e.target.value })}
                required
                min="0"
              />
            </div>
            <div className="form-group">
              <label className="form-label">Seuil d'alerte stock</label>
              <input
                type="number"
                className="form-input"
                value={formData.stockMinimum}
                onChange={(e) => setFormData({ ...formData, stockMinimum: e.target.value })}
                min="0"
              />
              <div style={{ fontSize: '0.75rem', color: 'var(--neutral-600)', marginTop: 'var(--space-1)' }}>
                Alerte si stock &lt; ce seuil
              </div>
            </div>
          </div>

          {/* Images */}
          <div className="form-group">
            <label className="form-label">Images (URLs)</label>
            <div style={{ display: 'flex', gap: 'var(--space-2)', marginBottom: 'var(--space-2)' }}>
              <input
                type="url"
                className="form-input"
                value={newImageUrl}
                onChange={(e) => setNewImageUrl(e.target.value)}
                placeholder="https://exemple.com/image.jpg"
                onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddImage())}
              />
              <button type="button" className="btn btn-secondary" onClick={handleAddImage} style={{ whiteSpace: 'nowrap' }}>
                <Plus size={16} />
                Ajouter
              </button>
            </div>
            {formData.images.length > 0 && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-2)' }}>
                {formData.images.map((url, i) => (
                  <div key={i} style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 'var(--space-2)',
                    padding: '4px 10px',
                    background: 'var(--neutral-100)',
                    borderRadius: 'var(--radius-full)',
                    fontSize: '0.75rem',
                    color: 'var(--neutral-700)',
                    maxWidth: '250px'
                  }}>
                    <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{url}</span>
                    <button type="button" onClick={() => handleRemoveImage(i)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--red-500)', padding: 0, display: 'flex' }}>
                      <Trash2 size={13} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Visibilité site */}
          <div className="form-group" style={{ marginTop: 'var(--space-4)' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', cursor: 'pointer' }}>
              <div style={{ position: 'relative', display: 'inline-flex', alignItems: 'center' }}>
                <input
                  type="checkbox"
                  checked={formData.disponibleSurSite}
                  onChange={(e) => setFormData({ ...formData, disponibleSurSite: e.target.checked })}
                  style={{ width: '20px', height: '20px', cursor: 'pointer', accentColor: 'var(--primary-500)' }}
                />
              </div>
              <div>
                <span className="form-label" style={{ marginBottom: 0 }}>Visible sur le site web</span>
                <div style={{ fontSize: '0.75rem', color: 'var(--neutral-500)', marginTop: '2px' }}>
                  Si coché, ce produit sera accessible via l'API publique /api/v1/products
                </div>
              </div>
            </label>
          </div>

          {/* Actions */}
          <div style={{ display: 'flex', gap: 'var(--space-3)', justifyContent: 'flex-end', marginTop: 'var(--space-6)' }}>
            <button type="button" className="btn btn-secondary" onClick={onClose} disabled={loading}>
              Annuler
            </button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? (produit ? 'Modification...' : 'Création...') : (produit ? 'Mettre à jour' : 'Créer le produit')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ProduitModal;
