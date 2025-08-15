// src/components/SessionCard.jsx
import { useContext, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import "../../styles/SessionCard.css";
import { AuthContext } from "../../context/AuthContext";
import { computeTiming, formatDateTime } from "../../utils/sessionTime";

function usernameFromEmail(email = "") {
  return email && email.includes("@") ? email.split("@")[0] : (email || "user");
}
function dicebearAvatar(seed) {
  const s = encodeURIComponent(String(seed || "user"));
  return `https://api.dicebear.com/7.x/initials/svg?seed=${s}`;
}

export default function SessionCard({ session, onFocus }) {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();

  const sportName =
    typeof session.sport === "object" ? session.sport?.name : session.sport;
  const sportIcon =
    typeof session.sport === "object" ? session.sport?.icon : null;

  const capacity = Number(
    session.max_players ?? session.capacity ?? session.max_participants ?? 0
  );
  const count = Array.isArray(session.participants)
    ? session.participants.length
    : Number(session.participants_count ?? 0);
  const remaining = Math.max(capacity - count, 0);
  const full = capacity ? count >= capacity : false;

  const timing = useMemo(
    () =>
      computeTiming
        ? computeTiming(session)
        : { isPast: false, isOngoing: false, isFuture: false },
    [session.start, session.end, session.date, session.start_time, session.end_time]
  );
  const dateLabel = useMemo(
    () => (formatDateTime ? formatDateTime(session) : (session.date || "—")),
    [session.start, session.date, session.start_time]
  );

  const isPast = !!timing.isPast;
  const isFull = !!full;

  const locationLabel = session.address || session.location || "—";

  const rootClass = [
    "session-card",
    isFull ? "is-full" : "",
    isPast ? "is-past" : "",
    timing.isOngoing ? "is-now" : "",
  ]
    .filter(Boolean)
    .join(" ");

  // 👉 carte cliquable uniquement si la session n'est PAS passée
  const clickable = !isPast;

  const handleCardClick = (e) => {
    if (!clickable) return; // garde-fou
    e.preventDefault();
    e.stopPropagation();
    if (typeof onFocus === "function") {
      onFocus(session, {
        disableZoom: isPast,
        reason: isPast ? "past" : isFull ? "full" : "default",
      });
      return;
    }
    navigate(`/sessions/${session.id}`);
  };

  // Accessibilité clavier
  const handleKeyDown = (e) => {
    if (!clickable) return;
    if (e.key === "Enter" || e.key === " ") handleCardClick(e);
  };

  return (
    <article
      className={rootClass}
      role={clickable ? "button" : "group"}
      tabIndex={clickable ? 0 : -1}
      onClick={clickable ? handleCardClick : undefined}
      onKeyDown={clickable ? handleKeyDown : undefined}
      aria-label={`Session ${session.title || ""}`}
      aria-disabled={isPast ? "true" : "false"}
      title={clickable ? "" : "Session passée — non cliquable"}
    >
      {/* RIBBONS */}
      {isPast && <div className="status-ribbon status-ribbon--past">PASSÉE</div>}
      {!isPast && isFull && (
        <div className="status-ribbon status-ribbon--full">COMPLET</div>
      )}

      {/* Top row: créateur + badges */}
      <div className="session-creator-row">
        <div className="creator">
          <img
            className="creator-avatar"
            src={dicebearAvatar(
              usernameFromEmail(session?.creator?.email || session?.creator)
            )}
            alt=""
          />
          <span className="creator-name">
            {session?.creator?.username ||
              usernameFromEmail(session?.creator?.email || "")}
          </span>
        </div>

        <div className="session-badges">
          {session.format && (
            <span className="sc-badge sc-badge-outline">
              {String(session.format).replaceAll("_", " ")}
            </span>
          )}
          {String(session.visibility || "").toLowerCase() !== "public" && (
            <span className="sc-badge">Privée</span>
          )}
          {timing.isOngoing && (
            <span className="sc-badge sc-badge-accent">En cours</span>
          )}
          {/* {isPast && <span className="sc-badge sc-badge-muted">Passée</span>} */}
        </div>
      </div>

      {/* Titre */}
      <h2 className="sc-title">{session.title}</h2>

      {/* Meta */}
      <div className="sc-meta">
        <div className="meta-row">
          <span>📅</span>
          <span>{dateLabel}</span>
        </div>
        <div className="meta-row">
          <span>📍</span>
          <span className="meta-location">{locationLabel}</span>
        </div>
      </div>

      {/* Sport chip */}
      <div className="sc-row">
        <span className="badge-sport">
          {sportIcon ? (
            <img
              src={sportIcon}
              alt=""
              className="badge-sport-icon"
              aria-hidden="true"
            />
          ) : (
            <span className="badge-sport-emoji" aria-hidden="true">
              🏆
            </span>
          )}
          <span className="badge-sport-label">{sportName || "Sport"}</span>
        </span>
      </div>

      {/* Capacités */}
      <div className="sc-capacity">
        <div className="capacity-bar capacity-track">
          <div
            className="capacity-fill"
            style={{
              width: capacity
                ? `${Math.min(100, Math.round((count / capacity) * 100))}%`
                : 0,
            }}
          />
        </div>
        <div className="capacity-legend">
          <span>
            {count}/{capacity || "∞"}
          </span>
          <span
            className={
              remaining === 0
                ? "avail avail--low"
                : remaining <= 2
                ? "avail avail--mid"
                : "avail avail--ok"
            }
          >
            {remaining ? `${remaining} places` : "Complet"}
          </span>
        </div>
      </div>

      {/* CTA — masqué si passé */}
      {!isPast && (
        <div className="sc-actions session-card-actions">
          <Link
            to={`/sessions/${session.id}`}
            className="btn-details"
            onClick={(e) => e.stopPropagation()}
          >
            Voir les détails
          </Link>
        </div>
      )}
    </article>
  );
}
