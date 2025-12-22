import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Layout from './components/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Clients from './pages/Clients';
import ClientDetail from './pages/ClientDetail';
import DeviceDetail from './pages/DeviceDetail';
import Interventions from './pages/Interventions';
import InterventionDetail from './pages/InterventionDetail';
import Stock from './pages/Stock';
import Facturation from './pages/Facturation';
import AppareilsPret from './pages/AppareilsPret';
import AppareilPretDetail from './pages/AppareilPretDetail';
import './styles/index.css';

// Protected Route Component
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated } = useAuth();
  return isAuthenticated ? children : <Navigate to="/login" />;
};

// App Routes
const AppRoutes = () => {
  const { isAuthenticated } = useAuth();

  return (
    <Routes>
      <Route
        path="/login"
        element={isAuthenticated ? <Navigate to="/" /> : <Login />}
      />
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <Layout>
              <Dashboard />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/clients"
        element={
          <ProtectedRoute>
            <Layout>
              <Clients />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/clients/:clientId"
        element={
          <ProtectedRoute>
            <Layout>
              <ClientDetail />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/clients/:clientId/appareils/:appareilId"
        element={
          <ProtectedRoute>
            <Layout>
              <DeviceDetail />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/interventions"
        element={
          <ProtectedRoute>
            <Layout>
              <Interventions />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/interventions/:interventionId"
        element={
          <ProtectedRoute>
            <Layout>
              <InterventionDetail />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/stock"
        element={
          <ProtectedRoute>
            <Layout>
              <Stock />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/appareils-pret"
        element={
          <ProtectedRoute>
            <Layout>
              <AppareilsPret />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/appareils-pret/:appareilId"
        element={
          <ProtectedRoute>
            <Layout>
              <AppareilPretDetail />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/facturation"
        element={
          <ProtectedRoute>
            <Layout>
              <Facturation />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/parametres"
        element={
          <ProtectedRoute>
            <Layout>
              <div className="card" style={{ padding: 'var(--space-8)', textAlign: 'center' }}>
                <h2>Paramètres</h2>
                <p style={{ color: 'var(--neutral-600)', marginTop: 'var(--space-4)' }}>
                  Page de paramètres en construction
                </p>
              </div>
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
};

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
