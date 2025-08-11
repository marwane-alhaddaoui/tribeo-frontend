import { useEffect, useState } from "react";
import { getSessions, joinSession, leaveSession } from "../../api/sessionService";
import SportFilter from "./SportFilter";
import SessionCard from "./SessionCard";
import "../../styles/SessionPage.css";
import SessionMap from "../../components/SessionMap";
import CreateSessionCTA from "../../components/CreateSessionCTA"; // 👈 NEW

export default function SessionsPage() {
  const [sessions, setSessions] = useState([]);
  const [selectedSport, setSelectedSport] = useState("");
  const [search, setSearch] = useState("");

  const fetchSessions = () => {
    const filters = { is_public: true }; // 🔥 forcer public (visiteurs OK)
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
      {/* Toolbar haut de page */}
      <div className="sessions-toolbar">
        <h1 className="sessions-title">Trouve ta prochaine session sportive</h1>
        {/* Bouton créer (redirige /login si visiteur, sinon /sessions/create) */}
        <CreateSessionCTA variant="button" />
      </div>

      {/* Barre de recherche + filtre sport */}
      <div className="sessions-filters">
        <input
          type="text"
          placeholder="Rechercher une session…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="search-input"
        />

        <SportFilter selected={selectedSport} onSelect={setSelectedSport} />
      </div>

      {/* Carte des sessions */}
      <SessionMap sessions={sessions} />

      {/* Grille des cartes */}
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

      {/* FAB mobile / action rapide */}
      <CreateSessionCTA variant="fab" />
    </div>
  );
}
