// pages/Dashboard/Dashboard.jsx
import { useEffect, useState, useContext } from "react";
import { getSessions } from "../../api/sessionService";
import { AuthContext } from "../../context/AuthContext";
import SessionCard from "../Sessions/SessionCard"; // ⬅️ importe ton composant
import "../../styles/SessionCard.css";             // ⬅️ pour être sûr que le style est chargé
import "../../styles/DashboardPage.css";

function isUserCreator(session, email) {
  return (session?.creator?.email || session?.creator) === email;
}
function isUserParticipant(session, email) {
  if (!Array.isArray(session?.participants)) return false;
  return session.participants.some((p) => (p?.email || p) === email);
}

export default function Dashboard() {
  const { user } = useContext(AuthContext);
  const [mySessions, setMySessions] = useState([]);
  const [createdSessions, setCreatedSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchSessions = async () => {
      setLoading(true);
      setError("");
      try {
        const res = await getSessions({ mine: true });
        const mine = Array.isArray(res) ? res.filter((s) => isUserParticipant(s, user.email)) : [];
        const created = Array.isArray(res) ? res.filter((s) => isUserCreator(s, user.email)) : [];
        setMySessions(mine);
        setCreatedSessions(created);
      } catch (err) {
        console.error(err);
        setError("Erreur de chargement des sessions.");
      } finally {
        setLoading(false);
      }
    };

    if (user?.email) fetchSessions();
  }, [user]);

  if (loading) return <p className="text-center mt-10">Chargement…</p>;
  if (error) return <p className="text-center mt-10 text-red-500">{error}</p>;

  return (
    <div className="dashboard-wrapper">
      <h1 className="dashboard-title">Mon tableau de bord</h1>

      {/* 👟 Mes sessions à venir */}
      <section className="dashboard-section">
        <h2 className="dashboard-subtitle">👟 Mes sessions à venir</h2>
        <div className="sessions-grid">
          {mySessions.length > 0 ? (
            mySessions.map((s) => <SessionCard key={s.id} session={s} />)
          ) : (
            <p className="dashboard-empty">Aucune session prévue.</p>
          )}
        </div>
      </section>

      {/* 🧑‍💼 Mes sessions créées */}
      <section className="dashboard-section">
        <h2 className="dashboard-subtitle">🧑‍💼 Mes sessions créées</h2>
        <div className="sessions-grid">
          {createdSessions.length > 0 ? (
            createdSessions.map((s) => <SessionCard key={s.id} session={s} />)
          ) : (
            <p className="dashboard-empty">Tu n’as pas encore créé de session.</p>
          )}
        </div>
      </section>
    </div>
  );
}
