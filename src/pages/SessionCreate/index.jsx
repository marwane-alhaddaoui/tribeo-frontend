import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { createSession, getSports } from '../../api/sessionService';
import '../../styles/CreateSession.css';

export default function CreateSessionPage() {
  const [sports, setSports] = useState([]);
  const [form, setForm] = useState({
    title: '',
    sport: '',
    description: '',
    location: '',
    date: '',
    start_time: '',
    is_public: true,
    team_mode: true,
    max_players: 10,
    min_players_per_team: 2,
    max_players_per_team: 5,
  });
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const fetchSports = async () => {
      const data = await getSports();
      setSports(data);
    };
    fetchSports();
  }, []);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm({
      ...form,
      [name]: type === 'checkbox' ? checked : value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await createSession(form);
      navigate('/dashboard');
    } catch (err) {
      const message = JSON.stringify(err.response?.data || err.message);
      setError('Erreur: ' + message);
    }
  };

  return (
    <div className="create-session-container">
      <h2 className="create-session-title">🏆 Créer une session sportive</h2>
      {error && <p className="error-message">{error}</p>}

      <form onSubmit={handleSubmit} className="create-session-form">
        <label>Titre</label>
        <input name="title" value={form.title} onChange={handleChange} required />

        <label>Sport</label>
        <select name="sport" value={form.sport} onChange={handleChange} required>
          <option value="">Sélectionner un sport</option>
          {Array.isArray(sports) &&
            sports.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
        </select>

        <label>Description</label>
        <textarea name="description" value={form.description} onChange={handleChange} required />

        <label>Lieu</label>
        <input name="location" value={form.location} onChange={handleChange} required />

        <label>Date</label>
        <input type="date" name="date" value={form.date} onChange={handleChange} required />

        <label>Heure de début</label>
        <input type="time" name="start_time" value={form.start_time} onChange={handleChange} required />

        <div className="checkbox-group">
          <label>
            <input type="checkbox" name="is_public" checked={form.is_public} onChange={handleChange} />
            Public
          </label>
          <label>
            <input type="checkbox" name="team_mode" checked={form.team_mode} onChange={handleChange} />
            Mode équipe
          </label>
        </div>

        <label>Max joueurs</label>
        <input type="number" name="max_players" min="1" value={form.max_players} onChange={handleChange} required />

        <label>Min joueurs/équipe</label>
        <input type="number" name="min_players_per_team" min="1" value={form.min_players_per_team} onChange={handleChange} required />

        <label>Max joueurs/équipe</label>
        <input type="number" name="max_players_per_team" min="1" value={form.max_players_per_team} onChange={handleChange} required />

        <button type="submit" className="btn-save-session">Créer la session</button>
      </form>
    </div>
  );
}
