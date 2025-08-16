// src/components/GroupCard.jsx
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import "./GroupCard.css";

export default function GroupCard({ group, locked = false }) {
  const { t } = useTranslation();

  if (!group) return null;

  const isPrivate = group.group_type === "PRIVATE";
  const isCoachOnly = group.group_type === "COACH";
  const open = !isPrivate && !isCoachOnly;

  const typeClass = isPrivate ? "is-private" : isCoachOnly ? "is-coach" : "is-open";
  const typeLabel = isPrivate
    ? t("group_card.type_private")
    : isCoachOnly
      ? t("group_card.type_coach_only")
      : t("group_card.type_public");

  const sportLabel = group?.sport_name ?? group?.sport?.name ?? group?.sport ?? "—";

  // count → pluriel géré par i18n
  const membersCount = Array.isArray(group?.members)
    ? group.members.length
    : (group?.members_count ?? 0);

  return (
    <article className={`gc-card ${locked ? "gc-locked" : ""}`}>
      <div className="gc-header">
        <span className={`gc-chip ${typeClass}`}>{typeLabel}</span>
        <div className="gc-members">
          {t("group_card.members", { count: membersCount })}
        </div>
      </div>

      <h3 className="gc-title">{group.name}</h3>
      <p className="gc-sub">
        {group.city || "—"} • {sportLabel}
      </p>

      <div className="group-card-actions">
        {locked ? (
          <button
            className="gc-btn-details gc-disabled"
            disabled
            aria-disabled="true"
            title={t("group_card.login_required_title")}
          >
            {t("group_card.details_btn")}
          </button>
        ) : (
          <Link
            className="gc-btn-details"
            to={`/groups/${group.id}`}
            title={t("group_card.view_group_title")}
          >
            {t("group_card.details_btn")}
          </Link>
        )}
      </div>

      {locked && <div className="gc-lock-overlay" aria-hidden="true" />}
    </article>
  );
}
