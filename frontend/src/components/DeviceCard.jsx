import { Monitor, Edit, Trash2 } from 'lucide-react';

const DeviceCard = ({ device, onClick, onEdit, onDelete }) => {
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
      {(onEdit || onDelete) && (
        <div style={{
          position: 'absolute',
          top: 'var(--space-3)',
          right: 'var(--space-3)',
          display: 'flex',
          gap: 'var(--space-2)',
          zIndex: 10
        }}>
          {onEdit && (
            <button
              className="btn-icon"
              onClick={(e) => {
                e.stopPropagation();
                onEdit(device);
              }}
              style={{ padding: 'var(--space-2)' }}
            >
              <Edit size={14} />
            </button>
          )}
          {onDelete && (
            <button
              className="btn-icon"
              onClick={(e) => {
                e.stopPropagation();
                onDelete(device);
              }}
              style={{ padding: 'var(--space-2)', color: 'var(--red-500)' }}
            >
              <Trash2 size={14} />
            </button>
          )}
        </div>
      )}

      {/* Device icon */}
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
        <Monitor size={24} style={{ color: 'var(--primary-600)' }} />
      </div>

      {/* Device info */}
      <div style={{ marginBottom: 'var(--space-2)' }}>
        <h3 style={{
          fontSize: '1rem',
          fontWeight: 600,
          marginBottom: 'var(--space-1)',
          color: 'var(--neutral-900)'
        }}>
          {device.type || 'Type non spécifié'}
        </h3>
        <div style={{ fontSize: '0.875rem', color: 'var(--neutral-600)' }}>
          {device.marque} {device.modele && `- ${device.modele}`}
        </div>
      </div>

      {/* Serial number */}
      {device.numeroSerie && (
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
          N° {device.numeroSerie}
        </div>
      )}

      {/* Intervention count badge */}
      {device.interventionCount !== undefined && (
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 'var(--space-2)',
          padding: 'var(--space-2) var(--space-3)',
          background: device.interventionCount > 0 ? 'var(--primary-100)' : 'var(--neutral-100)',
          color: device.interventionCount > 0 ? 'var(--primary-700)' : 'var(--neutral-600)',
          borderRadius: 'var(--radius-full)',
          fontSize: '0.75rem',
          fontWeight: 600
        }}>
          {device.interventionCount} intervention{device.interventionCount !== 1 ? 's' : ''}
        </div>
      )}
    </div>
  );
};

export default DeviceCard;
