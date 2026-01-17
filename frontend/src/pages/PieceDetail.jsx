import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Package, MapPin, TrendingUp, TrendingDown, Euro,
  Edit, Trash2, AlertTriangle, CheckCircle, Box, Tag
} from 'lucide-react';
import { pieces as piecesAPI } from '../services/api';
import Breadcrumb from '../components/Breadcrumb';
import PieceModal from '../components/PieceModal';

const PieceDetail = () => {
  const { pieceId } = useParams();
  const navigate = useNavigate();
  const [piece, setPiece] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showEditModal, setShowEditModal] = useState(false);

  useEffect(() => {
    loadPiece();
  }, [pieceId]);

  const loadPiece = async () => {
    setLoading(true);
    try {
      const { data } = await piecesAPI.getById(pieceId);
      setPiece(data);
    } catch (error) {
      console.error('Erreur chargement pièce:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer cette pièce ?')) {
      try {
        await piecesAPI.delete(pieceId);
        navigate('/stock');
      } catch (error) {
        console.error('Erreur suppression pièce:', error);
        alert('Erreur lors de la suppression');
      }
    }
  };

  const getStockStatus = () => {
    if (piece.quantiteStock === 0) return { type: 'danger', label: 'Rupture de stock', color: 'var(--red-600)' };
    if (piece.quantiteStock < piece.quantiteMinimum) return { type: 'warning', label: 'Stock critique', color: 'var(--yellow-600)' };
    return { type: 'success', label: 'Stock OK', color: 'var(--green-600)' };
  };

  const getMarge = () => {
    if (piece.prixAchat === 0) return 0;
    return ((piece.prixVente - piece.prixAchat) / piece.prixAchat * 100).toFixed(1);
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

  if (!piece) {
    return (
      <div className="animate-fade-in">
        <div className="card" style={{ padding: 'var(--space-8)', textAlign: 'center' }}>
          Pièce non trouvée
        </div>
      </div>
    );
  }

  const stockStatus = getStockStatus();
  const marge = getMarge();

  return (
    <div className="animate-fade-in">
      <Breadcrumb items={[
        { label: 'Stock', path: '/stock' },
        { label: piece.reference }
      ]} />

      {/* Header Card */}
      <div className="card" style={{ marginBottom: 'var(--space-6)' }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          marginBottom: 'var(--space-4)'
        }}>
          <div style={{ display: 'flex', gap: 'var(--space-4)', alignItems: 'flex-start' }}>
            {/* Icon */}
            <div style={{
              width: '64px',
              height: '64px',
              borderRadius: 'var(--radius-lg)',
              background: 'linear-gradient(135deg, var(--primary-100), var(--primary-200))',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <Package size={32} style={{ color: 'var(--primary-600)' }} />
            </div>

            {/* Info */}
            <div>
              <h1 style={{
                fontSize: '1.875rem',
                fontWeight: 700,
                color: 'var(--neutral-900)',
                marginBottom: 'var(--space-2)',
                fontFamily: 'monospace'
              }}>
                {piece.reference}
              </h1>
              <div style={{
                fontSize: '1.125rem',
                color: 'var(--neutral-700)',
                marginBottom: 'var(--space-2)'
              }}>
                {piece.designation}
              </div>
              <div style={{
                display: 'inline-flex',
                alignItems: 'center',
                padding: 'var(--space-2) var(--space-3)',
                background: `${stockStatus.color}20`,
                color: stockStatus.color,
                borderRadius: 'var(--radius-full)',
                fontSize: '0.875rem',
                fontWeight: 600
              }}>
                {stockStatus.label}
              </div>
            </div>
          </div>

          {/* Actions */}
          <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
            <button className="btn btn-secondary" onClick={() => setShowEditModal(true)}>
              <Edit size={18} />
              Modifier
            </button>
            <button
              className="btn btn-secondary"
              onClick={handleDelete}
              style={{ color: 'var(--red-500)' }}
            >
              <Trash2 size={18} />
              Supprimer
            </button>
            <button className="btn btn-secondary" onClick={() => navigate('/stock')}>
              Retour
            </button>
          </div>
        </div>
      </div>

      {/* Stock & Location */}
      <div className="grid grid-3" style={{ gap: 'var(--space-4)', marginBottom: 'var(--space-6)' }}>
        {/* Stock actuel */}
        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', marginBottom: 'var(--space-3)' }}>
            <div style={{
              width: '40px',
              height: '40px',
              borderRadius: 'var(--radius-lg)',
              background: stockStatus.type === 'danger' ? 'var(--red-100)' :
                         stockStatus.type === 'warning' ? 'var(--yellow-100)' : 'var(--green-100)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <Box size={20} style={{ color: stockStatus.color }} />
            </div>
            <div>
              <div style={{ fontSize: '0.75rem', color: 'var(--neutral-500)', marginBottom: '2px' }}>
                Stock actuel
              </div>
              <div style={{ fontWeight: 700, fontSize: '1.5rem', color: stockStatus.color }}>
                {piece.quantiteStock}
              </div>
            </div>
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--neutral-600)' }}>
            Minimum: {piece.quantiteMinimum}
          </div>
        </div>

        {/* Emplacement */}
        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', marginBottom: 'var(--space-3)' }}>
            <div style={{
              width: '40px',
              height: '40px',
              borderRadius: 'var(--radius-lg)',
              background: 'var(--purple-100)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <MapPin size={20} style={{ color: 'var(--purple-600)' }} />
            </div>
            <div>
              <div style={{ fontSize: '0.75rem', color: 'var(--neutral-500)', marginBottom: '2px' }}>
                Emplacement
              </div>
              <div style={{ fontWeight: 600, fontSize: '1.125rem', fontFamily: 'monospace' }}>
                {piece.emplacement || 'Non défini'}
              </div>
            </div>
          </div>
        </div>

        {/* Statut actif */}
        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
            <div style={{
              width: '40px',
              height: '40px',
              borderRadius: 'var(--radius-lg)',
              background: piece.actif ? 'var(--green-100)' : 'var(--neutral-100)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              {piece.actif ? (
                <CheckCircle size={20} style={{ color: 'var(--green-600)' }} />
              ) : (
                <AlertTriangle size={20} style={{ color: 'var(--neutral-600)' }} />
              )}
            </div>
            <div>
              <div style={{ fontSize: '0.75rem', color: 'var(--neutral-500)', marginBottom: '2px' }}>
                Statut
              </div>
              <div style={{ fontWeight: 600, fontSize: '1.125rem', color: piece.actif ? 'var(--green-600)' : 'var(--neutral-600)' }}>
                {piece.actif ? 'Active' : 'Inactive'}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Prix & Marque */}
      <div className="grid grid-2" style={{ gap: 'var(--space-4)', marginBottom: 'var(--space-6)' }}>
        {/* Prix */}
        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', marginBottom: 'var(--space-4)' }}>
            <Euro size={20} style={{ color: 'var(--neutral-600)' }} />
            <h3 style={{ fontSize: '1rem', fontWeight: 600 }}>Tarification</h3>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.875rem', color: 'var(--neutral-600)' }}>Prix d'achat</span>
              <span style={{ fontSize: '1.25rem', fontWeight: 600 }}>{piece.prixAchat.toFixed(2)}€</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.875rem', color: 'var(--neutral-600)' }}>Prix de vente</span>
              <span style={{ fontSize: '1.25rem', fontWeight: 600, color: 'var(--primary-600)' }}>
                {piece.prixVente.toFixed(2)}€
              </span>
            </div>
            <div style={{
              padding: 'var(--space-3)',
              background: marge > 0 ? 'var(--green-50)' : 'var(--neutral-50)',
              borderRadius: 'var(--radius-md)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <span style={{ fontSize: '0.875rem', color: 'var(--neutral-700)', fontWeight: 600 }}>
                Marge
              </span>
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                {marge > 0 ? (
                  <TrendingUp size={18} style={{ color: 'var(--green-600)' }} />
                ) : (
                  <TrendingDown size={18} style={{ color: 'var(--neutral-600)' }} />
                )}
                <span style={{
                  fontSize: '1.125rem',
                  fontWeight: 700,
                  color: marge > 0 ? 'var(--green-600)' : 'var(--neutral-600)'
                }}>
                  {marge}%
                </span>
              </div>
            </div>
            <div style={{
              padding: 'var(--space-3)',
              background: 'var(--blue-50)',
              borderRadius: 'var(--radius-md)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <span style={{ fontSize: '0.875rem', color: 'var(--blue-700)', fontWeight: 600 }}>
                Valeur totale stock
              </span>
              <span style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--blue-700)' }}>
                {(piece.quantiteStock * piece.prixAchat).toFixed(2)}€
              </span>
            </div>
          </div>
        </div>

        {/* Marque & Fournisseur */}
        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', marginBottom: 'var(--space-4)' }}>
            <Tag size={20} style={{ color: 'var(--neutral-600)' }} />
            <h3 style={{ fontSize: '1rem', fontWeight: 600 }}>Informations produit</h3>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
            {piece.marque && (
              <div>
                <div style={{ fontSize: '0.75rem', color: 'var(--neutral-500)', marginBottom: 'var(--space-1)' }}>
                  Marque
                </div>
                <div style={{ fontSize: '1rem', fontWeight: 600 }}>
                  {piece.marque}
                </div>
              </div>
            )}
            {piece.fournisseur && (
              <div>
                <div style={{ fontSize: '0.75rem', color: 'var(--neutral-500)', marginBottom: 'var(--space-1)' }}>
                  Fournisseur
                </div>
                <div style={{ fontSize: '1rem', fontWeight: 600 }}>
                  {piece.fournisseur}
                </div>
              </div>
            )}
            {piece.fournisseurRef && (
              <div>
                <div style={{ fontSize: '0.75rem', color: 'var(--neutral-500)', marginBottom: 'var(--space-1)' }}>
                  Référence fournisseur
                </div>
                <div style={{ fontSize: '0.875rem', fontFamily: 'monospace', color: 'var(--neutral-700)' }}>
                  {piece.fournisseurRef}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modèles compatibles */}
      {piece.modelesCompatibles && piece.modelesCompatibles.length > 0 && (
        <div className="card" style={{ marginBottom: 'var(--space-6)' }}>
          <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: 'var(--space-3)' }}>
            Modèles compatibles
          </h3>
          <div style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: 'var(--space-2)'
          }}>
            {piece.modelesCompatibles.map((modele, index) => (
              <span
                key={index}
                style={{
                  padding: 'var(--space-2) var(--space-3)',
                  background: 'var(--neutral-100)',
                  borderRadius: 'var(--radius-md)',
                  fontSize: '0.875rem',
                  fontWeight: 500,
                  fontFamily: 'monospace',
                  color: 'var(--neutral-700)'
                }}
              >
                {modele}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {showEditModal && (
        <PieceModal
          piece={piece}
          onClose={() => setShowEditModal(false)}
          onSave={() => {
            loadPiece();
            setShowEditModal(false);
          }}
        />
      )}
    </div>
  );
};

export default PieceDetail;
