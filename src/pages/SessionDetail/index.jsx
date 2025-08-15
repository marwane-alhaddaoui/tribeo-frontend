import { useParams, useNavigate } from "react-router-dom";
import { useCallback, useEffect, useMemo, useState, useContext } from "react";
import {
  getSessionById,
  joinSession,
  leaveSession,
  deleteSession, // 🗑
} from "../../api/sessionService";
import "../../styles/SessionDetailPage.css";

// 👇 Chat
import chatService from "../../api/chatService";
import ChatPanel from "../../components/ChatPanel";
import "../../styles/ChatPanel.css";

import { AuthContext } from "../../context/AuthContext";
import { QuotasContext } from "../../context/QuotasContext";

/* ====================== Utils ====================== */
function isFull(count, total) {
  return total ? count >= total : false;
}
function usernameFromEmail(email) {
  const s = String(email || "");
  if (!s.includes("@")) return s || "user";
  return s.split("@")[0] || "user";
}
function dicebearAvatar(seed) {
  const s = encodeURIComponent(String(seed || "user"));
  return `https://api.dicebear.com/7.x/initials/svg?seed=${s}`;
}

function getApiError(e, fallback = "Action impossible.") {
  const msg =
    e?.response?.data?.detail ||
    e?.response?.data?.error ||
    e?.message ||
    fallback;
  return String(msg);
}

/** Bridge pour supporter `start/end` (nouveau back) ET `date + start_time/end_time` (ancien) */
function getStartEndISO(s = {}) {
  // priorité au nouveau back
  const startIso = s.start || (s.date ? `${s.date}${s.start_time ? "T" + s.start_time : ""}` : null);
  const endIso =
    s.end ||
    (s.date && s.end_time ? `${s.date}T${s.end_time}` : null) ||
    null;
  return { startIso, endIso };
}

function fmtDate(date, time) {
  try {
    const iso = date ? `${date}${time ? "T" + time : ""}` : null;
    const d = iso ? new Date(iso) : date ? new Date(date) : null;
    return d
      ? d.toLocaleString(undefined, {
          weekday: "short",
          day: "2-digit",
          month: "short",
          hour: "2-digit",
          minute: "2-digit",
        })
      : null;
  } catch {
    return null;
  }
}
function toCountdown(date, time) {
  try {
    const iso = date ? `${date}${time ? "T" + time : ""}` : null;
    if (!iso) return null;
    const target = new Date(iso).getTime();
    const now = Date.now();
    const diff = target - now;
    if (diff <= 0) return "en cours / passé";
    const h = Math.floor(diff / (1000 * 60 * 60));
    const m = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    return h ? `${h}h${m.toString().padStart(2, "0")}` : `${m} min`;
  } catch {
    return null;
  }
}
function prettyFormat(format) {
  try {
    return String(format)
      .replaceAll("_", " ")
      .replace(/\b\w/g, (c) => c.toUpperCase());
  } catch {
    return format;
  }
}
function copyInvite(id) {
  const url = `${window.location.origin}/sessions/${id}`;
  if (navigator.clipboard?.writeText) {
    navigator.clipboard
      .writeText(url)
      .then(() => alert("Lien copié !"))
      .catch(() => fallbackCopy(url));
  } else fallbackCopy(url);
}
function fallbackCopy(text) {
  const ta = document.createElement("textarea");
  ta.value = text;
  document.body.appendChild(ta);
  ta.select();
  document.execCommand("copy");
  document.body.removeChild(ta);
  alert("Lien copié !");
}

/** Calcule les états temporels (passée/en cours/à venir) */
function computeTiming(s = {}) {
  const { startIso, endIso } = getStartEndISO(s);
  const now = Date.now();
  const startMs = startIso ? Date.parse(startIso) : null;
  const endMs = endIso ? Date.parse(endIso) : startMs ? startMs + 2 * 60 * 60 * 1000 : null; // fallback 2h
  const isPast = startMs ? now > (endMs ?? startMs) : false;
  const isOngoing = startMs && endMs ? now >= startMs && now <= endMs : false;
  const isFuture = startMs ? now < startMs : false;
  return { startIso, endIso, startMs, endMs, isPast, isOngoing, isFuture };
}

