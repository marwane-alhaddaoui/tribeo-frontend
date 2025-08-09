import "../../styles/SessionCard.css";

export default function SessionCard({ session }) {
  const sportName =
    typeof session.sport === "object" ? session.sport.name : session.sport;

  return (
    <div className="session-card">
      {/* ✅ Titre */}
      <h2>{session.title}</h2>

      {/* ✅ Icône sport */}
      {session.sport?.icon && (
        <img src={session.sport.icon} alt={sportName} />
      )}
      <p>🏆 {sportName}</p>

      {/* Autres infos */}
      <p>📅 {session.date}</p>
      <p>📍 {session.location}</p>
      <p>🎯 {session.level || "Non spécifié"}</p>
      <p>👥 {session.max_players} places disponibles</p>

      <button>Participer</button>
    </div>
  );
}
