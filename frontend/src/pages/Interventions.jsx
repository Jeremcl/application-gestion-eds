import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, List, LayoutGrid, Edit, Trash2, Eye } from 'lucide-react';
import { interventions as interventionsAPI } from '../services/api';
import InterventionModal from '../components/InterventionModal';
import ResponsiveTable from '../components/ResponsiveTable';

const Interventions = () => {
  const navigate = useNavigate();
  const [interventions, setInterventions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState('list'); // 'list' ou 'kanban'
  const [filterStatut, setFilterStatut] = useState('');
  const [showInterventionModal, setShowInterventionModal] = useState(false);
  const [editingIntervention, setEditingIntervention] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalInterventions, setTotalInterventions] = useState(0);

  const statuts = ['Demande', 'Planifié', 'En cours', 'Diagnostic', 'Réparation', 'Terminé', 'Facturé'];

  const statutColors = {
    'Demande': 'neutral',
    'Planifié': 'info',
    'En cours': 'warning',
    'Diagnostic': 'info',
    'Réparation': 'warning',
    'Terminé': 'success',
    'Facturé': 'success'
  };

  useEffect(() => {
    loadInterventions();
  }, [filterStatut, currentPage]);

  const loadInterventions = async () => {
    setLoading(true);
    try {
      const params = { page: currentPage, limit: 30 };
      if (filterStatut) params.statut = filterStatut;

      const { data } = await interventionsAPI.getAll(params);
      setInterventions(data.interventions);
      setTotalPages(data.totalPages || 1);
      setTotalInterventions(data.total || 0);
    } catch (error) {
      console.error('Erreur chargement interventions:', error);
    } finally {
      setLoading(false);
    }
  };

  const getInterventionsByStatut = (statut) => {
    return interventions.filter(int => int.statut === statut);
  };

  const handleEdit = (intervention, e) => {
    if (e) e.stopPropagation();
    setEditingIntervention(intervention);
    setShowInterventionModal(true);
  };

  const handleDelete = async (interventionId, e) => {
    if (e) e.stopPropagation();
    if (window.confirm('Êtes-vous sûr de vouloir supprimer cette intervention ?')) {
      try {
        await interventionsAPI.delete(interventionId);
        loadInterventions();
      } catch (error) {
        console.error('Erreur suppression intervention:', error);
        alert('Erreur lors de la suppression');
      }
    }
  };

  const handleView = (interventionId, e) => {
    if (e) e.stopPropagation();
    navigate(`/interventions/${interventionId}`);
  };

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Interventions</h1>
          <p className="page-subtitle">{totalInterventions} intervention(s) {totalPages > 1 && `- Page ${currentPage}/${totalPages}`}</p>
        </div>
        <div style={{ display: 'flex', gap: 'var(--space-3)' }}>
          <div style={{ display: 'flex', gap: '4px', background: 'white', borderRadius: 'var(--radius-md)', padding: '4px' }}>
            <button
              className={`btn ${viewMode === 'list' ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setViewMode('list')}
              style={{ padding: 'var(--space-2)' }}
            >
              <List size={18} />
            </button>
            <button
              className={`btn ${viewMode === 'kanban' ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setViewMode('kanban')}
              style={{ padding: 'var(--space-2)' }}
            >
              <LayoutGrid size={18} />
            </button>
          </div>
          <button className="btn btn-primary" onClick={() => setShowInterventionModal(true)}>
            <Plus size={18} />
            Nouvelle Intervention
          </button>
        </div>
      </div>

      {/* Filtres */}
      <div className="card mb-6" style={{ padding: 'var(--space-4)' }}>
        <div className="filters-scroll">
          <button
            className={`btn ${!filterStatut ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => { setFilterStatut(''); setCurrentPage(1); }}
          >
            Tous
          </button>
          {statuts.map(statut => (
            <button
              key={statut}
              className={`btn ${filterStatut === statut ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => { setFilterStatut(statut); setCurrentPage(1); }}
            >
              {statut}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="card" style={{ padding: 'var(--space-8)', textAlign: 'center' }}>
          Chargement...
        </div>
      ) : (
        <>
          {/* Vue Liste */}
          {viewMode === 'list' && (
            <ResponsiveTable
              data={interventions}
              onRowClick={(int) => handleView(int._id)}
              columns={[
                {
                  header: 'Numéro',
                  render: (int) => (
                    <span style={{ fontWeight: 600, color: 'var(--primary-600)' }}>
                      {int.numero}
                    </span>
                  )
                },
                {
                  header: 'Client',
                  render: (int) => `${int.clientId?.nom || ''} ${int.clientId?.prenom || ''}`
                },
                {
                  header: 'Appareil',
                  render: (int) => (
                    <div style={{ fontSize: '0.875rem' }}>
                      <div style={{ fontWeight: 600 }}>{int.appareil?.type}</div>
                      <div style={{ color: 'var(--neutral-500)' }}>
                        {int.appareil?.marque} {int.appareil?.modele}
                      </div>
                    </div>
                  )
                },
                {
                  header: 'Description',
                  cellStyle: { maxWidth: '200px', fontSize: '0.875rem' },
                  render: (int) => `${int.description?.substring(0, 60) || ''}...`
                },
                {
                  header: 'Statut',
                  render: (int) => (
                    <span className={`badge badge-${statutColors[int.statut]}`}>
                      {int.statut}
                    </span>
                  )
                },
                {
                  header: 'Technicien',
                  cellStyle: { fontSize: '0.875rem' },
                  render: (int) => int.technicien || '-'
                },
                {
                  header: 'Date',
                  cellStyle: { fontSize: '0.875rem' },
                  render: (int) => new Date(int.dateCreation).toLocaleDateString('fr-FR')
                },
                {
                  header: 'Actions',
                  headerStyle: { width: '150px', textAlign: 'center' },
                  render: (int) => (
                    <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                      <button className="btn-icon" onClick={(e) => handleView(int._id, e)} title="Voir">
                        <Eye size={16} />
                      </button>
                      <button className="btn-icon" onClick={(e) => handleEdit(int, e)} title="Modifier">
                        <Edit size={16} />
                      </button>
                      <button
                        className="btn-icon"
                        onClick={(e) => handleDelete(int._id, e)}
                        style={{ color: 'var(--red-500)' }}
                        title="Supprimer"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  )
                }
              ]}
              mobileCardConfig={{
                title: (int) => int.numero,
                subtitle: (int) => `${int.clientId?.nom || ''} ${int.clientId?.prenom || ''}`,
                badge: (int) => (
                  <span className={`badge badge-${statutColors[int.statut]}`}>
                    {int.statut}
                  </span>
                ),
                fields: [
                  {
                    label: 'Appareil',
                    render: (int) => `${int.appareil?.type || ''} ${int.appareil?.marque || ''}`
                  },
                  {
                    label: 'Technicien',
                    render: (int) => int.technicien || '-'
                  },
                  {
                    label: 'Date',
                    render: (int) => new Date(int.dateCreation).toLocaleDateString('fr-FR')
                  }
                ],
                actions: (int) => (
                  <>
                    <button className="btn-icon" onClick={(e) => handleView(int._id, e)} title="Voir">
                      <Eye size={16} />
                    </button>
                    <button className="btn-icon" onClick={(e) => handleEdit(int, e)} title="Modifier">
                      <Edit size={16} />
                    </button>
                    <button
                      className="btn-icon"
                      onClick={(e) => handleDelete(int._id, e)}
                      style={{ color: 'var(--red-500)' }}
                      title="Supprimer"
                    >
                      <Trash2 size={16} />
                    </button>
                  </>
                )
              }}
              emptyMessage="Aucune intervention trouvée"
            />
          )}

          {/* Vue Kanban */}
          {viewMode === 'kanban' && (
            <div className="kanban-container" style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(min(280px, 100%), 1fr))',
              gap: 'var(--space-4)',
              overflowX: 'auto'
            }}>
              {statuts.map(statut => {
                const statutInterventions = getInterventionsByStatut(statut);
                return (
                  <div key={statut} className="card kanban-column" style={{ minHeight: '400px' }}>
                    <div style={{
                      marginBottom: 'var(--space-4)',
                      paddingBottom: 'var(--space-3)',
                      borderBottom: '2px solid var(--primary-500)',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center'
                    }}>
                      <h3 style={{ fontSize: '1rem', fontWeight: 600 }}>
                        {statut}
                      </h3>
                      <span className={`badge badge-${statutColors[statut]}`}>
                        {statutInterventions.length}
                      </span>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
                      {statutInterventions.map(int => (
                        <div
                          key={int._id}
                          className="card"
                          style={{
                            padding: 'var(--space-4)',
                            background: 'white',
                            cursor: 'pointer',
                            transition: 'all var(--transition-fast)'
                          }}
                        >
                          <div style={{
                            fontWeight: 600,
                            color: 'var(--primary-600)',
                            fontSize: '0.875rem',
                            marginBottom: 'var(--space-2)'
                          }}>
                            {int.numero}
                          </div>
                          <div style={{ fontSize: '0.875rem', marginBottom: 'var(--space-2)' }}>
                            <strong>{int.clientId?.nom} {int.clientId?.prenom}</strong>
                          </div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--neutral-600)' }}>
                            {int.appareil.type} {int.appareil.marque}
                          </div>
                          <div style={{
                            fontSize: '0.75rem',
                            color: 'var(--neutral-500)',
                            marginTop: 'var(--space-2)',
                            paddingTop: 'var(--space-2)',
                            borderTop: '1px solid var(--neutral-200)'
                          }}>
                            {int.technicien || 'Non assigné'}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      {/* Pagination */}
      {!loading && totalPages > 1 && (
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          gap: 'var(--space-3)',
          marginTop: 'var(--space-6)',
          padding: 'var(--space-4)'
        }}>
          <button
            className="btn btn-secondary"
            onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
            disabled={currentPage === 1}
            style={{ opacity: currentPage === 1 ? 0.5 : 1 }}
          >
            ← Précédent
          </button>

          <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
            {[...Array(totalPages)].map((_, index) => {
              const pageNum = index + 1;
              // Afficher seulement quelques pages autour de la page actuelle
              if (
                pageNum === 1 ||
                pageNum === totalPages ||
                (pageNum >= currentPage - 2 && pageNum <= currentPage + 2)
              ) {
                return (
                  <button
                    key={pageNum}
                    className={`btn ${currentPage === pageNum ? 'btn-primary' : 'btn-secondary'}`}
                    onClick={() => setCurrentPage(pageNum)}
                    style={{ minWidth: '40px' }}
                  >
                    {pageNum}
                  </button>
                );
              } else if (
                pageNum === currentPage - 3 ||
                pageNum === currentPage + 3
              ) {
                return <span key={pageNum} style={{ padding: '0 var(--space-2)' }}>...</span>;
              }
              return null;
            })}
          </div>

          <button
            className="btn btn-secondary"
            onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
            disabled={currentPage === totalPages}
            style={{ opacity: currentPage === totalPages ? 0.5 : 1 }}
          >
            Suivant →
          </button>
        </div>
      )}

      {/* Intervention Modal */}
      <InterventionModal
        show={showInterventionModal}
        onClose={() => setShowInterventionModal(false)}
        onSuccess={() => {
          loadInterventions();
          setShowInterventionModal(false);
        }}
      />
    </div>
  );
};

export default Interventions;
