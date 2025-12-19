import { useState, useEffect, useRef } from 'react';
import { TrendingUp, TrendingDown, Wrench, Package, DollarSign, Users, Send, Sparkles } from 'lucide-react';
import { interventions as interventionsAPI, clients as clientsAPI, pieces as piecesAPI } from '../services/api';
import { ai as aiAPI } from '../services/api';

const Dashboard = () => {
  const [stats, setStats] = useState({
    interventionsJour: 0,
    interventionsSemaine: 0,
    interventionsMois: 0,
    caMensuel: 0
  });
  const [stockAlertes, setStockAlertes] = useState(0);
  const [totalClients, setTotalClients] = useState(0);
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);
  const sessionId = useRef(`session-${Date.now()}`);

  useEffect(() => {
    loadDashboardData();
    // Message de bienvenue de l'assistant
    setMessages([{
      role: 'assistant',
      content: 'Bienvenue sur EDS22 ! Je suis votre assistant intelligent. Je peux vous aider à consulter vos statistiques, gérer vos clients, suivre vos interventions et contrôler votre stock. Comment puis-je vous aider aujourd\'hui ?',
      timestamp: new Date()
    }]);
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const loadDashboardData = async () => {
    try {
      // Charger les stats des interventions
      const { data: statsData } = await interventionsAPI.getStats();
      setStats({
        interventionsJour: statsData.interventionsJour,
        interventionsSemaine: statsData.interventionsSemaine,
        interventionsMois: statsData.interventionsMois,
        caMensuel: statsData.caMensuel[0]?.total || 0
      });

      // Charger les alertes stock
      const { data: alertesData } = await piecesAPI.getAlertes();
      setStockAlertes(alertesData.count);

      // Charger le nombre de clients
      const { data: clientsData } = await clientsAPI.getAll({ limit: 1 });
      setTotalClients(clientsData.total);
    } catch (error) {
      console.error('Erreur chargement dashboard:', error);
    }
  };

  const handleSendMessage = async (messageText = inputMessage) => {
    if (!messageText.trim()) return;

    const userMessage = {
      role: 'user',
      content: messageText,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsTyping(true);

    try {
      const { data } = await aiAPI.chat(messageText, sessionId.current);

      setTimeout(() => {
        const assistantMessage = {
          role: 'assistant',
          content: data.message,
          timestamp: new Date()
        };
        setMessages(prev => [...prev, assistantMessage]);
        setIsTyping(false);
      }, 500);
    } catch (error) {
      console.error('Erreur chat AI:', error);
      setIsTyping(false);
    }
  };

  const suggestions = [
    '📊 Voir les stats du mois',
    '🔍 Rechercher un client',
    '⚙️ Créer une nouvelle intervention',
    '📦 Vérifier le stock critique'
  ];

  const metricCards = [
    {
      icon: Wrench,
      label: 'Interventions Aujourd\'hui',
      value: stats.interventionsJour,
      trend: '+12%',
      positive: true
    },
    {
      icon: Users,
      label: 'Total Clients',
      value: totalClients,
      trend: '+8%',
      positive: true
    },
    {
      icon: DollarSign,
      label: 'CA Mensuel',
      value: `${stats.caMensuel.toFixed(0)}€`,
      trend: '+15%',
      positive: true
    },
    {
      icon: Package,
      label: 'Alertes Stock',
      value: stockAlertes,
      trend: stockAlertes > 0 ? 'Critique' : 'OK',
      positive: stockAlertes === 0
    }
  ];

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <h1 className="page-title">Dashboard</h1>
        <p className="page-subtitle">Vue d'ensemble de votre activité</p>
      </div>

      {/* BARRE DE CHAT IA - En première position */}
      <div style={{
        background: 'white',
        borderRadius: 'var(--radius-xl)',
        padding: 'var(--space-4)',
        boxShadow: 'var(--shadow-md)',
        marginBottom: 'var(--space-6)',
        border: '1px solid var(--neutral-200)'
      }}>
        <div style={{
          display: 'flex',
          gap: 'var(--space-3)',
          alignItems: 'center'
        }}>
          <div style={{
            width: '40px',
            height: '40px',
            borderRadius: 'var(--radius-lg)',
            background: 'var(--gradient-primary)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'white',
            flexShrink: 0
          }}>
            <Sparkles size={20} />
          </div>
          <input
            type="text"
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
            placeholder="Posez une question à l'assistant IA..."
            style={{
              flex: 1,
              padding: 'var(--space-3) var(--space-4)',
              borderRadius: 'var(--radius-full)',
              border: '2px solid var(--neutral-200)',
              background: 'var(--neutral-50)',
              fontSize: '0.875rem',
              transition: 'all var(--transition-fast)'
            }}
            onFocus={(e) => e.target.style.borderColor = 'var(--primary-500)'}
            onBlur={(e) => e.target.style.borderColor = 'var(--neutral-200)'}
          />
          <button
            className="btn btn-primary"
            onClick={() => handleSendMessage()}
            style={{
              width: '44px',
              height: '44px',
              borderRadius: 'var(--radius-full)',
              padding: 0,
              flexShrink: 0
            }}
          >
            <Send size={18} />
          </button>
        </div>
        {/* Suggestions compactes */}
        {messages.length <= 1 && (
          <div style={{
            display: 'flex',
            gap: 'var(--space-2)',
            marginTop: 'var(--space-3)',
            flexWrap: 'wrap'
          }}>
            {suggestions.map((suggestion, index) => (
              <button
                key={index}
                className="btn btn-secondary"
                style={{
                  fontSize: '0.75rem',
                  padding: '6px 12px',
                  borderRadius: 'var(--radius-full)'
                }}
                onClick={() => handleSendMessage(suggestion)}
              >
                {suggestion}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Cartes métriques */}
      <div className="grid grid-4 mb-6">
        {metricCards.map((card, index) => (
          <div key={index} className="metric-card animate-slide-in" style={{ animationDelay: `${index * 0.1}s` }}>
            <div className="metric-icon">
              <card.icon size={32} />
            </div>
            <div className="metric-content">
              <div className="metric-label">{card.label}</div>
              <div className="metric-value">{card.value}</div>
              <div className={`metric-trend ${card.positive ? 'positive' : 'negative'}`}>
                {card.positive ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
                <span>{card.trend}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Section activité récente */}
      <div className="grid grid-2">
        <div className="card">
          <h3 style={{ marginBottom: 'var(--space-4)' }}>Interventions récentes</h3>
          <div style={{ color: 'var(--neutral-600)', fontSize: '0.875rem' }}>
            {stats.interventionsSemaine} interventions cette semaine
          </div>
        </div>

        <div className="card">
          <h3 style={{ marginBottom: 'var(--space-4)' }}>Alertes Stock</h3>
          <div style={{
            color: stockAlertes > 0 ? 'var(--red-600)' : 'var(--emerald-600)',
            fontSize: '0.875rem',
            fontWeight: 600
          }}>
            {stockAlertes > 0 ? `⚠️ ${stockAlertes} pièce(s) en stock critique` : '✅ Stock OK'}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
