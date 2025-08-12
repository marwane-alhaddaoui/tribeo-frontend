import { Link } from "react-router-dom";
import "./GroupCard.css";

export default function GroupCard({ group, locked = false }) {
  if (!group) return null;

  const isPrivate = group.group_type === "PRIVATE";
  const isCoachOnly = group.group_type === "COACH";
  const open = !isPrivate && !isCoachOnly;

  const typeClass = isPrivate ? "is-private" : isCoachOnly ? "is-coach" : "is-open";
  const typeLabel = isPrivate ? "Privé" : isCoachOnly ? "Coach‑only" : "Public";

  const sportLabel = group?.sport_name ?? group?.sport?.name ?? group?.sport ?? "—";

  // membersCount fiable : calcule via members si dispo, sinon fallback
  const membersCount = Array.isArray(group?.members)
    ? group.members.length
    : (group?.members_count ?? 0);

  return (
    <article className={`gc-card ${locked ? "gc-locked" : ""}`}>
      <div className="gc-header">
        <span className={`gc-chip ${typeClass}`}>{typeLabel}</span>
        <div className="gc-members">{membersCount} membre{membersCount > 1 ? "s" : ""}</div>
      </div>

      <h3 className="gc-title">{group.name}</h3>
      <p className="gc-sub">
        {group.city || "—"} • {sportLabel}
      </p>

      <div className="group-card-actions">
        {locked ? (
          <button className="gc-btn-details gc-disabled" disabled aria-disabled="true" title="Connecte-toi pour voir">
            Détails
          </button>
        ) : (
          <Link className="gc-btn-details" to={`/groups/${group.id}`} title="Voir le groupe">
            Détails
          </Link>
        )}
      </div>

      {locked && <div className="gc-lock-overlay" aria-hidden="true" />}
    </article>
  );
}
