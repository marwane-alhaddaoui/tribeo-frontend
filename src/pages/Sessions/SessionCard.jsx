import { useContext, useMemo } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import "../../styles/SessionCard.css";
import { AuthContext } from "../../context/AuthContext";

function usernameFromEmail(email = "") {
  return email && email.includes("@") ? email.split("@")[0] : (email || "user");
}
function dicebearAvatar(seed) {
  const s = encodeURIComponent(String(seed || "user"));
  return `https://api.dicebear.com/7.x/initials/svg?seed=${s}`;
}

export default function SessionCard({ session }) {
  const { user } = useContext(AuthContext);
  const email = user?.email;
  const teaser = !user; // 👈 visiteur => mode teaser
  const navigate = useNavigate();
  const locationRouter = useLocation();

  const sportName = typeof session.sport === "object" ? session.sport?.name : session.sport;
  const sportIcon = typeof session.sport === "object" ? session.sport?.icon : null;

  const capacity = Number(session.max_players) || 0;
  const count = Array.isArray(session.participants) ? session.participants.length : 0;
  const available = session.available_slots ?? Math.max(capacity - count, 0);
  const full = capacity ? count >= capacity : false;

  const isParticipant = useMemo(() => {
    if (!email) return false;
    return Array.isArray(session.participants)
      ? session.participants.some((p) => (p?.email || p) === email)
      : false;
  }, [session, email]);

  const isCreator = (session?.creator?.email || session?.creator) === email;

  const creatorName = session?.creator?.username || session?.creator?.email || "—";
  const creatorAvatar = session?.creator?.avatar_url || dicebearAvatar(creatorName);

  // classes de couleur pour "restants"
  const remaining = available;
  const remainingClass =
    remaining === 0 ? "avail avail--low" :
    remaining <= 2 ? "avail avail--mid" : "avail avail--ok";

  const pct = capacity ? Math.min(100, Math.round((count / capacity) * 100)) : 0;

  const dateLabel = useMemo(() => {
    try {
      const d = new Date(`${session.date}T${session.start_time || "00:00"}`);
      return d.toLocaleString(undefined, {
        weekday: "short",
        day: "2-digit",
        month: "short",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return `${session.date}${session.start_time ? ` • ${session.start_time}` : ""}`;
    }
  }, [session?.date, session?.start_time]);

  // Adresse: en teaser on ne montre que la ville (dernière partie après la virgule)
  const locationLabel = useMemo(() => {
    const loc = session.location;
    if (!loc) return teaser ? "Adresse après connexion" : "—";
    if (!teaser) return loc;
    const parts = String(loc).split(",");
    const city = parts[parts.length - 1]?.trim();
    return city ? `${city} — détail après connexion` : "Adresse après connexion";
  }, [session?.location, teaser]);

  return (
    <div className={`session-card ${full ? "is-full" : ""}`}>
      {/* ROW 1 — Créateur + badges compacts */}
      <div className="sc-row sc-row-top">
        <div className="sc-creator">
          <img className="sc-creator-avatar" src={creatorAvatar} alt={creatorName} referrerPolicy="no-referrer" />
          <span className={`sc-creator-name ${teaser ? "mask-text" : ""}`}>
            {teaser ? "Organisateur visible après connexion" : creatorName}
          </span>
        </div>
        <div className="sc-badges">
          {!teaser && isCreator && <span className="sc-badge sc-badge-soft">Créée par moi</span>}
          {session.format && <span className="sc-badge sc-badge-outline">{String(session.format).replaceAll("_"," ")}</span>}
          {String(session.visibility || "").toLowerCase() !== "public" && <span className="sc-badge">Privée</span>}
          {full && <span className="sc-badge sc-badge-danger">Complet</span>}
        </div>
      </div>

      {/* ROW 2 — Chip Sport (sous la 1ère ligne) */}
      <div className="sc-row">
        <span className="badge-sport">
          {sportIcon ? (
            <img src={sportIcon} alt="" className="badge-sport-icon" aria-hidden="true" />
          ) : (
            <span className="badge-sport-emoji" aria-hidden="true">🏆</span>
          )}
          <span className="badge-sport-label">{sportName || "Sport"}</span>
        </span>
      </div>

      {/* Titre */}
      <h2 className="sc-title">{session.title}</h2>

      {/* Infos */}
      <div className="sc-meta">
        <div className="meta-row"><span>📅</span><span>{dateLabel}</span></div>
        <div className="meta-row">
          <span>📍</span>
          <span className={`meta-location ${teaser ? "mask-text" : ""}`}>{locationLabel}</span>
        </div>
      </div>

      {/* Barre de capacité + chiffres */}
      <div className="sc-capacity">
        <div className="capacity-track">
          {teaser ? (
            <div className="capacity-skeleton" />
          ) : (
            <div className="capacity-fill" style={{ width: `${pct}%` }} />
          )}
        </div>
        <div className="capacity-legend">
          <span className={`${teaser ? "mask-text" : ""}`}>👥 {teaser ? "Compteur après connexion" : `${count}/${capacity}`}</span>
          <span className={`${teaser ? "mask-text" : remainingClass}`}>
            {teaser ? "Places visibles après connexion" : `${available} restant${available > 1 ? "s" : ""}`}
          </span>
        </div>
      </div>

      {/* Actions */}
      <div className="session-card-actions">
        {teaser ? (
          <button
            className="btn-details"
            onClick={() => navigate("/login", { state: { from: locationRouter } })}
          >
            Connecte-toi pour les détails
          </button>
        ) : (
          <Link to={`/sessions/${session.id}`} className="btn-details">Détails</Link>
        )}

        {isParticipant && !teaser && <span className="pill">Tu participes déjà</span>}
      </div>

      {/* Ruban teaser */}
      {teaser && (
        <div className="sc-ribbon">
          <span>🔒</span>
          <span>Adresse & participants visibles après connexion</span>
        </div>
      )}
    </div>
  );
}
