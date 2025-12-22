import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { MonitorSmartphone, Edit, Trash2, ChevronRight, ArrowLeft, UserPlus } from 'lucide-react';
import { appareilsPret as appareilsPretAPI } from '../services/api';
import Breadcrumb from '../components/Breadcrumb';
import AppareilPretModal from '../components/AppareilPretModal';
import PretModal from '../components/PretModal';
import RetourModal from '../components/RetourModal';

const AppareilPretDetail = () => {
  const { appareilId } = useParams();
  const navigate = useNavigate();
  const [appareil, setAppareil] = useState(null);
  const [prets, setPrets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showPretModal, setShowPretModal] = useState(false);
  const [showRetourModal, setShowRetourModal] = useState(false);
  const [selectedPret, setSelectedPret] = useState(null);

  useEffect(() => {
    loadAppareilData();
  }, [appareilId]);

  const loadAppareilData = async () => {
    setLoading(true);
    try {
      const [appareilRes, pretsRes] = await Promise.all([
        appareilsPretAPI.getById(appareilId),
        appareilsPretAPI.getPrets(appareilId)
      ]);
      setAppareil(appareilRes.data);
      setPrets(pretsRes.data);
    } catch (error) {
      console.error('Erreur chargement données:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (window.confirm(`Êtes-vous sûr de vouloir supprimer cet appareil ?`)) {
      try {
        await appareilsPretAPI.delete(appareilId);
        navigate('/appareils-pret');
      } catch (error) {
        console.error('Erreur suppression:', error);
        alert(error.message || 'Erreur lors de la suppression');
      }
    }
  };

  const handleRetour = (pret) => {
    setSelectedPret(pret);
    setShowRetourModal(true);
  };

  const getStatutBadgeClass = (statut) => {
    switch (statut) {
      case 'Disponible':
        return 'badge-success';
      case 'Prêté':
        return 'badge-warning';
      case 'En maintenance':
        return 'badge-danger';
      default:
        return 'badge-neutral';
    }
  };

  const getPretStatutBadgeClass = (statut) => {
    switch (statut) {
      case 'En cours':
        return 'badge-info';
      case 'Retourné':
        return 'badge-success';
      case 'Retard':
        return 'badge-danger';
      default:
        return 'badge-neutral';
    }
  };

  if (loading) {
    return <div style={{ textAlign: 'center', padding: 'var(--space-8)' }}>Chargement...</div>;
  }

  if (!appareil) {
    return (
      <div className="card" style={{ textAlign: 'center', padding: 'var(--space-8)' }}>
        <p>Appareil non trouvé</p>
        <button className="btn btn-secondary" onClick={() => navigate('/appareils-pret')} style={{ marginTop: 'var(--space-4)' }}>
          Retour à la liste
        </button>
      </div>
    );
  }

  return (
    <div>
      {/* Breadcrumb */}
      <Breadcrumb
        items={[
          { label: 'Appareils de prêt', path: '/appareils-pret' },
          { label: `${appareil.type} ${appareil.marque}` }
        ]}
      />

      {/* Back button */}
      <button
        className="btn btn-secondary mb-4"
        onClick={() => navigate('/appareils-pret')}
        style={{ marginBottom: 'var(--space-4)' }}
      >
        <ArrowLeft size={18} />
        Retour à la liste
      </button>

      {/* Appareil Info Card */}
      <div className="card" style={{ marginBottom: 'var(--space-6)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 'var(--space-6)' }}>
          <div style={{ display: 'flex', gap: 'var(--space-4)', alignItems: 'flex-start' }}>
            <div style={{
              width: '80px',
              height: '80px',
              borderRadius: 'var(--radius-lg)',
              background: 'linear-gradient(135deg, var(--primary-100), var(--primary-200))',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <MonitorSmartphone size={40} style={{ color: 'var(--primary-600)' }} />
            </div>
            <div>
              <h1 style={{ fontSize: '1.75rem', marginBottom: 'var(--space-2)' }}>
                {appareil.type} {appareil.marque}
              </h1>
              <p style={{ color: 'var(--neutral-600)', marginBottom: 'var(--space-3)' }}>
                {appareil.modele}
              </p>
              <span className={`badge ${getStatutBadgeClass(appareil.statut)}`}>
                {appareil.statut}
              </span>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
            {appareil.statut === 'Disponible' && (
              <button
                className="btn btn-primary"
                onClick={() => setShowPretModal(true)}
              >
                <UserPlus size={18} />
                Prêter
              </button>
            )}
            <button
              className="btn btn-secondary"
              onClick={() => setShowEditModal(true)}
            >
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
          </div>
        </div>

        {/* Details Grid */}
        <div className="grid grid-2" style={{ gap: 'var(--space-4)' }}>
          <div>
            <h3 style={{ fontSize: '1rem', marginBottom: 'var(--space-3)' }}>Informations techniques</h3>
            {appareil.numeroSerie && (
              <div style={{ marginBottom: 'var(--space-2)' }}>
                <span style={{ fontWeight: 600 }}>N° série:</span> {appareil.numeroSerie}
              </div>
            )}
            <div style={{ marginBottom: 'var(--space-2)' }}>
              <span style={{ fontWeight: 600 }}>État:</span> {appareil.etat}
            </div>
            <div style={{ marginBottom: 'var(--space-2)' }}>
              <span style={{ fontWeight: 600 }}>Valeur:</span> {appareil.valeur}€
            </div>
            {appareil.dateAchat && (
              <div style={{ marginBottom: 'var(--space-2)' }}>
                <span style={{ fontWeight: 600 }}>Date d'achat:</span> {new Date(appareil.dateAchat).toLocaleDateString('fr-FR')}
              </div>
            )}
          </div>
          <div>
            <h3 style={{ fontSize: '1rem', marginBottom: 'var(--space-3)' }}>Localisation & Accessoires</h3>
            {appareil.emplacement && (
              <div style={{ marginBottom: 'var(--space-2)' }}>
                <span style={{ fontWeight: 600 }}>Emplacement:</span> {appareil.emplacement}
              </div>
            )}
            {appareil.accessoiresInclus && appareil.accessoiresInclus.length > 0 && (
              <div style={{ marginBottom: 'var(--space-2)' }}>
                <span style={{ fontWeight: 600 }}>Accessoires:</span>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-2)', marginTop: 'var(--space-2)' }}>
                  {appareil.accessoiresInclus.map((acc, index) => (
                    <span key={index} className="badge badge-neutral">{acc}</span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {appareil.conditionsPret && (
          <div style={{ marginTop: 'var(--space-4)', padding: 'var(--space-3)', background: 'var(--neutral-50)', borderRadius: 'var(--radius-md)' }}>
            <span style={{ fontWeight: 600 }}>Conditions de prêt:</span> {appareil.conditionsPret}
          </div>
        )}

        {appareil.notes && (
          <div style={{ marginTop: 'var(--space-3)', padding: 'var(--space-3)', background: 'var(--neutral-50)', borderRadius: 'var(--radius-md)' }}>
            <span style={{ fontWeight: 600 }}>Notes:</span> {appareil.notes}
          </div>
        )}
      </div>

      {/* Historique des prêts */}
      <div className="card">
        <h2 style={{ marginBottom: 'var(--space-4)' }}>Historique des prêts</h2>
        {prets.length === 0 ? (
          <p style={{ color: 'var(--neutral-600)', textAlign: 'center', padding: 'var(--space-4)' }}>
            Aucun prêt enregistré pour cet appareil
          </p>
        ) : (
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>Client</th>
                  <th>Intervention</th>
                  <th>Date prêt</th>
                  <th>Retour prévu</th>
                  <th>Retour effectif</th>
                  <th>Statut</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {prets.map(pret => (
                  <tr key={pret._id}>
                    <td>{pret.clientId?.nom} {pret.clientId?.prenom}</td>
                    <td>{pret.interventionId?.numero || '-'}</td>
                    <td>{new Date(pret.datePret).toLocaleDateString('fr-FR')}</td>
                    <td>{pret.dateRetourPrevue ? new Date(pret.dateRetourPrevue).toLocaleDateString('fr-FR') : '-'}</td>
                    <td>{pret.dateRetourEffectif ? new Date(pret.dateRetourEffectif).toLocaleDateString('fr-FR') : '-'}</td>
                    <td>
                      <span className={`badge ${getPretStatutBadgeClass(pret.statut)}`}>
                        {pret.statut}
                      </span>
                    </td>
                    <td>
                      {pret.statut === 'En cours' && (
                        <button
                          className="btn btn-sm btn-primary"
                          onClick={() => handleRetour(pret)}
                        >
                          Retour
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modals */}
      <AppareilPretModal
        show={showEditModal}
        onClose={() => setShowEditModal(false)}
        onSuccess={loadAppareilData}
        editingAppareil={appareil}
      />

      <PretModal
        show={showPretModal}
        onClose={() => setShowPretModal(false)}
        onSuccess={loadAppareilData}
        prefilledData={{}}
      />

      <RetourModal
        show={showRetourModal}
        onClose={() => setShowRetourModal(false)}
        onSuccess={loadAppareilData}
        pret={selectedPret}
      />
    </div>
  );
};

export default AppareilPretDetail;
