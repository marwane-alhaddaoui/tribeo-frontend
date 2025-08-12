// src/components/GroupMembers.jsx
import { useMemo } from "react";
import "./GroupMembers.css";

/** Utilities (no external deps) */
function labelOf(m) {
  return m?.username || m?.email || `user#${m?.id ?? "?"}`;
}
function subOf(m) {
  // montre l'email en sous-texte uniquement si différent du label
  if (!m?.email) return "";
  const main = m?.username || "";
  return main && m.email !== main ? m.email : "";
}
function avatarUrl(seed) {
  const s = encodeURIComponent(String(seed || "user"));
  // Dicebear initials, zéro install/clé
  return `https://api.dicebear.com/7.x/initials/svg?seed=${s}`;
}

export default function GroupMembers({
  members = [],
  canManage = false,
  onRemove, // (member) => void
}) {
  // List safe + tri alpha par username/email
  const list = useMemo(() => {
    const arr = Array.isArray(members) ? members.slice() : [];
    return arr.sort((a, b) => labelOf(a).localeCompare(labelOf(b), undefined, { sensitivity: "base" }));
  }, [members]);

  if (!list.length) {
    return <div className="gm-empty">Aucun membre pour l’instant.</div>;
  }

  return (
    <ul className="gm-list" aria-label={`Membres (${list.length})`}>
      {list.map((m, idx) => {
        const label = labelOf(m);
        const sub = subOf(m);
        const key = m?.id ?? `${label}-${idx}`;
        const seed = m?.username || m?.email || m?.id;

        return (
          <li key={key} className="gm-item">
            <img
              src={avatarUrl(seed)}
              alt={label.charAt(0).toUpperCase()}
              width={26}
              height={26}
              style={{ borderRadius: 999, display: "block", flex: "0 0 26px" }}
              loading="lazy"
            />
            <div className="gm-info">
              <span className="gm-chip" title={label}>{label}</span>
            </div>

            {canManage && (
              <button
                className="gm-remove"
                onClick={() => onRemove?.(m)}
                title={`Retirer ${label} du groupe`}
                aria-label={`Retirer ${label} du groupe`}
              >
                Retirer
              </button>
            )}
          </li>
        );
      })}
    </ul>
  );
}
