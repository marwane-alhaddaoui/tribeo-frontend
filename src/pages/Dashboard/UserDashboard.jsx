import { useEffect, useState, useContext } from "react";
import { getSessions } from "../../api/sessionService";
import { listGroups } from "../../api/groupService";
import { AuthContext } from "../../context/AuthContext";
import SessionCard from "../Sessions/SessionCard";
import { Link } from "react-router-dom";
import "../../styles/SessionCard.css";
import "../../styles/DashboardPage.css";

function isUserCreator(session, email) {
  return (session?.creator?.email || session?.creator) === email;
}
function isUserParticipant(session, email) {
  if (!Array.isArray(session?.participants)) return false;
  return session.participants.some((p) => (p?.email || p) === email);
}

export default function Dashboard() {
  const { user } = useContext(AuthContext);
  const [mySessions, setMySessions] = useState([]);
  const [createdSessions, setCreatedSessions] = useState([]);
  const [myGroups, setMyGroups] = useState([]);
  const [discover, setDiscover] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // helper: fetch mes groupes (supporte plusieurs schémas API)
  const fetchMyGroups = async (email) => {
    const all = await listGroups({});
    // si l’API expose is_member
    const hasFlag = Array.isArray(all) && all.some((g) => g.is_member != null);
    if (hasFlag) {
      const mine = all.filter((g) => g.is_member === true);
      const rest = all.filter((g) => g.is_member !== true && g.group_type !== "COACH");
      return { mine, rest };
    }
    // fallback: endpoint mine=true
    try {
      const mine = await listGroups({ mine: true });
      const mineIds = new Set((mine || []).map((g) => g.id));
      const rest = (all || []).filter((g) => !mineIds.has(g.id) && g.group_type !== "COACH");
      return { mine: mine || [], rest };
    } catch {
      // dernier recours: tout sauf coach-only en "découvrir"
      return { mine: [], rest: (all || []).filter((g) => g.group_type !== "COACH") };
    }
  };

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError("");
      try {
        const res = await getSessions({ mine: true });
        const mine = Array.isArray(res) ? res.filter((s) => isUserParticipant(s, user.email)) : [];
        const created = Array.isArray(res) ? res.filter((s) => isUserCreator(s, user.email)) : [];
        setMySessions(mine);
        setCreatedSessions(created);

        const { mine: gMine, rest } = await fetchMyGroups(user.email);
        setMyGroups(gMine || []);
        setDiscover((rest || []).slice(0, 8));
      } catch (err) {
        console.error(err);
        setError("Erreur de chargement des données.");
      } finally {
        setLoading(false);
      }
    };
    if (user?.email) load();
  }, [user]);

  if (loading) return <p className="text-center mt-10">Chargement…</p>;
  if (error) return <p className="text-center mt-10 text-red-500">{error}</p>;

  const count = (g) => Array.isArray(g?.members) ? g.members.length : (g?.members_count ?? 0);
  const sportLabel = (g) => g?.sport?.name || g.sport_name || g.sport || "—";
  const typeLabel = (t) => t === "PRIVATE" ? "Privé" : t === "COACH" ? "Coach‑only" : "Public";

  return (
    <div className="dashboard-wrapper">
      <h1 className="dashboard-title">Mon tableau de bord</h1>

      {/* 👥 Mes groupes */}
      <section className="dashboard-section">
        <h2 className="dashboard-subtitle">👥 Mes groupes</h2>
        {myGroups.length ? (
          <div className="dashboard-grid">
            {myGroups.map((g) => (
              <div className="dashboard-card" key={g.id}>
                <h3><Link to={`/groups/${g.id}`}>{g.name}</Link></h3>
                <p>{g.city || "—"} • {sportLabel(g)} • {count(g)} membre{count(g)>1?"s":""}</p>
                <p className="muted">Type: {typeLabel(g.group_type)}</p>
                <Link to={`/groups/${g.id}`} className="dashboard-link">Ouvrir</Link>
              </div>
            ))}
          </div>
        ) : (
          <p className="dashboard-empty">Tu n’as pas encore rejoint de groupe.</p>
        )}
      </section>

      {/* 👟 Mes sessions à venir */}
      <section className="dashboard-section">
        <h2 className="dashboard-subtitle">👟 Mes sessions à venir</h2>
        <div className="sessions-grid">
          {mySessions.length ? (
            mySessions.map((s) => <SessionCard key={s.id} session={s} />)
          ) : (
            <p className="dashboard-empty">Aucune session prévue.</p>
          )}
        </div>
      </section>

      {/* 🧑‍💼 Mes sessions créées */}
      <section className="dashboard-section">
        <h2 className="dashboard-subtitle">🧑‍💼 Mes sessions créées</h2>
        <div className="sessions-grid">
          {createdSessions.length ? (
            createdSessions.map((s) => <SessionCard key={s.id} session={s} />)
          ) : (
            <p className="dashboard-empty">Tu n’as pas encore créé de session.</p>
          )}
        </div>
      </section>

      {/* 🔎 Découvrir des groupes */}
      <section className="dashboard-section">
        <h2 className="dashboard-subtitle">🔎 Découvrir des groupes</h2>
        {discover.length ? (
          <div className="dashboard-grid">
            {discover.map((g) => (
              <div className="dashboard-card" key={g.id}>
                <h3>{g.name}</h3>
                <p>{g.city || "—"} • {sportLabel(g)} • {count(g)} membre{count(g)>1?"s":""}</p>
                <Link to="/groups" className="dashboard-link">Voir dans Groupes</Link>
              </div>
            ))}
          </div>
        ) : (
          <p className="dashboard-empty">Rien à suggérer pour l’instant.</p>
        )}
      </section>
    </div>
  );
}
