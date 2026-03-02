import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Edit, Globe, EyeOff, AlertTriangle, Package, Tag, DollarSign, Layers, Image } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001';
const getImageUrl = (url) => {
  if (!url) return null;
  if (url.startsWith('http')) return url;
  return `${API_URL}${url}`;
};
import { produits as produitsAPI } from '../services/api';
import ProduitModal from '../components/ProduitModal';

const ETATS_LABELS = {
  neuf: 'Neuf',
  reconditionné: 'Reconditionné',
  piece_detachee: 'Pièce détachée'
};
const ETATS_COLORS = {
  neuf: { bg: '#dcfce7', color: '#166534' },
  reconditionné: { bg: '#dbeafe', color: '#1e40af' },
  piece_detachee: { bg: '#fef9c3', color: '#854d0e' }
};

const ProduitDetail = () => {
  const { produitId } = useParams();
  const navigate = useNavigate();
  const [produit, setProduit] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [togglingVisibilite, setTogglingVisibilite] = useState(false);

  useEffect(() => {
    loadProduit();
  }, [produitId]);

  const loadProduit = async () => {
    setLoading(true);
    try {
      const { data } = await produitsAPI.getById(produitId);
      setProduit(data);
    } catch (error) {
      console.error('Erreur chargement produit:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleVisibilite = async () => {
    setTogglingVisibilite(true);
    try {
      const { data } = await produitsAPI.toggleVisibilite(produitId);
      setProduit(prev => ({ ...prev, disponibleSurSite: data.disponibleSurSite }));
    } catch (error) {
      console.error('Erreur toggle visibilité:', error);
    } finally {
      setTogglingVisibilite(false);
    }
  };

  const handleSave = () => {
    setShowModal(false);
    loadProduit();
  };

  if (loading) {
    return (
      <div className="animate-fade-in">
        <div className="card" style={{ textAlign: 'center', padding: 'var(--space-16)', color: 'var(--neutral-500)' }}>
          Chargement...
        </div>
      </div>
    );
  }

  if (!produit) {
    return (
      <div className="animate-fade-in">
        <div className="card" style={{ textAlign: 'center', padding: 'var(--space-16)' }}>
          <Package size={40} style={{ color: 'var(--neutral-300)', margin: '0 auto var(--space-4)' }} />
          <div style={{ color: 'var(--neutral-600)', fontWeight: 500 }}>Produit non trouvé</div>
          <button className="btn btn-secondary" onClick={() => navigate('/boutique')} style={{ marginTop: 'var(--space-4)' }}>
            Retour à la boutique
          </button>
        </div>
      </div>
    );
  }

  const margePercent = produit.prixVente > 0 && produit.prixAchat > 0
    ? (((produit.prixVente - produit.prixAchat) / produit.prixVente) * 100).toFixed(1)
    : null;

  const margeEuros = produit.prixVente > 0 && produit.prixAchat > 0
    ? (produit.prixVente - produit.prixAchat).toFixed(2)
    : null;

  const stockStatus = produit.stockDisponible === 0 ? 'danger'
    : produit.stockDisponible < produit.stockMinimum ? 'warning'
    : 'success';

  const etatColors = ETATS_COLORS[produit.etat] || { bg: '#f3f4f6', color: '#374151' };

  return (
    <div className="animate-fade-in">
      {/* Navigation */}
      <div style={{ marginBottom: 'var(--space-4)' }}>
        <button className="btn btn-secondary" onClick={() => navigate('/boutique')}>
          <ArrowLeft size={16} />
          Retour boutique
        </button>
      </div>

      {/* En-tête */}
      <div className="page-header" style={{ marginBottom: 'var(--space-6)' }}>
        <div>
          <h1 className="page-title">{produit.nom}</h1>
          <div style={{ display: 'flex', gap: 'var(--space-3)', marginTop: 'var(--space-2)', flexWrap: 'wrap' }}>
            {produit.sku && (
              <span style={{ fontSize: '0.85rem', color: 'var(--neutral-500)', fontWeight: 500 }}>
                SKU : {produit.sku}
              </span>
            )}
            <span style={{
              padding: '3px 10px',
              borderRadius: 'var(--radius-full)',
              background: etatColors.bg,
              color: etatColors.color,
              fontSize: '0.8rem',
              fontWeight: 600
            }}>
              {ETATS_LABELS[produit.etat] || produit.etat}
            </span>
            <span style={{
              padding: '3px 10px',
              borderRadius: 'var(--radius-full)',
              background: 'var(--neutral-100)',
              color: 'var(--neutral-700)',
              fontSize: '0.8rem',
              fontWeight: 500
            }}>
              {produit.categorie}
            </span>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 'var(--space-3)' }}>
          <button
            className="btn btn-secondary"
            onClick={handleToggleVisibilite}
            disabled={togglingVisibilite}
            style={{
              color: produit.disponibleSurSite ? 'var(--primary-700)' : 'var(--neutral-600)',
              background: produit.disponibleSurSite ? 'var(--primary-50)' : undefined,
              borderColor: produit.disponibleSurSite ? 'var(--primary-200)' : undefined
            }}
          >
            {produit.disponibleSurSite ? <Globe size={16} /> : <EyeOff size={16} />}
            {produit.disponibleSurSite ? 'Publié sur le site' : 'Masqué du site'}
          </button>
          <button className="btn btn-primary" onClick={() => setShowModal(true)}>
            <Edit size={16} />
            Modifier
          </button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)' }}>

        {/* Colonne gauche */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>

          {/* Description */}
          <div className="card">
            <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: 'var(--space-3)', color: 'var(--neutral-700)' }}>
              Description
            </h3>
            {produit.description ? (
              <p style={{ color: 'var(--neutral-600)', lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>
                {produit.description}
              </p>
            ) : (
              <p style={{ color: 'var(--neutral-400)', fontStyle: 'italic' }}>Aucune description</p>
            )}
          </div>

          {/* Images */}
          {produit.images && produit.images.length > 0 && (
            <div className="card">
              <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: 'var(--space-3)', color: 'var(--neutral-700)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                  <Image size={16} />
                  Images ({produit.images.length})
                </div>
              </h3>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-3)' }}>
                {produit.images.map((url, i) => (
                  <div key={i} style={{
                    width: '100px',
                    height: '100px',
                    borderRadius: 'var(--radius-md)',
                    overflow: 'hidden',
                    background: 'var(--neutral-100)',
                    border: '1px solid var(--neutral-200)'
                  }}>
                    <img
                      src={getImageUrl(url)}
                      alt={`${produit.nom} - image ${i + 1}`}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      onError={(e) => {
                        e.target.style.display = 'none';
                        e.target.parentNode.innerHTML = '<div style="display:flex;align-items:center;justify-content:center;height:100%;color:#9ca3af;font-size:0.7rem;">Erreur</div>';
                      }}
                    />
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Colonne droite */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>

          {/* Prix & Marge */}
          <div className="card">
            <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: 'var(--space-4)', color: 'var(--neutral-700)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                <DollarSign size={16} />
                Tarification
              </div>
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-3)' }}>
              <div style={{ padding: 'var(--space-3)', background: 'var(--primary-50)', borderRadius: 'var(--radius-md)' }}>
                <div style={{ fontSize: '0.75rem', color: 'var(--primary-600)', fontWeight: 600, marginBottom: '4px' }}>PRIX DE VENTE</div>
                <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--primary-700)' }}>{produit.prixVente.toFixed(2)} €</div>
              </div>
              <div style={{ padding: 'var(--space-3)', background: 'var(--neutral-50)', borderRadius: 'var(--radius-md)', border: '1px solid var(--neutral-200)' }}>
                <div style={{ fontSize: '0.75rem', color: 'var(--neutral-600)', fontWeight: 600, marginBottom: '4px' }}>PRIX D'ACHAT</div>
                <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--neutral-700)' }}>{produit.prixAchat.toFixed(2)} €</div>
              </div>
            </div>
            {margePercent !== null && (
              <div style={{
                marginTop: 'var(--space-3)',
                padding: 'var(--space-3)',
                borderRadius: 'var(--radius-md)',
                background: Number(margePercent) >= 30 ? '#f0fdf4' : '#fefce8',
                border: `1px solid ${Number(margePercent) >= 30 ? '#bbf7d0' : '#fde68a'}`
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: '0.875rem', fontWeight: 600, color: Number(margePercent) >= 30 ? '#166534' : '#854d0e' }}>
                    Marge brute
                  </span>
                  <span style={{ fontSize: '0.875rem', fontWeight: 700, color: Number(margePercent) >= 30 ? '#166534' : '#854d0e' }}>
                    {margeEuros} € ({margePercent}%)
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Stock */}
          <div className="card">
            <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: 'var(--space-4)', color: 'var(--neutral-700)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                <Layers size={16} />
                Stock
              </div>
            </h3>
            <div style={{ display: 'flex', gap: 'var(--space-3)' }}>
              <div style={{
                flex: 1,
                padding: 'var(--space-3)',
                borderRadius: 'var(--radius-md)',
                background: stockStatus === 'danger' ? '#fef2f2' : stockStatus === 'warning' ? '#fffbeb' : 'var(--primary-50)',
                border: `1px solid ${stockStatus === 'danger' ? '#fecaca' : stockStatus === 'warning' ? '#fde68a' : 'var(--primary-200)'}`
              }}>
                <div style={{ fontSize: '0.75rem', fontWeight: 600, marginBottom: '4px', color: stockStatus === 'danger' ? '#dc2626' : stockStatus === 'warning' ? '#d97706' : 'var(--primary-600)' }}>
                  DISPONIBLE
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                  <span style={{ fontSize: '2rem', fontWeight: 800, color: stockStatus === 'danger' ? '#dc2626' : stockStatus === 'warning' ? '#d97706' : 'var(--primary-700)' }}>
                    {produit.stockDisponible}
                  </span>
                  {stockStatus !== 'success' && <AlertTriangle size={18} color={stockStatus === 'danger' ? '#dc2626' : '#d97706'} />}
                </div>
              </div>
              <div style={{ flex: 1, padding: 'var(--space-3)', borderRadius: 'var(--radius-md)', background: 'var(--neutral-50)', border: '1px solid var(--neutral-200)' }}>
                <div style={{ fontSize: '0.75rem', fontWeight: 600, marginBottom: '4px', color: 'var(--neutral-600)' }}>
                  SEUIL D'ALERTE
                </div>
                <span style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--neutral-700)' }}>
                  {produit.stockMinimum}
                </span>
              </div>
            </div>
            {stockStatus === 'danger' && (
              <div style={{ marginTop: 'var(--space-2)', fontSize: '0.8rem', color: '#dc2626', fontWeight: 500 }}>
                Rupture de stock — produit indisponible
              </div>
            )}
            {stockStatus === 'warning' && (
              <div style={{ marginTop: 'var(--space-2)', fontSize: '0.8rem', color: '#d97706', fontWeight: 500 }}>
                Stock faible — réapprovisionnement conseillé
              </div>
            )}
          </div>

          {/* Infos */}
          <div className="card">
            <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: 'var(--space-4)', color: 'var(--neutral-700)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                <Tag size={16} />
                Informations
              </div>
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
              {[
                { label: 'Catégorie', value: produit.categorie },
                { label: 'État', value: ETATS_LABELS[produit.etat] || produit.etat },
                { label: 'SKU / Référence', value: produit.sku || '—' },
                {
                  label: 'Visible sur le site',
                  value: produit.disponibleSurSite ? '✅ Publié' : '🔒 Masqué'
                },
                {
                  label: 'Créé le',
                  value: new Date(produit.dateCreation).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' })
                },
                {
                  label: 'Modifié le',
                  value: new Date(produit.dateModification).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' })
                }
              ].map(({ label, value }) => (
                <div key={label} style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  padding: '6px 0',
                  borderBottom: '1px solid var(--neutral-100)',
                  fontSize: '0.875rem'
                }}>
                  <span style={{ color: 'var(--neutral-500)', fontWeight: 500 }}>{label}</span>
                  <span style={{ color: 'var(--neutral-800)', fontWeight: 600 }}>{value}</span>
                </div>
              ))}
            </div>
          </div>
          {/* Sections d'informations */}
          {produit.sections && produit.sections.length > 0 && produit.sections.map((section, i) => (
            <div key={i} style={{
              borderRadius: 'var(--radius-lg)',
              border: '1px solid var(--neutral-200)',
              overflow: 'hidden'
            }}>
              <div style={{
                padding: 'var(--space-3) var(--space-4)',
                background: 'var(--neutral-50)',
                borderBottom: '1px solid var(--neutral-200)',
                display: 'flex',
                alignItems: 'center',
                gap: 'var(--space-2)'
              }}>
                <div style={{
                  width: '3px', height: '16px',
                  background: 'var(--primary-500)',
                  borderRadius: '2px',
                  flexShrink: 0
                }} />
                <h3 style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--neutral-800)', margin: 0 }}>
                  {section.titre}
                </h3>
              </div>
              <div style={{ padding: 'var(--space-4)', background: 'white' }}>
                <p style={{ color: 'var(--neutral-600)', lineHeight: 1.7, whiteSpace: 'pre-wrap', margin: 0, fontSize: '0.875rem' }}>
                  {section.contenu || <em style={{ color: 'var(--neutral-400)' }}>Aucun contenu</em>}
                </p>
              </div>
            </div>
          ))}

        </div>
      </div>

      {showModal && (
        <ProduitModal
          produit={produit}
          onClose={() => setShowModal(false)}
          onSave={handleSave}
        />
      )}
    </div>
  );
};

export default ProduitDetail;
