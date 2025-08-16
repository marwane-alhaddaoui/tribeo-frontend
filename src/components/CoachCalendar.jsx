// src/components/CoachCalendar.jsx
import { useEffect, useMemo, useState, useCallback } from "react";
import { useTranslation } from "react-i18next";
import {
  getMySessionsInRange,
  publishSession,
  cancelSession,
} from "../api/sessionService";
import "../styles/CoachCalendar.css";

// ---------- utils ----------
const fmtISO = (d) => d.toISOString().slice(0, 10);
const addMonths = (d, m) => {
  const nd = new Date(d);
  nd.setMonth(nd.getMonth() + m);
  return nd;
};
const firstDayOfMonth = (d) => new Date(d.getFullYear(), d.getMonth(), 1);
const lastDayOfMonth = (d) => new Date(d.getFullYear(), d.getMonth() + 1, 0);
const isSameDay = (a, b) =>
  a.getFullYear() === b.getFullYear() &&
  a.getMonth() === b.getMonth() &&
  a.getDate() === b.getDate();

// Combien d’events max “visibles” par case avant de compacter
const MAX_VISIBLE = 3;

export default function CoachCalendar() {
  const { t, i18n } = useTranslation();

  const STATUS_LABEL = useMemo(() => ({
    DRAFT: t("cc_status_draft"),
    OPEN: t("cc_status_open"),
    LOCKED: t("cc_status_locked"),
    FINISHED: t("cc_status_finished"),
    CANCELED: t("cc_status_canceled"),
  }), [t]);

  const statusClass = (s) =>
    ({
      DRAFT: "badge draft",
      OPEN: "badge open",
      LOCKED: "badge locked",
      FINISHED: "badge finished",
      CANCELED: "badge canceled",
    }[s] || "badge");

  const [cursor, setCursor] = useState(() => {
    const d = new Date();
    return new Date(d.getFullYear(), d.getMonth(), 1);
  });
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState(null);

  const today = new Date();

  const range = useMemo(() => {
    const start = firstDayOfMonth(cursor);
    const end = lastDayOfMonth(cursor);
    return { start: fmtISO(start), end: fmtISO(end) };
  }, [cursor]);

  // grille (lundi → dimanche)
  const gridDays = useMemo(() => {
    const first = firstDayOfMonth(cursor);
    const startWeekDay = (first.getDay() + 6) % 7; // Lundi = 0
    const days = [];
    for (let i = 0; i < startWeekDay; i++) days.push(null);
    const last = lastDayOfMonth(cursor).getDate();
    for (let d = 1; d <= last; d++) {
      days.push(new Date(cursor.getFullYear(), cursor.getMonth(), d));
    }
    while (days.length % 7 !== 0) days.push(null);
    return days;
  }, [cursor]);

  // fetch
  const fetchSessions = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getMySessionsInRange({
        start: range.start,
        end: range.end,
      });
      setSessions(Array.isArray(data) ? data : []);
    } finally {
      setLoading(false);
    }
  }, [range.start, range.end]);

  useEffect(() => {
    fetchSessions();
  }, [fetchSessions]);

  // index par date ISO
  const byDate = useMemo(() => {
    const map = {};
    for (const s of sessions) {
      const key = s.date?.slice(0, 10);
      if (!key) continue;
      if (!map[key]) map[key] = [];
      map[key].push(s);
    }
    for (const k of Object.keys(map)) {
      map[k].sort((a, b) => (a.start_time || "").localeCompare(b.start_time || ""));
    }
    return map;
  }, [sessions]);

  // actions
  const doPublish = async (id) => {
    setBusyId(id);
    try {
      await publishSession(id);
      await fetchSessions();
    } finally {
      setBusyId(null);
    }
  };
  const doCancel = async (id) => {
    setBusyId(id);
    try {
      await cancelSession(id);
      await fetchSessions();
    } finally {
      setBusyId(null);
    }
  };

  // navigation clavier
  useEffect(() => {
    const onKey = (e) => {
      if (["INPUT", "TEXTAREA", "SELECT"].includes(e.target.tagName)) return;
      if (e.key === "ArrowLeft") setCursor((c) => addMonths(c, -1));
      if (e.key === "ArrowRight") setCursor((c) => addMonths(c, 1));
      if (e.key?.toLowerCase() === "t") setCursor(new Date(today.getFullYear(), today.getMonth(), 1));
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [today]);

  // picker mois/année
  const onMonthChange = (e) => {
    const month = Number(e.target.value);
    setCursor((c) => new Date(c.getFullYear(), month, 1));
  };
  const onYearChange = (e) => {
    const year = Number(e.target.value);
    setCursor((c) => new Date(year, c.getMonth(), 1));
  };

  const yearsAround = useMemo(() => {
    const y = today.getFullYear();
    return Array.from({ length: 7 }, (_, i) => y - 3 + i);
  }, [today]);

  // noms localisés
  const monthLabel = (m) =>
    new Date(2000, m, 1).toLocaleString(i18n.language || undefined, { month: "long" });
  const weekdays = useMemo(
    () => [
      t("cc_wd_mon"),
      t("cc_wd_tue"),
      t("cc_wd_wed"),
      t("cc_wd_thu"),
      t("cc_wd_fri"),
      t("cc_wd_sat"),
      t("cc_wd_sun"),
    ],
    [t]
  );

  return (
    <div className="coach-cal">
      {/* Header */}
      <div className="cal-header">
        <div className="cal-left">
          <button
            className="cal-nav"
            onClick={() => setCursor((c) => addMonths(c, -1))}
            aria-label={t("cc_prev_month_aria")}
            title={t("cc_prev_month_title")}
          >
            ←
          </button>
          <button
            className="cal-nav"
            onClick={() => setCursor(new Date(today.getFullYear(), today.getMonth(), 1))}
            title={t("cc_today_title")}
          >
            {t("cc_today")}
          </button>
        </div>

        <div className="cal-title">
          <select className="cal-select" value={cursor.getMonth()} onChange={onMonthChange} aria-label={t("cc_month_aria")}>
            {Array.from({ length: 12 }).map((_, m) => (
              <option key={m} value={m}>
                {monthLabel(m)}
              </option>
            ))}
          </select>
          <select className="cal-select" value={cursor.getFullYear()} onChange={onYearChange} aria-label={t("cc_year_aria")}>
            {yearsAround.map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>
        </div>

        <div className="cal-right">
          <button
            className="cal-nav"
            onClick={() => setCursor((c) => addMonths(c, 1))}
            aria-label={t("cc_next_month_aria")}
            title={t("cc_next_month_title")}
          >
            →
          </button>
        </div>
      </div>

      {/* Weekdays */}
      <div className="cal-weekdays">
        {weekdays.map((d) => (
          <div key={d} className="wd">
            {d}
          </div>
        ))}
      </div>

      {/* Grid */}
      {loading ? (
        <div className="cal-loading">{t("cc_loading")}</div>
      ) : (
        <div className="cal-grid">
          {gridDays.map((d, idx) => {
            const key = d ? d.toISOString() : `empty-${idx}`;
            const iso = d ? fmtISO(d) : null;
            const items = iso ? byDate[iso] || [] : [];
            const isToday = d ? isSameDay(d, today) : false;
            const moreCount = Math.max(0, items.length - MAX_VISIBLE);

            return (
              <div className={`cell ${d ? "" : "empty"} ${isToday ? "is-today" : ""}`} key={key}>
                {d && <div className="cell-day">{d.getDate()}</div>}

                {!!items.length && (
                  <div className="events">
                    {items.slice(0, MAX_VISIBLE).map((ev) => {
                      const hhmm = (ev.start_time || "").slice(0, 5);
                      const sport = ev?.sport?.name || "—";
                      const busy = busyId === ev.id;
                      return (
                        <div className="event" key={ev.id}>
                          <div className={statusClass(ev.status)} title={STATUS_LABEL[ev.status] || ev.status}>
                            {STATUS_LABEL[ev.status] || ev.status}
                          </div>
                          <div className="event-title" title={ev.title}>{ev.title}</div>
                          <div className="event-time" title={`${hhmm} • ${sport}`}>
                            {hhmm || t("cc_time_unknown")} • {sport}
                          </div>
                          <div className="event-actions">
                            {ev.status === "DRAFT" && (
                              <button className="btn btn-primary" disabled={busy} onClick={() => doPublish(ev.id)}>
                                {busy ? "…" : t("cc_publish")}
                              </button>
                            )}
                            {ev.status !== "CANCELED" && (
                              <button className="btn btn-danger" disabled={busy} onClick={() => doCancel(ev.id)}>
                                {busy ? "…" : t("cc_cancel")}
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}

                    {moreCount > 0 && (
                      <div className="event more" title={t("cc_more_title", { count: moreCount })}>
                        {t("cc_more", { count: moreCount })}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Légende */}
      <div className="cal-legend">
        <span className="legend-item"><i className="dot draft" /> {t("cc_status_draft")}</span>
        <span className="legend-item"><i className="dot open" /> {t("cc_status_open")}</span>
        <span className="legend-item"><i className="dot locked" /> {t("cc_status_locked")}</span>
        <span className="legend-item"><i className="dot finished" /> {t("cc_status_finished")}</span>
        <span className="legend-item"><i className="dot canceled" /> {t("cc_status_canceled")}</span>
      </div>
    </div>
  );
}
