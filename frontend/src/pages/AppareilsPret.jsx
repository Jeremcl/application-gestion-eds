import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { MonitorSmartphone, Plus, Search, Euro } from 'lucide-react';
import { appareilsPret as appareilsPretAPI } from '../services/api';
import AppareilPretCard from '../components/AppareilPretCard';
import AppareilPretModal from '../components/AppareilPretModal';

const AppareilsPret = () => {
  const navigate = useNavigate();
  const [appareils, setAppareils] = useState([]);
  const [stats, setStats] = useState({ total: 0, disponibles: 0, pretes: 0, enMaintenance: 0, valeurTotale: 0 });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterStatut, setFilterStatut] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingAppareil, setEditingAppareil] = useState(null);

  useEffect(() => {
    loadAppareils();
    loadStats();
  }, [search, filterStatut]);

  const loadAppareils = async () => {
    setLoading(true);
    try {
      const { data } = await appareilsPretAPI.getAll({ search, statut: filterStatut });
      setAppareils(data.appareils);
    } catch (error) {
      console.error('Erreur chargement appareils:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const { data } = await appareilsPretAPI.getStats();
      setStats(data);
    } catch (error) {
      console.error('Erreur chargement stats:', error);
    }
  };

  const handleEdit = (appareil) => {
    setEditingAppareil(appareil);
    setShowModal(true);
  };

  const handleDelete = async (appareil) => {
    if (window.confirm(`Êtes-vous sûr de vouloir supprimer "${appareil.type} - ${appareil.marque}" ?`)) {
      try {
        await appareilsPretAPI.delete(appareil._id);
        loadAppareils();
        loadStats();
      } catch (error) {
        console.error('Erreur suppression appareil:', error);
        alert(error.message || 'Erreur lors de la suppression');
      }
    }
  };

  const handleView = (appareil) => {
    navigate(`/appareils-pret/${appareil._id}`);
  };

  const handleModalClose = () => {
    setShowModal(false);
    setEditingAppareil(null);
  };

  const handleModalSuccess = () => {
    loadAppareils();
    loadStats();
  };

  return (
    <div>
      {/* Header */}
      <div className="page-header" style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start'
      }}>
        <div>
          <h1 className="page-title">Appareils de prêt</h1>
          <p className="page-subtitle">Gestion du parc d'appareils de prêt</p>
        </div>
        <button
          className="btn btn-primary"
          onClick={() => {
            setEditingAppareil(null);
            setShowModal(true);
          }}
        >
          <Plus size={18} />
          Nouvel appareil
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-4 mb-6">
        <div className="metric-card">
          <div className="metric-icon">
            <MonitorSmartphone size={32} />
          </div>
          <div className="metric-content">
            <div className="metric-label">Total</div>
            <div className="metric-value">{stats.total}</div>
          </div>
        </div>

        <div className="metric-card" style={{ borderColor: 'var(--emerald-500)' }}>
          <div className="metric-icon" style={{ background: 'linear-gradient(135deg, #059669, #047857)' }}>
            <MonitorSmartphone size={32} />
          </div>
          <div className="metric-content">
            <div className="metric-label">Disponibles</div>
            <div className="metric-value" style={{ color: 'var(--emerald-600)' }}>{stats.disponibles}</div>
          </div>
        </div>

        <div className="metric-card" style={{ borderColor: 'var(--yellow-500)' }}>
          <div className="metric-icon" style={{ background: 'linear-gradient(135deg, #D97706, #B45309)' }}>
            <MonitorSmartphone size={32} />
          </div>
          <div className="metric-content">
            <div className="metric-label">Prêtés</div>
            <div className="metric-value" style={{ color: 'var(--yellow-600)' }}>{stats.pretes}</div>
          </div>
        </div>

        <div className="metric-card" style={{ borderColor: 'var(--primary-500)' }}>
          <div className="metric-icon">
            <Euro size={32} />
          </div>
          <div className="metric-content">
            <div className="metric-label">Valeur totale</div>
            <div className="metric-value" style={{ fontSize: '1.75rem' }}>{stats.valeurTotale}€</div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div style={{
        display: 'flex',
        gap: 'var(--space-4)',
        marginBottom: 'var(--space-6)',
        flexWrap: 'wrap'
      }}>
        {/* Search */}
        <div style={{ flex: '1', minWidth: '200px', position: 'relative' }}>
          <Search
            size={18}
            style={{
              position: 'absolute',
              left: '12px',
              top: '50%',
              transform: 'translateY(-50%)',
              color: 'var(--neutral-400)'
            }}
          />
          <input
            type="text"
            className="form-input"
            placeholder="Rechercher un appareil..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ paddingLeft: '40px' }}
          />
        </div>

        {/* Status filters */}
        <div className="filters-scroll">
          <button
            className={`btn ${filterStatut === '' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setFilterStatut('')}
          >
            Tous ({stats.total})
          </button>
          <button
            className={`btn ${filterStatut === 'Disponible' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setFilterStatut('Disponible')}
          >
            Disponibles ({stats.disponibles})
          </button>
          <button
            className={`btn ${filterStatut === 'Prêté' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setFilterStatut('Prêté')}
          >
            Prêtés ({stats.pretes})
          </button>
          <button
            className={`btn ${filterStatut === 'En maintenance' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setFilterStatut('En maintenance')}
          >
            Maintenance ({stats.enMaintenance})
          </button>
        </div>
      </div>

      {/* Appareils Grid */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: 'var(--space-8)' }}>
          <p>Chargement...</p>
        </div>
      ) : appareils.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: 'var(--space-8)' }}>
          <MonitorSmartphone size={48} style={{ color: 'var(--neutral-400)', marginBottom: 'var(--space-4)' }} />
          <p style={{ color: 'var(--neutral-600)' }}>
            {search || filterStatut ? 'Aucun appareil trouvé' : 'Aucun appareil de prêt enregistré'}
          </p>
        </div>
      ) : (
        <div className="grid grid-3">
          {appareils.map(appareil => (
            <AppareilPretCard
              key={appareil._id}
              appareil={appareil}
              onView={handleView}
              onEdit={handleEdit}
              onDelete={handleDelete}
              onClick={() => handleView(appareil)}
            />
          ))}
        </div>
      )}

      {/* Modal */}
      <AppareilPretModal
        show={showModal}
        onClose={handleModalClose}
        onSuccess={handleModalSuccess}
        editingAppareil={editingAppareil}
      />
    </div>
  );
};

export default AppareilsPret;
