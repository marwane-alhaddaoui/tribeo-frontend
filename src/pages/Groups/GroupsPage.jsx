import { useEffect, useMemo, useState, useContext } from "react";
import { listGroups } from "../../api/groupService";
import GroupCard from "../../components/GroupCard";
import { Link } from "react-router-dom";
import { AuthContext } from "../../context/AuthContext";
import "../../styles/GroupsPage.css";

/** Détermine si l'utilisateur peut créer un groupe */
function canUserCreateGroup(user) {
  if (!user) return false;
  const roles = (user.roles || user.role || []).toString().toUpperCase();
  return (
    user.is_superuser === true ||
    user.is_staff === true ||
    user.is_admin === true ||
    user.is_manager === true ||
    user.is_coach === true ||
    roles.includes("ADMIN") ||
    roles.includes("COACH") ||
    roles.includes("MANAGER")
  );
}

export default function GroupsPage() {
  const { user } = useContext(AuthContext);
  const isVisitor = !user; // 👈 visiteur non connecté
  const allowCreate = canUserCreateGroup(user);

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
      // Exclure les groupes COACH de la liste publique
      const filtered = Array.isArray(data)
        ? data.filter((g) => g.group_type !== "COACH")
        : [];
      setGroups(filtered);
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
    if (isVisitor) return; // 🔒 blocage visiteur
    fetchData();
  };

  const onReset = () => {
    if (isVisitor) return; // 🔒 blocage visiteur
    setQ(""); setSport(""); setCity("");
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

        {allowCreate ? (
          <Link to="/groups/new" className="btn-primary" title="Créer un groupe">
            + Créer un groupe
          </Link>
        ) : (
          <button
            className="btn-primary btn-disabled"
            disabled
            title={isVisitor ? "Connecte-toi pour créer un groupe" : "Réservé aux coachs/managers"}
            aria-disabled="true"
            type="button"
          >
            + Créer un groupe
          </button>
        )}
      </div>

      {/* Filtres */}
      <form onSubmit={onSearch} className={`groups-filters ${isVisitor ? "is-disabled" : ""}`}>
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Rechercher un groupe"
          className="gf-input"
          disabled={isVisitor}
        />
        <input
          value={sport}
          onChange={(e) => setSport(e.target.value)}
          placeholder="Sport ID (temporaire)"
          className="gf-input"
          disabled={isVisitor}
        />
        <input
          value={city}
          onChange={(e) => setCity(e.target.value)}
          placeholder="Ville"
          className="gf-input"
          disabled={isVisitor}
        />
        <div className="gf-actions">
          <button className="gf-button" type="submit" disabled={isVisitor}>Filtrer</button>
          <button className="gf-reset" type="button" onClick={onReset} disabled={isVisitor}>Réinitialiser</button>
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

      {/* Bandeau visiteur */}
      {isVisitor && (
        <div className="groups-locked-banner">
          <div className="glb-text">
            <strong>Contenu prévisualisé</strong> — Connecte-toi pour voir les groupes en clair et y accéder.
          </div>
          <div className="glb-actions">
            <Link className="btn-primary" to="/login">Se connecter</Link>
            <Link className="btn-ghost" to="/register">Créer un compte</Link>
          </div>
        </div>
      )}

      {/* Liste / états */}
      {loading ? (
        <div className={`groups-grid ${isVisitor ? "grid-locked" : ""}`}>
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="sk-card" />
          ))}
        </div>
      ) : groups.length ? (
        <div className={`groups-grid ${isVisitor ? "grid-locked" : ""}`}>
          {groups.map((g) => (
            <GroupCard key={g.id} group={g} locked={isVisitor} />
          ))}
        </div>
      ) : (
        <div className="groups-empty">
          <p>Aucun groupe avec ces filtres.</p>
          <div className="groups-empty-actions">
            <button className="btn-ghost" onClick={onReset} disabled={isVisitor}>Réinitialiser</button>
            {allowCreate ? (
              <Link to="/groups/new" className="btn-primary">Créer le premier</Link>
            ) : (
              <button className="btn-primary btn-disabled" disabled aria-disabled="true" type="button">
                Créer le premier
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
