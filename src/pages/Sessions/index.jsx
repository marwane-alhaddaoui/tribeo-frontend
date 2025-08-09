import { useEffect, useState } from "react";
import { getSessions } from "../../api/sessionService";
import SportFilter from "./SportFilter";
import SessionCard from "./SessionCard";
import "../../styles/SessionPage.css";

export default function SessionsPage() {
  const [sessions, setSessions] = useState([]);
  const [selectedSport, setSelectedSport] = useState("");
  const [search, setSearch] = useState("");

  useEffect(() => {
    const filters = {};
    if (selectedSport) filters.sport_id = selectedSport;
    if (search.trim()) filters.search = search.trim();

    getSessions(filters).then(setSessions);
  }, [selectedSport, search]);

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

      <div className="sessions-grid">
        {Array.isArray(sessions) && sessions.map((s) => (
          <SessionCard key={s.id} session={s} />
        ))}
      </div>
    </div>
  );
}
