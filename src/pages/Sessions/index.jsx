
import { useEffect, useState } from 'react';
import { getSessions } from '../../api/sessionService';
import '../../styles/SessionPage.css';

export default function SessionsPage() {
  const [sessions, setSessions] = useState([]);
  const [selectedSport, setSelectedSport] = useState('');

  const sports = ['Tous les sports', 'Football', 'Tennis', 'CrossFit', 'Running', 'Yoga'];

  useEffect(() => {
    getSessions(selectedSport ? { sport: selectedSport } : {}).then(setSessions);
  }, [selectedSport]);

  return (
    <div className="sessions-wrapper">
      <h1 className="sessions-title">Trouve ta prochaine session sportive</h1>

      <div className="sport-filters">
        {sports.map((sport) => (
          <button
            key={sport}
            className={`sport-button ${selectedSport === sport || (sport === 'Tous les sports' && selectedSport === '') ? 'active' : ''}`}
            onClick={() => setSelectedSport(sport === 'Tous les sports' ? '' : sport)}
          >
            {sport}
          </button>
        ))}
      </div>

      <div className="sessions-grid">
        {Array.isArray(sessions) && sessions.map((s) => (
          <div className="session-card" key={s.id}>
            <h2>{s.sport}</h2>
            <p>📅 {s.date}</p>
            <p>📍 {s.location}</p>
            <p>🎯 {s.level || 'Non spécifié'}</p>
            <p>👥 {s.max_players} places</p>
            <button>Participer</button>
          </div>
        ))}
      </div>
    </div>
  );
}
