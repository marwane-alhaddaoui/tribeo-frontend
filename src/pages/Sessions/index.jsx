// src/pages/Sessions/SessionsPage.jsx
import { useEffect, useState, useContext, useMemo } from "react";
import { getSessions, joinSession, leaveSession } from "../../api/sessionService";
import SportFilter from "./SportFilter";
import SessionCard from "./SessionCard";
import "../../styles/SessionPage.css";
import SessionMap from "../../components/SessionMap";
import CreateSessionCTA from "../../components/CreateSessionCTA";
import { AuthContext } from "../../context/AuthContext";
import { computeTiming } from "../../utils/sessionTime";

/* ====================== Filtres État ====================== */
const SESSION_FILTERS = {
  ALL: "ALL",
  OPEN: "OPEN",
  FINISHED: "FINISHED",
  FULL: "FULL",
};

function isFull(session) {
  const capacity = Number(session?.max_players ?? session?.capacity ?? session?.max_participants ?? 0);
  const count = Array.isArray(session?.participants)
    ? session.participants.length
    : Number(session?.participants_count ?? 0);
  return capacity > 0 && count >= capacity;
}

function matchesFilter(session, filter) {
  if (!filter || filter === SESSION_FILTERS.ALL) return true;

  const status = String(session?.status || "").toUpperCase();
  const timing = computeTiming ? computeTiming(session) : { isPast: false, isOngoing: false, isFuture: true };
  const full = isFull(session);

  switch (filter) {
    case SESSION_FILTERS.OPEN: {
      // Ouvert = pas passé, pas annulé/verrouillé/terminé, pas complet
      const badStatus = ["FINISHED", "CANCELED", "LOCKED"].includes(status);
      return !timing.isPast && !badStatus && !full;
    }
    case SESSION_FILTERS.FINISHED: {
      // Terminé = statut FINISHED OU (passé et pas en cours)
      return status === "FINISHED" || (timing.isPast && !timing.isOngoing);
    }
    case SESSION_FILTERS.FULL: {
      return full;
    }
    default:
      return true;
  }
}

/* ====================== Page ====================== */
export default function SessionsPage() {
  const { user } = useContext(AuthContext);
  const isVisitor = !user; // 👈 visiteur non connecté

  const [sessions, setSessions] = useState([]);
  const [selectedSport, setSelectedSport] = useState("");
  const [search, setSearch] = useState("");
  const [focused, setFocused] = useState(null); // session ciblée

  // 👇 nouveau: filtre état
  const [stateFilter, setStateFilter] = useState(SESSION_FILTERS.ALL);

  const fetchSessions = () => {
    const filters = { is_public: true };
    if (!isVisitor) {
      if (selectedSport) filters.sport_id = selectedSport;
      if (search.trim()) filters.search = search.trim();
    }
    getSessions(filters).then(setSessions).catch(console.error);
  };

  useEffect(() => {
    fetchSessions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedSport, search]); // on ne refetch pas sur le filtre d'état (filtrage côté front)

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

  // 👉 filtrage côté front (État: Ouvert/Terminé/Complet/Tout)
  const filteredSessions = useMemo(
    () => (Array.isArray(sessions) ? sessions.filter((s) => matchesFilter(s, stateFilter)) : []),
    [sessions, stateFilter]
  );

  // Si la session focus n'est plus dans la liste filtrée, on l'oublie
  useEffect(() => {
    if (focused && !filteredSessions.some((s) => s.id === focused.id)) {
      setFocused(null);
    }
  }, [filteredSessions, focused]);

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

            {/* Barre de filtres ÉTAT */}
      <div className={`sessions-state-filters ${isVisitor ? "is-disabled" : ""}`}>
        {[
          { key: "ALL", label: "Tout" },
          { key: "OPEN", label: "Ouvertes" },
          { key: "FINISHED", label: "Terminées" },
          { key: "FULL", label: "Complètes" },
        ].map((it) => (
          <button
            key={it.key}
            type="button"
            onClick={() => !isVisitor && setStateFilter(it.key)}
            disabled={isVisitor}
            className={`filter-btn ${stateFilter === it.key ? "active" : ""}`}
          >
            {it.label}
          </button>
        ))}
      </div>

      {/* 🔒 Bannière visiteur (même style que Groups) */}
      {isVisitor && (
        <div className="sessions-locked-banner">
          <div className="slb-text">
            <strong>Contenu prévisualisé</strong> — Connecte-toi pour voir les sessions en clair, la carte interactive et les détails.
          </div>
          <div className="slb-actions">
            <a className="btn-primary" href="/login">Se connecter</a>
            <a className="btn-ghost" href="/register">Créer un compte</a>
          </div>
        </div>
      )}

      {/* Carte contrôlée — on lui passe la liste filtrée */}
      <SessionMap sessions={filteredSessions} focus={focused} locked={isVisitor} />

      <div className={`sessions-grid ${isVisitor ? "grid-locked" : ""}`}>
        {Array.isArray(filteredSessions) && filteredSessions.length ? (
          filteredSessions.map((s) => (
            <SessionCard
              key={s.id}
              session={s}
              onJoin={isVisitor ? undefined : handleJoin}
              onLeave={isVisitor ? undefined : handleLeave}
              onFocus={isVisitor ? undefined : handleFocus}
            />
          ))
        ) : (
          <p className="sessions-empty">Aucune session.</p>
        )}
      </div>

      <CreateSessionCTA variant="fab" />
    </div>
  );
}
