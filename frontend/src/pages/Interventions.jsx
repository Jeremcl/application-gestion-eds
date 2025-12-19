import { useState, useEffect } from 'react';
import { Plus, List, LayoutGrid } from 'lucide-react';
import { interventions as interventionsAPI } from '../services/api';

const Interventions = () => {
  const [interventions, setInterventions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState('list'); // 'list' ou 'kanban'
  const [filterStatut, setFilterStatut] = useState('');

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
  }, [filterStatut]);

  const loadInterventions = async () => {
    setLoading(true);
    try {
      const params = {};
      if (filterStatut) params.statut = filterStatut;

      const { data } = await interventionsAPI.getAll(params);
      setInterventions(data.interventions);
    } catch (error) {
      console.error('Erreur chargement interventions:', error);
    } finally {
      setLoading(false);
    }
  };

  const getInterventionsByStatut = (statut) => {
    return interventions.filter(int => int.statut === statut);
  };

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Interventions</h1>
          <p className="page-subtitle">{interventions.length} intervention(s)</p>
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
          <button className="btn btn-primary">
            <Plus size={18} />
            Nouvelle Intervention
          </button>
        </div>
      </div>

      {/* Filtres */}
      <div className="card mb-6" style={{ padding: 'var(--space-4)' }}>
        <div style={{ display: 'flex', gap: 'var(--space-2)', flexWrap: 'wrap' }}>
          <button
            className={`btn ${!filterStatut ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setFilterStatut('')}
          >
            Tous
          </button>
          {statuts.map(statut => (
            <button
              key={statut}
              className={`btn ${filterStatut === statut ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setFilterStatut(statut)}
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
            <div className="table-container">
              <table className="table">
                <thead>
                  <tr>
                    <th>Numéro</th>
                    <th>Client</th>
                    <th>Appareil</th>
                    <th>Description</th>
                    <th>Statut</th>
                    <th>Technicien</th>
                    <th>Date</th>
                  </tr>
                </thead>
                <tbody>
                  {interventions.map((int) => (
                    <tr key={int._id}>
                      <td style={{ fontWeight: 600, color: 'var(--primary-600)' }}>
                        {int.numero}
                      </td>
                      <td>
                        {int.clientId?.nom} {int.clientId?.prenom}
                      </td>
                      <td>
                        <div style={{ fontSize: '0.875rem' }}>
                          <div style={{ fontWeight: 600 }}>{int.appareil.type}</div>
                          <div style={{ color: 'var(--neutral-500)' }}>
                            {int.appareil.marque} {int.appareil.modele}
                          </div>
                        </div>
                      </td>
                      <td style={{ maxWidth: '200px', fontSize: '0.875rem' }}>
                        {int.description?.substring(0, 60)}...
                      </td>
                      <td>
                        <span className={`badge badge-${statutColors[int.statut]}`}>
                          {int.statut}
                        </span>
                      </td>
                      <td style={{ fontSize: '0.875rem' }}>
                        {int.technicien || '-'}
                      </td>
                      <td style={{ fontSize: '0.875rem' }}>
                        {new Date(int.dateCreation).toLocaleDateString('fr-FR')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Vue Kanban */}
          {viewMode === 'kanban' && (
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
              gap: 'var(--space-4)',
              overflowX: 'auto'
            }}>
              {statuts.map(statut => {
                const statutInterventions = getInterventionsByStatut(statut);
                return (
                  <div key={statut} className="card" style={{ minHeight: '400px' }}>
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
    </div>
  );
};

export default Interventions;
