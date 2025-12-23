import { useState, useEffect } from 'react';
import { Plus, FileText } from 'lucide-react';
import { factures as facturesAPI } from '../services/api';

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

      {loading ? (
        <div className="card" style={{ padding: 'var(--space-8)', textAlign: 'center' }}>
          Chargement...
        </div>
      ) : (
        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>Numéro</th>
                <th>Type</th>
                <th>Client</th>
                <th>Date Émission</th>
                <th>Date Échéance</th>
                <th>Montant TTC</th>
                <th>Statut</th>
              </tr>
            </thead>
            <tbody>
              {factures.map((facture) => (
                <tr key={facture._id}>
                  <td style={{ fontWeight: 600, color: 'var(--primary-600)' }}>
                    {facture.numero}
                  </td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                      <FileText size={16} style={{ color: 'var(--neutral-500)' }} />
                      {facture.type}
                    </div>
                  </td>
                  <td>
                    {facture.clientId?.nom} {facture.clientId?.prenom}
                  </td>
                  <td style={{ fontSize: '0.875rem' }}>
                    {new Date(facture.dateEmission).toLocaleDateString('fr-FR')}
                  </td>
                  <td style={{ fontSize: '0.875rem' }}>
                    {facture.dateEcheance ? new Date(facture.dateEcheance).toLocaleDateString('fr-FR') : '-'}
                  </td>
                  <td style={{ fontWeight: 600 }}>
                    {facture.totalTTC.toFixed(2)}€
                  </td>
                  <td>
                    <span className={`badge badge-${statutColors[facture.statut]}`}>
                      {facture.statut}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

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
