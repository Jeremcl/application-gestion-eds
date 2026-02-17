import { useState, useEffect } from 'react';
import {
  Euro, Wrench, ShoppingCart, Clock, TrendingUp, TrendingDown,
  AlertTriangle, Users, Package, RotateCcw
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend, AreaChart, Area, ReferenceLine
} from 'recharts';
import { statistiques as statsAPI } from '../services/api';

const COLORS = {
  primary: '#2D5A3D',
  mid: '#4A7C5D',
  light: '#66A182',
  emerald: '#059669',
  blue: '#2563EB',
  yellow: '#F59E0B',
  red: '#EF4444',
  orange: '#F97316',
  purple: '#8B5CF6'
};

const STATUT_COLORS = {
  'Demande': '#F59E0B',
  'Planifié': '#2563EB',
  'En cours': '#059669',
  'Diagnostic': '#8B5CF6',
  'Réparation': '#F97316',
  'Terminé': '#4A7C5D',
  'Facturé': '#2D5A3D'
};

const DONUT_COLORS = [COLORS.primary, COLORS.emerald, COLORS.blue, COLORS.yellow, COLORS.purple];

const OBJECTIF_CA = 2400;

const Statistiques = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [periode, setPeriode] = useState('mois');

  useEffect(() => {
    loadStats();
  }, [periode]);

  const loadStats = async () => {
    setLoading(true);
    try {
      const { data: stats } = await statsAPI.getDashboard(periode);
      setData(stats);
    } catch (error) {
      console.error('Erreur chargement statistiques:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading || !data) {
    return (
      <div className="animate-fade-in">
        <div className="page-header">
          <h1 className="page-title">Statistiques</h1>
        </div>
        <div className="card" style={{ padding: 'var(--space-12)', textAlign: 'center' }}>
          <div style={{ color: 'var(--neutral-500)', fontSize: '0.875rem' }}>
            Chargement des statistiques...
          </div>
        </div>
      </div>
    );
  }

  const { kpis, revenusParMois, pipeline, ventilationRevenus, repartitionType, topAppareils, activiteParMois, facturesImpayees, topClients, qualite } = data;

  const periodeLabel = periode === 'mois' ? 'du mois' : periode === 'trimestre' ? 'du trimestre' : "de l'année";
  const pourcentCA = OBJECTIF_CA > 0 ? Math.round((kpis.caPeriode / OBJECTIF_CA) * 100) : 0;

  // Ordonnancement pipeline
  const statutOrdre = ['Demande', 'Planifié', 'En cours', 'Diagnostic', 'Réparation', 'Terminé', 'Facturé'];
  const pipelineSorted = statutOrdre
    .map(s => pipeline.find(p => p.statut === s) || { statut: s, count: 0 })
    .filter(p => p.count > 0);

  return (
    <div className="animate-fade-in">
      {/* Header */}
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 'var(--space-3)' }}>
        <h1 className="page-title">Statistiques</h1>
        <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
          {['mois', 'trimestre', 'annee'].map(p => (
            <button
              key={p}
              className={`btn ${periode === p ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setPeriode(p)}
              style={{ fontSize: '0.8125rem', padding: '6px 14px' }}
            >
              {p === 'mois' ? 'Mois' : p === 'trimestre' ? 'Trimestre' : 'Année'}
            </button>
          ))}
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-4 mb-6">
        <KpiCard
          icon={Euro}
          label={`CA ${periodeLabel}`}
          value={`${kpis.caPeriode.toLocaleString('fr-FR')}€`}
          trend={`${pourcentCA}% obj.`}
          positive={kpis.caPeriode >= OBJECTIF_CA}
        />
        <KpiCard
          icon={Wrench}
          label="Interventions en cours"
          value={kpis.enCours}
          trend={`${kpis.enCours} actives`}
          positive={true}
        />
        <KpiCard
          icon={ShoppingCart}
          label="Panier moyen"
          value={`${kpis.panierMoyen}€`}
          trend="facturées"
          positive={kpis.panierMoyen > 0}
        />
        <KpiCard
          icon={Clock}
          label="Délai moyen"
          value={`${kpis.delaiMoyen}j`}
          trend="création → réalisation"
          positive={kpis.delaiMoyen <= 7}
        />
      </div>

      {/* CA par mois - Full width */}
      <div className="card mb-6">
        <h3 style={{ marginBottom: 'var(--space-4)' }}>Chiffre d'affaires par mois</h3>
        <div style={{ width: '100%', height: 300 }}>
          <ResponsiveContainer>
            <BarChart data={revenusParMois} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
              <XAxis dataKey="mois" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip
                formatter={(value) => [`${value}€`, 'CA']}
                contentStyle={{ borderRadius: '8px', border: '1px solid #E5E7EB' }}
              />
              <ReferenceLine y={OBJECTIF_CA} stroke={COLORS.red} strokeDasharray="5 5" label={{ value: `Objectif ${OBJECTIF_CA}€`, position: 'right', fill: COLORS.red, fontSize: 11 }} />
              <Bar dataKey="ca" fill={COLORS.primary} radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Pipeline + Donut revenus */}
      <div className="grid grid-2 mb-6">
        {/* Pipeline par statut */}
        <div className="card">
          <h3 style={{ marginBottom: 'var(--space-4)' }}>Pipeline interventions</h3>
          <div style={{ width: '100%', height: 280 }}>
            <ResponsiveContainer>
              <BarChart data={pipelineSorted} layout="vertical" margin={{ top: 5, right: 20, bottom: 5, left: 80 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                <XAxis type="number" tick={{ fontSize: 12 }} />
                <YAxis type="category" dataKey="statut" tick={{ fontSize: 12 }} width={75} />
                <Tooltip contentStyle={{ borderRadius: '8px', border: '1px solid #E5E7EB' }} />
                <Bar dataKey="count" radius={[0, 4, 4, 0]}>
                  {pipelineSorted.map((entry, index) => (
                    <Cell key={index} fill={STATUT_COLORS[entry.statut] || COLORS.mid} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Répartition revenus */}
        <div className="card">
          <h3 style={{ marginBottom: 'var(--space-4)' }}>Répartition revenus</h3>
          <div style={{ width: '100%', height: 280 }}>
            <ResponsiveContainer>
              <PieChart>
                <Pie
                  data={ventilationRevenus.filter(v => v.value > 0)}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={3}
                  dataKey="value"
                  label={({ name, value }) => `${name}: ${value}€`}
                >
                  {ventilationRevenus.map((entry, index) => (
                    <Cell key={index} fill={DONUT_COLORS[index]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => `${value}€`} contentStyle={{ borderRadius: '8px', border: '1px solid #E5E7EB' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Types + Activité mensuelle */}
      <div className="grid grid-2 mb-6">
        {/* Atelier/Domicile + Top appareils */}
        <div className="card">
          <h3 style={{ marginBottom: 'var(--space-4)' }}>Types d'interventions</h3>
          <div style={{ display: 'flex', gap: 'var(--space-4)', flexWrap: 'wrap' }}>
            {/* Atelier vs Domicile */}
            <div style={{ flex: '1 1 200px' }}>
              <p style={{ fontSize: '0.75rem', color: 'var(--neutral-500)', marginBottom: 'var(--space-2)', textAlign: 'center' }}>Atelier / Domicile</p>
              <div style={{ width: '100%', height: 180 }}>
                <ResponsiveContainer>
                  <PieChart>
                    <Pie
                      data={repartitionType.filter(r => r.value > 0)}
                      cx="50%"
                      cy="50%"
                      innerRadius={35}
                      outerRadius={65}
                      paddingAngle={3}
                      dataKey="value"
                    >
                      {repartitionType.map((entry, index) => (
                        <Cell key={index} fill={DONUT_COLORS[index]} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ borderRadius: '8px', border: '1px solid #E5E7EB' }} />
                    <Legend wrapperStyle={{ fontSize: '0.75rem' }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
            {/* Top appareils */}
            <div style={{ flex: '1 1 200px' }}>
              <p style={{ fontSize: '0.75rem', color: 'var(--neutral-500)', marginBottom: 'var(--space-2)', textAlign: 'center' }}>Top appareils</p>
              <div style={{ width: '100%', height: 180 }}>
                <ResponsiveContainer>
                  <PieChart>
                    <Pie
                      data={topAppareils.filter(a => a.value > 0)}
                      cx="50%"
                      cy="50%"
                      innerRadius={35}
                      outerRadius={65}
                      paddingAngle={3}
                      dataKey="value"
                    >
                      {topAppareils.map((entry, index) => (
                        <Cell key={index} fill={DONUT_COLORS[index % DONUT_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ borderRadius: '8px', border: '1px solid #E5E7EB' }} />
                    <Legend wrapperStyle={{ fontSize: '0.75rem' }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>

        {/* Activité mensuelle */}
        <div className="card">
          <h3 style={{ marginBottom: 'var(--space-4)' }}>Activité mensuelle</h3>
          <div style={{ width: '100%', height: 280 }}>
            <ResponsiveContainer>
              <AreaChart data={activiteParMois} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                <XAxis dataKey="mois" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip contentStyle={{ borderRadius: '8px', border: '1px solid #E5E7EB' }} />
                <Legend wrapperStyle={{ fontSize: '0.75rem' }} />
                <Area type="monotone" dataKey="creees" name="Créées" stroke={COLORS.blue} fill={COLORS.blue} fillOpacity={0.15} />
                <Area type="monotone" dataKey="terminees" name="Terminées" stroke={COLORS.emerald} fill={COLORS.emerald} fillOpacity={0.15} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Santé financière - Full width */}
      <div className="card mb-6">
        <h3 style={{ marginBottom: 'var(--space-4)' }}>Santé financière</h3>
        <div className="grid grid-2">
          {/* Factures impayées */}
          <div>
            <h4 style={{ fontSize: '0.875rem', color: 'var(--neutral-600)', marginBottom: 'var(--space-3)' }}>
              Factures impayées ({facturesImpayees.total} — {facturesImpayees.montantTotal}€)
            </h4>
            <table style={{ width: '100%', fontSize: '0.8125rem', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid var(--neutral-200)' }}>
                  <th style={{ textAlign: 'left', padding: '8px 4px', color: 'var(--neutral-500)', fontWeight: 600 }}>Tranche</th>
                  <th style={{ textAlign: 'center', padding: '8px 4px', color: 'var(--neutral-500)', fontWeight: 600 }}>Nombre</th>
                  <th style={{ textAlign: 'right', padding: '8px 4px', color: 'var(--neutral-500)', fontWeight: 600 }}>Montant</th>
                </tr>
              </thead>
              <tbody>
                {facturesImpayees.aging.map((a, i) => (
                  <tr key={i} style={{ borderBottom: '1px solid var(--neutral-100)' }}>
                    <td style={{ padding: '8px 4px' }}>{a.tranche}</td>
                    <td style={{ textAlign: 'center', padding: '8px 4px' }}>
                      <span style={{
                        background: i === 2 ? 'var(--red-500)' : i === 1 ? COLORS.yellow : 'var(--neutral-200)',
                        color: i >= 1 ? 'white' : 'var(--neutral-700)',
                        padding: '2px 10px',
                        borderRadius: '12px',
                        fontSize: '0.75rem',
                        fontWeight: 600
                      }}>
                        {a.count}
                      </span>
                    </td>
                    <td style={{ textAlign: 'right', padding: '8px 4px', fontWeight: 600 }}>{a.montant}€</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Top 5 clients par CA */}
          <div>
            <h4 style={{ fontSize: '0.875rem', color: 'var(--neutral-600)', marginBottom: 'var(--space-3)' }}>
              Top 5 clients par CA
            </h4>
            {topClients.length === 0 ? (
              <p style={{ fontSize: '0.8125rem', color: 'var(--neutral-400)' }}>Aucune donnée</p>
            ) : (
              <table style={{ width: '100%', fontSize: '0.8125rem', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid var(--neutral-200)' }}>
                    <th style={{ textAlign: 'left', padding: '8px 4px', color: 'var(--neutral-500)', fontWeight: 600 }}>Client</th>
                    <th style={{ textAlign: 'center', padding: '8px 4px', color: 'var(--neutral-500)', fontWeight: 600 }}>Interv.</th>
                    <th style={{ textAlign: 'right', padding: '8px 4px', color: 'var(--neutral-500)', fontWeight: 600 }}>CA</th>
                  </tr>
                </thead>
                <tbody>
                  {topClients.map((c, i) => (
                    <tr key={i} style={{ borderBottom: '1px solid var(--neutral-100)' }}>
                      <td style={{ padding: '8px 4px' }}>{c.nom}</td>
                      <td style={{ textAlign: 'center', padding: '8px 4px' }}>{c.count}</td>
                      <td style={{ textAlign: 'right', padding: '8px 4px', fontWeight: 600, color: COLORS.primary }}>{c.totalCA}€</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>

      {/* Indicateurs qualité */}
      <div className="grid grid-3 mb-6">
        {/* Taux retour */}
        <div className="card" style={{ textAlign: 'center' }}>
          <div style={{ marginBottom: 'var(--space-3)' }}>
            <RotateCcw size={28} style={{ color: qualite.tauxRetour > 5 ? COLORS.red : COLORS.emerald }} />
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--neutral-500)', marginBottom: 'var(--space-1)' }}>Taux de retour garantie</div>
          <div style={{ fontSize: '1.75rem', fontWeight: 700, color: qualite.tauxRetour > 5 ? COLORS.red : COLORS.primary }}>
            {qualite.tauxRetour}%
          </div>
          <div style={{ fontSize: '0.6875rem', color: qualite.tauxRetour > 5 ? COLORS.red : 'var(--neutral-400)', marginTop: 'var(--space-1)' }}>
            {qualite.tauxRetour > 5 ? 'Attention - seuil dépassé' : 'Bon niveau'}
          </div>
        </div>

        {/* Top pièces */}
        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', marginBottom: 'var(--space-3)' }}>
            <Package size={18} style={{ color: COLORS.primary }} />
            <span style={{ fontSize: '0.875rem', fontWeight: 600 }}>Top pièces utilisées</span>
          </div>
          {qualite.topPieces.length === 0 ? (
            <p style={{ fontSize: '0.8125rem', color: 'var(--neutral-400)' }}>Aucune donnée</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
              {qualite.topPieces.map((p, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.8125rem' }}>
                  <span style={{ color: 'var(--neutral-700)' }}>{p.nom}</span>
                  <span style={{
                    background: 'var(--primary-100)',
                    color: COLORS.primary,
                    padding: '2px 8px',
                    borderRadius: '10px',
                    fontSize: '0.75rem',
                    fontWeight: 600
                  }}>
                    x{p.quantite}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Stock critique */}
        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', marginBottom: 'var(--space-3)' }}>
            <AlertTriangle size={18} style={{ color: qualite.stockCritique.length > 0 ? COLORS.red : COLORS.emerald }} />
            <span style={{ fontSize: '0.875rem', fontWeight: 600 }}>Stock critique</span>
          </div>
          {qualite.stockCritique.length === 0 ? (
            <p style={{ fontSize: '0.8125rem', color: 'var(--emerald-600)' }}>Aucune alerte stock</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
              {qualite.stockCritique.map((s, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.8125rem' }}>
                  <span style={{ color: 'var(--neutral-700)' }} title={s.designation}>{s.reference}</span>
                  <span style={{
                    background: '#FEE2E2',
                    color: COLORS.red,
                    padding: '2px 8px',
                    borderRadius: '10px',
                    fontSize: '0.75rem',
                    fontWeight: 600
                  }}>
                    {s.stock}/{s.minimum}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// Composant KPI Card réutilisable
const KpiCard = ({ icon: Icon, label, value, trend, positive }) => (
  <div className="metric-card animate-slide-in">
    <div className="metric-icon">
      <Icon size={32} />
    </div>
    <div className="metric-content">
      <div className="metric-label">{label}</div>
      <div className="metric-value">{value}</div>
      <div className={`metric-trend ${positive ? 'positive' : 'negative'}`}>
        {positive ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
        <span>{trend}</span>
      </div>
    </div>
  </div>
);

export default Statistiques;
