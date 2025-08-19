import { useEffect, useMemo, useState, useCallback } from "react";
import UserManagement from "./UserManagement";
import SessionManagement from "./SessionManagement";
import SportsManagement from "./SportsManagement";
import GroupManagement from "./GroupManagement"; // 👈 NEW
import "../../styles/AdminDashboard.css";
import AuditActions from "../../components/AuditActions";

export default function AdminDashboard({
  stats = { users: 0, sessions: 0, sports: 0, groups: 0 },
}) {
  const [counts, setCounts] = useState({
    users:    { total: stats.users,    filtered: stats.users },
    sessions: { total: stats.sessions, filtered: stats.sessions },
    sports:   { total: stats.sports,   filtered: stats.sports },
    groups:   { total: stats.groups,   filtered: stats.groups }, // 👈 NEW
  });

  const same = (a, b) => a?.total === b?.total && a?.filtered === b?.filtered;

  const setUsersStats = useCallback((s) => setCounts((c) => (same(c.users, s) ? c : { ...c, users: s })), []);
  const setSessStats  = useCallback((s) => setCounts((c) => (same(c.sessions, s) ? c : { ...c, sessions: s })), []);
  const setSportStats = useCallback((s) => setCounts((c) => (same(c.sports, s) ? c : { ...c, sports: s })), []);
  const setGroupStats = useCallback((s) => setCounts((c) => (same(c.groups, s) ? c : { ...c, groups: s })), []); // 👈 NEW

  const TABS = useMemo(
    () => [
      { id: "users",    emoji: "👤", aria: "Utilisateurs" },
      { id: "sessions", emoji: "📅", aria: "Sessions" },
      { id: "sports",   emoji: "🏆", aria: "Sports" },
      { id: "groups",   emoji: "👥", aria: "Groupes" }, // 👈 NEW
    ],
    []
  );

  const saved = typeof window !== "undefined" ? localStorage.getItem("adm_tab") : null;
  const [active, setActive] = useState(saved || "users");
  const [q, setQ] = useState("");

  useEffect(() => { localStorage.setItem("adm_tab", active); }, [active]);

  useEffect(() => {
    const onKey = (e) => {
      if (["INPUT", "TEXTAREA"].includes(e.target.tagName)) return;
      if (e.key === "1") setActive("users");
      if (e.key === "2") setActive("sessions");
      if (e.key === "3") setActive("sports");
      if (e.key === "4") setActive("groups"); // 👈 NEW
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <div className="admin">
      {/* header */}
      <header className="admin__head">
        <div className="admin__title">
          <span className="spark">⚙️</span> Admin Dashboard
          <span className="hint"> •</span>
        </div>

  
          <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
  
     <AuditActions />
   </div>
      </header>

      {/* quick stats */}
      <section className="admin__stats">
        <StatCard label="Users"    value={counts.users.total}    icon="👤" />
        <StatCard label="Sessions" value={counts.sessions.total} icon="📅" />
        <StatCard label="Sports"   value={counts.sports.total}   icon="🏆" />
        <StatCard label="Groupes"  value={counts.groups.total}   icon="👥" /> {/* NEW */}
      </section>

      {/* tabs */}
      <nav className="admin__tabs">
        {TABS.map((t) => (
          <button
            key={t.id}
            className={`tab ${active === t.id ? "is-active" : ""}`}
            onClick={() => setActive(t.id)}
            aria-label={t.aria}
            title={t.aria}
          >
            <span className="tab__emoji">{t.emoji}</span>
          </button>
        ))}
      </nav>

      {/* panels */}
      <section className="admin__panel">
        <div style={{ display: active === "users" ? "block" : "none" }} aria-hidden={active !== "users"}>
          <UserManagement query={q} onStats={setUsersStats} />
        </div>
        <div style={{ display: active === "sessions" ? "block" : "none" }} aria-hidden={active !== "sessions"}>
          <SessionManagement query={q} onStats={setSessStats} />
        </div>
        <div style={{ display: active === "sports" ? "block" : "none" }} aria-hidden={active !== "sports"}>
          <SportsManagement query={q} onStats={setSportStats} />
        </div>
        <div style={{ display: active === "groups" ? "block" : "none" }} aria-hidden={active !== "groups"}>
          <GroupManagement query={q} onStats={setGroupStats} /> {/* NEW */}
        </div>
      </section>
    </div>
  );
}

function StatCard({ label, value, icon }) {
  return (
    <div className="stat">
      <div className="stat__icon">{icon}</div>
      <div className="stat__body">
        <div className="stat__value">{format(value)}</div>
        <div className="stat__label">{label}</div>
      </div>
    </div>
  );
}

function format(n) {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + "M";
  if (n >= 1_000) return (n / 1_000).toFixed(1) + "k";
  return String(n ?? 0);
}
