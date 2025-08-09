import "../../styles/SessionCard.css";
import { useContext } from "react";
import { AuthContext } from "../../context/AuthContext";

export default function SessionCard({ session, onJoin, onLeave }) {
  const { user } = useContext(AuthContext);

  const sportName =
    typeof session.sport === "object" ? session.sport.name : session.sport;

  // Vérifie si l'utilisateur participe déjà à la session
  const isParticipant =
    Array.isArray(session.participants) &&
    session.participants.includes(user?.email);

  return (
    <div className="session-card">
      <h2>{session.title}</h2>
      {session.sport?.icon && <img src={session.sport.icon} alt={sportName} />}
      <p>🏆 {sportName}</p>
      <p>📅 {session.date}</p>
      <p>📍 {session.location}</p>
      <p>🎯 {session.level || "Non spécifié"}</p>
      <p>👥 {session.available_slots} places disponibles</p>

      {isParticipant ? (
        <button onClick={() => onLeave(session.id)}>Quitter</button>
      ) : (
        <button
          onClick={() => onJoin(session.id)}
          disabled={session.available_slots <= 0}
        >
          {session.available_slots <= 0 ? "Complet" : "Participer"}
        </button>
      )}
    </div>
  );
}
