import { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Clock, MapPin, User, Plus, Edit2 } from 'lucide-react';
import { interventions as interventionsAPI } from '../services/api';
import InterventionModal from '../components/InterventionModal';
import { useNavigate } from 'react-router-dom';

const Calendrier = () => {
  const navigate = useNavigate();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [interventions, setInterventions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(null);
  const [showInterventionModal, setShowInterventionModal] = useState(false);
  const [prefilledDate, setPrefilledDate] = useState(null);
  const [hoveredDay, setHoveredDay] = useState(null);

  const monthNames = [
    'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
    'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
  ];

  const dayNames = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];

  useEffect(() => {
    loadInterventions();
  }, [currentDate]);

  const loadInterventions = async () => {
    try {
      setLoading(true);
      const { data } = await interventionsAPI.getAll({});
      setInterventions(data.interventions);
    } catch (error) {
      console.error('Erreur chargement interventions:', error);
    } finally {
      setLoading(false);
    }
  };

  const getDaysInMonth = (date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = (firstDay.getDay() + 6) % 7; // Lundi = 0

    const days = [];

    // Jours du mois précédent
    for (let i = 0; i < startingDayOfWeek; i++) {
      const prevDate = new Date(year, month, -startingDayOfWeek + i + 1);
      days.push({ date: prevDate, isCurrentMonth: false });
    }

    // Jours du mois actuel
    for (let i = 1; i <= daysInMonth; i++) {
      days.push({ date: new Date(year, month, i), isCurrentMonth: true });
    }

    // Jours du mois suivant pour compléter la grille
    const remainingDays = 42 - days.length; // 6 semaines * 7 jours
    for (let i = 1; i <= remainingDays; i++) {
      days.push({ date: new Date(year, month + 1, i), isCurrentMonth: false });
    }

    return days;
  };

  const getInterventionsForDate = (date) => {
    return interventions.filter(intervention => {
      const interventionDate = intervention.datePrevue
        ? new Date(intervention.datePrevue)
        : new Date(intervention.dateCreation);

      return interventionDate.getDate() === date.getDate() &&
             interventionDate.getMonth() === date.getMonth() &&
             interventionDate.getFullYear() === date.getFullYear();
    });
  };

  const previousMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  const isToday = (date) => {
    const today = new Date();
    return date.getDate() === today.getDate() &&
           date.getMonth() === today.getMonth() &&
           date.getFullYear() === today.getFullYear();
  };

  const isPastDate = (date) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const compareDate = new Date(date);
    compareDate.setHours(0, 0, 0, 0);
    return compareDate < today;
  };

  const getStatusColor = (statut) => {
    const colors = {
      'Demande': '#D97706',
      'Planifié': '#2563EB',
      'En cours': '#059669',
      'Diagnostic': '#7C3AED',
      'Réparation': '#DC2626',
      'Terminé': '#10B981',
      'Facturé': '#2D5A3D'
    };
    return colors[statut] || '#6B7280';
  };

  const days = getDaysInMonth(currentDate);

  return (
    <div style={{ padding: 'var(--space-6)' }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 'var(--space-6)',
        flexWrap: 'wrap',
        gap: 'var(--space-4)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
          <CalendarIcon size={32} style={{ color: 'var(--primary-500)' }} />
          <h1 style={{ fontSize: '1.875rem', fontWeight: '700', color: 'var(--neutral-900)' }}>
            Calendrier
          </h1>
        </div>
        <button
          onClick={() => setShowInterventionModal(true)}
          className="btn btn-primary"
          style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}
        >
          <Plus size={20} />
          Nouvelle intervention
        </button>
      </div>

      {/* Navigation du calendrier */}
      <div className="card" style={{ marginBottom: 'var(--space-6)' }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 'var(--space-4)'
        }}>
          <button
            onClick={previousMonth}
            className="btn btn-secondary"
            style={{
              padding: 'var(--space-2)',
              display: 'flex',
              alignItems: 'center',
              gap: 'var(--space-2)'
            }}
          >
            <ChevronLeft size={20} />
            Précédent
          </button>

          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
            <h2 style={{ fontSize: '1.5rem', fontWeight: '600', color: 'var(--neutral-900)' }}>
              {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
            </h2>
            <button
              onClick={goToToday}
              className="btn btn-secondary"
              style={{ fontSize: '0.875rem' }}
            >
              Aujourd'hui
            </button>
          </div>

          <button
            onClick={nextMonth}
            className="btn btn-secondary"
            style={{
              padding: 'var(--space-2)',
              display: 'flex',
              alignItems: 'center',
              gap: 'var(--space-2)'
            }}
          >
            Suivant
            <ChevronRight size={20} />
          </button>
        </div>

        {/* Grille du calendrier */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(7, 1fr)',
          gap: '1px',
          background: 'var(--neutral-200)',
          border: '1px solid var(--neutral-200)',
          borderRadius: 'var(--radius-lg)',
          overflow: 'hidden'
        }}>
          {/* En-têtes des jours */}
          {dayNames.map(day => (
            <div
              key={day}
              style={{
                background: 'var(--primary-500)',
                color: 'white',
                padding: 'var(--space-3)',
                textAlign: 'center',
                fontWeight: '600',
                fontSize: '0.875rem'
              }}
            >
              {day}
            </div>
          ))}

          {/* Jours du mois */}
          {days.map((day, index) => {
            const dayInterventions = getInterventionsForDate(day.date);
            const isCurrentDay = isToday(day.date);
            const isPast = isPastDate(day.date);
            const isHovered = hoveredDay === index;

            return (
              <div
                key={index}
                style={{
                  background: day.isCurrentMonth ? 'white' : 'var(--neutral-50)',
                  minHeight: '120px',
                  padding: 'var(--space-2)',
                  position: 'relative',
                  cursor: 'pointer',
                  transition: 'all var(--transition-fast)',
                  opacity: day.isCurrentMonth ? 1 : 0.5,
                  border: isHovered && day.isCurrentMonth ? '2px solid var(--primary-300)' : '2px solid transparent'
                }}
                onMouseEnter={() => setHoveredDay(index)}
                onMouseLeave={() => setHoveredDay(null)}
                onClick={(e) => {
                  // Si on clique directement sur le jour (pas sur une intervention)
                  if (e.target === e.currentTarget || e.target.closest('.day-header')) {
                    if (dayInterventions.length > 0) {
                      setSelectedDate(day.date);
                    }
                  }
                }}
              >
                {/* En-tête du jour avec numéro et bouton + */}
                <div
                  className="day-header"
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: 'var(--space-2)'
                  }}
                >
                  <div
                    style={{
                      width: '32px',
                      height: '32px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      borderRadius: 'var(--radius-full)',
                      fontWeight: '600',
                      fontSize: '0.875rem',
                      background: isCurrentDay ? 'var(--primary-500)' : 'transparent',
                      color: isCurrentDay ? 'white' : (isPast ? 'var(--neutral-400)' : 'var(--neutral-900)')
                    }}
                  >
                    {day.date.getDate()}
                  </div>

                  {/* Bouton + pour créer intervention (visible au hover) */}
                  {day.isCurrentMonth && isHovered && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setPrefilledDate(day.date);
                        setShowInterventionModal(true);
                      }}
                      style={{
                        width: '24px',
                        height: '24px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        borderRadius: 'var(--radius-full)',
                        background: 'var(--primary-500)',
                        border: 'none',
                        cursor: 'pointer',
                        color: 'white',
                        transition: 'all var(--transition-fast)',
                        opacity: 0.8
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.opacity = '1';
                        e.currentTarget.style.transform = 'scale(1.1)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.opacity = '0.8';
                        e.currentTarget.style.transform = 'scale(1)';
                      }}
                      title="Créer une intervention"
                    >
                      <Plus size={14} />
                    </button>
                  )}
                </div>

                {/* Interventions */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-1)' }}>
                  {dayInterventions.slice(0, 3).map(intervention => (
                    <div
                      key={intervention._id}
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/interventions/${intervention._id}`);
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = `${getStatusColor(intervention.statut)}25`;
                        e.currentTarget.style.transform = 'translateX(2px)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = `${getStatusColor(intervention.statut)}15`;
                        e.currentTarget.style.transform = 'translateX(0)';
                      }}
                      style={{
                        padding: 'var(--space-1) var(--space-2)',
                        borderRadius: 'var(--radius-sm)',
                        fontSize: '0.75rem',
                        fontWeight: '500',
                        borderLeft: `3px solid ${getStatusColor(intervention.statut)}`,
                        background: `${getStatusColor(intervention.statut)}15`,
                        color: getStatusColor(intervention.statut),
                        cursor: 'pointer',
                        transition: 'all var(--transition-fast)',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 'var(--space-1)'
                      }}
                      title={`${intervention.clientId?.nom || 'Client'} ${intervention.clientId?.prenom || ''} - ${intervention.appareil?.type || 'Appareil'} - Cliquez pour voir les détails`}
                    >
                      <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', textTransform: 'uppercase', fontWeight: '600' }}>
                        {intervention.clientId?.nom || 'Client'}
                      </span>
                      <Edit2 size={10} style={{ flexShrink: 0, opacity: 0.6 }} />
                    </div>
                  ))}
                  {dayInterventions.length > 3 && (
                    <div
                      style={{
                        padding: 'var(--space-1)',
                        fontSize: '0.75rem',
                        color: 'var(--neutral-600)',
                        textAlign: 'center',
                        fontWeight: '600'
                      }}
                    >
                      +{dayInterventions.length - 3} autre{dayInterventions.length - 3 > 1 ? 's' : ''}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Légende des statuts */}
      <div className="card">
        <h3 style={{ fontSize: '1.125rem', fontWeight: '600', marginBottom: 'var(--space-4)' }}>
          Légende des statuts
        </h3>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
          gap: 'var(--space-3)'
        }}>
          {['Demande', 'Planifié', 'En cours', 'Diagnostic', 'Réparation', 'Terminé', 'Facturé'].map(statut => (
            <div
              key={statut}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 'var(--space-2)'
              }}
            >
              <div
                style={{
                  width: '16px',
                  height: '16px',
                  borderRadius: 'var(--radius-sm)',
                  background: getStatusColor(statut)
                }}
              />
              <span style={{ fontSize: '0.875rem', color: 'var(--neutral-700)' }}>
                {statut}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Modal détails journée */}
      {selectedDate && (
        <div className="modal-container" onClick={() => setSelectedDate(null)}>
          <div
            className="card modal-content animate-slide-in"
            style={{ width: '100%', maxWidth: '600px', maxHeight: '80vh', overflowY: 'auto' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: 'var(--space-6)'
            }}>
              <h2>
                Interventions du {selectedDate.toLocaleDateString('fr-FR', {
                  weekday: 'long',
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric'
                })}
              </h2>
              <button
                onClick={() => setSelectedDate(null)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: '1.5rem',
                  color: 'var(--neutral-600)'
                }}
              >
                ×
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
              {getInterventionsForDate(selectedDate).map(intervention => (
                <div
                  key={intervention._id}
                  onClick={() => navigate(`/interventions/${intervention._id}`)}
                  style={{
                    padding: 'var(--space-4)',
                    background: 'var(--neutral-50)',
                    borderRadius: 'var(--radius-lg)',
                    borderLeft: `4px solid ${getStatusColor(intervention.statut)}`,
                    cursor: 'pointer',
                    transition: 'all var(--transition-fast)'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'var(--neutral-100)';
                    e.currentTarget.style.transform = 'translateX(4px)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'var(--neutral-50)';
                    e.currentTarget.style.transform = 'translateX(0)';
                  }}
                >
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'start',
                    marginBottom: 'var(--space-2)'
                  }}>
                    <div>
                      <div style={{ fontWeight: '600', fontSize: '1rem', marginBottom: 'var(--space-1)' }}>
                        <span style={{ textTransform: 'uppercase' }}>{intervention.clientId?.nom}</span> {intervention.clientId?.prenom}
                      </div>
                      <div style={{ color: 'var(--neutral-600)', fontSize: '0.875rem' }}>
                        {intervention.appareil?.type} - {intervention.appareil?.marque}
                      </div>
                    </div>
                    <span
                      className="badge"
                      style={{
                        background: `${getStatusColor(intervention.statut)}15`,
                        color: getStatusColor(intervention.statut),
                        border: `1px solid ${getStatusColor(intervention.statut)}30`
                      }}
                    >
                      {intervention.statut}
                    </span>
                  </div>

                  <div style={{ fontSize: '0.875rem', color: 'var(--neutral-700)', marginBottom: 'var(--space-3)' }}>
                    {intervention.description}
                  </div>

                  <div style={{
                    display: 'flex',
                    gap: 'var(--space-4)',
                    fontSize: '0.875rem',
                    color: 'var(--neutral-600)'
                  }}>
                    {intervention.technicien && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-1)' }}>
                        <User size={16} />
                        {intervention.technicien}
                      </div>
                    )}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-1)' }}>
                      <MapPin size={16} />
                      {intervention.typeIntervention}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Modal création intervention */}
      <InterventionModal
        show={showInterventionModal}
        onClose={() => {
          setShowInterventionModal(false);
          setPrefilledDate(null);
        }}
        onSuccess={() => {
          loadInterventions();
          setShowInterventionModal(false);
          setPrefilledDate(null);
        }}
        prefilledData={prefilledDate ? {
          datePrevue: prefilledDate.toISOString().split('T')[0]
        } : {}}
      />
    </div>
  );
};

export default Calendrier;
