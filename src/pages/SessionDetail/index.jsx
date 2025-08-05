import { useParams } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { getSessionById } from '../../api/sessionService';

export default function SessionDetailPage() {
  const { id } = useParams();
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchSession = async () => {
      try {
        const res = await getSessionById(id);
        setSession(res.data);
      } catch (err) {
        setError("Impossible de charger la session.");
      } finally {
        setLoading(false);
      }
    };

    fetchSession();
  }, [id]);

  if (loading) return <p className="text-center mt-10">Chargement...</p>;
  if (error) return <p className="text-center mt-10 text-red-500">{error}</p>;

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-2">{session.name}</h1>
      <p className="text-gray-700 mb-1">Sport : {session.sport}</p>
      <p className="text-gray-700 mb-1">Lieu : {session.location}</p>
      <p className="text-gray-700 mb-1">Date : {new Date(session.date).toLocaleString()}</p>
      <p className="text-gray-700 mb-1">Participants : {session.participants_count}</p>

      {/* Tu peux ajouter plus d'infos ici si dispo dans ton backend */}
    </div>
  );
}
