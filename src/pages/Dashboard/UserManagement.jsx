// src/pages/Dashboard/UserManagement.jsx
import { useEffect, useMemo, useState, useCallback } from "react";
import { getAllUsers, deleteUser, updateUser } from "../../api/adminService";
import "../../styles/UserManagement.css";
import { extractApiError } from "../../utils/httpError";

const ROLES = ["admin", "coach", "user","premium"];
const PAGE_SIZE = 10;

export default function UserManagement({ query = "", onStats }) {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  // recherche / filtre
  const [localSearch, setLocalSearch] = useState("");
  const [q, setQ] = useState("");
  const [roleFilter, setRoleFilter] = useState("");

  // pagination
  const [page, setPage] = useState(1);

  // édition
  const [editing, setEditing] = useState(null);
  const [saving, setSaving] = useState(false);

  // erreurs globales
  const [err, setErr] = useState("");

  const resetPaging = () => setPage(1);

  // debounce recherche (query global + local)
  const rawQ = (localSearch || query).toLowerCase().trim();
  useEffect(() => {
    const t = setTimeout(() => setQ(rawQ), 250);
    return () => clearTimeout(t);
  }, [rawQ]);

  // fetch initial
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        setLoading(true);
        const list = await getAllUsers();
        if (alive) setUsers(Array.isArray(list) ? list : []);
      } catch (e) {
        if (alive) setErr("Impossible de charger les utilisateurs.");
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  // filtrage + recherche
  const filtered = useMemo(() => {
    let base = users;

    if (q) {
      base = base.filter((u) =>
        [
          u.first_name || "",
          u.last_name || "",
          u.username || "",
          u.email || "",
          u.role || "",
        ]
          .join(" ")
          .toLowerCase()
          .includes(q)
      );
    }

    if (roleFilter) {
      base = base.filter((u) => (u.role || "user") === roleFilter);
    }

    return base;
  }, [users, q, roleFilter]);

  // pagination calculée
  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, pageCount);

  const pageSlice = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    return filtered.slice(start, start + PAGE_SIZE);
  }, [filtered, currentPage]);

  // remonter stats au parent
  useEffect(() => {
    onStats?.({ total: users.length, filtered: filtered.length });
  }, [users.length, filtered.length, onStats]);

  // suppression (optimiste)
  const onDelete = async (id) => {
    if (!window.confirm("❌ Supprimer cet utilisateur ?")) return;
    const prev = users;
    setUsers((us) => us.filter((u) => u.id !== id));
    try {
      await deleteUser(id);
    } catch (e) {
      setUsers(prev); // rollback
      alert(extractApiError(e));
    }
  };

  // ouverture modale d'édition
  const onOpenEdit = (u) => {
    setErr("");
    setEditing({
      id: u.id,
      first_name: u.first_name || "",
      last_name: u.last_name || "",
      email: u.email || "",
      role: u.role || "user",
    });
  };

  // modifications en cours ?
  const dirty = useMemo(() => {
    if (!editing) return false;
    const orig = users.find((u) => u.id === editing.id);
    if (!orig) return true;
    return (
      editing.first_name !== (orig.first_name || "") ||
      editing.last_name !== (orig.last_name || "") ||
      editing.email !== (orig.email || "") ||
      editing.role !== (orig.role || "user")
    );
  }, [editing, users]);

  // sauvegarde modale
  const onSave = async () => {
    if (!editing || !dirty) return;
    setSaving(true);
    try {
      const payload = {
        first_name: editing.first_name.trim(),
        last_name: editing.last_name.trim(),
        email: editing.email.trim(),
        role: editing.role,
      };
      const updated = await updateUser(editing.id, payload);
      setUsers((us) =>
        us.map((u) => (u.id === editing.id ? { ...u, ...updated } : u))
      );
      setEditing(null);
    } catch (e) {
      alert(extractApiError(e));
    } finally {
      setSaving(false);
    }
  };

  // set rapide de rôle (actions inline)
  const quickSetRole = useCallback(
    async (u, role) => {
      const prev = users;
      try {
        setUsers((list) =>
          list.map((x) => (x.id === u.id ? { ...x, role } : x))
        );
        const updated = await updateUser(u.id, {
          first_name: u.first_name,
          last_name: u.last_name,
          email: u.email,
          role,
        });
        setUsers((list) =>
          list.map((x) => (x.id === u.id ? { ...x, ...updated } : x))
        );
      } catch (e) {
        setUsers(prev);
        alert(extractApiError(e));
      }
    },
    [users]
  );

  return (
    <div className="um">
      <div className="um__bar">
        <div className="um__title">Gestion des utilisateurs</div>

        <div className="um__search">
          <span className="ico">🔎</span>
          <input
            value={localSearch}
            onChange={(e) => {
              setLocalSearch(e.target.value);
              resetPaging();
            }}
            placeholder="Rechercher (nom, email, rôle)…"
            aria-label="Recherche utilisateurs"
          />
          {localSearch && (
            <button className="clear" onClick={() => setLocalSearch("")}>
              ✕
            </button>
          )}
        </div>

        <select
          className="um__select"
          value={roleFilter}
          onChange={(e) => {
            setRoleFilter(e.target.value);
            resetPaging();
          }}
          aria-label="Filtrer par rôle"
        >
          <option value="">Tous rôles</option>
          {ROLES.map((r) => (
            <option key={r} value={r}>
              {r}
            </option>
          ))}
        </select>

        <div className="um__count">{filtered.length} résultat(s)</div>
      </div>

      {err && <p className="um__err">{err}</p>}

      {loading ? (
        <div className="um__skeleton">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="row">
              <div className="ph avatar" />
              <div className="ph name" />
              <div className="ph email" />
              <div className="ph role" />
              <div className="ph actions" />
            </div>
          ))}
        </div>
      ) : filtered.length ? (
        <>
          <div className="um__tablewrap">
            <table className="admin-table um__table">
              <thead>
                <tr>
                  <th>Utilisateur</th>
                  <th>Email</th>
                  <th>Rôle</th>
                  <th style={{ width: 260 }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {pageSlice.map((u) => {
                  const avatar =
                    u.avatar_url || u.avatar || u.avatar_src || "/avatar.png";
                  return (
                    <tr key={u.id}>
                      <td>
                        <div className="u-cell">
                          <img
                            className="u-avatar"
                            src={avatar}
                            alt=""
                            onError={(e) =>
                              (e.currentTarget.style.visibility = "hidden")
                            }
                          />
                          <div className="u-id">
                            <div className="u-name">
                              {(u.first_name || "") + " " + (u.last_name || "")}
                            </div>
                            <div className="u-username">@{u.username}</div>
                          </div>
                        </div>
                      </td>
                      <td className="u-email">{u.email}</td>
                      <td>
                        <span className={`pill pill--${u.role || "user"}`}>
                          {u.role || "user"}
                        </span>
                      </td>
                      <td className="u-actions">
                        <button
                          className="btn small"
                          onClick={() => onOpenEdit(u)}
                          title="Modifier"
                        >
                          ✏ Modifier
                        </button>
                        <button
                          className="btn danger small"
                          onClick={() => onDelete(u.id)}
                          title="Supprimer"
                        >
                          🗑 Supprimer
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

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
      ) : (
        <div className="um__empty">Aucun utilisateur trouvé.</div>
      )}

      {editing && (
        <div
          className="modal-overlay"
          onClick={() => !saving && setEditing(null)}
        >
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h3>Modifier l’utilisateur</h3>

            <label>Prénom</label>
            <input
              type="text"
              value={editing.first_name}
              onChange={(e) =>
                setEditing({ ...editing, first_name: e.target.value })
              }
            />

            <label>Nom</label>
            <input
              type="text"
              value={editing.last_name}
              onChange={(e) =>
                setEditing({ ...editing, last_name: e.target.value })
              }
            />

            <label>Email</label>
            <input
              type="email"
              value={editing.email}
              onChange={(e) =>
                setEditing({ ...editing, email: e.target.value })
              }
            />

            <label>Rôle</label>
            <select
              value={editing.role}
              onChange={(e) =>
                setEditing({ ...editing, role: e.target.value })
              }
            >
              {ROLES.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>

            <div className="modal-buttons">
              <button
                className="btn ghost"
                onClick={() => !saving && setEditing(null)}
                disabled={saving}
              >
                Annuler
              </button>
              <button
                className="btn primary"
                onClick={onSave}
                disabled={saving || !dirty}
                title={!dirty ? "Aucun changement" : ""}
              >
                {saving ? "…" : "Sauvegarder"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
