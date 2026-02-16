import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Wrench, User, Monitor, Calendar, Clock, Euro,
  FileText, Package, Edit, Trash2, CheckCircle, XCircle, MonitorSmartphone, ChevronRight, ClipboardList
} from 'lucide-react';
import { interventions as interventionsAPI } from '../services/api';
import Breadcrumb from '../components/Breadcrumb';
import InterventionModal from '../components/InterventionModal';
import DepotAtelierModal from '../components/DepotAtelierModal';

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
  const [showDepotModal, setShowDepotModal] = useState(false);

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
          <div style={{ display: 'flex', gap: 'var(--space-2)', flexWrap: 'wrap' }}>
            {intervention.statut === 'Planifié' && intervention.typeIntervention === 'Atelier' && !intervention.dateDepot && (
              <button
                className="btn btn-primary"
                onClick={() => setShowDepotModal(true)}
                style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}
              >
                <ClipboardList size={18} />
                Commencer le dépôt atelier
              </button>
            )}
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
            <a
              href={`tel:${intervention.clientId.telephone}`}
              style={{
                fontSize: '0.875rem',
                color: 'var(--primary-600)',
                textDecoration: 'none',
                cursor: 'pointer'
              }}
              onMouseOver={(e) => e.target.style.textDecoration = 'underline'}
              onMouseOut={(e) => e.target.style.textDecoration = 'none'}
            >
              {intervention.clientId.telephone}
            </a>
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

      {/* Appareil de prêt */}
      {intervention.appareilPretId && (
        <div
          className="card"
          style={{
            marginBottom: 'var(--space-6)',
            cursor: 'pointer',
            transition: 'all 0.2s',
            background: 'linear-gradient(135deg, var(--amber-50), var(--orange-50))',
            border: '2px solid var(--amber-200)'
          }}
          onClick={() => navigate(`/appareils-pret/${intervention.appareilPretId._id || intervention.appareilPretId}`)}
          onMouseOver={(e) => {
            e.currentTarget.style.transform = 'translateY(-2px)';
            e.currentTarget.style.boxShadow = '0 4px 12px rgba(245, 158, 11, 0.2)';
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = 'none';
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
              <div style={{
                width: '48px',
                height: '48px',
                borderRadius: 'var(--radius-lg)',
                background: 'linear-gradient(135deg, var(--amber-100), var(--orange-100))',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <MonitorSmartphone size={24} style={{ color: 'var(--amber-700)' }} />
              </div>
              <div>
                <div style={{
                  fontSize: '0.75rem',
                  color: 'var(--amber-700)',
                  marginBottom: '2px',
                  fontWeight: 600,
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px'
                }}>
                  Appareil de prêt
                </div>
                <div style={{ fontWeight: 600, fontSize: '1.125rem', color: 'var(--neutral-900)' }}>
                  {intervention.appareilPretId.type} {intervention.appareilPretId.marque}
                </div>
                <div style={{ fontSize: '0.875rem', color: 'var(--neutral-600)', marginTop: '2px' }}>
                  {intervention.appareilPretId.modele}
                  {intervention.appareilPretId.numeroSerie && ` • N° ${intervention.appareilPretId.numeroSerie}`}
                </div>
              </div>
            </div>
            <ChevronRight size={24} style={{ color: 'var(--amber-600)' }} />
          </div>
        </div>
      )}

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

      {/* Dépôt Atelier */}
      {intervention.dateDepot && (
        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--space-4)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
              <ClipboardList size={20} style={{ color: 'var(--primary-600)' }} />
              <h3 style={{ fontSize: '1rem', fontWeight: 600 }}>Dépôt Atelier</h3>
            </div>
            <div style={{ fontSize: '0.875rem', color: 'var(--neutral-600)' }}>
              {new Date(intervention.dateDepot).toLocaleDateString('fr-FR', {
                day: '2-digit',
                month: 'long',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              })}
            </div>
          </div>

          {/* Photos du dépôt */}
          {intervention.photosDepot && intervention.photosDepot.length > 0 && (
            <div style={{ marginBottom: 'var(--space-4)' }}>
              <h4 style={{ fontSize: '0.875rem', fontWeight: 600, marginBottom: 'var(--space-3)', color: 'var(--neutral-700)' }}>
                Photos à la réception ({intervention.photosDepot.length})
              </h4>
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))',
                gap: 'var(--space-3)'
              }}>
                {intervention.photosDepot.map((photo, index) => (
                  <div
                    key={index}
                    style={{
                      position: 'relative',
                      paddingTop: '100%',
                      borderRadius: 'var(--radius-lg)',
                      overflow: 'hidden',
                      boxShadow: 'var(--shadow-md)',
                      cursor: 'pointer'
                    }}
                    onClick={() => window.open(photo, '_blank')}
                  >
                    <img
                      src={photo}
                      alt={`Photo dépôt ${index + 1}`}
                      style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover'
                      }}
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Accessoires remis */}
          {intervention.accessoiresDepot && intervention.accessoiresDepot.length > 0 && (
            <div style={{ marginBottom: 'var(--space-4)' }}>
              <h4 style={{ fontSize: '0.875rem', fontWeight: 600, marginBottom: 'var(--space-3)', color: 'var(--neutral-700)' }}>
                Accessoires remis
              </h4>
              <div style={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: 'var(--space-2)'
              }}>
                {intervention.accessoiresDepot.map((accessoire, index) => (
                  <span
                    key={index}
                    style={{
                      padding: 'var(--space-2) var(--space-3)',
                      background: 'var(--primary-50)',
                      color: 'var(--primary-700)',
                      borderRadius: 'var(--radius-md)',
                      fontSize: '0.875rem',
                      border: '1px solid var(--primary-200)'
                    }}
                  >
                    {accessoire}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Documents */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: 'var(--space-3)',
            padding: 'var(--space-4)',
            background: 'var(--neutral-50)',
            borderRadius: 'var(--radius-lg)'
          }}>
            {intervention.ficheDAUrl && (
              <a
                href={intervention.ficheDAUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-secondary"
                style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', justifyContent: 'center' }}
              >
                <FileText size={18} />
                Fiche de dépôt (PDF)
              </a>
            )}
            {intervention.qrCodeUrl && (
              <a
                href={intervention.qrCodeUrl}
                download={`QR-${intervention.numero}.png`}
                className="btn btn-secondary"
                style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', justifyContent: 'center' }}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="3" width="8" height="8" />
                  <rect x="13" y="3" width="8" height="8" />
                  <rect x="3" y="13" width="8" height="8" />
                  <rect x="16" y="16" width="2" height="2" />
                  <rect x="19" y="16" width="2" height="2" />
                  <rect x="16" y="19" width="2" height="2" />
                  <rect x="19" y="19" width="2" height="2" />
                </svg>
                QR Code
              </a>
            )}
          </div>
        </div>
      )}

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

      {/* Depot Atelier Modal */}
      {intervention && (
        <DepotAtelierModal
          show={showDepotModal}
          onClose={() => setShowDepotModal(false)}
          intervention={intervention}
          onSuccess={() => {
            loadIntervention();
          }}
        />
      )}
    </div>
  );
};

export default InterventionDetail;
