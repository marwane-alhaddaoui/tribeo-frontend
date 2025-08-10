import { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { createSession, getSports } from '../../api/sessionService';
import { getGroupsByCoach } from '../../api/groupService';
import { AuthContext } from '../../context/AuthContext';
import '../../styles/CreateSession.css';
import AddressAutocomplete from "../../components/AddressAutocomplete";

export default function CreateSessionPage() {
  const { user } = useContext(AuthContext);
  const [sports, setSports] = useState([]);
  const [groups, setGroups] = useState([]);
  const [form, setForm] = useState({
    title: '',
    sport_id: '',
    description: '',
    location: '',
    latitude: null,
    longitude: null,
    date: '',
    start_time: '',
    visibility: 'PUBLIC', // 🔹 par défaut
    group_id: '',
    team_mode: true,
    max_players: 10,
    min_players_per_team: 2,
    max_players_per_team: 5,
  });
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    // Charger les sports
    getSports().then(setSports).catch(console.error);

    // Charger les groupes si coach
    if (user.role === 'coach') {
      getGroupsByCoach().then(setGroups).catch(console.error);
    }
  }, [user.role]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm({
      ...form,
      [name]: type === 'checkbox' ? checked : value,
    });
  };

  const handleAddressSelect = (location, latitude, longitude) => {
    setForm({
      ...form,
      location,
      latitude,
      longitude
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!form.latitude || !form.longitude) {
      setError("❌ Veuillez sélectionner une adresse valide depuis la liste.");
      return;
    }

    // Si visibility = GROUP mais pas de groupe choisi
    if (form.visibility === 'GROUP' && !form.group_id) {
      setError("❌ Veuillez sélectionner un groupe.");
      return;
    }

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
        <select name="sport_id" value={form.sport_id} onChange={handleChange} required>
          <option value="">Sélectionner un sport</option>
          {sports.map((s) => (
            <option key={s.id} value={s.id}>{s.name}</option>
          ))}
        </select>

        <label>Description</label>
        <textarea name="description" value={form.description} onChange={handleChange} required />

        <label>Lieu</label>
        <AddressAutocomplete
          value={form.location}
          onSelect={handleAddressSelect}
        />

        <label>Date</label>
        <input type="date" name="date" value={form.date} onChange={handleChange} required />

        <label>Heure de début</label>
        <input type="time" name="start_time" value={form.start_time} onChange={handleChange} required />

        {/* 🔹 Choix de visibilité (uniquement si coach/admin) */}
        {(user.role === 'coach' || user.role === 'admin') && (
          <>
            <label>Visibilité</label>
            <select name="visibility" value={form.visibility} onChange={handleChange}>
              <option value="PUBLIC">Publique</option>
              <option value="PRIVATE">Privée</option>
              <option value="GROUP">Groupe</option>
            </select>

            {/* 🔹 Si visibilité = GROUP → choix du groupe */}
            {form.visibility === 'GROUP' && (
              <div>
                <label>Groupe</label>
                <select
                  name="group_id"
                  value={form.group_id}
                  onChange={handleChange}
                  required
                >
                  <option value="">Sélectionner un groupe</option>
                  {groups.map((g) => (
                    <option key={g.id} value={g.id}>{g.name}</option>
                  ))}
                </select>
              </div>
            )}
          </>
        )}

        <label>
          <input type="checkbox" name="team_mode" checked={form.team_mode} onChange={handleChange} />
          Mode équipe
        </label>

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
