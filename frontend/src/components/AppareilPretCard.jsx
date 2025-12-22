import { MonitorSmartphone, Edit, Trash2, Eye } from 'lucide-react';

const AppareilPretCard = ({ appareil, onClick, onEdit, onDelete, onView }) => {
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

  return (
    <div
      className="card"
      style={{
        padding: 'var(--space-4)',
        cursor: onClick ? 'pointer' : 'default',
        transition: 'all 0.2s',
        position: 'relative'
      }}
      onClick={onClick}
      onMouseOver={(e) => {
        if (onClick) {
          e.currentTarget.style.transform = 'translateY(-2px)';
          e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.1)';
        }
      }}
      onMouseOut={(e) => {
        if (onClick) {
          e.currentTarget.style.transform = 'translateY(0)';
          e.currentTarget.style.boxShadow = 'none';
        }
      }}
    >
      {/* Actions buttons */}
      {(onView || onEdit || onDelete) && (
        <div style={{
          position: 'absolute',
          top: 'var(--space-3)',
          right: 'var(--space-3)',
          display: 'flex',
          gap: 'var(--space-2)',
          zIndex: 10
        }}>
          {onView && (
            <button
              className="btn-icon"
              onClick={(e) => {
                e.stopPropagation();
                onView(appareil);
              }}
              style={{ padding: 'var(--space-2)' }}
              title="Voir détails"
            >
              <Eye size={14} />
            </button>
          )}
          {onEdit && (
            <button
              className="btn-icon"
              onClick={(e) => {
                e.stopPropagation();
                onEdit(appareil);
              }}
              style={{ padding: 'var(--space-2)' }}
              title="Modifier"
            >
              <Edit size={14} />
            </button>
          )}
          {onDelete && (
            <button
              className="btn-icon"
              onClick={(e) => {
                e.stopPropagation();
                onDelete(appareil);
              }}
              style={{ padding: 'var(--space-2)', color: 'var(--red-500)' }}
              title="Supprimer"
            >
              <Trash2 size={14} />
            </button>
          )}
        </div>
      )}

      {/* Device icon or photo */}
      <div style={{
        width: '48px',
        height: '48px',
        borderRadius: 'var(--radius-lg)',
        background: 'linear-gradient(135deg, var(--primary-100), var(--primary-200))',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 'var(--space-3)'
      }}>
        <MonitorSmartphone size={24} style={{ color: 'var(--primary-600)' }} />
      </div>

      {/* Device info */}
      <div style={{ marginBottom: 'var(--space-2)' }}>
        <h3 style={{
          fontSize: '1rem',
          fontWeight: 600,
          marginBottom: 'var(--space-1)',
          color: 'var(--neutral-900)'
        }}>
          {appareil.type || 'Type non spécifié'}
        </h3>
        <div style={{ fontSize: '0.875rem', color: 'var(--neutral-600)' }}>
          {appareil.marque} {appareil.modele && `${appareil.modele}`}
        </div>
      </div>

      {/* Serial number */}
      {appareil.numeroSerie && (
        <div style={{
          fontSize: '0.75rem',
          color: 'var(--neutral-500)',
          fontFamily: 'monospace',
          background: 'var(--neutral-100)',
          padding: 'var(--space-1) var(--space-2)',
          borderRadius: 'var(--radius-sm)',
          marginBottom: 'var(--space-3)',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap'
        }}>
          N° {appareil.numeroSerie}
        </div>
      )}

      {/* Statut and Valeur */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 'var(--space-2)' }}>
        <span className={`badge ${getStatutBadgeClass(appareil.statut)}`}>
          {appareil.statut}
        </span>
        {appareil.valeur > 0 && (
          <span style={{
            fontSize: '0.875rem',
            fontWeight: 600,
            color: 'var(--primary-700)'
          }}>
            {appareil.valeur}€
          </span>
        )}
      </div>

      {/* Emplacement */}
      {appareil.emplacement && (
        <div style={{
          fontSize: '0.75rem',
          color: 'var(--neutral-500)',
          marginTop: 'var(--space-2)'
        }}>
          📍 {appareil.emplacement}
        </div>
      )}
    </div>
  );
};

export default AppareilPretCard;
