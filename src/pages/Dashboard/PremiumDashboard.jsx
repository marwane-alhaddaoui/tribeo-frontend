// src/pages/Dashboard/PremiumDashboard.jsx
import { useEffect, useState, useContext } from "react";
import { getSessions } from "../../api/sessionService";
import { listGroups } from "../../api/groupService";
import { AuthContext } from "../../context/AuthContext";
import { QuotasContext } from "../../context/QuotasContext";
import SessionCard from "../Sessions/SessionCard";
import QuotasBanner from "../../components/QuotasBanner";
import { Link } from "react-router-dom";
import "../../styles/DashboardPage.css";
import "../../styles/SessionCard.css";

export default function PremiumDashboard() {
  const { user } = useContext(AuthContext);
  const { quotas } = useContext(QuotasContext);
  const [mySessions, setMySessions] = useState([]);
  const [createdSessions, setCreatedSessions] = useState([]);
  const [myGroups, setMyGroups] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        setLoading(true);
        const [allSessions, groups] = await Promise.all([
          getSessions({ mine: true }),
          listGroups({ scope: "mine" }),
        ]);
        const email = user?.email;

        const mine = Array.isArray(allSessions) ? allSessions : [];
        const upcoming = mine.filter(s => (s.status || "").toUpperCase() !== "FINISHED" && (s.status || "").toUpperCase() !== "CANCELED");
        const created = mine.filter(s => (s?.creator?.email || s?.creator) === email);

        if (!mounted) return;
        setMySessions(upcoming);
        setCreatedSessions(created);
        setMyGroups(Array.isArray(groups) ? groups : []);
      } finally {
        setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, [user?.email]);

  return (
    <div className="dashboard">
      <div className="dashboard-head">
        <h1 className="dashboard-title">Tableau de bord (Premium)</h1>
        <QuotasBanner />
      </div>

      <div className="dashboard-actions">
        <Link to="/sessions/create" className="btn primary">+ Créer une session</Link>
      <Link to="/groups/new" className="btn ghost">+ Créer un groupe</Link>        <Link to="/billing" className="btn">Gérer mon abonnement</Link>
      </div>

      {loading ? <p>Chargement…</p> : (
        <>
          <section className="dashboard-section">
            <h2 className="dashboard-subtitle">👟 Mes sessions à venir</h2>
            <div className="sessions-grid">
              {mySessions.length ? mySessions.map((s) => <SessionCard key={s.id} session={s} />) : <p className="dashboard-empty">Aucune session prévue.</p>}
            </div>
          </section>

          <section className="dashboard-section">
            <h2 className="dashboard-subtitle">🧑‍💼 Mes sessions créées</h2>
            <div className="sessions-grid">
              {createdSessions.length ? createdSessions.map((s) => <SessionCard key={s.id} session={s} />) : <p className="dashboard-empty">Tu n’as pas encore créé de session.</p>}
            </div>
          </section>

          <section className="dashboard-section">
            <h2 className="dashboard-subtitle">👥 Mes groupes</h2>
            <div className="cards-grid">
              {myGroups.length ? myGroups.map((g) => (
                <div key={g.id} className="card">
                  <div className="card__body">
                    <div className="card__title">{g.name}</div>
                    <div className="card__meta">{g.sport_name || "—"} · {g.city || "—"}</div>
                  </div>
                  <div className="card__actions">
                    <Link to={`/groups/${g.id}`} className="btn ghost">Ouvrir</Link>
                    <Link to={`/sessions/create?group=${g.id}`} className="btn primary">+ Session</Link>
                  </div>
                </div>
              )) : <p className="dashboard-empty">Tu n’as pas de groupe pour l’instant.</p>}
            </div>
          </section>
        </>
      )}
    </div>
  );
}
