import { useEffect, useMemo, useState } from "react";
import { listGroups } from "../../api/groupService";
import GroupCard from "../../components/GroupCard";
import { Link } from "react-router-dom";
import "../../styles/GroupsPage.css";

export default function GroupsPage() {
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);

  // filtres
  const [q, setQ] = useState("");
  const [sport, setSport] = useState("");
  const [city, setCity] = useState("");

  const fetchData = async () => {
    setLoading(true);
    try {
      const data = await listGroups({
        q: q || undefined,
        sport: sport || undefined,
        city: city || undefined,
      });
      setGroups(Array.isArray(data) ? data : []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onSearch = (e) => {
    e.preventDefault();
    fetchData();
  };

  const onReset = () => {
    setQ("");
    setSport("");
    setCity("");
    // relance la recherche “clean”
    setTimeout(fetchData, 0);
  };

  const resultText = useMemo(() => {
    const n = groups.length;
    if (loading) return "Chargement…";
    if (n === 0) return "Aucun groupe";
    if (n === 1) return "1 groupe";
    return `${n} groupes`;
  }, [groups, loading]);

  return (
    <div className="groups-wrap">
      {/* Header */}
      <div className="groups-head">
        <div>
          <h1 className="groups-title">Groupes</h1>
          <p className="groups-sub">Organise tes équipes et lance vos sessions.</p>
        </div>

        <Link to="/groups/new" className="btn-primary">
          + Créer un groupe
        </Link>
      </div>

      {/* Filtres */}
      <form onSubmit={onSearch} className="groups-filters">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Rechercher un groupe"
          className="gf-input"
        />
        <input
          value={sport}
          onChange={(e) => setSport(e.target.value)}
          placeholder="Sport ID (temporaire)"
          className="gf-input"
        />
        <input
          value={city}
          onChange={(e) => setCity(e.target.value)}
          placeholder="Ville"
          className="gf-input"
        />
        <div className="gf-actions">
          <button className="gf-button" type="submit">Filtrer</button>
          <button className="gf-reset" type="button" onClick={onReset}>Réinitialiser</button>
        </div>
      </form>

      {/* Résumé résultats */}
      <div className="groups-bar">
        <span className="groups-count">{resultText}</span>
        {(q || sport || city) && (
          <div className="groups-active-filters">
            {q && <span className="chip">q: {q}</span>}
            {sport && <span className="chip">sport: {sport}</span>}
            {city && <span className="chip">ville: {city}</span>}
          </div>
        )}
      </div>

      {/* Liste / états */}
      {loading ? (
        <div className="groups-grid">
          <div className="sk-card" />
          <div className="sk-card" />
        </div>
      ) : groups.length ? (
        <div className="groups-grid">
          {groups.map((g) => (
            <GroupCard key={g.id} group={g} />
          ))}
        </div>
      ) : (
        <div className="groups-empty">
          <p>Aucun groupe avec ces filtres.</p>
          <div className="groups-empty-actions">
            <button className="btn-ghost" onClick={onReset}>Réinitialiser</button>
            <Link to="/groups/new" className="btn-primary">Créer le premier</Link>
          </div>
        </div>
      )}
    </div>
  );
}
