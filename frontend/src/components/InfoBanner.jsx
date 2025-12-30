import { useState, useEffect } from 'react';
import { Cloud, CloudRain, Sun, CloudSnow, Wind, Calendar } from 'lucide-react';

const InfoBanner = () => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [weather, setWeather] = useState(null);

  // Mettre à jour la date à minuit
  useEffect(() => {
    const updateDate = () => {
      setCurrentTime(new Date());
    };

    // Calculer le temps jusqu'à minuit
    const now = new Date();
    const tomorrow = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
    const timeUntilMidnight = tomorrow - now;

    // Mettre à jour à minuit
    const midnightTimer = setTimeout(() => {
      updateDate();
      // Puis mettre à jour toutes les 24h
      const dailyInterval = setInterval(updateDate, 24 * 60 * 60 * 1000);
      return () => clearInterval(dailyInterval);
    }, timeUntilMidnight);

    return () => clearTimeout(midnightTimer);
  }, []);

  // Charger la météo
  useEffect(() => {
    fetchWeather();
  }, []);

  // Rotation automatique des informations
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % 2);
    }, 4000); // Change toutes les 4 secondes
    return () => clearInterval(interval);
  }, []);

  const fetchWeather = async () => {
    try {
      // Utiliser l'API OpenWeatherMap gratuite
      // Vous pouvez obtenir une clé API gratuite sur https://openweathermap.org/api
      const API_KEY = 'VOTRE_CLE_API'; // À remplacer
      const city = 'Paris'; // Ville par défaut

      // Pour le moment, on simule des données
      // Décommentez le code ci-dessous quand vous aurez une clé API
      /*
      const response = await fetch(
        `https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${API_KEY}&units=metric&lang=fr`
      );
      const data = await response.json();
      setWeather({
        temp: Math.round(data.main.temp),
        description: data.weather[0].description,
        icon: data.weather[0].main
      });
      */

      // Données simulées pour le développement
      setWeather({
        temp: 18,
        description: 'Partiellement nuageux',
        icon: 'Clouds'
      });
    } catch (error) {
      console.error('Erreur chargement météo:', error);
      setWeather({
        temp: '--',
        description: 'Non disponible',
        icon: 'Cloud'
      });
    }
  };

  const formatDate = (date) => {
    const days = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];
    const months = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc'];

    const dayName = days[date.getDay()];
    const day = date.getDate();
    const month = months[date.getMonth()];
    const year = date.getFullYear();

    return `${dayName}. ${day} ${month} ${year}`;
  };

  const getWeatherIcon = (iconName) => {
    const icons = {
      'Clear': Sun,
      'Clouds': Cloud,
      'Rain': CloudRain,
      'Snow': CloudSnow,
      'Wind': Wind
    };
    const Icon = icons[iconName] || Cloud;
    return <Icon size={18} />;
  };

  const infoItems = [
    {
      label: 'Date',
      value: formatDate(currentTime),
      icon: <Calendar size={18} />
    },
    {
      label: 'Météo',
      value: weather ? `${weather.temp}°C - ${weather.description}` : 'Chargement...',
      icon: weather ? getWeatherIcon(weather.icon) : <Cloud size={18} />
    }
  ];

  return (
    <div className="info-banner">
      <div className="info-banner-content">
        <div
          className="info-banner-slider"
          style={{ transform: `translateY(-${currentIndex * 48}px)` }}
        >
          {infoItems.map((item, index) => (
            <div key={index} className="info-banner-item">
              <span className="info-banner-icon">{item.icon}</span>
              <span className="info-banner-label">{item.label}:</span>
              <span className="info-banner-value">{item.value}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Indicateurs de pagination */}
      <div className="info-banner-indicators">
        {infoItems.map((_, index) => (
          <div
            key={index}
            className={`info-banner-indicator ${currentIndex === index ? 'active' : ''}`}
            onClick={() => setCurrentIndex(index)}
          />
        ))}
      </div>
    </div>
  );
};

export default InfoBanner;
