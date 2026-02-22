import { useState, useEffect } from 'react';
import { User, Lock, SlidersHorizontal, ShieldAlert, Users, Eye, EyeOff, Trash2, Plus, Save, CheckCircle, AlertCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { users as usersAPI, maintenance as maintenanceAPI } from '../services/api';

// Composant de notification toast simple
const Toast = ({ message, type, onClose }) => (
  <div style={{
    position: 'fixed',
    top: 'var(--space-6)',
    right: 'var(--space-6)',
    background: type === 'success' ? 'var(--primary-600)' : 'var(--red-600)',
    color: 'white',
    padding: 'var(--space-3) var(--space-5)',
    borderRadius: 'var(--radius-lg)',
    boxShadow: 'var(--shadow-lg)',
    display: 'flex',
    alignItems: 'center',
    gap: 'var(--space-2)',
    zIndex: 9999,
    fontSize: '0.875rem',
    fontWeight: 500,
    animation: 'fadeIn 0.2s ease'
  }}>
    {type === 'success' ? <CheckCircle size={16} /> : <AlertCircle size={16} />}
    {message}
  </div>
);

const Parametres = () => {
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState('compte');
  const [toast, setToast] = useState(null);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  const tabs = [
    { id: 'compte', label: 'Mon Compte', icon: User },
    { id: 'preferences', label: 'Préférences', icon: SlidersHorizontal },
    ...(user?.role === 'admin' ? [
      { id: 'maintenance', label: 'Maintenance', icon: ShieldAlert },
      { id: 'utilisateurs', label: 'Utilisateurs', icon: Users },
    ] : [])
  ];

  return (
    <div className="animate-fade-in">
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      <div className="page-header">
        <h1 className="page-title">Paramètres</h1>
      </div>

      {/* Onglets */}
      <div style={{
        display: 'flex',
        gap: 'var(--space-2)',
        marginBottom: 'var(--space-6)',
        borderBottom: '2px solid var(--neutral-200)',
        paddingBottom: '0'
      }}>
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 'var(--space-2)',
              padding: 'var(--space-3) var(--space-4)',
              background: 'none',
              border: 'none',
              borderBottom: activeTab === tab.id ? '2px solid var(--primary-600)' : '2px solid transparent',
              marginBottom: '-2px',
              color: activeTab === tab.id ? 'var(--primary-600)' : 'var(--neutral-500)',
              fontWeight: activeTab === tab.id ? 600 : 400,
              fontSize: '0.9rem',
              cursor: 'pointer',
              transition: 'all var(--transition-fast)',
              fontFamily: 'inherit'
            }}
          >
            <tab.icon size={18} />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Contenu des onglets */}
      {activeTab === 'compte' && <SectionCompte showToast={showToast} user={user} logout={logout} />}
      {activeTab === 'preferences' && <SectionPreferences showToast={showToast} />}
      {activeTab === 'maintenance' && user?.role === 'admin' && <SectionMaintenance showToast={showToast} />}
      {activeTab === 'utilisateurs' && user?.role === 'admin' && <SectionUtilisateurs showToast={showToast} currentUser={user} />}
    </div>
  );
};

