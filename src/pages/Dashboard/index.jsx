import { useEffect, useState, useContext } from 'react';
import { getSessions } from '../../api/sessionService';
import { AuthContext } from '../../context/AuthContext';
import { Link } from 'react-router-dom';

export default function Dashboard() {
  const { user } = useContext(AuthContext);
  const [allSessions, setAllSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [mySessions, setMySessions] = useState([]);
  const [createdSessions, setCreatedSessions] = useState([]);

  useEffect(() => {
    const fetchSessions = async () => {
      try {
        const res = await getSessions(); // ✅ res est déjà un tableau
        setAllSessions(res);
        console.log("res :", res);

        const joined = res.filter((s) =>
          s.participants.includes(user.email)
        );

        const created = res.filter((s) =>
          s.creator === user.email
        );

        setMySessions(joined);
        setCreatedSessions(created);
      } catch (err) {
        setError("Erreur de chargement des sessions.");
      } finally {
        setLoading(false);
      }
    };

    fetchSessions();
  }, [user]);

  if (loading) return <p className="text-center mt-10">Chargement…</p>;
  if (error) return <p className="text-center mt-10 text-red-500">{error}</p>;

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-6">🏠 Mon tableau de bord</h1>

      {/* 🔷 Sessions auxquelles je participe */}
      <section className="mb-10">
        <h2 className="text-xl font-semibold mb-2">👟 Mes sessions à venir</h2>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {mySessions.length > 0 ? (
            mySessions.map((s) => (
              <div key={s.id} className="p-4 border rounded shadow bg-white">
                <h3 className="text-lg font-bold">{s.title}</h3>
                <p>{s.sport} - {s.date} à {s.start_time}</p>
                <p>📍 {s.location}</p>
                <Link to={`/sessions/${s.id}`} className="text-blue-600 underline mt-2 inline-block">Voir détails</Link>
              </div>
            ))
          ) : (
            <p>Aucune session prévue.</p>
          )}
        </div>
      </section>

      {/* 🔶 Sessions que j’ai créées */}
      <section>
        <h2 className="text-xl font-semibold mb-2">🧑‍💼 Mes sessions créées</h2>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {createdSessions.length > 0 ? (
            createdSessions.map((s) => (
              <div key={s.id} className="p-4 border rounded shadow bg-white">
                <h3 className="text-lg font-bold">{s.title}</h3>
                <p>{s.sport} - {s.date} à {s.start_time}</p>
                <p>📍 {s.location}</p>
                <Link to={`/sessions/${s.id}`} className="text-blue-600 underline mt-2 inline-block">Voir détails</Link>
              </div>
            ))
          ) : (
            <p>Tu n’as pas encore créé de session.</p>
          )}
        </div>
      </section>
    </div>
  );
}
