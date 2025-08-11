import { useEffect, useMemo, useState } from "react";
import axiosClient from "../../api/axiosClient";
import "../../styles/SportsManagement.css";

const PAGE_SIZE = 10;
const ACCEPTED_TYPES = ["image/png", "image/jpeg", "image/svg+xml"];
const MAX_FILE_MB = 2;

export default function SportsManagement({ query = "", onStats }) {
  const [sports, setSports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState(null);

  const [search, setSearch] = useState("");
  const [q, setQ] = useState(""); // debounced (global+local)

  const [page, setPage] = useState(1);

  const [editing, setEditing] = useState(null); // {id?, name, iconFile?, iconUrl?}
  const [saving, setSaving] = useState(false);

  // fetch
  const fetchSports = async () => {
    try {
      setLoading(true);
      const res = await axiosClient.get("/sports/");
      setSports(Array.isArray(res.data) ? res.data : []);
      setErr(null);
    } catch (e) {
      console.error(e);
      setErr("Impossible de charger les sports.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSports();
  }, []);

  // debounce search (combine local + global query)
  const rawQ = (search || query).trim().toLowerCase();
  useEffect(() => {
    const t = setTimeout(() => setQ(rawQ), 250);
    return () => clearTimeout(t);
  }, [rawQ]);

  const filtered = useMemo(() => {
    if (!q) return sports;
    return sports.filter((s) => (s.name || "").toLowerCase().includes(q));
  }, [sports, q]);

  // report stats up
  useEffect(() => {
    onStats?.({ total: sports.length, filtered: filtered.length });
  }, [sports.length, filtered.length, onStats]);

  // pagination
  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, pageCount);
  const pageSlice = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    return filtered.slice(start, start + PAGE_SIZE);
  }, [filtered, currentPage]);

  const resetPaging = () => setPage(1);

  // open modal
  const openCreate = () =>
    setEditing({
      id: null,
      name: "",
      iconFile: null,
      iconUrl: "",
    });

  const openEdit = (s) =>
    setEditing({
      id: s.id,
      name: s.name ?? "",
      iconFile: null,
      iconUrl: s.icon || "", // url actuelle
    });

  // validations
  const validate = ({ name, iconFile }) => {
    if (!name.trim()) return "Le nom est requis.";
    if (iconFile) {
      if (!ACCEPTED_TYPES.includes(iconFile.type))
        return "Format d’icône invalide (png, jpg, svg).";
      if (iconFile.size > MAX_FILE_MB * 1024 * 1024)
        return `Icône trop lourde (max ${MAX_FILE_MB} Mo).`;
    }
    return null;
  };

  // save (create/update)
  const handleSave = async () => {
    if (!editing) return;
    const v = validate(editing);
    if (v) {
      setErr(v);
      return;
    }
    setSaving(true);
    try {
      const formData = new FormData();
      formData.append("name", editing.name.trim());
      if (editing.iconFile) formData.append("icon", editing.iconFile);

      if (editing.id) {
        await axiosClient.put(`/sports/${editing.id}/`, formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });
      } else {
        await axiosClient.post(`/sports/`, formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });
      }

      setEditing(null);
      setErr(null);
      await fetchSports(); // récupère l’URL finale de l’icône
    } catch (e) {
      console.error(e);
      setErr("Impossible d'enregistrer le sport.");
    } finally {
      setSaving(false);
    }
  };

  // delete (optimistic)
  const handleDelete = async (id) => {
    if (!window.confirm("Supprimer ce sport ?")) return;
    const prev = sports;
    setSports((x) => x.filter((s) => s.id !== id));
    try {
      await axiosClient.delete(`/sports/${id}/`);
    } catch (e) {
      console.error(e);
      setErr("Impossible de supprimer le sport.");
      setSports(prev); // rollback
    }
  };

  // input handlers
  const onNameChange = (e) =>
    setEditing((st) => ({ ...st, name: e.target.value }));

  const onIconChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setEditing((st) => ({
      ...st,
      iconFile: file,
      iconUrl: URL.createObjectURL(file), // preview
    }));
  };

  const clearIcon = () =>
    setEditing((st) => ({ ...st, iconFile: null, iconUrl: "" }));

  return (
    <div className="sport-wrap">
      <div className="sport-head">
        <h2>🏆 Gestion des sports</h2>
        <div className="sport-actions">
          <input
            className="sport-search"
            type="text"
            placeholder="Rechercher un sport..."
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
          <button className="btn primary" onClick={openCreate}>
            ➕ Ajouter
          </button>
        </div>
      </div>

      {loading && <p className="muted">Chargement…</p>}
      {err && <p className="err">{err}</p>}

      {!loading && filtered.length === 0 && (
        <p className="muted">Aucun sport trouvé.</p>
      )}

      {!loading && filtered.length > 0 && (
        <>
          <table className="admin-table">
            <thead>
              <tr>
                <th>Nom</th>
                <th>Icône</th>
                <th style={{ width: 160 }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {pageSlice.map((s) => (
                <tr key={s.id}>
                  <td className="cell-ellipsis" title={s.name}>
                    {s.name}
                  </td>
                  <td>
                    {s.icon ? (
                      <img className="sport-icon" src={s.icon} alt={s.name} />
                    ) : (
                      <span className="muted">—</span>
                    )}
                  </td>
                  <td className="cell-actions">
                    <button className="btn small" onClick={() => openEdit(s)}>
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
              ))}
            </tbody>
          </table>

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
      )}

      {/* modal */}
      {editing && (
        <div className="modal-overlay" onClick={() => !saving && setEditing(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h3>{editing.id ? "Modifier le sport" : "Ajouter un sport"}</h3>

            <label>Nom</label>
            <input type="text" value={editing.name} onChange={onNameChange} />

            <label>Icône (png/jpg/svg, ≤ {MAX_FILE_MB} Mo)</label>
            <div className="icon-row">
              <input
                type="file"
                accept={ACCEPTED_TYPES.join(",")}
                onChange={onIconChange}
              />
              {editing.iconUrl ? (
                <div className="icon-preview">
                  <img src={editing.iconUrl} alt="preview" />
                  <button className="btn danger small" onClick={clearIcon}>
                    Retirer
                  </button>
                </div>
              ) : (
                <span className="muted">Aucune icône sélectionnée</span>
              )}
            </div>

            <div className="modal-buttons">
              <button className="btn ghost" disabled={saving} onClick={() => setEditing(null)}>
                Annuler
              </button>
              <button className="btn primary" disabled={saving} onClick={handleSave}>
                {saving ? "Sauvegarde…" : "Sauvegarder"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
