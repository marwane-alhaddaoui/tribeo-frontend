// src/components/SessionFilters.jsx
import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import "./SessionFilters.css";
import { computeTiming } from "../utils/sessionTime";

export const SESSION_FILTERS = {
  ALL: "ALL",
  OPEN: "OPEN",
  FINISHED: "FINISHED",
  FULL: "FULL",
};

function isFull(session) {
  const capacity = Number(session?.max_players ?? session?.capacity ?? session?.max_participants ?? 0);
  const count = Array.isArray(session?.participants)
    ? session.participants.length
    : Number(session?.participants_count ?? 0);
  return capacity > 0 && count >= capacity;
}

export function matchesFilter(session, filter) {
  const status = String(session?.status || "").toUpperCase();
  const timing = computeTiming ? computeTiming(session) : { isPast: false, isOngoing: false, isFuture: true };
  const full = isFull(session);

  switch (filter) {
    case SESSION_FILTERS.OPEN: {
      const badStatus = ["FINISHED", "CANCELED", "LOCKED"].includes(status);
      // Open = not past, not canceled/locked/finished and not full
      return !timing.isPast && !badStatus && !full;
    }
    case SESSION_FILTERS.FINISHED: {
      // Finished = status FINISHED OR (past and not ongoing)
      return status === "FINISHED" || (timing.isPast && !timing.isOngoing);
    }
    case SESSION_FILTERS.FULL: {
      return full;
    }
    case SESSION_FILTERS.ALL:
    default:
      return true;
  }
}

export default function SessionFilters({ value, onChange, onRefresh }) {
  const { t } = useTranslation();

  const items = useMemo(
    () => [
      { key: SESSION_FILTERS.ALL, label: t("session_filters.all") },
      { key: SESSION_FILTERS.OPEN, label: t("session_filters.open") },
      { key: SESSION_FILTERS.FINISHED, label: t("session_filters.finished") },
      { key: SESSION_FILTERS.FULL, label: t("session_filters.full") },
    ],
    [t]
  );

  return (
    <div className="filters-bar" role="tablist" aria-label={t("session_filters.bar_aria")}>
      {items.map((it) => {
        const isActive = value === it.key;
        return (
          <button
            key={it.key}
            className={`fbtn ${isActive ? "active" : ""}`}
            onClick={() => onChange?.(it.key)}
            type="button"
            role="tab"
            aria-selected={isActive}
            title={t("session_filters.filter_title", { label: it.label })}
          >
            {it.label}
          </button>
        );
      })}
      {onRefresh && (
        <button
          className="fbtn"
          onClick={onRefresh}
          type="button"
          aria-label={t("session_filters.refresh_aria")}
          title={t("session_filters.refresh_title")}
        >
          {t("session_filters.refresh")}
        </button>
      )}
    </div>
  );
}
