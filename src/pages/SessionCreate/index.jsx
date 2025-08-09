import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { createSession, getSports } from '../../api/sessionService';

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
    <div className="p-6 max-w-xl mx-auto">
      <h2 className="text-2xl font-bold mb-4">Créer une session sportive</h2>
      {error && <p className="text-red-500 mb-4">{error}</p>}

      <form onSubmit={handleSubmit} className="space-y-4">
        <input name="title" placeholder="Titre" onChange={handleChange} className="w-full p-2 border rounded" required />
        
        <select name="sport" value={form.sport} onChange={handleChange} className="w-full p-2 border rounded" required>
          <option value="">Sélectionner un sport</option>
          {Array.isArray(sports) &&
          sports.map((s) => (
         <option key={s.id} value={s.id}>
           {s.name}
         </option>
         ))
          }
        </select>

        <textarea name="description" placeholder="Description" onChange={handleChange} className="w-full p-2 border rounded" required />
        <input name="location" placeholder="Lieu" onChange={handleChange} className="w-full p-2 border rounded" required />
        <input name="date" type="date" onChange={handleChange} className="w-full p-2 border rounded" required />
        <input name="start_time" type="time" onChange={handleChange} className="w-full p-2 border rounded" required />

        <label className="flex items-center gap-2">
          <input type="checkbox" name="is_public" checked={form.is_public} onChange={handleChange} />
          Public
        </label>

        <label className="flex items-center gap-2">
          <input type="checkbox" name="team_mode" checked={form.team_mode} onChange={handleChange} />
          Mode équipe
        </label>

        <input name="max_players" type="number" min="1" placeholder="Max joueurs" onChange={handleChange} className="w-full p-2 border rounded" required />
        <input name="min_players_per_team" type="number" min="1" placeholder="Min joueurs/équipe" onChange={handleChange} className="w-full p-2 border rounded" required />
        <input name="max_players_per_team" type="number" min="1" placeholder="Max joueurs/équipe" onChange={handleChange} className="w-full p-2 border rounded" required />

        <button type="submit" className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700">
          Créer la session
        </button>
      </form>
    </div>
  );
}
