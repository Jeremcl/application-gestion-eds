import { useState, useEffect } from 'react';

const ResponsiveTable = ({
  columns,
  data,
  onRowClick,
  renderMobileCard,
  mobileCardConfig,
  loading,
  emptyMessage = 'Aucune donnée'
}) => {
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  if (loading) {
    return (
      <div className="card" style={{ padding: 'var(--space-8)', textAlign: 'center' }}>
        Chargement...
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="card" style={{ padding: 'var(--space-8)', textAlign: 'center', color: 'var(--neutral-500)' }}>
        {emptyMessage}
      </div>
    );
  }

  // Desktop: Table view
  const renderTable = () => (
    <div className="table-container">
      <table className="table">
        <thead>
          <tr>
            {columns.map((col, index) => (
              <th key={index} style={col.headerStyle}>
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((item, rowIndex) => (
            <tr
              key={item._id || rowIndex}
              onClick={() => onRowClick && onRowClick(item)}
              style={{ cursor: onRowClick ? 'pointer' : 'default' }}
            >
              {columns.map((col, colIndex) => (
                <td key={colIndex} style={col.cellStyle}>
                  {col.render ? col.render(item) : item[col.accessor]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  // Mobile: Card view
  const renderMobileCards = () => {
    if (renderMobileCard) {
      return (
        <div className="table-mobile-cards" style={{ display: 'block' }}>
          {data.map((item, index) => (
            <div key={item._id || index}>
              {renderMobileCard(item)}
            </div>
          ))}
        </div>
      );
    }

    // Default mobile card rendering using mobileCardConfig
    if (mobileCardConfig) {
      return (
        <div className="table-mobile-cards" style={{ display: 'block' }}>
          {data.map((item, index) => (
            <div
              key={item._id || index}
              className="mobile-card"
              onClick={() => onRowClick && onRowClick(item)}
              style={{ cursor: onRowClick ? 'pointer' : 'default' }}
            >
              <div className="mobile-card-header">
                <div>
                  <div className="mobile-card-title">
                    {mobileCardConfig.title(item)}
                  </div>
                  {mobileCardConfig.subtitle && (
                    <div className="mobile-card-subtitle">
                      {mobileCardConfig.subtitle(item)}
                    </div>
                  )}
                </div>
                {mobileCardConfig.badge && (
                  <div>{mobileCardConfig.badge(item)}</div>
                )}
              </div>

              <div className="mobile-card-body">
                {mobileCardConfig.fields.map((field, fieldIndex) => (
                  <div key={fieldIndex} className="mobile-card-row">
                    <span className="mobile-card-label">{field.label}</span>
                    <span className="mobile-card-value">
                      {field.render ? field.render(item) : item[field.accessor]}
                    </span>
                  </div>
                ))}
              </div>

              {mobileCardConfig.actions && (
                <div className="mobile-card-actions" onClick={(e) => e.stopPropagation()}>
                  {mobileCardConfig.actions(item)}
                </div>
              )}
            </div>
          ))}
        </div>
      );
    }

    // Fallback: simple card rendering from columns
    return (
      <div className="table-mobile-cards" style={{ display: 'block' }}>
        {data.map((item, index) => (
          <div
            key={item._id || index}
            className="mobile-card"
            onClick={() => onRowClick && onRowClick(item)}
            style={{ cursor: onRowClick ? 'pointer' : 'default' }}
          >
            <div className="mobile-card-body">
              {columns.slice(0, 5).map((col, colIndex) => (
                <div key={colIndex} className="mobile-card-row">
                  <span className="mobile-card-label">{col.header}</span>
                  <span className="mobile-card-value">
                    {col.render ? col.render(item) : item[col.accessor]}
                  </span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    );
  };

  return isMobile ? renderMobileCards() : renderTable();
};

export default ResponsiveTable;
