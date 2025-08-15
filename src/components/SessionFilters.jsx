// src/components/SessionFilters.jsx
import { useMemo } from "react";
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
      // Ouvert = pas passé, pas annulé/verrouillé/terminé et pas complet
      return !timing.isPast && !badStatus && !full;
    }
    case SESSION_FILTERS.FINISHED: {
      // Terminé = statut FINISHED OU (passé et pas en cours)
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
  const items = useMemo(() => ([
    { key: SESSION_FILTERS.ALL, label: "Tout" },
    { key: SESSION_FILTERS.OPEN, label: "Ouvertes" },
    { key: SESSION_FILTERS.FINISHED, label: "Terminées" },
    { key: SESSION_FILTERS.FULL, label: "Complètes" },
  ]), []);

  return (
    <div className="filters-bar">
      {items.map((it) => (
        <button
          key={it.key}
          className={`fbtn ${value === it.key ? "active" : ""}`}
          onClick={() => onChange?.(it.key)}
          type="button"
        >
          {it.label}
        </button>
      ))}
      {onRefresh && (
        <button className="fbtn" onClick={onRefresh} type="button" aria-label="Rafraîchir">Rafraîchir</button>
      )}
    </div>
  );
}
