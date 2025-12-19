import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Lock, Mail } from 'lucide-react';
import logoEDS from '../assets/Logo-eds-vert.svg';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const result = await login(email, password);

    if (result.success) {
      navigate('/');
    } else {
      setError(result.message);
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(135deg, var(--neutral-50) 0%, var(--primary-50) 100%)',
      padding: 'var(--space-6)'
    }}>
      <div style={{
        width: '100%',
        maxWidth: '420px'
      }}>
        {/* Logo et titre */}
        <div style={{
          textAlign: 'center',
          marginBottom: 'var(--space-8)'
        }}>
          <div style={{
            width: '80px',
            height: '80px',
            margin: '0 auto var(--space-4)',
            borderRadius: 'var(--radius-xl)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: 'var(--shadow-glow)',
            overflow: 'hidden',
            background: 'white',
            padding: '8px'
          }}>
            <img 
              src={logoEDS} 
              alt="EDS Logo" 
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'contain'
              }}
            />
          </div>
          <h1 style={{
            fontSize: '2rem',
            fontWeight: 700,
            color: 'var(--primary-600)',
            marginBottom: 'var(--space-2)'
          }}>
            EDS22
          </h1>
          <p style={{
            color: 'var(--neutral-600)',
            fontSize: '0.875rem'
          }}>
            Gestion Réparation Électroménager
          </p>
        </div>

        {/* Formulaire de connexion */}
        <div className="card" style={{
          padding: 'var(--space-8)'
        }}>
          <h2 style={{
            fontSize: '1.5rem',
            fontWeight: 600,
            marginBottom: 'var(--space-6)',
            textAlign: 'center'
          }}>
            Connexion
          </h2>

          {error && (
            <div style={{
              padding: 'var(--space-4)',
              marginBottom: 'var(--space-4)',
              background: 'rgba(220, 38, 38, 0.1)',
              border: '1px solid var(--red-500)',
              borderRadius: 'var(--radius-md)',
              color: 'var(--red-600)',
              fontSize: '0.875rem'
            }}>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">
                <Mail size={16} style={{ display: 'inline', marginRight: '6px' }} />
                Email
              </label>
              <input
                type="email"
                className="form-input"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@eds22.com"
                required
                autoFocus
              />
            </div>

            <div className="form-group">
              <label className="form-label">
                <Lock size={16} style={{ display: 'inline', marginRight: '6px' }} />
                Mot de passe
              </label>
              <input
                type="password"
                className="form-input"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
              />
            </div>

            <button
              type="submit"
              className="btn btn-primary"
              style={{
                width: '100%',
                marginTop: 'var(--space-6)',
                padding: 'var(--space-4)'
              }}
              disabled={loading}
            >
              {loading ? 'Connexion...' : 'Se connecter'}
            </button>
          </form>

          <div style={{
            marginTop: 'var(--space-6)',
            padding: 'var(--space-4)',
            background: 'var(--primary-50)',
            borderRadius: 'var(--radius-md)',
            fontSize: '0.75rem',
            color: 'var(--neutral-600)'
          }}>
            <strong>Identifiants de test :</strong><br />
            Email: admin@eds22.com<br />
            Mot de passe: admin123
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
