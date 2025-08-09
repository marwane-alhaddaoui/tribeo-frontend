import { useEffect, useState } from "react";
import { getSessions, joinSession, leaveSession } from "../../api/sessionService";
import SportFilter from "./SportFilter";
import SessionCard from "./SessionCard";
import "../../styles/SessionPage.css";
import SessionMap from "../../components/SessionMap";

export default function SessionsPage() {
  const [sessions, setSessions] = useState([]);
  const [selectedSport, setSelectedSport] = useState("");
  const [search, setSearch] = useState("");

  const fetchSessions = () => {
    const filters = {};
    if (selectedSport) filters.sport_id = selectedSport;
    if (search.trim()) filters.search = search.trim();

    getSessions(filters).then(setSessions).catch(console.error);
  };

  useEffect(() => {
    fetchSessions();
  }, [selectedSport, search]);

  const handleJoin = async (id) => {
    try {
      await joinSession(id);
      alert("✅ Vous avez rejoint la session !");
      fetchSessions();
    } catch (err) {
      alert(`❌ ${err.response?.data?.detail || "Erreur lors de la participation"}`);
    }
  };

  const handleLeave = async (id) => {
    try {
      await leaveSession(id);
      alert("✅ Vous avez quitté la session !");
      fetchSessions();
    } catch (err) {
      alert(`❌ ${err.response?.data?.detail || "Erreur lors de la sortie"}`);
    }
  };

  return (
    <div className="sessions-wrapper">
      <h1 className="sessions-title">Trouve ta prochaine session sportive</h1>

      {/* Champ de recherche */}
      <input
        type="text"
        placeholder="Rechercher une session..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="search-input"
      />

      <SportFilter selected={selectedSport} onSelect={setSelectedSport} />

      {/* Carte des sessions */}
      <SessionMap sessions={sessions} />

      <div className="sessions-grid">
        {Array.isArray(sessions) &&
          sessions.map((s) => (
            <SessionCard
              key={s.id}
              session={s}
              onJoin={handleJoin}
              onLeave={handleLeave}
            />
          ))}
      </div>
    </div>
  );
}
