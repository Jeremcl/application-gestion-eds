import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Home, Users, Wrench, Package, FileText, Settings, Search, Bell, LogOut, ChevronDown } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useState, useEffect, useRef } from 'react';
import { pieces } from '../services/api';
import logoEDS from '../assets/Logo-eds-vert.svg';

const Layout = ({ children }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [stockAlertes, setStockAlertes] = useState(0);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const userMenuRef = useRef(null);

  useEffect(() => {
    loadStockAlertes();
  }, []);

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

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navItems = [
    { path: '/', icon: Home, label: 'Dashboard' },
    { path: '/clients', icon: Users, label: 'Clients' },
    { path: '/interventions', icon: Wrench, label: 'Interventions' },
    { path: '/stock', icon: Package, label: 'Stock', badge: stockAlertes },
    { path: '/facturation', icon: FileText, label: 'Facturation' },
    { path: '/parametres', icon: Settings, label: 'Paramètres' }
  ];

  return (
    <div className="app-container">
      {/* Sidebar */}
      <aside className="sidebar">
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
            >
              <item.icon size={20} />
              <span>{item.label}</span>
              {item.badge > 0 && <span className="nav-badge">{item.badge}</span>}
            </Link>
          ))}
        </nav>

        <div className="nav-divider"></div>

        <div className="nav-item" onClick={handleLogout} style={{ cursor: 'pointer' }}>
          <LogOut size={20} />
          <span>Déconnexion</span>
        </div>
      </aside>

      {/* Header */}
      <header className="header">
        <div className="header-search">
          <Search size={18} className="header-search-icon" />
          <input type="text" placeholder="Rechercher un client, une intervention..." />
        </div>

        <div className="header-actions">
          <div className="header-notification">
            <Bell size={20} />
            {stockAlertes > 0 && <div className="notification-dot"></div>}
          </div>

          <div className="header-user" ref={userMenuRef} style={{ position: 'relative' }}>
            <div 
              onClick={() => setShowUserMenu(!showUserMenu)}
              style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: 'var(--space-3)',
                cursor: 'pointer',
                padding: 'var(--space-2)',
                borderRadius: 'var(--radius-md)',
                transition: 'background var(--transition-fast)'
              }}
              onMouseEnter={(e) => e.currentTarget.style.background = 'var(--neutral-100)'}
              onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
            >
              <div className="user-avatar">
                {user?.nom?.charAt(0) || 'U'}
              </div>
              <div>
                <div style={{ fontWeight: 600, fontSize: '0.875rem' }}>{user?.nom}</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--neutral-500)' }}>
                  {user?.role === 'admin' ? 'Administrateur' : 'Technicien'}
                </div>
              </div>
              <ChevronDown 
                size={16} 
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
                minWidth: '200px',
                zIndex: 1000,
                overflow: 'hidden'
              }}>
                <div style={{
                  padding: 'var(--space-2)',
                  borderBottom: '1px solid var(--neutral-200)',
                  background: 'var(--neutral-50)'
                }}>
                  <div style={{ fontSize: '0.75rem', color: 'var(--neutral-600)', fontWeight: 600 }}>
                    {user?.email}
                  </div>
                </div>
                <div
                  onClick={handleLogout}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 'var(--space-3)',
                    padding: 'var(--space-4)',
                    cursor: 'pointer',
                    color: 'var(--red-600)',
                    transition: 'background var(--transition-fast)',
                    fontSize: '0.875rem',
                    fontWeight: 500
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.background = 'var(--red-50)'}
                  onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                >
                  <LogOut size={18} />
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
    </div>
  );
};

export default Layout;
