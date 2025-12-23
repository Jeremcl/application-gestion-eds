import { useState, useEffect } from 'react';
import { Plus, AlertTriangle, Package, Search } from 'lucide-react';
import { pieces as piecesAPI } from '../services/api';

const Stock = () => {
  const [pieces, setPieces] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAlertes, setShowAlertes] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [alertesCount, setAlertesCount] = useState(0);

  useEffect(() => {
    loadPieces();
  }, [showAlertes, searchTerm]);

  const loadPieces = async () => {
    setLoading(true);
    try {
      const params = {
        search: searchTerm,
        stockCritique: showAlertes
      };
      const { data } = await piecesAPI.getAll(params);
      setPieces(data.pieces);

      // Charger le nombre d'alertes
      const { data: alertesData } = await piecesAPI.getAlertes();
      setAlertesCount(alertesData.count);
    } catch (error) {
      console.error('Erreur chargement pièces:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStockStatus = (piece) => {
    if (piece.quantiteStock === 0) return 'danger';
    if (piece.quantiteStock < piece.quantiteMinimum) return 'warning';
    return 'success';
  };

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Stock Pièces Détachées</h1>
          <p className="page-subtitle">{pieces.length} pièce(s) en stock</p>
        </div>
        <button className="btn btn-primary">
          <Plus size={18} />
          Nouvelle Pièce
        </button>
      </div>

      {/* Alertes stock */}
      {alertesCount > 0 && (
        <div className="card mb-6" style={{
          padding: 'var(--space-4)',
          background: 'rgba(220, 38, 38, 0.1)',
          border: '2px solid var(--red-500)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
            <AlertTriangle size={24} style={{ color: 'var(--red-600)' }} />
            <div>
              <div style={{ fontWeight: 600, color: 'var(--red-700)', marginBottom: '4px' }}>
                {alertesCount} pièce(s) en stock critique
              </div>
              <div style={{ fontSize: '0.875rem', color: 'var(--red-600)' }}>
                Certaines pièces sont en dessous du seuil minimum. Pensez à réapprovisionner.
              </div>
            </div>
            <button
              className={`btn ${showAlertes ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setShowAlertes(!showAlertes)}
              style={{ marginLeft: 'auto' }}
            >
              {showAlertes ? 'Voir tout le stock' : 'Voir les alertes'}
            </button>
          </div>
        </div>
      )}

      {/* Barre de recherche */}
      <div className="card mb-6" style={{ padding: 'var(--space-4)' }}>
        <div style={{ position: 'relative' }}>
          <Search size={18} style={{
            position: 'absolute',
            left: '12px',
            top: '50%',
            transform: 'translateY(-50%)',
            color: 'var(--neutral-400)'
          }} />
          <input
            type="text"
            placeholder="Rechercher par référence, désignation, marque..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              width: '100%',
              padding: 'var(--space-3) var(--space-4) var(--space-3) 40px',
              border: '1px solid var(--neutral-300)',
              borderRadius: 'var(--radius-md)',
              fontSize: '0.875rem'
            }}
          />
        </div>
      </div>

      {/* Table des pièces */}
      {loading ? (
        <div className="card" style={{ padding: 'var(--space-8)', textAlign: 'center' }}>
          Chargement...
        </div>
      ) : (
        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>Référence</th>
                <th>Désignation</th>
                <th>Marque</th>
                <th>Emplacement</th>
                <th>Stock</th>
                <th>Prix Achat</th>
                <th>Prix Vente</th>
                <th>Fournisseur</th>
              </tr>
            </thead>
            <tbody>
              {pieces.map((piece) => {
                const stockStatus = getStockStatus(piece);
                return (
                  <tr key={piece._id}>
                    <td style={{ fontWeight: 600, color: 'var(--primary-600)' }}>
                      {piece.reference}
                    </td>
                    <td>
                      <div style={{ fontWeight: 500 }}>{piece.designation}</div>
                      {piece.modelesCompatibles?.length > 0 && (
                        <div style={{ fontSize: '0.75rem', color: 'var(--neutral-500)' }}>
                          Compatible: {piece.modelesCompatibles.slice(0, 2).join(', ')}
                          {piece.modelesCompatibles.length > 2 && '...'}
                        </div>
                      )}
                    </td>
                    <td>{piece.marque || '-'}</td>
                    <td>
                      <span style={{
                        padding: '4px 8px',
                        background: 'var(--neutral-100)',
                        borderRadius: 'var(--radius-sm)',
                        fontSize: '0.75rem',
                        fontWeight: 600,
                        fontFamily: 'monospace'
                      }}>
                        {piece.emplacement || 'N/A'}
                      </span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                        <span className={`badge badge-${stockStatus}`}>
                          {piece.quantiteStock}
                        </span>
                        <span style={{ fontSize: '0.75rem', color: 'var(--neutral-500)' }}>
                          / min. {piece.quantiteMinimum}
                        </span>
                        {stockStatus === 'warning' && (
                          <AlertTriangle size={16} style={{ color: 'var(--yellow-600)' }} />
                        )}
                        {stockStatus === 'danger' && (
                          <AlertTriangle size={16} style={{ color: 'var(--red-600)' }} />
                        )}
                      </div>
                    </td>
                    <td style={{ fontSize: '0.875rem' }}>
                      {piece.prixAchat.toFixed(2)}€
                    </td>
                    <td style={{ fontSize: '0.875rem', fontWeight: 600 }}>
                      {piece.prixVente.toFixed(2)}€
                    </td>
                    <td style={{ fontSize: '0.875rem' }}>
                      {piece.fournisseur || '-'}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Stats rapides */}
      <div className="grid grid-3" style={{ marginTop: 'var(--space-12)' }}>
        <div className="metric-card">
          <div className="metric-icon" style={{ background: 'var(--gradient-primary)' }}>
            <Package size={28} />
          </div>
          <div className="metric-content">
            <div className="metric-label">Total Pièces</div>
            <div className="metric-value" style={{ fontSize: '2rem' }}>{pieces.length}</div>
          </div>
        </div>
        <div className="metric-card">
          <div className="metric-icon" style={{ background: 'linear-gradient(135deg, #DC2626 0%, #B91C1C 100%)' }}>
            <AlertTriangle size={28} />
          </div>
          <div className="metric-content">
            <div className="metric-label">Stock Critique</div>
            <div className="metric-value" style={{ fontSize: '2rem', color: 'var(--red-600)' }}>
              {alertesCount}
            </div>
          </div>
        </div>
        <div className="metric-card">
          <div className="metric-icon" style={{ background: 'linear-gradient(135deg, #059669 0%, #047857 100%)' }}>
            <Package size={28} />
          </div>
          <div className="metric-content">
            <div className="metric-label">Valeur Stock</div>
            <div className="metric-value" style={{ fontSize: '2rem' }}>
              {pieces.reduce((sum, p) => sum + (p.quantiteStock * p.prixAchat), 0).toFixed(0)}€
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Stock;
