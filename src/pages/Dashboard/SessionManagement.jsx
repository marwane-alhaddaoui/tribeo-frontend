// src/pages/Dashboard/SessionManagement.jsx
import { useEffect, useMemo, useState, useCallback } from "react";
import {
  getAllSessionsAdmin,
  deleteSession as adminDeleteSession,
  updateSession as adminUpdateSession,
} from "../../api/adminService";
import {
  getSessions,
  publishSession,
  lockSession,
  finishSession,
  cancelSession,
  getSports,
} from "../../api/sessionService";
import "../../styles/SessionManagement.css";
import { extractApiError } from "../../utils/httpError";

const PAGE_SIZE = 10;

function statusBadge(s) {
  const v = String(s || "").toUpperCase();
  return <span className={`pill pill--${v.toLowerCase()}`}>{v || "—"}</span>;
}

export default function SessionManagement({ query = "", onStats }) {
  const [sessions, setSessions] = useState([]);
  const [sports, setSports] = useState([]);
  const [search, setSearch] = useState("");
  const [q, setQ] = useState(""); // debounced (global+local)
  const [editing, setEditing] = useState(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState(null);
  const [page, setPage] = useState(1);
  const [saving, setSaving] = useState(false);

  const resetPaging = () => setPage(1);

  // Fetch all sessions (admin scope) + sports for edit selector
  const fetchSessions = useCallback(async () => {
    try {
      setLoading(true);
      const [all, sp] = await Promise.all([getAllSessionsAdmin(), getSports()]);
      setSessions(Array.isArray(all) ? all : []);
      setSports(Array.isArray(sp) ? sp : []);
      setErr(null);
    } catch (e) {
      setErr("Impossible de charger les sessions.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSessions();
  }, [fetchSessions]);

  // debounce search (combine local + global query)
  const rawQ = (search || query).trim().toLowerCase();
  useEffect(() => {
    const t = setTimeout(() => setQ(rawQ), 250);
    return () => clearTimeout(t);
  }, [rawQ]);

  const filtered = useMemo(() => {
    if (!q) return sessions;
    return sessions.filter((s) =>
      `${s.title ?? ""} ${s.sport?.name ?? ""} ${s.location ?? ""} ${s.date ?? ""} ${(s.status ?? "")}`
        .toLowerCase()
        .includes(q)
    );
  }, [sessions, q]);

  // report stats up
  useEffect(() => {
    onStats?.({ total: sessions.length, filtered: filtered.length });
  }, [sessions.length, filtered.length, onStats]);

  // pagination
  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, pageCount);
  const pageSlice = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    return filtered.slice(start, start + PAGE_SIZE);
  }, [filtered, currentPage]);

  // ADMIN actions: publish/lock/finish/cancel
  const onAction = useCallback(
    async (action, s) => {
      const id = s.id || s.pk || s.session_id;
      if (!id) return;
      const prev = sessions;
      try {
        setSaving(true);
        if (action === "publish") await publishSession(id);
        if (action === "lock") await lockSession(id);
        if (action === "finish") await finishSession(id);
        if (action === "cancel") await cancelSession(id);
        const newStatus =
          { publish: "OPEN", lock: "LOCKED", finish: "FINISHED", cancel: "CANCELED" }[action] || null;
        if (newStatus) {
          setSessions((list) =>
            list.map((x) => (x.id === id ? { ...x, status: newStatus } : x))
          );
        } else {
          // fallback refetch
          const fresh = await getSessions();
          setSessions(Array.isArray(fresh) ? fresh : prev);
        }
      } catch (e) {
        setSessions(prev);
        alert(extractApiError(e));
      } finally {
        setSaving(false);
      }
    },
    [sessions]
  );

  // delete (optimistic)
  const handleDelete = async (id) => {
    if (!window.confirm("❌ Supprimer cette session ?")) return;
    const prev = sessions;
    setSessions((s) => s.filter((x) => x.id !== id));
    try {
      await adminDeleteSession(id);
    } catch (e) {
      setErr("La suppression a échoué.");
      setSessions(prev); // rollback
    }
  };

  // open edit modal
  const openEdit = (s) =>
    setEditing({
      ...s,
      sport_id: s.sport?.id || "",
      max_players: Number(s.max_players ?? 0),
      title: s.title ?? "",
      location: s.location ?? "",
      date: (s.date || "").slice(0, 10), // YYYY-MM-DD
    });

  // validate
  const validate = (data) => {
    if (!data.title.trim()) return "Le titre est requis.";
    if (!data.sport_id) return "Le sport est requis.";
    if (!data.date) return "La date est requise.";
    if (!data.location.trim()) return "Le lieu est requis.";
    const n = Number(data.max_players);
    if (!Number.isFinite(n) || n < 1) return "Max joueurs doit être ≥ 1.";
    return null;
  };

  // save edit
  const handleSave = async () => {
    if (!editing) return;
    const payload = {
      title: editing.title.trim(),
      sport_id: Number(editing.sport_id),
      date: editing.date, // YYYY-MM-DD
      location: editing.location.trim(),
      max_players: Number(editing.max_players),
    };
    const v = validate(payload);
    if (v) {
      setErr(v);
      return;
    }

    const prev = sessions;
    setSaving(true);
    // optimistic row
    const updatedRow = {
      ...editing,
      sport: sports.find((sp) => sp.id === payload.sport_id) || editing.sport,
      ...payload,
    };
    setSessions((list) => list.map((x) => (x.id === editing.id ? updatedRow : x)));

    try {
      await adminUpdateSession(editing.id, payload);
      setEditing(null);
      setErr(null);
    } catch (e) {
      setErr("La sauvegarde a échoué.");
      setSessions(prev); // rollback
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="adm-wrap">
      <div className="adm-head">
        <h2>Gestion des sessions</h2>
        <div className="adm-actions">
          <input
            className="adm-search"
            type="text"
            placeholder="Rechercher une session…"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              resetPaging();
            }}
          />
          {search && (
            <button className="btn ghost" onClick={() => setSearch("")}>
              Réinitialiser
            </button>
          )}
          <button className="btn" onClick={fetchSessions} disabled={loading || saving}>
            Rafraîchir
          </button>
        </div>
      </div>

      {loading && <p className="muted">Chargement…</p>}
      {err && <p className="err">{err}</p>}

      {!loading && filtered.length === 0 && (
        <p className="muted">Aucune session trouvée.</p>
      )}

      {!loading && filtered.length > 0 && (
        <>
          <table className="adm-table">
            <thead>
              <tr>
                <th>Titre</th>
                <th>Sport</th>
                <th>Date</th>
                <th>Lieu</th>
                <th>Max</th>
                <th>Statut</th>
                <th style={{ width: 280 }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {pageSlice.map((s) => {
                const status = (s.status || "").toUpperCase();
                return (
                  <tr key={s.id}>
                    <td className="cell-ellipsis" title={s.title}>
                      {s.title}
                    </td>
                    <td>{s.sport?.name || "—"}</td>
                    <td>{s.date?.slice(0, 10) || "—"}</td>
                    <td className="cell-ellipsis" title={s.location}>
                      {s.location || "—"}
                    </td>
                    <td>{s.max_players ?? "—"}</td>
                    <td>{statusBadge(status)}</td>
                    <td className="cell-actions">
                      {/* statut actions */}
                      <button
                        className="btn small"
                        disabled={saving || status !== "DRAFT"}
                        onClick={() => onAction("publish", s)}
                        title="Publier"
                      >
                        Publier
                      </button>
                      <button
                        className="btn small"
                        disabled={saving || status !== "OPEN"}
                        onClick={() => onAction("lock", s)}
                        title="Locker"
                      >
                        Locker
                      </button>
                      <button
                        className="btn small"
                        disabled={saving || !["OPEN", "LOCKED"].includes(status)}
                        onClick={() => onAction("finish", s)}
                        title="Terminer"
                      >
                        Terminer
                      </button>
                      <button
                        className="btn danger small"
                        disabled={saving || status === "CANCELED"}
                        onClick={() => onAction("cancel", s)}
                        title="Annuler"
                      >
                        Annuler
                      </button>
                      {/* CRUD */}
                      <button className="btn ghost small" onClick={() => openEdit(s)}>
                        ✏ Modifier
                      </button>
                      <button
                        className="btn danger small"
                        onClick={() => handleDelete(s.id)}
                      >
                        🗑 Supprimer
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {/* Pagination */}
          <div className="pager">
            <button
              className="btn ghost"
              disabled={currentPage <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
            >
              ←
            </button>
            <span className="pager-info">
              Page {currentPage}/{pageCount} • {filtered.length} résultat(s)
            </span>
            <button
              className="btn ghost"
              disabled={currentPage >= pageCount}
              onClick={() => setPage((p) => Math.min(pageCount, p + 1))}
            >
              →
            </button>
          </div>
        </>
      )}

      {/* Modal d'édition */}
      {editing && (
        <div
          className="modal-overlay"
          onClick={() => !saving && setEditing(null)}
        >
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h3>Modifier la session</h3>

            <label>Titre</label>
            <input
              type="text"
              value={editing.title}
              onChange={(e) => setEditing({ ...editing, title: e.target.value })}
            />

            <label>Sport</label>
            <select
              value={editing.sport_id}
              onChange={(e) =>
                setEditing({ ...editing, sport_id: Number(e.target.value) })
              }
            >
              <option value="">Sélectionner un sport</option>
              {sports.map((sp) => (
                <option key={sp.id} value={sp.id}>
                  {sp.name}
                </option>
              ))}
            </select>

            <label>Date</label>
            <input
              type="date"
              value={editing.date}
              onChange={(e) => setEditing({ ...editing, date: e.target.value })}
            />

            <label>Lieu</label>
            <input
              type="text"
              value={editing.location}
              onChange={(e) =>
                setEditing({ ...editing, location: e.target.value })
              }
            />

            <label>Max joueurs</label>
            <input
              type="number"
              min={1}
              value={editing.max_players}
              onChange={(e) =>
                setEditing({ ...editing, max_players: Number(e.target.value) })
              }
            />

            <div className="modal-buttons">
              <button
                className="btn ghost"
                disabled={saving}
                onClick={() => setEditing(null)}
              >
                Annuler
              </button>
              <button
                className="btn primary"
                disabled={saving}
                onClick={handleSave}
              >
                {saving ? "Sauvegarde…" : "Sauvegarder"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
