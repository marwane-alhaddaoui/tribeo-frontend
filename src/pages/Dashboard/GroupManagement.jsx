import { useEffect, useMemo, useState } from "react";
import { listGroups, deleteGroup } from "../../api/groupService"; // ⬅️ ajout deleteGroup
import "../../styles/SessionManagement.css";

const PAGE_SIZE = 10;

export default function GroupManagement({ query = "", onStats }) {
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState(null);

  const [search, setSearch] = useState("");
  const [q, setQ] = useState("");
  const [type, setType] = useState("ALL");
  const [page, setPage] = useState(1);

  const fetchGroups = async () => {
    try {
      setLoading(true);
      const res = await listGroups({});
      setGroups(Array.isArray(res) ? res : []);
      setErr(null);
    } catch (e) {
      console.error(e);
      setErr("Impossible de charger les groupes.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchGroups(); }, []);

  const rawQ = (search || query).trim().toLowerCase();
  useEffect(() => {
    const t = setTimeout(() => setQ(rawQ), 200);
    return () => clearTimeout(t);
  }, [rawQ]);

  const filtered = useMemo(() => {
    let arr = groups;
    if (type !== "ALL") arr = arr.filter(g => (g.group_type || "").toUpperCase() === type);
    if (!q) return arr;
    return arr.filter((g) =>
      [
        g.name || "",
        g.city || "",
        g?.sport?.name || g.sport_name || g.sport || "",
        g.group_type || "",
      ]
        .join(" ")
        .toLowerCase()
        .includes(q)
    );
  }, [groups, q, type]);

  useEffect(() => {
    onStats?.({ total: groups.length, filtered: filtered.length });
  }, [groups.length, filtered.length, onStats]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, pageCount);
  const pageSlice = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    return filtered.slice(start, start + PAGE_SIZE);
  }, [filtered, currentPage]);

  const resetPaging = () => setPage(1);

  const typeLabel = (t) =>
    t === "PRIVATE" ? "Privé" : t === "COACH" ? "Coach-only" : "Public";

  const membersCount = (g) =>
    Array.isArray(g?.members) ? g.members.length : (g?.members_count ?? 0);

  const handleDelete = async (id) => {
    if (!window.confirm("❌ Supprimer ce groupe ?")) return;
    try {
      await deleteGroup(id);
      setGroups((prev) => prev.filter((g) => g.id !== id));
    } catch (e) {
      console.error(e);
      alert("Erreur lors de la suppression");
    }
  };

  return (
    <div className="adm-wrap">
      <div className="adm-head">
        <h2>Gestion des groupes</h2>
        <div className="adm-actions" style={{ gap: 8 }}>
          <input
            className="adm-search"
            type="text"
            placeholder="Rechercher (nom, ville, sport)…"
            value={search}
            onChange={(e) => { setSearch(e.target.value); resetPaging(); }}
          />
          <select
            className="adm-search"
            value={type}
            onChange={(e) => { setType(e.target.value); resetPaging(); }}
            style={{ maxWidth: 200 }}
          >
            <option value="ALL">Tous les types</option>
            <option value="PUBLIC">Public</option>
            <option value="PRIVATE">Privé</option>
            <option value="COACH">Coach-only</option>
          </select>
          {(search || type !== "ALL") && (
            <button className="btn ghost" onClick={() => { setSearch(""); setType("ALL"); }}>
              Réinitialiser
            </button>
          )}
        </div>
      </div>

      {loading && <p className="muted">Chargement…</p>}
      {err && <p className="err">{err}</p>}

      {!loading && filtered.length === 0 && (
        <p className="muted">Aucun groupe trouvé.</p>
      )}

      {!loading && filtered.length > 0 && (
        <>
          <table className="adm-table">
            <thead>
              <tr>
                <th>Nom</th>
                <th>Type</th>
                <th>Ville</th>
                <th>Sport</th>
                <th>Membres</th>
                <th style={{ width: 200 }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {pageSlice.map((g) => (
                <tr key={g.id}>
                  <td className="cell-ellipsis" title={g.name}>{g.name}</td>
                  <td>{typeLabel(g.group_type)}</td>
                  <td className="cell-ellipsis" title={g.city || "—"}>{g.city || "—"}</td>
                  <td className="cell-ellipsis" title={g?.sport?.name || g.sport_name || g.sport || "—"}>
                    {g?.sport?.name || g.sport_name || g.sport || "—"}
                  </td>
                  <td>{membersCount(g)}</td>
                  <td className="cell-actions">
                    <a className="btn small" href={`/groups/${g.id}`} target="_blank" rel="noreferrer">
                      🔎 Ouvrir
                    </a>
                    <button
                      className="btn small danger"
                      onClick={() => handleDelete(g.id)}
                    >
                      🗑 Supprimer
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

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
    </div>
  );
}
