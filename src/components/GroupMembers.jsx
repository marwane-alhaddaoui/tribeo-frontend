import { X, Users } from "lucide-react";
import "./GroupMembers.css";

export default function GroupMembers({ emails = [], canManage = false, onRemove }) {
  if (!emails?.length) {
    return (
      <div className="gm-empty">
        <Users size={18} />
        <span>Aucun membre pour le moment.</span>
      </div>
    );
  }

  return (
    <ul className="gm-list">
      {emails.map((email) => (
        <li key={email} className="gm-item">
          <span className="gm-email" title={email}>{email}</span>

          {canManage ? (
            <button
              type="button"
              onClick={() => onRemove?.(email)}
              className="gm-remove"
              aria-label={`Retirer ${email}`}
              title="Retirer"
            >
              <X size={16} />
              <span className="gm-remove-label">Retirer</span>
            </button>
          ) : null}
        </li>
      ))}
    </ul>
  );
}