function normalizeSession(s) {
  const timing = computeTiming(s);
  const base = {
    ...s,
    participants: Array.isArray(s?.participants) ? s.participants : [],
    max_players: Number(s?.max_players ?? s?.capacity ?? s?.max_participants) || 0,
    team_count: Number(s?.team_count) || (s?.team_mode ? 2 : 1),
    creator: s?.creator ?? null, // peut être un objet ou un id
    team_mode: !!s?.team_mode,
    _timing: timing,
  };
  // Compléter les champs legacy si absents (pour l'affichage existant)
  if (!base.date && timing.startIso) base.date = timing.startIso.slice(0, 10);
  if (!base.start_time && timing.startIso) base.start_time = timing.startIso.slice(11, 16);
  if (!base.end_time && timing.endIso) base.end_time = timing.endIso.slice(11, 16);
  return base;
}

/* robust eq (insensible à la casse / trim) */
const eq = (a, b) => String(a ?? "").trim().toLowerCase() === String(b ?? "").trim().toLowerCase();

/* ====================== Page ====================== */
export default function SessionDetailPage() {
  const { quotas } = useContext(QuotasContext);
  const { id } = useParams();
  const navigate = useNavigate();

  // on privilégie AuthContext si présent, sinon fallback localStorage (pour ne rien casser)
  const { user: ctxUser } = useContext(AuthContext) || {};
  const localUser = useMemo(() => {
    try {
      return JSON.parse(localStorage.getItem("user")) ?? null;
    } catch {
      return null;
    }
  }, []);
  const currentUser = ctxUser || localUser;

  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  // ⛔️ évite de monter le Chat pendant l’optimistic UI
  const [pendingJoin, setPendingJoin] = useState(false);

  const me = {
    id: currentUser?.id ?? null,
    email: currentUser?.email ?? null,
    username:
      currentUser?.username ??
      (currentUser?.email ? usernameFromEmail(currentUser.email) : null),
  };

  const refetch = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const { data } = await getSessionById(id);
      setSession(normalizeSession(data));
    } catch (e) {
      console.error(e);
      setError("Impossible de charger la session.");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    refetch();
  }, [refetch]);

  // détecte si l'utilisateur courant EST le créateur (match id OU email OU username)
  const isCreator = useMemo(() => {
    if (!session || !currentUser) return false;

    const c = session.creator;
    // cas 1: objet { id, email, username }
    if (c && typeof c === "object") {
      if (me.id != null && c.id != null && Number(me.id) === Number(c.id)) return true;
      if (me.email && c.email && eq(me.email, c.email)) return true;
      if (me.username && c.username && eq(me.username, c.username)) return true;
      return false;
    }
    // cas 2: id numérique ou chaîne
    if (c != null && me.id != null && Number(c) === Number(me.id)) return true;
    // (si l’API renvoyait un email/username “brut”, on tente quand même)
    if (typeof c === "string") {
      if (me.email && eq(me.email, c)) return true;
      if (me.username && eq(me.username, c)) return true;
    }
    return false;
  }, [session, currentUser, me.id, me.email, me.username]);

  // ✅ Backend autorise: créateur OU participant. On reflète ça côté UI :
  const isIn = useMemo(() => {
    if (!session || !me.email) return false;
    return (session.participants || []).some((p) => eq(p.email, me.email));
  }, [session, me.email]);

  // ⛔️ tant que pendingJoin, on ne monte pas le chat
  const canReadChat = ((isIn && !pendingJoin) || isCreator);
  const canWriteChat = ((isIn && !pendingJoin) || isCreator);

  // 👇 vue restreinte quand group/private & pas membre/creator
  const isRestrictedView = useMemo(() => {
    const vis = String(session?.visibility || "").toUpperCase();
    const isGroupOnly = vis === "GROUP" || vis === "PRIVATE" || vis === "RESTRICTED";
    return isGroupOnly && !(isIn || isCreator);
  }, [session?.visibility, isIn, isCreator]);

  // Modération: créateur ou owner/manager du groupe parent (si fourni par l’API)
  const canModerateChat = !!(isCreator || (session?.group && session.group.is_owner_or_manager));

  const full = useMemo(() => {
    if (!session) return false;
    const n = Array.isArray(session.participants) ? session.participants.length : 0;
    return n >= (session.max_players || 0);
  }, [session]);

  const status = useMemo(
    () => String(session?.status || "").toUpperCase(),
    [session?.status]
  );
  const timing = session?._timing || {
    isPast: false,
    isOngoing: false,
    isFuture: false,
  };

  const joinDisabled = useMemo(() => {
    const badStatus = ["LOCKED", "FINISHED", "CANCELED"].includes(status);
    return timing.isPast || full || badStatus;
  }, [timing.isPast, full, status]);

  const joinDisabledReason = useMemo(() => {
    if (timing.isPast) return "Cette session est passée. Inscriptions fermées.";
    if (status === "LOCKED") return "Cette session est verrouillée.";
    if (status === "FINISHED") return "Session terminée.";
    if (status === "CANCELED") return "Session annulée.";
    if (full) return "La session est complète.";
    return "Action impossible.";
  }, [timing.isPast, status, full]);

  const handleJoin = async () => {
    if (!me.email) return alert("Connecte-toi pour rejoindre.");
    if (busy || isIn) return;
    if (joinDisabled) {
      alert(joinDisabledReason);
      return;
    }
    setBusy(true);
    setPendingJoin(true);
    try {
      // Optimistic UI
      setSession((prev) => {
        if (!prev) return prev;
        if ((prev.participants || []).some((p) => eq(p.email, me.email))) return prev;
        if ((prev.participants?.length || 0) >= (prev.max_players || 0)) return prev;
        const mine = {
          id: me.id ?? me.email,
          email: me.email,
          username: me.username || usernameFromEmail(me.email),
          avatar_url: null,
        };
        return { ...prev, participants: [...(prev.participants || []), mine] };
      });
      await joinSession(id);
      await refetch();
    } catch (e) {
      console.error(e);
      await refetch();

      // 👇 on lit le message d'erreur renvoyé par le backend
      const msg =
        e?.response?.data?.detail || e?.response?.data?.error || String(e);

      // Quota backend atteint -> proposer l'upgrade
      if (/Quota mensuel de participation/i.test(msg)) {
        const go = confirm(
          "Tu as atteint ton quota de participations ce mois-ci. Passer Premium ?"
        );
        if (go) navigate("/profile"); // UpgradeCard est sur le profil
        return;
      }

      alert(msg || "Impossible de rejoindre.");
    } finally {
      setPendingJoin(false);
      setBusy(false);
    }
  };

  const handleLeave = async () => {
    if (!me.email || busy || !isIn) return;
    setBusy(true);
    setPendingJoin(false);
    try {
      setSession((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          participants: (prev.participants || []).filter((p) => !eq(p.email, me.email)),
        };
      });
      await leaveSession(id);
      await refetch();
    } catch (e) {
      console.error(e);
      await refetch();
      alert("Impossible de quitter.");
    } finally {
      setBusy(false);
    }
  };

  // 🗑 Danger Zone — suppression (créateur uniquement)
  const handleDelete = async () => {
    if (!isCreator) return;
    if (!window.confirm("Supprimer cette session ? Cette action est définitive.")) return;
    setBusy(true);
    try {
      await deleteSession(id);
      navigate("/sessions");
    } catch (e) {
      console.error(e);
      alert(e?.response?.data?.detail || "Suppression impossible.");
    } finally {
      setBusy(false);
    }
  };

  if (loading) return <p className="session-loading">Chargement…</p>;
  if (error)
    return (
      <div className="session-error">
        <p className="session-error-text">{error}</p>
        <button onClick={refetch} className="session-detail-button">
          Réessayer
        </button>
      </div>
    );
  if (!session) return null;

  const dateStr = fmtDate(session.date, session.start_time);
  const countdown = toCountdown(session.date, session.start_time);

  const capacity = session.max_players || 0;
  const count = Array.isArray(session.participants) ? session.participants.length : 0;
  const remaining = Math.max(capacity - count, 0);

  const teamCount =
    Number(session.team_count) > 0
      ? Number(session.team_count)
      : session.team_mode
      ? 2
      : 1;
  const perTeam = Math.max(1, Math.floor(capacity / Math.max(teamCount, 1)));

  const participantObjs = mapParticipants(session.participants, me.email);
  const teams = buildTeams(participantObjs, teamCount, perTeam);
  const creator =
    session.creator && typeof session.creator === "object"
      ? session.creator
      : { username: "—", avatar_url: null };

  return (
    <div className="session-detail-wrapper">
      <div className="session-detail-grid">
        {/* Colonne gauche — Aperçu & actions */}
        <section className="session-col-left">
          {/* Bannières état */}
          {timing.isPast && (
            <div className="session-banner danger">
              Cette session est passée — inscriptions fermées.
            </div>
          )}
          {timing.isOngoing && !timing.isPast && (
            <div className="session-banner info">Session en cours.</div>
          )}
          {["LOCKED", "FINISHED", "CANCELED"].includes(status) && !timing.isPast && (
            <div className="session-banner danger">
              {status === "LOCKED" && "Cette session est verrouillée."}
              {status === "FINISHED" && "Session terminée."}
              {status === "CANCELED" && "Session annulée."}
            </div>
          )}

          <header className="session-header">
            <div className="session-header-top">
              <h1 className="session-detail-title">{session.title}</h1>
              <div className="session-badges">
                {isFull(count, capacity) && (
                  <span className="session-badge session-badge-red">Complet</span>
                )}
                {session.visibility &&
                  String(session.visibility).toLowerCase() !== "public" && (
                    <span className="session-badge">Privée</span>
                  )}
                {session.format && (
                  <span className="session-badge session-badge-outline">
                    {prettyFormat(session.format)}
                  </span>
                )}
                {status && (
                  <span className="session-badge session-badge-outline">
                    {status}
                  </span>
                )}
              </div>
            </div>

            <div className="meta-list">
              <Meta
                label="Créateur"
                value={
                  <span className="meta-with-avatar">
                    <img
                      src={creator.avatar_url || dicebearAvatar(creator.username)}
                      alt={creator.username}
                      className="meta-avatar"
                      referrerPolicy="no-referrer"
                    />
                    <span>{creator.username}</span>
                  </span>
                }
              />
              <Meta label="Sport" value={session.sport?.name ?? "—"} />
              <Meta label="Lieu" value={session.location ?? "—"} />
              <Meta label="Date" value={dateStr ?? "—"} />
              <Meta label="Capacité" value={`${capacity} places`} />
              <Meta label="Restant" value={`${remaining}`} />
              {countdown && <Meta label="Début dans" value={countdown} />}
            </div>

            {/* Barre de capacité */}
            <div className="capacity-bar">
              <div
                className="capacity-bar-fill"
                style={{
                  width: `${
                    capacity ? Math.min(100, Math.round((count / capacity) * 100)) : 0
                  }%`,
                }}
              />
            </div>

            {/* Actions */}
            <div className="session-actions">
            {!isIn ? (
              <button
                onClick={handleJoin}
                className="session-detail-button"
                disabled={busy || joinDisabled}
                title={joinDisabled ? joinDisabledReason : "Rejoindre la session"}
              >
                Rejoindre
              </button>
            ) : !isCreator ? (
              <button
                onClick={handleLeave}
                className="session-secondary-btn"
                disabled={busy}
                title="Quitter la session"
              >
                Quitter
              </button>
            ) : (
              <button
                className="session-secondary-btn"
                disabled
                title="Tu es l’organisateur, tu ne peux pas quitter cette session. Supprime-la si nécessaire."
              >
                Organisateur · non quittable
              </button>
            )}          

            <button onClick={() => copyInvite(id)} className="session-secondary-btn">
              Copier lien
            </button>         

            {session.location && (
              <a
                className="session-secondary-btn"
                href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                  session.location
                )}`}
                target="_blank"
                rel="noreferrer"
              >
                Ouvrir dans Maps
              </a>
            )}
          </div>
          </header>

          {/* Description */}
          {session.description && (
            <div className="session-desc">
              <h2 className="session-section-title">Description</h2>
              <p className="session-desc-text">{session.description}</p>
            </div>
          )}

          {/* 🛑 Danger Zone — CREATOR ONLY */}
          {isCreator && (
            <section className="danger-zone" style={{ marginTop: 24 }}>
              <h2>Zone dangereuse</h2>
              <p>
                La suppression est <strong>définitive</strong>. Vérifie bien
                avant de continuer.
              </p>
              <button className="gd-btn danger" onClick={handleDelete} disabled={busy}>
                🗑 Supprimer la session
              </button>
            </section>
          )}
        </section>

        {/* Colonne droite — Équipes & Participants & Chat */}
        <section className="session-col-right">
          

          {/* Contenu flouté si accès restreint */}
          <div className={`session-obscured${isRestrictedView ? " is-restricted" : ""}`}>
            <div className="obscured-content">
              <TeamBoard
                teams={teams}
                perTeam={perTeam}
                onClickEmpty={() =>
                  joinDisabled ? alert(joinDisabledReason) : handleJoin()
                }
                onClickMine={() => handleLeave()}
              />

              <div className="session-participants">
                <h2 className="session-section-title">Participants</h2>
                {participantObjs.length ? (
                  <div className="participants-row">
                    {participantObjs.map((u) => (
                      <div key={u.id} className="participant-chip">
                        <img
                          src={u.avatar}
                          alt={u.username}
                          className="participant-avatar"
                          referrerPolicy="no-referrer"
                        />
                        <span className="participant-username">{u.username}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="session-empty">Aucun participant pour le moment.</p>
                )}
              </div>

              {/* 👇 Chat de la session (privé créateur/participants) */}
              <div style={{ marginTop: 24 }}>
                <h2 className="session-section-title">Chat de la session</h2>
                <ChatPanel
                  key={`${id}-${canReadChat ? 'r' : 'nr'}`}
                  api={chatService.session(id)}
                  canRead={canReadChat}
                  canWrite={canWriteChat}
                  canModerate={canModerateChat}
                  // 🔥 blur si l'utilisateur n'a pas l'accès et que la session n'est pas publique
                  blurred={!canReadChat && String(session?.visibility || '').toUpperCase() !== 'PUBLIC'}
                />
              </div>
            </div>

            {/* Overlay seulement quand restreint */}
            {isRestrictedView && (
              <div className="obscured-overlay">
                <div className="obscured-card">
                  <div className="obscured-title">Accès réservé aux membres</div>
                  <div className="obscured-text">
                    Rejoins la session pour afficher les équipes, participants et le chat.
                  </div>
                  <div className="obscured-actions">
                    <button
                      className="session-detail-button"
                      onClick={handleJoin}
                      disabled={busy || joinDisabled}
                      title={joinDisabled ? joinDisabledReason : "Rejoindre la session"}
                    >
                      Rejoindre
                    </button>
                    <button className="session-secondary-btn" onClick={refetch}>
                      Rafraîchir
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
/* ====================== TEAM BOARD ====================== */
function TeamBoard({ teams, perTeam }) {
  if (!Array.isArray(teams) || !teams.length) return null;

  const pairs = [];
  for (let i = 0; i < teams.length; i += 2) {
    pairs.push(teams.slice(i, i + 2));
  }

  return (
    <div className="team-board">
      {pairs.map((pair, idx) => (
        <div key={idx} className="team-pair">
          <TeamRow
            teamIndex={idx * 2}
            users={pair[0] || []}
            perTeam={perTeam}
          />
          <div className="team-vs">VS</div>
          <TeamRow
            teamIndex={idx * 2 + 1}
            users={pair[1] || []}
            perTeam={perTeam}
          />
        </div>
      ))}
    </div>
  );
}

function TeamRow({ teamIndex, users, perTeam }) {
  const slots = Array.from({ length: perTeam }, (_, i) => users[i] || null);
  return (
    <div className="team-row">
      <span className="team-label">Équipe {teamIndex + 1}</span>
      <div className="team-slots">
        {slots.map((u, i) =>
          u ? (
            <SlotBubble
              key={i}
              avatar={u.avatar}
              label={u.username}
              isMe={u.isMe}
            />
          ) : (
            <EmptySlot key={i} />
          )
        )}
      </div>
    </div>
  );
}

function SlotBubble({ avatar, label, isMe }) {
  // 👉 plus de clic pour changer/choisir quoi que ce soit
  return (
    <div
      className={`slot-bubble${isMe ? " slot-bubble-me" : ""}`}
      title={label}
      role="group"
      aria-label={label}
    >
      <img src={avatar} alt={label} className="slot-avatar" referrerPolicy="no-referrer" />
      <span className="slot-label">{label}</span>
    </div>
  );
}

function EmptySlot() {
  return <div className="slot-empty" aria-hidden="true" />;
}

/* ====================== UI Helpers ====================== */
function Meta({ label, value }) {
  return (
    <span className="meta-item">
      <span className="meta-label">{label} :</span>
      <span className="meta-value">{value ?? "—"}</span>
    </span>
  );
}

/* ====================== Data Mapping ====================== */
function mapParticipants(participants = [], currentUserEmail = null) {
  return (participants || []).map((u) => {
    const username = u.username || usernameFromEmail(u.email);
    const avatar = u.avatar_url || dicebearAvatar(username);
    return {
      id: u.id ?? u.email,
      email: u.email,
      username,
      avatar,
      isMe: currentUserEmail ? eq(u.email, currentUserEmail) : false,
    };
  });
}

function buildTeams(users = [], teamCount = 2, perTeam = 1) {
  const teams = Array.from({ length: teamCount }, () => []);
  let ti = 0;
  users.forEach((u) => {
    if (teams[ti].length < perTeam) {
      teams[ti].push(u);
    } else {
      let placed = false;
      for (let k = 0; k < teamCount; k++) {
        if (teams[k].length < perTeam) {
          teams[k].push(u);
          placed = true;
          break;
        }
      }
      if (!placed) {
        // toutes pleines: ignore
      }
    }
    ti = (ti + 1) % teamCount;
  });
  return teams;
}
