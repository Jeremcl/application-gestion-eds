import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Search, ShoppingBag, Eye, EyeOff, Edit, AlertTriangle, Globe, Filter, Package } from 'lucide-react';
import { produits as produitsAPI } from '../services/api';
import ProduitModal from '../components/ProduitModal';
import ResponsiveTable from '../components/ResponsiveTable';

const CATEGORIES = ['Téléphones', 'Tablettes', 'Ordinateurs', 'Électroménager', 'TV/Écrans', 'Consoles', 'Accessoires', 'Autre'];
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

const Boutique = () => {
  const navigate = useNavigate();
  const [produits, setProduits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategorie, setFilterCategorie] = useState('');
  const [filterEtat, setFilterEtat] = useState('');
  const [filterVisibilite, setFilterVisibilite] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [showModal, setShowModal] = useState(false);
  const [editingProduit, setEditingProduit] = useState(null);
  const [togglingId, setTogglingId] = useState(null);
  const [alertesCount, setAlertesCount] = useState(0);

  useEffect(() => {
    loadProduits();
  }, [searchTerm, filterCategorie, filterEtat, filterVisibilite, currentPage]);

  const loadProduits = async () => {
    setLoading(true);
    try {
      const params = {
        page: currentPage,
        limit: 20,
        search: searchTerm,
        categorie: filterCategorie,
        etat: filterEtat,
        disponibleSurSite: filterVisibilite
      };
      const { data } = await produitsAPI.getAll(params);
      setProduits(data.produits || []);
      setTotalPages(data.totalPages || 1);
      setTotal(data.total || 0);

      const { data: alertes } = await produitsAPI.getAlertesStock();
      setAlertesCount(alertes.count || 0);
    } catch (error) {
      console.error('Erreur chargement produits:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleVisibilite = async (produit, e) => {
    e.stopPropagation();
    setTogglingId(produit._id);
    try {
      await produitsAPI.toggleVisibilite(produit._id);
      setProduits(prev => prev.map(p =>
        p._id === produit._id ? { ...p, disponibleSurSite: !p.disponibleSurSite } : p
      ));
    } catch (error) {
      console.error('Erreur toggle visibilité:', error);
    } finally {
      setTogglingId(null);
    }
  };

  const handleEdit = (produit, e) => {
    e.stopPropagation();
    setEditingProduit(produit);
    setShowModal(true);
  };

  const handleNew = () => {
    setEditingProduit(null);
    setShowModal(true);
  };

  const handleSave = () => {
    setShowModal(false);
    setEditingProduit(null);
    loadProduits();
  };

  const handleRowClick = (produitId) => {
    navigate(`/boutique/${produitId}`);
  };

  const getStockStatus = (produit) => {
    if (produit.stockDisponible === 0) return 'danger';
    if (produit.stockDisponible < produit.stockMinimum) return 'warning';
    return 'success';
  };

  const resetFilters = () => {
    setSearchTerm('');
    setFilterCategorie('');
    setFilterEtat('');
    setFilterVisibilite('');
    setCurrentPage(1);
  };

  const hasActiveFilters = searchTerm || filterCategorie || filterEtat || filterVisibilite;

  const columns = [
    {
      key: 'nom',
      label: 'Produit',
      render: (produit) => (
        <div>
          <div style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--neutral-900)' }}>{produit.nom}</div>
          {produit.sku && (
            <div style={{ fontSize: '0.75rem', color: 'var(--neutral-500)', marginTop: '2px' }}>
              SKU : {produit.sku}
            </div>
          )}
        </div>
      )
    },
    {
      key: 'categorie',
      label: 'Catégorie',
      render: (produit) => (
        <span style={{
          padding: '3px 10px',
          borderRadius: 'var(--radius-full)',
          background: 'var(--neutral-100)',
          fontSize: '0.8rem',
          fontWeight: 500,
          color: 'var(--neutral-700)'
        }}>
          {produit.categorie}
        </span>
      )
    },
    {
      key: 'etat',
      label: 'État',
      render: (produit) => {
        const colors = ETATS_COLORS[produit.etat] || { bg: '#f3f4f6', color: '#374151' };
        return (
          <span style={{
            padding: '3px 10px',
            borderRadius: 'var(--radius-full)',
            background: colors.bg,
            color: colors.color,
            fontSize: '0.8rem',
            fontWeight: 500
          }}>
            {ETATS_LABELS[produit.etat] || produit.etat}
          </span>
        );
      }
    },
    {
      key: 'prixVente',
      label: 'Prix vente',
      render: (produit) => (
        <span style={{ fontWeight: 600, color: 'var(--primary-700)' }}>
          {produit.prixVente.toFixed(2)} €
        </span>
      )
    },
    {
      key: 'stock',
      label: 'Stock',
      render: (produit) => {
        const status = getStockStatus(produit);
        return (
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
            <span style={{
              fontWeight: 600,
              color: status === 'danger' ? 'var(--red-600)' : status === 'warning' ? 'var(--yellow-600)' : 'var(--neutral-800)'
            }}>
              {produit.stockDisponible}
            </span>
            {status !== 'success' && (
              <AlertTriangle
                size={14}
                color={status === 'danger' ? 'var(--red-500)' : 'var(--yellow-500)'}
              />
            )}
          </div>
        );
      }
    },
    {
      key: 'disponibleSurSite',
      label: 'Site web',
      render: (produit) => (
        <button
          onClick={(e) => handleToggleVisibilite(produit, e)}
          disabled={togglingId === produit._id}
          title={produit.disponibleSurSite ? 'Retirer du site' : 'Publier sur le site'}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '5px 12px',
            borderRadius: 'var(--radius-full)',
            border: 'none',
            cursor: togglingId === produit._id ? 'wait' : 'pointer',
            fontWeight: 600,
            fontSize: '0.78rem',
            transition: 'all 0.15s ease',
            background: produit.disponibleSurSite ? 'var(--primary-100)' : 'var(--neutral-100)',
            color: produit.disponibleSurSite ? 'var(--primary-700)' : 'var(--neutral-500)',
            opacity: togglingId === produit._id ? 0.6 : 1
          }}
        >
          {produit.disponibleSurSite
            ? <><Globe size={13} /> Publié</>
            : <><EyeOff size={13} /> Masqué</>
          }
        </button>
      )
    },
    {
      key: 'actions',
      label: '',
      render: (produit) => (
        <div style={{ display: 'flex', gap: 'var(--space-2)' }} onClick={(e) => e.stopPropagation()}>
          <button
            onClick={(e) => handleEdit(produit, e)}
            className="btn btn-secondary"
            style={{ padding: '6px 10px' }}
            title="Modifier"
          >
            <Edit size={14} />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); handleRowClick(produit._id); }}
            className="btn btn-secondary"
            style={{ padding: '6px 10px' }}
            title="Voir le détail"
          >
            <Eye size={14} />
          </button>
        </div>
      )
    }
  ];

  return (
    <div className="animate-fade-in">
      {/* En-tête */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Boutique</h1>
          <p className="page-subtitle">
            {total} produit{total > 1 ? 's' : ''}
            {alertesCount > 0 && (
              <span style={{ marginLeft: 'var(--space-3)', color: 'var(--yellow-600)', fontWeight: 600 }}>
                · {alertesCount} stock{alertesCount > 1 ? 's' : ''} faible{alertesCount > 1 ? 's' : ''}
              </span>
            )}
          </p>
        </div>
        <button className="btn btn-primary" onClick={handleNew}>
          <Plus size={18} />
          Nouveau produit
        </button>
      </div>

      {/* Bannière alerte stock */}
      {alertesCount > 0 && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 'var(--space-3)',
          padding: 'var(--space-3) var(--space-4)',
          marginBottom: 'var(--space-4)',
          background: '#fffbeb',
          border: '1px solid #fde68a',
          borderRadius: 'var(--radius-lg)',
          fontSize: '0.875rem',
          color: 'var(--yellow-600)',
          fontWeight: 500
        }}>
          <AlertTriangle size={16} />
          {alertesCount} produit{alertesCount > 1 ? 's ont' : ' a'} un stock sous le seuil d'alerte
          <button
            onClick={() => { setFilterVisibilite(''); }}
            style={{ marginLeft: 'auto', fontSize: '0.8rem', color: 'var(--yellow-700)', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600 }}
          >
            Voir tous
          </button>
        </div>
      )}

      {/* Filtres */}
      <div className="card" style={{ marginBottom: 'var(--space-4)' }}>
        <div style={{ display: 'flex', gap: 'var(--space-3)', flexWrap: 'wrap', alignItems: 'center' }}>
          {/* Recherche */}
          <div style={{ position: 'relative', flex: '1', minWidth: '200px' }}>
            <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--neutral-400)' }} />
            <input
              type="text"
              className="form-input"
              placeholder="Rechercher par nom, SKU..."
              value={searchTerm}
              onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
              style={{ paddingLeft: '38px' }}
            />
          </div>

          {/* Filtre catégorie */}
          <select
            className="form-input"
            value={filterCategorie}
            onChange={(e) => { setFilterCategorie(e.target.value); setCurrentPage(1); }}
            style={{ width: 'auto', minWidth: '160px' }}
          >
            <option value="">Toutes catégories</option>
            {CATEGORIES.map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>

          {/* Filtre état */}
          <select
            className="form-input"
            value={filterEtat}
            onChange={(e) => { setFilterEtat(e.target.value); setCurrentPage(1); }}
            style={{ width: 'auto', minWidth: '140px' }}
          >
            <option value="">Tous les états</option>
            <option value="neuf">Neuf</option>
            <option value="reconditionné">Reconditionné</option>
            <option value="piece_detachee">Pièce détachée</option>
          </select>

          {/* Filtre visibilité */}
          <select
            className="form-input"
            value={filterVisibilite}
            onChange={(e) => { setFilterVisibilite(e.target.value); setCurrentPage(1); }}
            style={{ width: 'auto', minWidth: '160px' }}
          >
            <option value="">Toute visibilité</option>
            <option value="true">Publiés sur le site</option>
            <option value="false">Masqués du site</option>
          </select>

          {hasActiveFilters && (
            <button className="btn btn-secondary" onClick={resetFilters} style={{ whiteSpace: 'nowrap' }}>
              <Filter size={14} />
              Réinitialiser
            </button>
          )}
        </div>
      </div>

      {/* Table */}
      {loading ? (
        <div className="card" style={{ textAlign: 'center', padding: 'var(--space-16)', color: 'var(--neutral-500)' }}>
          Chargement...
        </div>
      ) : produits.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: 'var(--space-16)' }}>
          <Package size={40} style={{ color: 'var(--neutral-300)', margin: '0 auto var(--space-4)' }} />
          <div style={{ color: 'var(--neutral-600)', fontWeight: 500, marginBottom: 'var(--space-2)' }}>
            {hasActiveFilters ? 'Aucun produit ne correspond aux filtres' : 'Aucun produit pour l\'instant'}
          </div>
          {!hasActiveFilters && (
            <button className="btn btn-primary" onClick={handleNew} style={{ marginTop: 'var(--space-3)' }}>
              <Plus size={16} /> Ajouter le premier produit
            </button>
          )}
        </div>
      ) : (
        <ResponsiveTable
          columns={columns}
          data={produits}
          onRowClick={(produit) => handleRowClick(produit._id)}
        />
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div style={{ display: 'flex', justifyContent: 'center', gap: 'var(--space-2)', marginTop: 'var(--space-4)' }}>
          <button
            className="btn btn-secondary"
            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
            disabled={currentPage === 1}
          >
            Précédent
          </button>
          <span style={{ padding: '8px 16px', color: 'var(--neutral-600)', fontSize: '0.875rem' }}>
            Page {currentPage} / {totalPages}
          </span>
          <button
            className="btn btn-secondary"
            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
          >
            Suivant
          </button>
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <ProduitModal
          produit={editingProduit}
          onClose={() => { setShowModal(false); setEditingProduit(null); }}
          onSave={handleSave}
        />
      )}
    </div>
  );
};

export default Boutique;
