import { useState, useEffect, useRef } from 'react';
import { TrendingUp, TrendingDown, Wrench, Package, Euro, Users, Send, Sparkles } from 'lucide-react';
import { interventions as interventionsAPI, clients as clientsAPI, pieces as piecesAPI } from '../services/api';
import { ai as aiAPI } from '../services/api';
import InfoBanner from '../components/InfoBanner';

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
  const [placeholder, setPlaceholder] = useState('Voir les statistiques du mois...');
  const messagesEndRef = useRef(null);
  const sessionId = useRef(`session-${Date.now()}`);

  // Récupérer l'utilisateur connecté
  const currentUser = JSON.parse(localStorage.getItem('user') || '{}');

  useEffect(() => {
    loadDashboardData();
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Animation typewriter pour le placeholder
  useEffect(() => {
    const suggestions = [
      'Voir les statistiques du mois...',
      'Rechercher un client...',
      'Vérifier le stock critique...',
      'Consulter les interventions en cours...',
      'Analyser le chiffre d\'affaires...',
      'Voir les alertes stock...'
    ];

    let currentIndex = 0;
    let charIndex = 0;
    let isDeleting = false;
    let isPaused = false;

    const typewriter = () => {
      const currentSuggestion = suggestions[currentIndex];

      if (isPaused) {
        return;
      }

      if (!isDeleting && charIndex <= currentSuggestion.length) {
        // Écrire lettre par lettre
        setPlaceholder(currentSuggestion.substring(0, charIndex));
        charIndex++;

        if (charIndex > currentSuggestion.length) {
          // Pause avant de commencer à effacer
          isPaused = true;
          setTimeout(() => {
            isPaused = false;
            isDeleting = true;
          }, 2000);
        }
      } else if (isDeleting) {
        charIndex--;

        if (charIndex === 0) {
          // Changer immédiatement de suggestion sans afficher de vide
          isDeleting = false;
          currentIndex = (currentIndex + 1) % suggestions.length;
          // Commencer directement avec la première lettre de la nouvelle suggestion
          const nextSuggestion = suggestions[currentIndex];
          setPlaceholder(nextSuggestion.substring(0, 1));
          charIndex = 1;
        } else {
          // Effacer lettre par lettre
          setPlaceholder(currentSuggestion.substring(0, charIndex));
        }
      }
    };

    const interval = setInterval(typewriter, isDeleting ? 50 : 100);

    return () => clearInterval(interval);
  }, []);

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
      console.log('📤 Envoi message:', messageText);
      const response = await aiAPI.chat(messageText, sessionId.current);
      console.log('📥 Réponse brute:', response);

      const data = response.data;
      console.log('📊 Data extraite:', data);

      if (!data || !data.message) {
        throw new Error('Réponse invalide du serveur: ' + JSON.stringify(data));
      }

      setTimeout(() => {
        const assistantMessage = {
          role: 'assistant',
          content: data.message,
          timestamp: new Date()
        };
        console.log('✅ Ajout message assistant:', assistantMessage);
        setMessages(prev => [...prev, assistantMessage]);
        setIsTyping(false);
      }, 500);
    } catch (error) {
      console.error('❌ Erreur chat AI:', error);
      console.error('❌ Détails erreur:', error.response || error.message);
      console.error('❌ Data de la réponse:', error.response?.data);

      // Afficher un message d'erreur à l'utilisateur
      const errorMsg = error.response?.data?.message || error.response?.data?.error || error.message || 'Impossible de contacter le serveur';
      const errorMessage = {
        role: 'assistant',
        content: `⚠️ Erreur serveur: ${errorMsg}\n\nVeuillez vérifier les logs du backend pour plus de détails.`,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
      setIsTyping(false);
    }
  };

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
      icon: Euro,
      label: 'CA Mensuel',
      value: `${stats.caMensuel.toFixed(0)}€`,
      trend: '',
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
        {/* Info Banner - Date, Heure, Météo */}
        <InfoBanner />
      </div>

      {/* CHATBOT IA - Interface complète */}
      <div className="chatbot-container" style={{
        background: 'white',
        borderRadius: 'var(--radius-xl)',
        boxShadow: 'var(--shadow-md)',
        marginBottom: 'var(--space-6)',
        border: '2px solid var(--primary-500)',
        overflow: 'hidden',
        transition: 'all var(--transition-base)'
      }}>
        {/* Header de bienvenue */}
        {messages.length === 0 && (
          <div className="chatbot-welcome" style={{
            padding: 'var(--space-6) var(--space-4) var(--space-4)',
            textAlign: 'center',
            borderBottom: '1px solid var(--neutral-100)'
          }}>
            <h2 style={{
              fontSize: '2rem',
              fontWeight: 300,
              color: 'var(--neutral-800)',
              marginBottom: 'var(--space-3)',
              lineHeight: '1.4',
              letterSpacing: '-0.02em',
              fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif'
            }}>
              Bonjour <span style={{
                color: 'var(--primary-500)',
                fontWeight: 600,
                background: 'linear-gradient(135deg, var(--primary-500) 0%, var(--emerald-500) 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text'
              }}>{currentUser.nom || 'Admin'}</span> 👋
            </h2>
            <p style={{
              fontSize: '1.125rem',
              color: 'var(--neutral-600)',
              fontWeight: 300,
              letterSpacing: '0.01em'
            }}>
              Comment puis-je vous aider aujourd'hui ?
            </p>
          </div>
        )}

        {/* Historique des messages */}
        <div style={{
          maxHeight: messages.length === 0 ? '0px' : '400px',
          overflowY: 'auto',
          padding: messages.length === 0 ? '0' : 'var(--space-4)',
          display: 'flex',
          flexDirection: 'column',
          gap: 'var(--space-3)',
          transition: 'all 0.3s ease'
        }}>
          {messages.map((message, index) => (
            <div
              key={index}
              style={{
                display: 'flex',
                gap: 'var(--space-3)',
                alignItems: 'flex-start',
                justifyContent: message.role === 'user' ? 'flex-end' : 'flex-start'
              }}
            >
              {message.role === 'assistant' && (
                <div style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: 'var(--radius-lg)',
                  background: 'var(--gradient-primary)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'white',
                  flexShrink: 0
                }}>
                  <Sparkles size={16} />
                </div>
              )}
              <div className="chatbot-message-bubble" style={{
                maxWidth: '70%',
                padding: 'var(--space-3) var(--space-4)',
                borderRadius: 'var(--radius-lg)',
                background: message.role === 'user' ? 'var(--primary-500)' : 'var(--neutral-100)',
                color: message.role === 'user' ? 'white' : 'var(--neutral-900)',
                fontSize: '0.875rem',
                lineHeight: '1.5'
              }}>
                {message.content}
              </div>
            </div>
          ))}

          {/* Indicateur de typing */}
          {isTyping && (
            <div style={{
              display: 'flex',
              gap: 'var(--space-3)',
              alignItems: 'flex-start'
            }}>
              <div style={{
                width: '32px',
                height: '32px',
                borderRadius: 'var(--radius-lg)',
                background: 'var(--gradient-primary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'white',
                flexShrink: 0
              }}>
                <Sparkles size={16} />
              </div>
              <div style={{
                padding: 'var(--space-3) var(--space-4)',
                borderRadius: 'var(--radius-lg)',
                background: 'var(--neutral-100)',
                color: 'var(--neutral-600)',
                fontSize: '0.875rem'
              }}>
                <span className="typing-dots">●●●</span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Barre de séparation */}
        <div style={{ height: '1px', background: 'var(--neutral-200)' }} />

        {/* Barre de saisie */}
        <div style={{ padding: 'var(--space-4)' }}>
          <div className="chatbot-input-container" style={{
            display: 'flex',
            gap: 'var(--space-3)',
            alignItems: 'center'
          }}>
            <input
              type="text"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
              placeholder={placeholder}
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
        </div>
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
