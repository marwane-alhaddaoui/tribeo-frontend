import { useEffect, useMemo, useState, useCallback } from "react";
import UserManagement from "./UserManagement";
import SessionManagement from "./SessionManagement";
import SportsManagement from "./SportsManagement";
import "../../styles/AdminDashboard.css";

export default function AdminDashboard({
  stats = { users: 0, sessions: 0, sports: 0 },
}) {
  const [counts, setCounts] = useState({
    users:   { total: stats.users,    filtered: stats.users },
    sessions:{ total: stats.sessions, filtered: stats.sessions },
    sports:  { total: stats.sports,   filtered: stats.sports },
  });

  // éviter les setState inutiles → coupe toute boucle résiduelle
  const same = (a, b) => a?.total === b?.total && a?.filtered === b?.filtered;

  const setUsersStats = useCallback((s) => {
    setCounts((c) => (same(c.users, s) ? c : { ...c, users: s }));
  }, []);

  const setSessStats = useCallback((s) => {
    setCounts((c) => (same(c.sessions, s) ? c : { ...c, sessions: s }));
  }, []);

  const setSportStats = useCallback((s) => {
    setCounts((c) => (same(c.sports, s) ? c : { ...c, sports: s }));
  }, []);

  // onglets = icône seule (pas de label/compteur)
  const TABS = useMemo(
    () => [
      { id: "users",    emoji: "👤", aria: "Utilisateurs" },
      { id: "sessions", emoji: "📅", aria: "Sessions" },
      { id: "sports",   emoji: "🏆", aria: "Sports" },
    ],
    []
  );

  // persistance onglet actif
  const saved = typeof window !== "undefined" ? localStorage.getItem("adm_tab") : null;
  const [active, setActive] = useState(saved || "users");
  const [q, setQ] = useState("");

  useEffect(() => {
    localStorage.setItem("adm_tab", active);
  }, [active]);

  // raccourcis clavier 1/2/3
  useEffect(() => {
    const onKey = (e) => {
      if (["INPUT", "TEXTAREA"].includes(e.target.tagName)) return;
      if (e.key === "1") setActive("users");
      if (e.key === "2") setActive("sessions");
      if (e.key === "3") setActive("sports");
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
          <span className="hint"> • press 1‑2‑3 to switch</span>
        </div>

        <div className="admin__search">
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Rechercher… (filtre local au panel)"
            aria-label="Rechercher"
          />
        </div>
      </header>

      {/* quick stats (totaux) — chiffres uniquement ici */}
      <section className="admin__stats">
        <StatCard label="Users"    value={counts.users.total}    icon="👤" />
        <StatCard label="Sessions" value={counts.sessions.total} icon="📅" />
        <StatCard label="Sports"   value={counts.sports.total}   icon="🏆" />
      </section>

      {/* sticky tabs — icône seule */}
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

      {/* panel — MONTER TOUT LE MONDE, cacher au lieu de ne pas rendre */}
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
