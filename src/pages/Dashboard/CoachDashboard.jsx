// pages/Dashboard/CoachDashboard.jsx
import { useState, useEffect } from "react";
import { getSessions } from "../../api/sessionService";
import { getGroupsByCoach } from "../../api/groupService"; // 🆕 à créer côté API
import "../../styles/CoachDashboard.css";

export default function CoachDashboard() {
  const [activeTab, setActiveTab] = useState("groups");
  const [groups, setGroups] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const g = await getGroupsByCoach();
        setGroups(g);

        const s = await getSessions({ coach: true }); // Optionnel : filtre backend
        setSessions(s);
      } catch (error) {
        console.error("Erreur chargement dashboard coach :", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) return <p className="text-center mt-10">Chargement…</p>;

  return (
    <div className="coach-dashboard">
      <h1 className="coach-title">🏆 Coach Dashboard</h1>

      {/* Navigation interne */}
      <div className="coach-nav">
        <button
          className={activeTab === "groups" ? "active" : ""}
          onClick={() => setActiveTab("groups")}
        >
          📋 Mes Groupes
        </button>
        <button
          className={activeTab === "sessions" ? "active" : ""}
          onClick={() => setActiveTab("sessions")}
        >
          📅 Mes Sessions
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
                </div>
              ))
            ) : (
              <p className="empty">Aucune session trouvée.</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
