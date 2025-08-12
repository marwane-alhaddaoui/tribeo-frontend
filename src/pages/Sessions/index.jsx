import { useEffect, useState, useContext } from "react";
import { getSessions, joinSession, leaveSession } from "../../api/sessionService";
import SportFilter from "./SportFilter";
import SessionCard from "./SessionCard";
import "../../styles/SessionPage.css";
import SessionMap from "../../components/SessionMap";
import CreateSessionCTA from "../../components/CreateSessionCTA";
import { AuthContext } from "../../context/AuthContext";

export default function SessionsPage() {
  const { user } = useContext(AuthContext);
  const isVisitor = !user; // 👈 visiteur non connecté

  const [sessions, setSessions] = useState([]);
  const [selectedSport, setSelectedSport] = useState("");
  const [search, setSearch] = useState("");
  const [focused, setFocused] = useState(null); // session ciblée

  const fetchSessions = () => {
    const filters = { is_public: true };
    if (!isVisitor) {
      if (selectedSport) filters.sport_id = selectedSport;
      if (search.trim()) filters.search = search.trim();
    }
    getSessions(filters).then(setSessions).catch(console.error);
  };

  useEffect(() => { fetchSessions(); }, [selectedSport, search]); // eslint OK

  // Désactive le focus/zoom si visiteur
  const handleFocus = (s) => {
    if (isVisitor) return;
    if (!s?.latitude || !s?.longitude) return;
    setFocused(s);
    const el = document.getElementById("sessions-map");
    if (el) el.scrollIntoView({ behavior: "smooth", block: "center" });
  };

  const handleJoin = async (id) => {
    if (isVisitor) return;
    try {
      await joinSession(id);
      alert("✅ Vous avez rejoint la session !");
      fetchSessions();
    } catch (err) {
      alert(`❌ ${err?.response?.data?.detail || "Erreur lors de la participation"}`);
    }
  };

  const handleLeave = async (id) => {
    if (isVisitor) return;
    try {
      await leaveSession(id);
      alert("✅ Vous avez quitté la session !");
      fetchSessions();
    } catch (err) {
      alert(`❌ ${err?.response?.data?.detail || "Erreur lors de la sortie"}`);
    }
  };

  const onChangeSearch = (e) => {
    if (isVisitor) return;
    setSearch(e.target.value);
  };
  const onSelectSport = (sId) => {
    if (isVisitor) return;
    setSelectedSport(sId);
  };

  return (
    <div className="sessions-wrapper">
      <div className="sessions-toolbar">
        <h1 className="sessions-title">Trouve ta prochaine session sportive</h1>
        <CreateSessionCTA variant="button" />
      </div>

      <div className={`sessions-filters ${isVisitor ? "is-disabled" : ""}`}>
        <input
          type="text"
          placeholder="Rechercher une session…"
          value={search}
          onChange={onChangeSearch}
          className="search-input"
          disabled={isVisitor}
        />
        <div className={isVisitor ? "pointer-block" : ""}>
          <SportFilter selected={selectedSport} onSelect={onSelectSport} disabled={isVisitor} />
        </div>
      </div>

      {/* 🔒 Bannière visiteur (même style que Groups) */}
      {isVisitor && (
        <div className="sessions-locked-banner">
          <div className="slb-text">
            <strong>Contenu prévisualisé</strong> — Connecte‑toi pour voir les sessions en clair, la carte interactive et les détails.
          </div>
          <div className="slb-actions">
            <a className="btn-primary" href="/login">Se connecter</a>
            <a className="btn-ghost" href="/register">Créer un compte</a>
          </div>
        </div>
      )}

      {/* Carte contrôlée — verrouillée pour visiteurs */}
      <SessionMap sessions={sessions} focus={focused} locked={isVisitor} />

      <div className={`sessions-grid ${isVisitor ? "grid-locked" : ""}`}>
        {Array.isArray(sessions) &&
          sessions.map((s) => (
            <SessionCard
              key={s.id}
              session={s}
              onJoin={isVisitor ? undefined : handleJoin}
              onLeave={isVisitor ? undefined : handleLeave}
              onFocus={isVisitor ? undefined : handleFocus}
            />
          ))}
      </div>

      <CreateSessionCTA variant="fab" />
    </div>
  );
}
