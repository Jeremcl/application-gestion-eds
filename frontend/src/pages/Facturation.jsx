import { useState, useEffect } from 'react';
import { Plus, FileText } from 'lucide-react';
import { factures as facturesAPI } from '../services/api';
import ResponsiveTable from '../components/ResponsiveTable';

const Facturation = () => {
  const [factures, setFactures] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadFactures();
  }, []);

  const loadFactures = async () => {
    setLoading(true);
    try {
      const { data } = await facturesAPI.getAll();
      setFactures(data.factures);
    } catch (error) {
      console.error('Erreur chargement factures:', error);
    } finally {
      setLoading(false);
    }
  };

  const statutColors = {
    'Brouillon': 'neutral',
    'Émis': 'info',
    'Payé': 'success'
  };

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Facturation</h1>
          <p className="page-subtitle">{factures.length} facture(s)</p>
        </div>
        <button className="btn btn-primary">
          <Plus size={18} />
          Nouvelle Facture
        </button>
      </div>

      <ResponsiveTable
        loading={loading}
        data={factures}
        columns={[
          {
            header: 'Numéro',
            render: (f) => (
              <span style={{ fontWeight: 600, color: 'var(--primary-600)' }}>{f.numero}</span>
            )
          },
          {
            header: 'Type',
            render: (f) => (
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                <FileText size={16} style={{ color: 'var(--neutral-500)' }} />
                {f.type}
              </div>
            )
          },
          {
            header: 'Client',
            render: (f) => `${f.clientId?.nom || ''} ${f.clientId?.prenom || ''}`
          },
          {
            header: 'Date Émission',
            cellStyle: { fontSize: '0.875rem' },
            render: (f) => new Date(f.dateEmission).toLocaleDateString('fr-FR')
          },
          {
            header: 'Date Échéance',
            cellStyle: { fontSize: '0.875rem' },
            render: (f) => f.dateEcheance ? new Date(f.dateEcheance).toLocaleDateString('fr-FR') : '-'
          },
          {
            header: 'Montant TTC',
            render: (f) => <span style={{ fontWeight: 600 }}>{f.totalTTC.toFixed(2)}€</span>
          },
          {
            header: 'Statut',
            render: (f) => (
              <span className={`badge badge-${statutColors[f.statut]}`}>{f.statut}</span>
            )
          }
        ]}
        mobileCardConfig={{
          title: (f) => f.numero,
          subtitle: (f) => `${f.clientId?.nom || ''} ${f.clientId?.prenom || ''}`,
          badge: (f) => (
            <span className={`badge badge-${statutColors[f.statut]}`}>{f.statut}</span>
          ),
          fields: [
            {
              label: 'Type',
              render: (f) => f.type
            },
            {
              label: 'Émission',
              render: (f) => new Date(f.dateEmission).toLocaleDateString('fr-FR')
            },
            {
              label: 'Échéance',
              render: (f) => f.dateEcheance ? new Date(f.dateEcheance).toLocaleDateString('fr-FR') : '-'
            },
            {
              label: 'Montant TTC',
              render: (f) => `${f.totalTTC.toFixed(2)}€`
            }
          ]
        }}
        emptyMessage="Aucune facture trouvée"
      />

      {/* Stats rapides */}
      <div className="grid grid-3" style={{ marginTop: 'var(--space-12)' }}>
        <div className="card">
          <div style={{ fontSize: '0.875rem', color: 'var(--neutral-600)', marginBottom: 'var(--space-2)' }}>
            Total Factures
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 700, color: 'var(--primary-700)' }}>
            {factures.length}
          </div>
        </div>
        <div className="card">
          <div style={{ fontSize: '0.875rem', color: 'var(--neutral-600)', marginBottom: 'var(--space-2)' }}>
            Factures Payées
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 700, color: 'var(--emerald-600)' }}>
            {factures.filter(f => f.statut === 'Payé').length}
          </div>
        </div>
        <div className="card">
          <div style={{ fontSize: '0.875rem', color: 'var(--neutral-600)', marginBottom: 'var(--space-2)' }}>
            Montant Total
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 700, color: 'var(--primary-700)' }}>
            {factures.reduce((sum, f) => sum + f.totalTTC, 0).toFixed(2)}€
          </div>
        </div>
      </div>
    </div>
  );
};

export default Facturation;
