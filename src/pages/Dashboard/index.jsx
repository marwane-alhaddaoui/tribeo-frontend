import { useEffect, useState } from 'react';
import { getSessions } from '../../api/sessionService';
import SessionCard from './SessionCard';

export default function Dashboard() {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchSessions = async () => {
      try {
        const res = await getSessions();
        setSessions(res.data);
      } catch (err) {
        setError("Impossible de charger les sessions.");
      } finally {
        setLoading(false);
      }
    };

    fetchSessions();
  }, []);

  if (loading) return <p className="text-center mt-10">Chargement...</p>;
  if (error) return <p className="text-center mt-10 text-red-500">{error}</p>;

  return (
    <div className="p-6 bg-gray-100 min-h-screen">
      <h1 className="text-2xl font-bold mb-4">📋 Liste des sessions sportives</h1>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {sessions.length > 0 ? (
          sessions.map((session) => (
            <SessionCard key={session.id} session={session} />
          ))
        ) : (
          <p>Aucune session disponible.</p>
        )}
      </div>
    </div>
  );
}
