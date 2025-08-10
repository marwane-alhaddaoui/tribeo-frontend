// pages/Dashboard/CoachCalendar.jsx
import { useEffect, useMemo, useState } from "react";
import { getMySessionsInRange, publishSession, cancelSession } from "../api/sessionService";
import "../styles/CoachCalendar.css";

function fmt(d) { return d.toISOString().slice(0,10); }
function addMonths(d, m) { const nd=new Date(d); nd.setMonth(nd.getMonth()+m); return nd; }
function firstDayOfMonth(d){ return new Date(d.getFullYear(), d.getMonth(), 1); }
function lastDayOfMonth(d){ return new Date(d.getFullYear(), d.getMonth()+1, 0); }

const statusClass = (s) => ({
  DRAFT: "badge draft",
  OPEN: "badge open",
  LOCKED: "badge locked",
  FINISHED: "badge finished",
  CANCELED: "badge canceled",
}[s] || "badge");

export default function CoachCalendar() {
  const [cursor, setCursor] = useState(() => new Date()); // mois courant
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);

  const range = useMemo(() => {
    const start = firstDayOfMonth(cursor);
    const end = lastDayOfMonth(cursor);
    return { start: fmt(start), end: fmt(end) };
  }, [cursor]);

  const gridDays = useMemo(() => {
    const first = firstDayOfMonth(cursor);
    const startWeekDay = (first.getDay() + 6) % 7; // Lundi=0
    const days = [];
    for (let i=0; i<startWeekDay; i++) days.push(null);
    const last = lastDayOfMonth(cursor).getDate();
    for (let d=1; d<=last; d++) days.push(new Date(cursor.getFullYear(), cursor.getMonth(), d));
    // compléter pour avoir un multiple de 7
    while (days.length % 7 !== 0) days.push(null);
    return days;
  }, [cursor]);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const data = await getMySessionsInRange({ start: range.start, end: range.end });
        setSessions(Array.isArray(data) ? data : []);
      } finally { setLoading(false); }
    })();
  }, [range.start, range.end]);

  const byDate = useMemo(() => {
    const map = {};
    for (const s of sessions) {
      if (!map[s.date]) map[s.date] = [];
      map[s.date].push(s);
    }
    return map;
  }, [sessions]);

  const handlePublish = async (id) => {
    await publishSession(id);
    // refresh
    const data = await getMySessionsInRange({ start: range.start, end: range.end });
    setSessions(Array.isArray(data) ? data : []);
  };

  const handleCancel = async (id) => {
    await cancelSession(id);
    const data = await getMySessionsInRange({ start: range.start, end: range.end });
    setSessions(Array.isArray(data) ? data : []);
  };

  return (
    <div className="coach-cal">
      <div className="cal-header">
        <button onClick={() => setCursor(addMonths(cursor, -1))}>←</button>
        <h2>
          {cursor.toLocaleString("fr-FR", { month: "long", year: "numeric" })}
        </h2>
        <button onClick={() => setCursor(addMonths(cursor, 1))}>→</button>
      </div>

      <div className="cal-weekdays">
        {["Lun","Mar","Mer","Jeu","Ven","Sam","Dim"].map((d) => (
          <div key={d} className="wd">{d}</div>
        ))}
      </div>

      {loading ? (
        <p style={{marginTop: 16}}>Chargement…</p>
      ) : (
        <div className="cal-grid">
          {gridDays.map((d, idx) => {
            const key = d ? d.toISOString() : `empty-${idx}`;
            const iso = d ? fmt(d) : null;
            const items = iso ? (byDate[iso] || []) : [];
            return (
              <div className={`cell ${d ? "" : "empty"}`} key={key}>
                {d && <div className="cell-day">{d.getDate()}</div>}
                {!!items.length && (
                  <div className="events">
                    {items.map(ev => (
                      <div className="event" key={ev.id}>
                        <div className={statusClass(ev.status)}>{ev.status}</div>
                        <div className="event-title">{ev.title}</div>
                        <div className="event-time">{ev.start_time?.slice(0,5)} • {ev.sport?.name}</div>
                        <div className="event-actions">
                          {ev.status === "DRAFT" && (
                            <button className="btn btn-primary" onClick={() => handlePublish(ev.id)}>Publier</button>
                          )}
                          {ev.status !== "CANCELED" && (
                            <button className="btn btn-danger" onClick={() => handleCancel(ev.id)}>Annuler</button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
