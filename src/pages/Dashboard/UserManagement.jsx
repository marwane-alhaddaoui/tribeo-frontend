import { useEffect, useMemo, useState } from "react";
import { getAllUsers, deleteUser, updateUser } from "../../api/adminService";
import "../../styles/UserManagement.css";

const ROLES = ["admin", "coach", "user"];
const PAGE_SIZE = 10;

export default function UserManagement({ query = "", onStats }) {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [localSearch, setLocalSearch] = useState("");
  const [q, setQ] = useState(""); // debounced
  const [page, setPage] = useState(1);

  const [editing, setEditing] = useState(null);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState("");

  // debounce combined search (global query + local)
  const rawQ = (localSearch || query).toLowerCase().trim();
  useEffect(() => {
    const t = setTimeout(() => setQ(rawQ), 250);
    return () => clearTimeout(t);
  }, [rawQ]);

  // filtered (déclaré AVANT tout effet qui l'utilise)
  const filtered = useMemo(() => {
    if (!q) return users;
    return users.filter((u) =>
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
  }, [users, q]);

  // pagination
  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, pageCount);
  const pageSlice = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    return filtered.slice(start, start + PAGE_SIZE);
  }, [filtered, currentPage]);

  const resetPaging = () => setPage(1);

  // report stats up
  useEffect(() => {
    onStats?.({ total: users.length, filtered: filtered.length });
  }, [users.length, filtered.length, onStats]);

  // fetch
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        setLoading(true);
        const list = await getAllUsers();
        if (alive) setUsers(Array.isArray(list) ? list : []);
      } catch (e) {
        console.error(e);
        if (alive) setErr("Impossible de charger les utilisateurs.");
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  const onDelete = async (id) => {
    if (!window.confirm("❌ Supprimer cet utilisateur ?")) return;
    // optimiste
    const prev = users;
    setUsers((us) => us.filter((u) => u.id !== id));
    try {
      await deleteUser(id);
    } catch (e) {
      console.error(e);
      setUsers(prev); // rollback
      alert("Suppression impossible.");
    }
  };

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
      // merge optimiste
      setUsers((us) =>
        us.map((u) => (u.id === editing.id ? { ...u, ...updated } : u))
      );
      setEditing(null);
    } catch (e) {
      console.error(e);
      const api = e?.response?.data || {};
      alert(
        api.detail ||
          api.email?.[0] ||
          api.role?.[0] ||
          "Impossible d’enregistrer les modifications."
      );
    } finally {
      setSaving(false);
    }
  };

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
            placeholder="Rechercher (nom, email, rôle…) • local"
            aria-label="Recherche utilisateurs"
          />
          {localSearch && (
            <button className="clear" onClick={() => setLocalSearch("")}>
              ✕
            </button>
          )}
        </div>
        <div className="um__count">{filtered.length} résultat(s)</div>
      </div>

      {err && <p className="um__err">{err}</p>}

      {/* skeleton */}
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
                  <th style={{ width: 160 }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {pageSlice.map((u) => (
                  <tr key={u.id}>
                    <td>
                      <div className="u-cell">
                        <img
                          className="u-avatar"
                          src={u.avatar_src || "/avatar.png"}
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
                    <td>
                      <button
                        className="btn small"
                        onClick={() => onOpenEdit(u)}
                      >
                        ✏ Modifier
                      </button>
                      <button
                        className="btn danger small"
                        onClick={() => onDelete(u.id)}
                      >
                        🗑 Supprimer
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* pagination */}
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

      {/* MODAL */}
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
