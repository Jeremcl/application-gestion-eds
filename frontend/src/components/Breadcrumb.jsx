import { Link } from 'react-router-dom';
import { ChevronRight, Home } from 'lucide-react';

const Breadcrumb = ({ items }) => {
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: 'var(--space-2)',
      marginBottom: 'var(--space-6)',
      fontSize: '0.875rem',
      color: 'var(--neutral-600)'
    }}>
      <Link
        to="/"
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 'var(--space-1)',
          color: 'var(--neutral-600)',
          textDecoration: 'none',
          transition: 'color 0.2s'
        }}
        onMouseOver={(e) => e.target.style.color = 'var(--primary-600)'}
        onMouseOut={(e) => e.target.style.color = 'var(--neutral-600)'}
      >
        <Home size={16} />
        Accueil
      </Link>

      {items.map((item, index) => (
        <div key={index} style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
          <ChevronRight size={16} style={{ color: 'var(--neutral-400)' }} />
          {item.path && index < items.length - 1 ? (
            <Link
              to={item.path}
              style={{
                color: 'var(--neutral-600)',
                textDecoration: 'none',
                transition: 'color 0.2s'
              }}
              onMouseOver={(e) => e.target.style.color = 'var(--primary-600)'}
              onMouseOut={(e) => e.target.style.color = 'var(--neutral-600)'}
            >
              {item.label}
            </Link>
          ) : (
            <span style={{ color: 'var(--neutral-900)', fontWeight: 500 }}>
              {item.label}
            </span>
          )}
        </div>
      ))}
    </div>
  );
};

export default Breadcrumb;
