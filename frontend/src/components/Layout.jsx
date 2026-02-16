import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Home, Users, Wrench, Package, FileText, Settings, Search, Bell, LogOut, ChevronDown, Wrench as WrenchIcon, MonitorSmartphone, FileStack, Truck, Menu, Calendar } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useState, useEffect, useRef } from 'react';
import { pieces, maintenance as maintenanceAPI, appareilsPret } from '../services/api';
import logoEDS from '../assets/Logo-eds-vert.svg';

const Layout = ({ children }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [stockAlertes, setStockAlertes] = useState(0);
  const [appareilsPretesCount, setAppareilsPretesCount] = useState(0);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showMaintenanceModal, setShowMaintenanceModal] = useState(false);
  const [maintenanceStatus, setMaintenanceStatus] = useState(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const userMenuRef = useRef(null);

  useEffect(() => {
    loadStockAlertes();
    loadAppareilsPretesCount();
    if (user?.role === 'admin') {
      loadMaintenanceStatus();
    }
  }, [user]);

  // Fermer le menu utilisateur si on clique en dehors
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target)) {
        setShowUserMenu(false);
      }
    };

    if (showUserMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showUserMenu]);

  const loadStockAlertes = async () => {
    try {
      const { data } = await pieces.getAlertes();
      setStockAlertes(data.count);
    } catch (error) {
      console.error('Erreur chargement alertes stock:', error);
    }
  };

  const loadAppareilsPretesCount = async () => {
    try {
      const { data } = await appareilsPret.getStats();
      setAppareilsPretesCount(data.pretes);
    } catch (error) {
      console.error('Erreur chargement count appareils prêtés:', error);
    }
  };

  const loadMaintenanceStatus = async () => {
    try {
      const { data } = await maintenanceAPI.getStatus();
      setMaintenanceStatus(data);
    } catch (error) {
      console.error('Erreur chargement statut maintenance:', error);
    }
  };

  const handleToggleMaintenance = async (isActive, endDate, message) => {
    try {
      await maintenanceAPI.toggle({ isActive, endDate, message });
      await loadMaintenanceStatus();
      setShowMaintenanceModal(false);
    } catch (error) {
      console.error('Erreur modification maintenance:', error);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navItems = [
    { path: '/', icon: Home, label: 'Dashboard' },
    { path: '/clients', icon: Users, label: 'Clients' },
    { path: '/interventions', icon: Wrench, label: 'Interventions' },
    { path: '/calendrier', icon: Calendar, label: 'Calendrier' },
    { path: '/stock', icon: Package, label: 'Stock', badge: stockAlertes },
    { path: '/appareils-pret', icon: MonitorSmartphone, label: 'Appareils de prêt', badge: appareilsPretesCount },
    { path: '/facturation', icon: FileText, label: 'Facturation' },
    { path: '/fiches-internes', icon: FileStack, label: 'Fiches Internes' },
    { path: '/vehicules', icon: Truck, label: 'Vehicules' },
    { path: '/parametres', icon: Settings, label: 'Parametres' }
  ];

  return (
    <div className="app-container">
      {/* Overlay mobile */}
      {isMobileMenuOpen && (
        <div
          className="sidebar-overlay"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`sidebar ${isMobileMenuOpen ? 'sidebar-open' : ''}`}>
        <div className="sidebar-logo">
          <img src={logoEDS} alt="EDS Logo" className="sidebar-logo-img" />
          <div className="sidebar-logo-text">EDS22</div>
        </div>

        <nav className="sidebar-nav">
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`nav-item ${location.pathname === item.path ? 'active' : ''}`}
              onClick={() => setIsMobileMenuOpen(false)}
            >
              <item.icon size={20} />
              <span>{item.label}</span>
              {item.badge > 0 && <span className="nav-badge">{item.badge}</span>}
            </Link>
          ))}
        </nav>

        <div className="nav-divider"></div>

        <div className="nav-item" onClick={() => { setIsMobileMenuOpen(false); handleLogout(); }} style={{ cursor: 'pointer' }}>
          <LogOut size={20} />
          <span>Déconnexion</span>
        </div>
      </aside>

      {/* Header */}
      <header className="header">
        <button
          className="hamburger-btn"
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          aria-label="Menu"
        >
          <Menu size={24} />
        </button>

        <div className="header-search">
          <Search size={18} className="header-search-icon" />
          <input type="text" placeholder="Rechercher un client, une intervention..." />
        </div>

        <div className="header-actions">
          <div className="header-notification">
            <Bell size={18} />
            {stockAlertes > 0 && <div className="notification-dot"></div>}
          </div>

          <div className="header-user" ref={userMenuRef} style={{ position: 'relative' }}>
            <div
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="header-user-trigger"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 'var(--space-2)',
                cursor: 'pointer',
                padding: '6px 10px',
                borderRadius: 'var(--radius-full)',
                background: 'white',
                boxShadow: 'var(--shadow-xs)',
                transition: 'all var(--transition-fast)'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'var(--neutral-100)';
                e.currentTarget.style.boxShadow = 'var(--shadow-md)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'white';
                e.currentTarget.style.boxShadow = 'var(--shadow-xs)';
              }}
            >
              <div className="user-avatar" style={{ width: '32px', height: '32px', fontSize: '0.75rem' }}>
                {user?.nom?.charAt(0) || 'U'}
              </div>
              <div className="user-info">
                <div className="user-name" style={{ fontWeight: 600, fontSize: '0.8125rem' }}>{user?.nom}</div>
                <div className="user-role" style={{ fontSize: '0.6875rem', color: 'var(--neutral-500)' }}>
                  {user?.role === 'admin' ? 'Administrateur' : 'Technicien'}
                </div>
              </div>
              <ChevronDown
                className="user-chevron"
                size={14}
                style={{
                  color: 'var(--neutral-500)',
                  transition: 'transform var(--transition-fast)',
                  transform: showUserMenu ? 'rotate(180deg)' : 'rotate(0deg)'
                }}
              />
            </div>

            {/* Menu déroulant */}
            {showUserMenu && (
              <div style={{
                position: 'absolute',
                top: 'calc(100% + var(--space-2))',
                right: 0,
                background: 'white',
                borderRadius: 'var(--radius-lg)',
                boxShadow: 'var(--shadow-lg)',
                border: '1px solid var(--neutral-200)',
                minWidth: '180px',
                zIndex: 1000,
                overflow: 'hidden'
              }}>
                <div style={{
                  padding: '8px 12px',
                  borderBottom: '1px solid var(--neutral-200)',
                  background: 'var(--neutral-50)'
                }}>
                  <div style={{ fontSize: '0.6875rem', color: 'var(--neutral-600)', fontWeight: 600 }}>
                    {user?.email}
                  </div>
                </div>
                {user?.role === 'admin' && (
                  <div
                    onClick={() => setShowMaintenanceModal(true)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 'var(--space-2)',
                      padding: '8px 12px',
                      cursor: 'pointer',
                      color: maintenanceStatus?.isActive ? 'var(--amber-600)' : 'var(--neutral-700)',
                      transition: 'background var(--transition-fast)',
                      fontSize: '0.8125rem',
                      fontWeight: 500
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.background = 'var(--neutral-100)'}
                    onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                  >
                    <WrenchIcon size={16} />
                    <span>Mode maintenance</span>
                    {maintenanceStatus?.isActive && (
                      <span style={{
                        marginLeft: 'auto',
                        width: '8px',
                        height: '8px',
                        borderRadius: '50%',
                        background: 'var(--amber-500)'
                      }} />
                    )}
                  </div>
                )}
                <div
                  onClick={handleLogout}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 'var(--space-2)',
                    padding: '8px 12px',
                    cursor: 'pointer',
                    color: 'var(--red-600)',
                    transition: 'background var(--transition-fast)',
                    fontSize: '0.8125rem',
                    fontWeight: 500
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.background = 'var(--red-50)'}
                  onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                >
                  <LogOut size={16} />
                  <span>Se déconnecter</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="main-content">
        {children}
      </main>

      {/* Modal Maintenance */}
      {showMaintenanceModal && (
        <MaintenanceModal
          maintenanceStatus={maintenanceStatus}
          onClose={() => setShowMaintenanceModal(false)}
          onSave={handleToggleMaintenance}
        />
      )}
    </div>
  );
};