// --- Section Mon Compte ---
const SectionCompte = ({ showToast, user, logout }) => {
  const [nom, setNom] = useState(user?.nom || '');
  const [email, setEmail] = useState(user?.email || '');
  const [loadingProfile, setLoadingProfile] = useState(false);

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [loadingPassword, setLoadingPassword] = useState(false);

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    if (!nom.trim()) return showToast('Le nom est requis', 'error');
    setLoadingProfile(true);
    try {
      const { data } = await usersAPI.updateMe({ nom: nom.trim(), email: email.trim() });
      // Mettre à jour localStorage
      const stored = JSON.parse(localStorage.getItem('user') || '{}');
      localStorage.setItem('user', JSON.stringify({ ...stored, nom: data.user.nom, email: data.user.email }));
      showToast('Profil mis à jour avec succès');
    } catch (err) {
      showToast(err.response?.data?.message || 'Erreur lors de la mise à jour', 'error');
    } finally {
      setLoadingProfile(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (!currentPassword || !newPassword || !confirmPassword) {
      return showToast('Tous les champs sont requis', 'error');
    }
    if (newPassword !== confirmPassword) {
      return showToast('Les nouveaux mots de passe ne correspondent pas', 'error');
    }
    if (newPassword.length < 6) {
      return showToast('Le mot de passe doit faire au moins 6 caractères', 'error');
    }
    setLoadingPassword(true);
    try {
      await usersAPI.changePassword({ currentPassword, newPassword });
      showToast('Mot de passe modifié avec succès');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      showToast(err.response?.data?.message || 'Erreur lors du changement de mot de passe', 'error');
    } finally {
      setLoadingPassword(false);
    }
  };

  return (
    <div style={{ display: 'grid', gap: 'var(--space-6)', maxWidth: '600px' }}>
      {/* Infos profil */}
      <div className="card" style={{ padding: 'var(--space-6)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', marginBottom: 'var(--space-6)' }}>
          <div className="user-avatar" style={{ width: '48px', height: '48px', fontSize: '1.25rem', flexShrink: 0 }}>
            {user?.nom?.charAt(0) || 'U'}
          </div>
          <div>
            <h2 style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--neutral-800)' }}>Informations du compte</h2>
            <p style={{ fontSize: '0.8rem', color: 'var(--neutral-500)', marginTop: '2px' }}>
              {user?.role === 'admin' ? 'Administrateur' : 'Technicien'}
            </p>
          </div>
        </div>

        <form onSubmit={handleSaveProfile} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
          <div className="form-group">
            <label className="form-label">Nom complet</label>
            <input
              type="text"
              className="form-input"
              value={nom}
              onChange={(e) => setNom(e.target.value)}
              placeholder="Votre nom"
            />
          </div>
          <div className="form-group">
            <label className="form-label">Adresse email</label>
            <input
              type="email"
              className="form-input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="votre@email.com"
            />
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <button type="submit" className="btn btn-primary" disabled={loadingProfile}>
              <Save size={16} />
              {loadingProfile ? 'Enregistrement...' : 'Enregistrer'}
            </button>
          </div>
        </form>
      </div>

      {/* Changement de mot de passe */}
      <div className="card" style={{ padding: 'var(--space-6)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', marginBottom: 'var(--space-6)' }}>
          <Lock size={22} color="var(--primary-600)" />
          <h2 style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--neutral-800)' }}>Changer le mot de passe</h2>
        </div>

        <form onSubmit={handleChangePassword} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
          <div className="form-group">
            <label className="form-label">Mot de passe actuel</label>
            <div style={{ position: 'relative' }}>
              <input
                type={showCurrent ? 'text' : 'password'}
                className="form-input"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="••••••••"
                style={{ paddingRight: 'var(--space-10)' }}
              />
              <button
                type="button"
                onClick={() => setShowCurrent(!showCurrent)}
                style={{ position: 'absolute', right: 'var(--space-3)', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--neutral-400)' }}
              >
                {showCurrent ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Nouveau mot de passe</label>
            <div style={{ position: 'relative' }}>
              <input
                type={showNew ? 'text' : 'password'}
                className="form-input"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="••••••••"
                style={{ paddingRight: 'var(--space-10)' }}
              />
              <button
                type="button"
                onClick={() => setShowNew(!showNew)}
                style={{ position: 'absolute', right: 'var(--space-3)', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--neutral-400)' }}
              >
                {showNew ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Confirmer le nouveau mot de passe</label>
            <input
              type="password"
              className="form-input"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="••••••••"
            />
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <button type="submit" className="btn btn-primary" disabled={loadingPassword}>
              <Lock size={16} />
              {loadingPassword ? 'Modification...' : 'Modifier le mot de passe'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// --- Section Préférences ---
const SectionPreferences = ({ showToast }) => {
  const [objectifCA, setObjectifCA] = useState(() => parseInt(localStorage.getItem('pref_objectifCA') || '2400'));
  const [seuilStock, setSeuilStock] = useState(() => parseInt(localStorage.getItem('pref_seuilStock') || '3'));
  const [saved, setSaved] = useState(false);

  const handleSave = (e) => {
    e.preventDefault();
    if (objectifCA < 0) return showToast('L\'objectif CA doit être positif', 'error');
    if (seuilStock < 1) return showToast('Le seuil de stock doit être d\'au moins 1', 'error');
    localStorage.setItem('pref_objectifCA', String(objectifCA));
    localStorage.setItem('pref_seuilStock', String(seuilStock));
    showToast('Préférences enregistrées');
  };

  return (
    <div style={{ maxWidth: '600px' }}>
      <div className="card" style={{ padding: 'var(--space-6)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', marginBottom: 'var(--space-6)' }}>
          <SlidersHorizontal size={22} color="var(--primary-600)" />
          <div>
            <h2 style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--neutral-800)' }}>Préférences de l'application</h2>
            <p style={{ fontSize: '0.8rem', color: 'var(--neutral-500)', marginTop: '2px' }}>Ces paramètres sont propres à votre navigateur</p>
          </div>
        </div>

        <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-5)' }}>
          <div className="form-group">
            <label className="form-label">Objectif CA mensuel (€)</label>
            <p style={{ fontSize: '0.8rem', color: 'var(--neutral-500)', marginBottom: 'var(--space-2)' }}>
              Utilisé comme référence sur le dashboard
            </p>
            <input
              type="number"
              className="form-input"
              value={objectifCA}
              onChange={(e) => setObjectifCA(parseInt(e.target.value) || 0)}
              min="0"
              step="100"
              style={{ maxWidth: '200px' }}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Seuil d'alerte stock (unités)</label>
            <p style={{ fontSize: '0.8rem', color: 'var(--neutral-500)', marginBottom: 'var(--space-2)' }}>
              Une alerte est déclenchée quand le stock d'une pièce passe en dessous de ce seuil
            </p>
            <input
              type="number"
              className="form-input"
              value={seuilStock}
              onChange={(e) => setSeuilStock(parseInt(e.target.value) || 1)}
              min="1"
              max="50"
              style={{ maxWidth: '200px' }}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <button type="submit" className="btn btn-primary">
              <Save size={16} />
              Enregistrer les préférences
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// --- Section Maintenance (admin) ---
const SectionMaintenance = ({ showToast }) => {
  const [isActive, setIsActive] = useState(false);
  const [endDate, setEndDate] = useState('');
  const [message, setMessage] = useState('L\'application est actuellement en maintenance. Veuillez réessayer plus tard.');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const { data } = await maintenanceAPI.getStatus();
        setIsActive(data.isActive || false);
        setEndDate(data.endDate ? new Date(data.endDate).toISOString().slice(0, 16) : '');
        setMessage(data.message || message);
      } catch (err) {
        console.error('Erreur chargement maintenance:', err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const handleSave = async (e) => {
    e.preventDefault();
    if (isActive && !endDate) return showToast('Veuillez définir une date de fin', 'error');
    setSaving(true);
    try {
      await maintenanceAPI.toggle({ isActive, endDate, message });
      showToast(isActive ? 'Mode maintenance activé' : 'Mode maintenance désactivé');
    } catch (err) {
      showToast('Erreur lors de la mise à jour', 'error');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div style={{ color: 'var(--neutral-500)', padding: 'var(--space-4)' }}>Chargement...</div>;

  return (
    <div style={{ maxWidth: '600px' }}>
      <div className="card" style={{ padding: 'var(--space-6)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', marginBottom: 'var(--space-6)' }}>
          <ShieldAlert size={22} color={isActive ? 'var(--amber-600)' : 'var(--primary-600)'} />
          <div>
            <h2 style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--neutral-800)' }}>Mode Maintenance</h2>
            <p style={{ fontSize: '0.8rem', color: 'var(--neutral-500)', marginTop: '2px' }}>
              Bloque l'accès aux techniciens pendant les opérations de maintenance
            </p>
          </div>
          {isActive && (
            <span style={{
              marginLeft: 'auto',
              background: 'var(--amber-100)',
              color: 'var(--amber-700)',
              padding: '2px 10px',
              borderRadius: 'var(--radius-full)',
              fontSize: '0.75rem',
              fontWeight: 600
            }}>Actif</span>
          )}
        </div>

        <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={isActive}
              onChange={(e) => setIsActive(e.target.checked)}
              style={{ width: '18px', height: '18px', cursor: 'pointer', accentColor: 'var(--primary-600)' }}
            />
            <span style={{ fontSize: '0.9rem', fontWeight: 500 }}>Activer le mode maintenance</span>
          </label>

          {isActive && (
            <>
              <div className="form-group">
                <label className="form-label">Date et heure de fin</label>
                <input
                  type="datetime-local"
                  className="form-input"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  min={new Date().toISOString().slice(0, 16)}
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">Message affiché aux utilisateurs</label>
                <textarea
                  className="form-input"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  rows={3}
                  placeholder="Message de maintenance..."
                />
              </div>
            </>
          )}

          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <button type="submit" className={`btn ${isActive ? 'btn-danger' : 'btn-primary'}`} disabled={saving}
              style={isActive ? { background: 'var(--amber-600)', color: 'white', border: 'none' } : {}}>
              {saving ? 'Enregistrement...' : isActive ? 'Activer la maintenance' : 'Désactiver la maintenance'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// --- Section Utilisateurs (admin) ---
const SectionUtilisateurs = ({ showToast, currentUser }) => {
  const [userList, setUserList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [newUser, setNewUser] = useState({ nom: '', email: '', password: '', role: 'tech' });
  const [creating, setCreating] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [showPassword, setShowPassword] = useState(false);

  const loadUsers = async () => {
    try {
      const { data } = await usersAPI.getAll();
      setUserList(data.users);
    } catch (err) {
      showToast('Erreur lors du chargement des utilisateurs', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadUsers(); }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!newUser.nom || !newUser.email || !newUser.password) {
      return showToast('Tous les champs sont requis', 'error');
    }
    if (newUser.password.length < 6) {
      return showToast('Le mot de passe doit faire au moins 6 caractères', 'error');
    }
    setCreating(true);
    try {
      await usersAPI.create(newUser);
      showToast(`Utilisateur ${newUser.nom} créé avec succès`);
      setNewUser({ nom: '', email: '', password: '', role: 'tech' });
      setShowForm(false);
      await loadUsers();
    } catch (err) {
      showToast(err.response?.data?.message || 'Erreur lors de la création', 'error');
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async (userId, userName) => {
    if (!confirm(`Supprimer l'utilisateur "${userName}" ? Cette action est irréversible.`)) return;
    setDeletingId(userId);
    try {
      await usersAPI.delete(userId);
      showToast(`Utilisateur ${userName} supprimé`);
      setUserList(prev => prev.filter(u => u._id !== userId));
    } catch (err) {
      showToast(err.response?.data?.message || 'Erreur lors de la suppression', 'error');
    } finally {
      setDeletingId(null);
    }
  };

  if (loading) return <div style={{ color: 'var(--neutral-500)', padding: 'var(--space-4)' }}>Chargement...</div>;

  return (
    <div style={{ maxWidth: '700px', display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
      {/* Liste des utilisateurs */}
      <div className="card" style={{ padding: 'var(--space-6)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--space-5)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
            <Users size={22} color="var(--primary-600)" />
            <h2 style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--neutral-800)' }}>
              Utilisateurs ({userList.length})
            </h2>
          </div>
          <button className="btn btn-primary" onClick={() => setShowForm(!showForm)}>
            <Plus size={16} />
            Ajouter un utilisateur
          </button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
          {userList.map(u => (
            <div key={u._id} style={{
              display: 'flex',
              alignItems: 'center',
              gap: 'var(--space-3)',
              padding: 'var(--space-3) var(--space-4)',
              background: 'var(--neutral-50)',
              borderRadius: 'var(--radius-lg)',
              border: '1px solid var(--neutral-200)'
            }}>
              <div className="user-avatar" style={{ width: '38px', height: '38px', fontSize: '0.9rem', flexShrink: 0 }}>
                {u.nom?.charAt(0) || '?'}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 600, fontSize: '0.875rem', color: 'var(--neutral-800)' }}>
                  {u.nom}
                  {u._id === currentUser?.id && (
                    <span style={{
                      marginLeft: 'var(--space-2)',
                      background: 'var(--primary-100)',
                      color: 'var(--primary-700)',
                      padding: '1px 8px',
                      borderRadius: 'var(--radius-full)',
                      fontSize: '0.7rem',
                      fontWeight: 600
                    }}>Vous</span>
                  )}
                </div>
                <div style={{ fontSize: '0.775rem', color: 'var(--neutral-500)', marginTop: '1px' }}>{u.email}</div>
              </div>
              <span style={{
                background: u.role === 'admin' ? 'var(--primary-100)' : 'var(--neutral-100)',
                color: u.role === 'admin' ? 'var(--primary-700)' : 'var(--neutral-600)',
                padding: '2px 10px',
                borderRadius: 'var(--radius-full)',
                fontSize: '0.75rem',
                fontWeight: 600,
                flexShrink: 0
              }}>
                {u.role === 'admin' ? 'Admin' : 'Technicien'}
              </span>
              {u._id !== currentUser?.id && (
                <button
                  className="btn btn-secondary"
                  onClick={() => handleDelete(u._id, u.nom)}
                  disabled={deletingId === u._id}
                  style={{
                    padding: 'var(--space-2)',
                    color: 'var(--red-600)',
                    borderColor: 'var(--red-200)',
                    background: 'var(--red-50)',
                    minWidth: 'unset'
                  }}
                >
                  <Trash2 size={15} />
                </button>
              )}
            </div>
          ))}
          {userList.length === 0 && (
            <p style={{ color: 'var(--neutral-500)', textAlign: 'center', padding: 'var(--space-4)' }}>
              Aucun utilisateur trouvé
            </p>
          )}
        </div>
      </div>

      {/* Formulaire création */}
      {showForm && (
        <div className="card" style={{ padding: 'var(--space-6)' }}>
          <h3 style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--neutral-800)', marginBottom: 'var(--space-5)' }}>
            Créer un nouvel utilisateur
          </h3>
          <form onSubmit={handleCreate} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)' }}>
              <div className="form-group">
                <label className="form-label">Nom complet</label>
                <input
                  type="text"
                  className="form-input"
                  value={newUser.nom}
                  onChange={(e) => setNewUser(prev => ({ ...prev, nom: e.target.value }))}
                  placeholder="Prénom Nom"
                />
              </div>
              <div className="form-group">
                <label className="form-label">Rôle</label>
                <select
                  className="form-input"
                  value={newUser.role}
                  onChange={(e) => setNewUser(prev => ({ ...prev, role: e.target.value }))}
                >
                  <option value="tech">Technicien</option>
                  <option value="admin">Administrateur</option>
                </select>
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Adresse email</label>
              <input
                type="email"
                className="form-input"
                value={newUser.email}
                onChange={(e) => setNewUser(prev => ({ ...prev, email: e.target.value }))}
                placeholder="prenom@eds22.com"
              />
            </div>
            <div className="form-group">
              <label className="form-label">Mot de passe</label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showPassword ? 'text' : 'password'}
                  className="form-input"
                  value={newUser.password}
                  onChange={(e) => setNewUser(prev => ({ ...prev, password: e.target.value }))}
                  placeholder="Minimum 6 caractères"
                  style={{ paddingRight: 'var(--space-10)' }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{ position: 'absolute', right: 'var(--space-3)', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--neutral-400)' }}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 'var(--space-3)', justifyContent: 'flex-end' }}>
              <button type="button" className="btn btn-secondary" onClick={() => setShowForm(false)}>
                Annuler
              </button>
              <button type="submit" className="btn btn-primary" disabled={creating}>
                <Plus size={16} />
                {creating ? 'Création...' : 'Créer l\'utilisateur'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default Parametres;
