// src/utils/sessionTime.js
/** Construit des ISO à partir du shape (nouveau back: start/end) ou (ancien: date + start_time/end_time) */
export function getStartEndISO(s = {}) {
  const startIso = s.start || (s.date && (s.start_time ? `${s.date}T${s.start_time}` : `${s.date}`)) || null;
  const endIso =
    s.end ||
    (s.date && s.end_time ? `${s.date}T${s.end_time}` : null) ||
    null;
  return { startIso, endIso };
}

/** Calcule les états temporels coté client */
export function computeTiming(s = {}) {
  const { startIso, endIso } = getStartEndISO(s);
  const now = Date.now();
  const startMs = startIso ? Date.parse(startIso) : null;
  const endMs = endIso ? Date.parse(endIso) : (startMs ? startMs + 2 * 60 * 60 * 1000 : null); // fallback 2h

  const isPast = startMs ? now > (endMs ?? startMs) : false;
  const isOngoing = startMs && endMs ? now >= startMs && now <= endMs : false;
  const isFuture = startMs ? now < startMs : false;

  return { startIso, endIso, startMs, endMs, isPast, isOngoing, isFuture };
}

/** Format court pour affichage */
export function formatDateTime(s = {}) {
  const { startIso } = getStartEndISO(s);
  if (!startIso) return "—";
  const d = new Date(startIso);
  try {
    return d.toLocaleString(undefined, {
      weekday: "short",
      day: "2-digit",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return d.toString();
  }
}