// Composant Modal Maintenance
const MaintenanceModal = ({ maintenanceStatus, onClose, onSave }) => {
  const [isActive, setIsActive] = useState(maintenanceStatus?.isActive || false);
  const [endDate, setEndDate] = useState(
    maintenanceStatus?.endDate 
      ? new Date(maintenanceStatus.endDate).toISOString().slice(0, 16)
      : ''
  );
  const [message, setMessage] = useState(maintenanceStatus?.message || '');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (isActive && !endDate) {
      alert('Veuillez sélectionner une date et heure de fin de maintenance');
      return;
    }
    onSave(isActive, endDate, message);
  };

  return (
    <div className="modal-container" style={{ zIndex: 2000 }} onClick={onClose}>
      <div className="modal-content" style={{
        background: 'white',
        borderRadius: 'var(--radius-xl)',
        padding: 'var(--space-6)',
        maxWidth: '500px',
        width: '100%',
        boxShadow: 'var(--shadow-xl)',
        maxHeight: '90vh',
        overflowY: 'auto'
      }} onClick={(e) => e.stopPropagation()}>
        <h2 style={{
          fontSize: '1.5rem',
          fontWeight: 700,
          marginBottom: 'var(--space-6)',
          color: 'var(--primary-700)'
        }}>
          Mode Maintenance
        </h2>

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: 'var(--space-4)' }}>
            <label style={{
              display: 'flex',
              alignItems: 'center',
              gap: 'var(--space-2)',
              cursor: 'pointer',
              fontSize: '0.875rem',
              fontWeight: 500
            }}>
              <input
                type="checkbox"
                checked={isActive}
                onChange={(e) => setIsActive(e.target.checked)}
                style={{ width: '18px', height: '18px', cursor: 'pointer' }}
              />
              <span>Activer le mode maintenance</span>
            </label>
          </div>

          {isActive && (
            <>
              <div className="form-group" style={{ marginBottom: 'var(--space-4)' }}>
                <label className="form-label">
                  Date et heure de fin de maintenance
                </label>
                <input
                  type="datetime-local"
                  className="form-input"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  required={isActive}
                  min={new Date().toISOString().slice(0, 16)}
                />
              </div>

              <div className="form-group" style={{ marginBottom: 'var(--space-6)' }}>
                <label className="form-label">
                  Message de maintenance (optionnel)
                </label>
                <textarea
                  className="form-input"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  rows={3}
                  placeholder="L'application est actuellement en maintenance. Veuillez réessayer plus tard."
                />
              </div>
            </>
          )}

          <div style={{
            display: 'flex',
            gap: 'var(--space-3)',
            justifyContent: 'flex-end'
          }}>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={onClose}
            >
              Annuler
            </button>
            <button
              type="submit"
              className="btn btn-primary"
            >
              {isActive ? 'Activer' : 'Désactiver'} la maintenance
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Layout;
