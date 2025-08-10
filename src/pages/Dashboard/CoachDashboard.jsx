// pages/Dashboard/CoachDashboard.jsx
import { useState, useEffect } from "react";
import { getSessions, publishSession, cancelSession } from "../../api/sessionService";
import { getGroupsByCoach } from "../../api/groupService";
import "../../styles/CoachDashboard.css";
import CoachCalendar from "../../components/CoachCalendar";

export default function CoachDashboard() {
  const [activeTab, setActiveTab] = useState("groups");
  const [groups, setGroups] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchData = async () => {
    try {
      const g = await getGroupsByCoach();
      setGroups(g);

      const s = await getSessions({ mine: true }); // sessions du coach
      setSessions(s);
    } catch (err) {
      console.error("Erreur chargement dashboard coach :", err);
      setError("Erreur de chargement des données.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const handlePublish = async (id) => {
    try {
      await publishSession(id);
      alert("✅ Session publiée !");
      fetchData();
    } catch (error) {
      alert("❌ Erreur publication : " + (error.response?.data?.detail || error.message));
    }
  };

  const handleCancel = async (id) => {
    try {
      await cancelSession(id);
      alert("⚠️ Session annulée !");
      fetchData();
    } catch (error) {
      alert("❌ Erreur annulation : " + (error.response?.data?.detail || error.message));
    }
  };

  if (loading) return <p className="text-center mt-10">Chargement…</p>;
  if (error) return <p className="text-center mt-10 text-red-500">{error}</p>;

  return (
    <div className="coach-dashboard">
      <h1 className="coach-title">🏆 Coach Dashboard</h1>

      {/* Navigation interne */}
      <div className="coach-nav">
        <button className={activeTab === "groups" ? "active" : ""} onClick={() => setActiveTab("groups")}>
          📋 Mes Groupes
        </button>
        <button className={activeTab === "sessions" ? "active" : ""} onClick={() => setActiveTab("sessions")}>
          📅 Mes Sessions
        </button>
        <button className={activeTab === "calendar" ? "active" : ""} onClick={() => setActiveTab("calendar")}>
          🗓️ Calendrier
        </button>
      </div>

      {/* Contenu dynamique */}
      <div className="coach-content">
        {activeTab === "groups" && (
          <div className="coach-section">
            {groups.length > 0 ? (
              groups.map((g) => (
                <div key={g.id} className="coach-card">
                  <h3>{g.name}</h3>
                  <p>{g.description}</p>
                  <p>👥 Membres : {g.members.length}</p>
                </div>
              ))
            ) : (
              <p className="empty">Aucun groupe trouvé.</p>
            )}
          </div>
        )}

        {activeTab === "sessions" && (
          <div className="coach-section">
            {sessions.length > 0 ? (
              sessions.map((s) => (
                <div key={s.id} className="coach-card">
                  <h3>{s.title}</h3>
                  <p>📅 {s.date} à {s.start_time}</p>
                  <p>📍 {s.location}</p>
                  <p>Status : {s.status}</p>

                  <div className="coach-actions">
                    {s.status === "DRAFT" && (
                      <button onClick={() => handlePublish(s.id)}>🚀 Publier</button>
                    )}
                    {s.status !== "CANCELED" && (
                      <button onClick={() => handleCancel(s.id)}>❌ Annuler</button>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <p className="empty">Aucune session trouvée.</p>
            )}
          </div>
        )}

        {activeTab === "calendar" && (
          <CoachCalendar />
        )}
      </div>
    </div>
  );
}
