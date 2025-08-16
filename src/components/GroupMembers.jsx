// src/components/GroupMembers.jsx
import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import "./GroupMembers.css";

/** Utilities */
function labelOf(m) {
  return m?.username || m?.email || `user#${m?.id ?? "?"}`;
}
function subOf(m) {
  if (!m?.email) return "";
  const main = m?.username || "";
  return main && m.email !== main ? m.email : "";
}
function avatarUrl(seed) {
  const s = encodeURIComponent(String(seed || "user"));
  return `https://api.dicebear.com/7.x/initials/svg?seed=${s}`;
}

export default function GroupMembers({
  members = [],
  canManage = false,
  onRemove, // (member) => void
}) {
  const { t } = useTranslation();

  // List safe + tri alpha
  const list = useMemo(() => {
    const arr = Array.isArray(members) ? members.slice() : [];
    return arr.sort((a, b) =>
      labelOf(a).localeCompare(labelOf(b), undefined, { sensitivity: "base" })
    );
  }, [members]);

  if (!list.length) {
    return <div className="gm-empty">{t("group_members.empty")}</div>;
  }

  return (
    <ul className="gm-list" aria-label={t("group_members.list_aria", { count: list.length })}>
      {list.map((m, idx) => {
        const label = labelOf(m);
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
                title={t("group_members.remove_title", { name: label })}
                aria-label={t("group_members.remove_aria", { name: label })}
              >
                {t("group_members.remove_btn")}
              </button>
            )}
          </li>
        );
      })}
    </ul>
  );
}
