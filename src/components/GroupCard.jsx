import { Link } from "react-router-dom";
import { Users, MapPin } from "lucide-react";
import "./GroupCard.css";

export default function GroupCard({ group }) {
  const members = group?.members_count ?? 0;
  const city = group?.city;
  const desc = group?.description;

  return (
    <div className="group-card">
      {/* TOP ROW — titre + chip à droite si besoin */}
      <div className="gc-row gc-row-top">
        <h3 className="gc-title">{group.name}</h3>

        {/* Chip d'info (ex: ville) */}
        {city && (
          <span className="gc-chip">
            <span className="gc-chip-emoji">📍</span>
            <span className="gc-chip-label">{city}</span>
          </span>
        )}
      </div>

      {/* META */}
      <div className="gc-meta">
        <div className="meta-row">
          <Users size={16} />
          <span>{members} membre{members > 1 ? "s" : ""}</span>
        </div>
        {desc && <p className="gc-desc">{desc}</p>}
      </div>

      {/* ACTIONS */}
      <div className="group-card-actions">
        <Link to={`/groups/${group.id}`} className="gc-btn-details">
          Voir le groupe
        </Link>
      </div>
    </div>
  );
}
