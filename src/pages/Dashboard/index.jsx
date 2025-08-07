import { useEffect, useState, useContext } from 'react';
import { getSessions } from '../../api/sessionService';
import { AuthContext } from '../../context/AuthContext';
import { Link } from 'react-router-dom';
import '../../styles/DashboardPage.css';


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
    <div className="dashboard-wrapper">
  <h1 className="dashboard-title">🏠 Mon tableau de bord</h1>

  {/* 🔷 Mes sessions à venir */}
  <section className="dashboard-section">
    <h2 className="dashboard-subtitle">👟 Mes sessions à venir</h2>
    <div className="dashboard-grid">
      {mySessions.length > 0 ? (
        mySessions.map((s) => (
          <div className="dashboard-card" key={s.id}>
            <h3>{s.title}</h3>
            <p>📅 {s.date} à {s.start_time}</p>
            <p>📍 {s.location}</p>
            <Link to={`/sessions/${s.id}`} className="dashboard-link">Voir détails</Link>
          </div>
        ))
      ) : (
        <p className="dashboard-empty">Aucune session prévue.</p>
      )}
    </div>
  </section>

  {/* 🔶 Mes sessions créées */}
  <section className="dashboard-section">
    <h2 className="dashboard-subtitle">🧑‍💼 Mes sessions créées</h2>
    <div className="dashboard-grid">
      {createdSessions.length > 0 ? (
        createdSessions.map((s) => (
          <div className="dashboard-card" key={s.id}>
            <h3>{s.title}</h3>
            <p>📅 {s.date} à {s.start_time}</p>
            <p>📍 {s.location}</p>
            <Link to={`/sessions/${s.id}`} className="dashboard-link">Voir détails</Link>
          </div>
        ))
      ) : (
        <p className="dashboard-empty">Tu n’as pas encore créé de session.</p>
      )}
    </div>
  </section>
</div>

  );
}
