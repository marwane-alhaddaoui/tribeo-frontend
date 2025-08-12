// src/pages/Dashboard/CoachDashboard.jsx
import { useEffect, useMemo, useState } from "react";
import {
  getSessions,
  publishSession,
  cancelSession,
  deleteSession,        // 🆕
} from "../../api/sessionService";
import {
  getGroupsByCoach,
  deleteGroup,          // 🆕
} from "../../api/groupService";
import "../../styles/CoachDashboard.css";
import CoachCalendar from "../../components/CoachCalendar";
import { Link, useNavigate } from "react-router-dom";

const STATUS_LABEL = {
  DRAFT: "Brouillon",
  PUBLISHED: "Publiée",
  CANCELED: "Annulée",
};

function fmtDate(date, time) {
  try {
    const d = new Date(`${date}T${time || "00:00"}`);
    return d.toLocaleString(undefined, {
      weekday: "short",
      day: "2-digit",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return `${date}${time ? ` • ${time}` : ""}`;
  }
}

export default function CoachDashboard() {
  const [activeTab, setActiveTab] = useState("sessions"); // sessions | groups | calendar
  const [groups, setGroups] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [q, setQ] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [toast, setToast] = useState(null);
  const [confirm, setConfirm] = useState(null);
  const navigate = useNavigate();

  const fetchData = async () => {
    setLoading(true);
    setError("");
    try {
      const [g, s] = await Promise.all([getGroupsByCoach(), getSessions({ mine: true })]);
      setGroups(Array.isArray(g) ? g : []);
      setSessions(Array.isArray(s) ? s : []);
    } catch (err) {
      console.error("Erreur chargement dashboard coach :", err);
      setError("Erreur de chargement des données.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  // Derivés
  const now = new Date();
  const derived = useMemo(() => {
    const all = sessions.map((s) => {
      const start = new Date(`${s.date}T${s.start_time || "00:00"}`);
      return { ...s, _isPast: start < now };
    });

    const needle = q.trim().toLowerCase();
    let filtered = needle
      ? all.filter((s) =>
          [s.title, s.location, s?.sport?.name, s.sport]
            .filter(Boolean)
            .some((x) => String(x).toLowerCase().includes(needle))
        )
      : all;

    if (statusFilter !== "ALL") {
      if (statusFilter === "UPCOMING") filtered = filtered.filter((s) => !s._isPast && s.status !== "CANCELED");
      else if (statusFilter === "PAST") filtered = filtered.filter((s) => s._isPast);
      else filtered = filtered.filter((s) => s.status === statusFilter);
    }

    filtered.sort((a, b) => {
      const da = new Date(`${a.date}T${a.start_time || "00:00"}`).getTime();
      const db = new Date(`${b.date}T${b.start_time || "00:00"}`).getTime();
      return da - db;
    });

    const stats = {
      total: sessions.length,
      draft: sessions.filter((s) => s.status === "DRAFT").length,
      published: sessions.filter((s) => s.status === "PUBLISHED").length,
      canceled: sessions.filter((s) => s.status === "CANCELED").length,
      upcoming: sessions.filter((s) => new Date(`${s.date}T${s.start_time || "00:00"}`) >= now && s.status !== "CANCELED").length,
    };

    return { list: filtered, stats };
  }, [sessions, q, statusFilter]);

  // ---- Actions sessions ----
  const doPublish = async (id) => {
    setBusy(true);
    const prev = sessions;
    try {
      setSessions((arr) => arr.map((s) => (s.id === id ? { ...s, status: "PUBLISHED" } : s)));
      await publishSession(id);
      setToast({ kind: "success", msg: "Session publiée ✅" });
    } catch (e) {
      console.error(e);
      setSessions(prev);
      setToast({ kind: "error", msg: e?.response?.data?.detail || "Erreur lors de la publication." });
    } finally {
      setBusy(false);
      setConfirm(null);
    }
  };

  const doCancel = async (id) => {
    setBusy(true);
    const prev = sessions;
    try {
      setSessions((arr) => arr.map((s) => (s.id === id ? { ...s, status: "CANCELED" } : s)));
      await cancelSession(id);
      setToast({ kind: "warn", msg: "Session annulée ⚠️" });
    } catch (e) {
      console.error(e);
      setSessions(prev);
      setToast({ kind: "error", msg: e?.response?.data?.detail || "Erreur lors de l’annulation." });
    } finally {
      setBusy(false);
      setConfirm(null);
    }
  };

  const doDeleteSession = async (id) => {
    setBusy(true);
    const prev = sessions;
    try {
      setSessions((arr) => arr.filter((s) => s.id !== id)); // optimiste
      await deleteSession(id);
      setToast({ kind: "success", msg: "Session supprimée 🗑️" });
    } catch (e) {
      console.error(e);
      setSessions(prev); // rollback
      setToast({ kind: "error", msg: e?.response?.data?.detail || "Suppression impossible." });
    } finally {
      setBusy(false);
      setConfirm(null);
    }
  };

  // ---- Actions groupes ----
  const doDeleteGroup = async (id) => {
    setBusy(true);
    const prev = groups;
    try {
      setGroups((arr) => arr.filter((g) => g.id !== id)); // optimiste
      await deleteGroup(id);
      setToast({ kind: "success", msg: "Groupe supprimé 🗑️" });
    } catch (e) {
      console.error(e);
      setGroups(prev);
      setToast({ kind: "error", msg: e?.response?.data?.detail || "Suppression du groupe impossible." });
    } finally {
      setBusy(false);
      setConfirm(null);
    }
  };

  // ---- Confirm factory ----
  const openConfirm = (type, entity) => {
    if (type === "publish") {
      setConfirm({
        title: "Publier la session ?",
        desc: `“${entity.title}” sera visible par tes membres (et/ou en public).`,
        actionLabel: "Publier",
        kind: "primary",
        onConfirm: () => doPublish(entity.id),
      });
    } else if (type === "cancel") {
      setConfirm({
        title: "Annuler la session ?",
        desc: `“${entity.title}” sera marquée comme annulée pour tous les participants.`,
        actionLabel: "Annuler",
        kind: "danger",
        onConfirm: () => doCancel(entity.id),
      });
    } else if (type === "delete-session") {
      setConfirm({
        title: "Supprimer la session ?",
        desc: `Action définitive. “${entity.title}” sera supprimée.`,
        actionLabel: "Supprimer",
        kind: "danger",
        onConfirm: () => doDeleteSession(entity.id),
      });
    } else if (type === "delete-group") {
      setConfirm({
        title: "Supprimer le groupe ?",
        desc: `Action définitive. “${entity.name}” sera supprimé.`,
        actionLabel: "Supprimer",
        kind: "danger",
        onConfirm: () => doDeleteGroup(entity.id),
      });
    }
  };

  if (loading) {
    return (
      <div className="coach-dashboard">
        <h1 className="coach-title">🏆 Coach Dashboard</h1>
        <Toolbar
          q={q} setQ={setQ}
          statusFilter={statusFilter} setStatusFilter={setStatusFilter}
          onCreate={() => navigate("/sessions/create")}
        />
        <SkeletonSection />
      </div>
    );
  }
  if (error) return <p className="text-center mt-10 text-red-500">{error}</p>;

  return (
    <div className="coach-dashboard">
      <h1 className="coach-title">🏆 Coach Dashboard</h1>

      <StatsBar stats={derived.stats} onCreate={() => navigate("/sessions/create")} />

      <div className="coach-nav">
        <button className={activeTab === "sessions" ? "active" : ""} onClick={() => setActiveTab("sessions")}>📅 Mes Sessions</button>
        <button className={activeTab === "groups" ? "active" : ""} onClick={() => setActiveTab("groups")}>📋 Mes Groupes</button>
        <button className={activeTab === "calendar" ? "active" : ""} onClick={() => setActiveTab("calendar")}>🗓️ Calendrier</button>
      </div>

      <div className="coach-content">
        {activeTab === "sessions" && (
          <>
            <Toolbar
              q={q} setQ={setQ}
              statusFilter={statusFilter} setStatusFilter={setStatusFilter}
              onCreate={() => navigate("/sessions/create")}
            />

            {derived.list.length ? (
              <div className="coach-grid">
                {derived.list.map((s) => (
                  <div key={s.id} className="coach-card">
                    <div className="cc-head">
                      <h3 className="cc-title">{s.title}</h3>
                      <span className={`status ${s.status?.toLowerCase()}`}>{STATUS_LABEL[s.status] || s.status}</span>
                    </div>

                    <div className="cc-meta">
                      <div className="row"><span>📅</span><span>{fmtDate(s.date, s.start_time)}</span></div>
                      <div className="row"><span>📍</span><span>{s.location || "—"}</span></div>
                      <div className="row"><span>👥</span><span>{(s.participants?.length ?? s.participants_count ?? 0)}/{s.max_players ?? "—"}</span></div>
                    </div>

                    <div className="cc-actions">
                      <Link to={`/sessions/${s.id}`} className="btn ghost">Détails</Link>
                      {s.status === "DRAFT" && (
                        <button className="btn primary" disabled={busy} onClick={() => openConfirm("publish", s)}>
                          🚀 Publier
                        </button>
                      )}
                      {s.status !== "CANCELED" && (
                        <button className="btn danger" disabled={busy} onClick={() => openConfirm("cancel", s)}>
                          ❌ Annuler
                        </button>
                      )}
                      <button className="btn danger" disabled={busy} onClick={() => openConfirm("delete-session", s)}>
                        🗑 Supprimer
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <Empty
                title="Aucune session trouvée"
                subtitle="Crée ta première session ou ajuste les filtres."
                actionLabel="Créer une session"
                onAction={() => navigate("/sessions/create")}
              />
            )}
          </>
        )}

        {activeTab === "groups" && (
          <div>
            <div className="coach-toolbar" style={{ marginBottom: "12px" }}>
              <button className="btn primary" onClick={() => navigate("/groups/new")} title="Créer un groupe">
                + Nouveau groupe
              </button>
            </div>

            <div className="coach-grid">
              {groups.length ? (
                groups.map((g) => {
                  const members = Array.isArray(g.members) ? g.members.length : (g.members_count ?? 0);
                  const sport = g?.sport?.name || g.sport_name || g.sport || "—";
                  return (
                    <div key={g.id} className="coach-card">
                      <div className="cc-head">
                        <h3 className="cc-title">{g.name}</h3>
                        <span className="badge">👥 {members}</span>
                      </div>
                      <div className="cc-meta">
                        <div className="row"><span>🏆</span><span>{sport}</span></div>
                        <div className="row"><span>📍</span><span>{g.city || "—"}</span></div>
                      </div>
                      <div className="cc-actions">
                        <Link to={`/groups/${g.id}`} className="btn ghost">Gérer</Link>
                        <Link to={`/sessions/create?group=${g.id}`} className="btn primary">+ Session</Link>
                        <button className="btn danger" disabled={busy} onClick={() => openConfirm("delete-group", g)}>
                          🗑 Supprimer
                        </button>
                      </div>
                    </div>
                  );
                })
              ) : (
                <Empty
                  title="Aucun groupe"
                  subtitle="Crée un groupe pour organiser tes athlètes."
                  actionLabel="Créer un groupe"
                  onAction={() => navigate("/groups/new")}
                />
              )}
            </div>
          </div>
        )}

        {activeTab === "calendar" && <CoachCalendar />}
      </div>

      {confirm && (
        <ConfirmModal
          title={confirm.title}
          desc={confirm.desc}
          actionLabel={confirm.actionLabel}
          kind={confirm.kind}
          busy={busy}
          onCancel={() => setConfirm(null)}
          onConfirm={confirm.onConfirm}
        />
      )}

      {toast && (
        <Toast kind={toast.kind} onClose={() => setToast(null)}>
          {toast.msg}
        </Toast>
      )}
    </div>
  );
}

/* ----------------- UI bits ----------------- */

function StatsBar({ stats, onCreate }) {
  return (
    <div className="stats-bar">
      <div className="stat"><span className="k">{stats.total}</span><span>Total</span></div>
      <div className="stat"><span className="k">{stats.upcoming}</span><span>À venir</span></div>
      <div className="stat"><span className="k">{stats.published}</span><span>Publiées</span></div>
      <div className="stat"><span className="k">{stats.draft}</span><span>Brouillons</span></div>
      <div className="stat"><span className="k">{stats.canceled}</span><span>Annulées</span></div>
      <button className="btn primary ml-auto" onClick={onCreate}>+ Nouvelle session</button>
    </div>
  );
}

function Toolbar({ q, setQ, statusFilter, setStatusFilter, onCreate }) {
  return (
    <div className="coach-toolbar">
      <input
        className="input search"
        placeholder="Rechercher (titre, lieu, sport)…"
        value={q}
        onChange={(e) => setQ(e.target.value)}
      />
      <select className="input" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
        <option value="ALL">Tous les statuts</option>
        <option value="UPCOMING">À venir</option>
        <option value="DRAFT">Brouillons</option>
        <option value="PUBLISHED">Publiées</option>
        <option value="PAST">Passées</option>
        <option value="CANCELED">Annulées</option>
      </select>
      <button className="btn ghost" onClick={() => { setQ(""); setStatusFilter("ALL"); }}>
        Réinitialiser
      </button>
      <button className="btn primary" onClick={onCreate}>Créer</button>
    </div>
  );
}

function Empty({ title, subtitle, actionLabel, onAction }) {
  return (
    <div className="empty">
      <h3>{title}</h3>
      <p>{subtitle}</p>
      {actionLabel && <button className="btn primary" onClick={onAction}>{actionLabel}</button>}
    </div>
  );
}

function SkeletonSection() {
  return (
    <div className="coach-grid">
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="coach-card skeleton">
          <div className="sk-line w-60" />
          <div className="sk-line w-40" />
          <div className="sk-line w-80" />
          <div className="sk-line w-30" />
        </div>
      ))}
    </div>
  );
}

function ConfirmModal({ title, desc, actionLabel, kind = "primary", busy, onCancel, onConfirm }) {
  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true">
      <div className="modal">
        <h3>{title}</h3>
        <p>{desc}</p>
        <div className="modal-actions">
          <button className="btn ghost" onClick={onCancel} disabled={busy}>Annuler</button>
          <button className={`btn ${kind}`} onClick={onConfirm} disabled={busy}>
            {actionLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

function Toast({ kind = "info", children, onClose }) {
  return (
    <div className={`toast ${kind}`}>
      <span>{children}</span>
      <button onClick={onClose} aria-label="Fermer">✕</button>
    </div>
  );
}

