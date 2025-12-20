import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Wrench, User, Monitor, Calendar, Clock, Euro,
  FileText, Package, Edit, Trash2, CheckCircle, XCircle
} from 'lucide-react';
import { interventions as interventionsAPI } from '../services/api';
import Breadcrumb from '../components/Breadcrumb';
import InterventionModal from '../components/InterventionModal';

const statusColors = {
  'Demande': 'var(--blue-500)',
  'Planifié': 'var(--purple-500)',
  'En cours': 'var(--yellow-500)',
  'Diagnostic': 'var(--orange-500)',
  'Réparation': 'var(--pink-500)',
  'Terminé': 'var(--green-500)',
  'Facturé': 'var(--primary-600)'
};

const InterventionDetail = () => {
  const { interventionId } = useParams();
  const navigate = useNavigate();
  const [intervention, setIntervention] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showEditModal, setShowEditModal] = useState(false);

  useEffect(() => {
    loadIntervention();
  }, [interventionId]);

  const loadIntervention = async () => {
    setLoading(true);
    try {
      const { data } = await interventionsAPI.getById(interventionId);
      setIntervention(data);
    } catch (error) {
      console.error('Erreur chargement intervention:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer cette intervention ?')) {
      try {
        await interventionsAPI.delete(interventionId);
        navigate('/interventions');
      } catch (error) {
        console.error('Erreur suppression intervention:', error);
        alert('Erreur lors de la suppression');
      }
    }
  };

  const formatDate = (date) => {
    if (!date) return '-';
    return new Date(date).toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
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

  if (!intervention) {
    return (
      <div className="animate-fade-in">
        <div className="card" style={{ padding: 'var(--space-8)', textAlign: 'center' }}>
          Intervention non trouvée
        </div>
      </div>
    );
  }

  return (
    <div className="animate-fade-in">
      <Breadcrumb items={[
        { label: 'Interventions', path: '/interventions' },
        { label: intervention.numero }
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
              <Wrench size={32} style={{ color: 'var(--primary-600)' }} />
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
                {intervention.numero}
              </h1>
              <div style={{
                display: 'inline-flex',
                alignItems: 'center',
                padding: 'var(--space-2) var(--space-3)',
                background: `${statusColors[intervention.statut]}20`,
                color: statusColors[intervention.statut],
                borderRadius: 'var(--radius-full)',
                fontSize: '0.875rem',
                fontWeight: 600,
                marginBottom: 'var(--space-2)'
              }}>
                {intervention.statut}
              </div>
              <div style={{ fontSize: '0.875rem', color: 'var(--neutral-600)' }}>
                Type: <strong>{intervention.typeIntervention}</strong>
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
            <button className="btn btn-secondary" onClick={() => navigate('/interventions')}>
              Retour
            </button>
          </div>
        </div>
      </div>

      {/* Client & Device Info */}
      <div className="grid grid-2" style={{ gap: 'var(--space-4)', marginBottom: 'var(--space-6)' }}>
        {/* Client */}
        <div
          className="card"
          style={{ cursor: 'pointer', transition: 'all 0.2s' }}
          onClick={() => intervention.clientId?._id && navigate(`/clients/${intervention.clientId._id}`)}
          onMouseOver={(e) => {
            if (intervention.clientId?._id) {
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.1)';
            }
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = 'none';
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', marginBottom: 'var(--space-3)' }}>
            <div style={{
              width: '40px',
              height: '40px',
              borderRadius: 'var(--radius-lg)',
              background: 'var(--blue-100)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <User size={20} style={{ color: 'var(--blue-600)' }} />
            </div>
            <div>
              <div style={{ fontSize: '0.75rem', color: 'var(--neutral-500)', marginBottom: '2px' }}>
                Client
              </div>
              <div style={{ fontWeight: 600, fontSize: '1rem' }}>
                {intervention.clientId?.nom} {intervention.clientId?.prenom}
              </div>
            </div>
          </div>
          {intervention.clientId?.telephone && (
            <div style={{ fontSize: '0.875rem', color: 'var(--neutral-600)' }}>
              {intervention.clientId.telephone}
            </div>
          )}
        </div>

        {/* Device */}
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
              <Monitor size={20} style={{ color: 'var(--purple-600)' }} />
            </div>
            <div>
              <div style={{ fontSize: '0.75rem', color: 'var(--neutral-500)', marginBottom: '2px' }}>
                Appareil
              </div>
              <div style={{ fontWeight: 600, fontSize: '1rem' }}>
                {intervention.appareil?.type}
              </div>
            </div>
          </div>
          <div style={{ fontSize: '0.875rem', color: 'var(--neutral-600)' }}>
            {intervention.appareil?.marque} {intervention.appareil?.modele}
          </div>
          {intervention.appareil?.numeroSerie && (
            <div style={{
              fontSize: '0.75rem',
              color: 'var(--neutral-500)',
              fontFamily: 'monospace',
              marginTop: 'var(--space-2)'
            }}>
              N° {intervention.appareil.numeroSerie}
            </div>
          )}
        </div>
      </div>

      {/* Description & Details */}
      <div className="grid grid-2" style={{ gap: 'var(--space-4)', marginBottom: 'var(--space-6)' }}>
        {/* Description */}
        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', marginBottom: 'var(--space-3)' }}>
            <FileText size={20} style={{ color: 'var(--neutral-600)' }} />
            <h3 style={{ fontSize: '1rem', fontWeight: 600 }}>Description</h3>
          </div>
          <p style={{ fontSize: '0.875rem', color: 'var(--neutral-700)', lineHeight: 1.6 }}>
            {intervention.description || 'Aucune description'}
          </p>
        </div>

        {/* Planning */}
        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', marginBottom: 'var(--space-3)' }}>
            <Calendar size={20} style={{ color: 'var(--neutral-600)' }} />
            <h3 style={{ fontSize: '1rem', fontWeight: 600 }}>Planning</h3>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)', fontSize: '0.875rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--neutral-600)' }}>Date création:</span>
              <strong>{formatDate(intervention.dateCreation)}</strong>
            </div>
            {intervention.datePrevue && (
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--neutral-600)' }}>Date prévue:</span>
                <strong>{formatDate(intervention.datePrevue)}</strong>
              </div>
            )}
            {intervention.dateRealisation && (
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--neutral-600)' }}>Date réalisation:</span>
                <strong>{formatDate(intervention.dateRealisation)}</strong>
              </div>
            )}
            {intervention.technicien && (
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 'var(--space-2)', paddingTop: 'var(--space-2)', borderTop: '1px solid var(--neutral-200)' }}>
                <span style={{ color: 'var(--neutral-600)' }}>Technicien:</span>
                <strong>{intervention.technicien}</strong>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Diagnostic & Notes */}
      {(intervention.diagnostic || intervention.notes) && (
        <div className="grid grid-2" style={{ gap: 'var(--space-4)', marginBottom: 'var(--space-6)' }}>
          {intervention.diagnostic && (
            <div className="card">
              <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: 'var(--space-3)' }}>
                Diagnostic
              </h3>
              <p style={{ fontSize: '0.875rem', color: 'var(--neutral-700)', lineHeight: 1.6 }}>
                {intervention.diagnostic}
              </p>
            </div>
          )}
          {intervention.notes && (
            <div className="card">
              <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: 'var(--space-3)' }}>
                Notes
              </h3>
              <p style={{ fontSize: '0.875rem', color: 'var(--neutral-700)', lineHeight: 1.6 }}>
                {intervention.notes}
              </p>
            </div>
          )}
        </div>
      )}

      {/* Costs */}
      <div className="card" style={{ marginBottom: 'var(--space-6)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', marginBottom: 'var(--space-4)' }}>
          <Euro size={20} style={{ color: 'var(--neutral-600)' }} />
          <h3 style={{ fontSize: '1rem', fontWeight: 600 }}>Tarification</h3>
        </div>
        <div className="grid grid-3" style={{ gap: 'var(--space-4)' }}>
          <div>
            <div style={{ fontSize: '0.75rem', color: 'var(--neutral-500)', marginBottom: 'var(--space-1)' }}>
              Main d'œuvre
            </div>
            <div style={{ fontSize: '1.25rem', fontWeight: 600 }}>
              {intervention.coutMainOeuvre || 0}€
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--neutral-600)', marginTop: 'var(--space-1)' }}>
              {intervention.tempsMainOeuvre || 0}h × {intervention.tauxHoraire || 45}€/h
            </div>
          </div>
          <div>
            <div style={{ fontSize: '0.75rem', color: 'var(--neutral-500)', marginBottom: 'var(--space-1)' }}>
              Pièces détachées
            </div>
            <div style={{ fontSize: '1.25rem', fontWeight: 600 }}>
              {intervention.coutPieces || 0}€
            </div>
          </div>
          <div style={{
            padding: 'var(--space-4)',
            background: 'var(--primary-50)',
            borderRadius: 'var(--radius-md)'
          }}>
            <div style={{ fontSize: '0.75rem', color: 'var(--primary-700)', marginBottom: 'var(--space-1)' }}>
              Coût Total
            </div>
            <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--primary-700)' }}>
              {intervention.coutTotal || 0}€
            </div>
          </div>
        </div>
      </div>

      {/* Pieces Used */}
      {intervention.piecesUtilisees && intervention.piecesUtilisees.length > 0 && (
        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', marginBottom: 'var(--space-4)' }}>
            <Package size={20} style={{ color: 'var(--neutral-600)' }} />
            <h3 style={{ fontSize: '1rem', fontWeight: 600 }}>Pièces utilisées</h3>
          </div>
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>Référence</th>
                  <th>Quantité</th>
                  <th>Prix unitaire</th>
                  <th>Total</th>
                </tr>
              </thead>
              <tbody>
                {intervention.piecesUtilisees.map((piece, index) => (
                  <tr key={index}>
                    <td>{piece.pieceId?.reference || '-'}</td>
                    <td>{piece.quantite}</td>
                    <td>{piece.prixUnitaire}€</td>
                    <td style={{ fontWeight: 600 }}>
                      {(piece.quantite * piece.prixUnitaire).toFixed(2)}€
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      <InterventionModal
        show={showEditModal}
        onClose={() => setShowEditModal(false)}
        onSuccess={() => {
          loadIntervention();
          setShowEditModal(false);
        }}
        editingIntervention={intervention}
      />
    </div>
  );
};

export default InterventionDetail;
