import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Truck, Plus, Search, Euro } from 'lucide-react';
import { vehicules as vehiculesAPI } from '../services/api';
import VehiculeCard from '../components/VehiculeCard';
import VehiculeModal from '../components/VehiculeModal';

const Vehicules = () => {
  const navigate = useNavigate();
  const [vehicules, setVehicules] = useState([]);
  const [stats, setStats] = useState({ total: 0, disponibles: 0, enUtilisation: 0, enMaintenance: 0, depensesMois: 0 });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterStatut, setFilterStatut] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingVehicule, setEditingVehicule] = useState(null);

  useEffect(() => {
    loadVehicules();
    loadStats();
  }, [search, filterStatut]);

  const loadVehicules = async () => {
    setLoading(true);
    try {
      const { data } = await vehiculesAPI.getAll({ search, statut: filterStatut });
      setVehicules(data.vehicules);
    } catch (error) {
      console.error('Erreur chargement vehicules:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const { data } = await vehiculesAPI.getStats();
      setStats(data);
    } catch (error) {
      console.error('Erreur chargement stats:', error);
    }
  };

  const handleEdit = (vehicule) => {
    setEditingVehicule(vehicule);
    setShowModal(true);
  };

  const handleDelete = async (vehicule) => {
    if (window.confirm(`Etes-vous sur de vouloir supprimer "${vehicule.nom}" ?`)) {
      try {
        await vehiculesAPI.delete(vehicule._id);
        loadVehicules();
        loadStats();
      } catch (error) {
        console.error('Erreur suppression vehicule:', error);
        alert(error.response?.data?.message || 'Erreur lors de la suppression');
      }
    }
  };

  const handleView = (vehicule) => {
    navigate(`/vehicules/${vehicule._id}`);
  };

  const handleModalClose = () => {
    setShowModal(false);
    setEditingVehicule(null);
  };

  const handleModalSuccess = () => {
    loadVehicules();
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
          <h1 className="page-title">Vehicules</h1>
          <p className="page-subtitle">Gestion du parc de vehicules</p>
        </div>
        <button
          className="btn btn-primary"
          onClick={() => {
            setEditingVehicule(null);
            setShowModal(true);
          }}
        >
          <Plus size={18} />
          Nouveau vehicule
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-4 mb-6">
        <div className="metric-card">
          <div className="metric-icon">
            <Truck size={32} />
          </div>
          <div className="metric-content">
            <div className="metric-label">Total</div>
            <div className="metric-value">{stats.total}</div>
          </div>
        </div>

        <div className="metric-card" style={{ borderColor: 'var(--emerald-500)' }}>
          <div className="metric-icon" style={{ background: 'linear-gradient(135deg, #059669, #047857)' }}>
            <Truck size={32} />
          </div>
          <div className="metric-content">
            <div className="metric-label">Disponibles</div>
            <div className="metric-value" style={{ color: 'var(--emerald-600)' }}>{stats.disponibles}</div>
          </div>
        </div>

        <div className="metric-card" style={{ borderColor: 'var(--yellow-500)' }}>
          <div className="metric-icon" style={{ background: 'linear-gradient(135deg, #D97706, #B45309)' }}>
            <Truck size={32} />
          </div>
          <div className="metric-content">
            <div className="metric-label">En utilisation</div>
            <div className="metric-value" style={{ color: 'var(--yellow-600)' }}>{stats.enUtilisation}</div>
          </div>
        </div>

        <div className="metric-card" style={{ borderColor: 'var(--primary-500)' }}>
          <div className="metric-icon">
            <Euro size={32} />
          </div>
          <div className="metric-content">
            <div className="metric-label">Depenses du mois</div>
            <div className="metric-value" style={{ fontSize: '1.75rem' }}>{stats.depensesMois}EUR</div>
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
            placeholder="Rechercher un vehicule..."
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
            className={`btn ${filterStatut === 'En utilisation' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setFilterStatut('En utilisation')}
          >
            En utilisation ({stats.enUtilisation})
          </button>
          <button
            className={`btn ${filterStatut === 'En maintenance' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setFilterStatut('En maintenance')}
          >
            Maintenance ({stats.enMaintenance})
          </button>
        </div>
      </div>

      {/* Vehicules Grid */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: 'var(--space-8)' }}>
          <p>Chargement...</p>
        </div>
      ) : vehicules.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: 'var(--space-8)' }}>
          <Truck size={48} style={{ color: 'var(--neutral-400)', marginBottom: 'var(--space-4)' }} />
          <p style={{ color: 'var(--neutral-600)' }}>
            {search || filterStatut ? 'Aucun vehicule trouve' : 'Aucun vehicule enregistre'}
          </p>
        </div>
      ) : (
        <div className="grid grid-3">
          {vehicules.map(vehicule => (
            <VehiculeCard
              key={vehicule._id}
              vehicule={vehicule}
              onView={handleView}
              onEdit={handleEdit}
              onDelete={handleDelete}
              onClick={() => handleView(vehicule)}
            />
          ))}
        </div>
      )}

      {/* Modal */}
      <VehiculeModal
        show={showModal}
        onClose={handleModalClose}
        onSuccess={handleModalSuccess}
        editingVehicule={editingVehicule}
      />
    </div>
  );
};

export default Vehicules;
