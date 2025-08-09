import { useEffect, useState } from "react";
import { getSessions } from "../../api/sessionService";
import SportFilter from "./SportFilter";
import SessionCard from "./SessionCard";
import "../../styles/SessionPage.css";

export default function SessionsPage() {
  const [sessions, setSessions] = useState([]);
  const [selectedSport, setSelectedSport] = useState("");

  useEffect(() => {
  const filters = selectedSport ? { sport_id: selectedSport } : {};
  getSessions(filters).then(setSessions);
}, [selectedSport]);

  return (
    <div className="sessions-wrapper">
      <h1 className="sessions-title">Trouve ta prochaine session sportive</h1>

      <SportFilter selected={selectedSport} onSelect={setSelectedSport} />

      <div className="sessions-grid">
        {Array.isArray(sessions) && sessions.map((s) => (
          <SessionCard key={s.id} session={s} />
        ))}
      </div>
    </div>
  );
}
