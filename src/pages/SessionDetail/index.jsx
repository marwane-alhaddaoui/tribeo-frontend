// pages/Sessions/SessionDetailPage.jsx
import { useParams } from "react-router-dom";
import { useCallback, useEffect, useMemo, useState } from "react";
import { getSessionById, joinSession, leaveSession } from "../../api/sessionService";
import "../../styles/SessionDetailPage.css";

export default function SessionDetailPage() {
  const { id } = useParams();
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const currentUserEmail = useMemo(() => {
    try { return JSON.parse(localStorage.getItem("user"))?.email ?? null; } catch { return null; }
  }, []);

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

  useEffect(() => { refetch(); }, [refetch]);

  const isIn = useMemo(() => {
    if (!session || !currentUserEmail) return false;
    return (session.participants || []).some(p => p.email === currentUserEmail);
  }, [session, currentUserEmail]);

  const full = useMemo(() => {
    if (!session) return false;
    const n = Array.isArray(session.participants) ? session.participants.length : 0;
    return n >= (session.max_players || 0);
  }, [session]);

  const handleJoin = async () => {
    if (!currentUserEmail) return alert("Connecte-toi pour rejoindre.");
    if (busy || full || isIn) return;
    setBusy(true);
    try {
      // Optimistic UI: on pousse un objet minimal (API corrigera au refetch)
      setSession(prev => {
        if (!prev) return prev;
        if ((prev.participants || []).some(p => p.email === currentUserEmail)) return prev;
        if ((prev.participants?.length || 0) >= (prev.max_players || 0)) return prev;
        const me = {
          id: currentUserEmail,
          email: currentUserEmail,
          username: usernameFromEmail(currentUserEmail),
          avatar_url: null,
        };
        return { ...prev, participants: [...(prev.participants || []), me] };
      });
      await joinSession(id);
    } catch (e) {
      console.error(e);
      await refetch();
      alert("Impossible de rejoindre.");
    } finally {
      setBusy(false);
    }
  };

  const handleLeave = async () => {
    if (!currentUserEmail || busy || !isIn) return;
    setBusy(true);
    try {
      setSession(prev => {
        if (!prev) return prev;
        return { ...prev, participants: (prev.participants || []).filter(p => p.email !== currentUserEmail) };
      });
      await leaveSession(id);
    } catch (e) {
      console.error(e);
      await refetch();
      alert("Impossible de quitter.");
    } finally {
      setBusy(false);
    }
  };

  if (loading) return <p className="session-loading">Chargement…</p>;
  if (error) return (
    <div className="session-error">
      <p className="session-error-text">{error}</p>
      <button onClick={refetch} className="session-detail-button">Réessayer</button>
    </div>
  );
  if (!session) return null;

  const dateStr = fmtDate(session.date, session.start_time);
  const countdown = toCountdown(session.date, session.start_time);

  const capacity = session.max_players || 0;
  const count = Array.isArray(session.participants) ? session.participants.length : 0;
  const remaining = Math.max(capacity - count, 0);

  const teamCount = Number(session.team_count) > 0 ? Number(session.team_count) : (session.team_mode ? 2 : 1);
  const perTeam = Math.max(1, Math.floor(capacity / Math.max(teamCount, 1)));

  // participants -> objets {id,email,username,avatar,isMe}
  const participantObjs = mapParticipants(session.participants, currentUserEmail);

  // build teams (lignes d’équipes)
  const teams = buildTeams(participantObjs, teamCount, perTeam);

  // créateur (objet direct)
  const creator = session.creator || { username: "—", avatar_url: null };

  return (
    <div className="session-detail-wrapper">
      <div className="session-detail-grid">
        {/* Colonne gauche — Aperçu & actions */}
        <section className="session-col-left">
          <header className="session-header">
            <div className="session-header-top">
              <h1 className="session-detail-title">{session.title}</h1>
              <div className="session-badges">
                {isFull(count, capacity) && <span className="session-badge session-badge-red">Complet</span>}
                {session.visibility && String(session.visibility).toLowerCase() !== "public" && (
                  <span className="session-badge">Privée</span>
                )}
                {session.format && <span className="session-badge session-badge-outline">{prettyFormat(session.format)}</span>}
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
                style={{ width: `${capacity ? Math.min(100, Math.round((count / capacity) * 100)) : 0}%` }}
              />
            </div>

            {/* Actions */}
            <div className="session-actions">
              {!isIn ? (
                <button
                  onClick={handleJoin}
                  className="session-detail-button"
                  disabled={busy || full}
                >
                  Rejoindre
                </button>
              ) : (
                <button
                  onClick={handleLeave}
                  className="session-secondary-btn"
                  disabled={busy}
                >
                  Quitter
                </button>
              )}

              <button onClick={refetch} className="session-secondary-btn">Rafraîchir</button>
              <button onClick={() => copyInvite(id)} className="session-secondary-btn">Copier lien</button>

              {session.location && (
                <a
                  className="session-secondary-btn"
                  href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(session.location)}`}
                  target="_blank" rel="noreferrer"
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
        </section>

        {/* Colonne droite — Équipes & Participants */}
        <section className="session-col-right">
          {/* Bouton Quitter dédié (optionnel) */}
          {isIn && (
            <div className="team-actions">
              <button className="session-secondary-btn session-danger" onClick={handleLeave}>
                Quitter la session
              </button>
            </div>
          )}

          {/* Board d’équipes : lignes par équipe + VS */}
          <TeamBoard
            teams={teams}
            perTeam={perTeam}
            onClickEmpty={() => handleJoin()}
            onClickMine={() => handleLeave()}
          />

          {/* Liste participants (usernames only) */}
          <div className="session-participants">
            <h2 className="session-section-title">Participants</h2>
            {participantObjs.length ? (
              <div className="participants-row">
                {participantObjs.map(u => (
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
        </section>
      </div>
    </div>
  );
}

/* ====================== TEAM BOARD ====================== */
function TeamBoard({ teams, perTeam, onClickEmpty, onClickMine }) {
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
            onClickEmpty={onClickEmpty}
            onClickMine={onClickMine}
          />

          <div className="team-vs">VS</div>

          <TeamRow
            teamIndex={idx * 2 + 1}
            users={pair[1] || []}
            perTeam={perTeam}
            onClickEmpty={onClickEmpty}
            onClickMine={onClickMine}
          />
        </div>
      ))}
    </div>
  );
}

function TeamRow({ teamIndex, users, perTeam, onClickEmpty, onClickMine }) {
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
              onClick={() => (u.isMe ? onClickMine?.() : null)}
            />
          ) : (
            <EmptySlot key={i} onClick={() => onClickEmpty?.()} />
          )
        )}
      </div>
    </div>
  );
}

function SlotBubble({ avatar, label, isMe, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`slot-bubble${isMe ? " slot-bubble-me" : ""}`}
      title={label}
    >
      <img src={avatar} alt={label} className="slot-avatar" referrerPolicy="no-referrer" />
      <span className="slot-label">{label}</span>
    </button>
  );
}

function EmptySlot({ onClick }) {
  return (
    <button
      onClick={onClick}
      className="slot-empty"
      title="Rejoindre ce slot"
    >
      +
    </button>
  );
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
  return (participants || []).map(u => {
    // u est déjà {id, email, username, avatar_url}
    const username = u.username || usernameFromEmail(u.email);
    const avatar = u.avatar_url || dicebearAvatar(username);
    return {
      id: u.id ?? u.email,
      email: u.email,
      username,
      avatar,
      isMe: u.email === currentUserEmail,
    };
  });
}

function buildTeams(users = [], teamCount = 2, perTeam = 1) {
  const teams = Array.from({ length: teamCount }, () => []);
  let ti = 0;
  users.forEach(u => {
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
        // toutes pleines: ignore ou gérer autrement
      }
    }
    ti = (ti + 1) % teamCount;
  });
  return teams;
}

/* ====================== Utils ====================== */
function isFull(count, total) { return total ? count >= total : false; }
function usernameFromEmail(email) {
  const s = String(email || "");
  if (!s.includes("@")) return s || "user";
  return s.split("@")[0] || "user";
}
function dicebearAvatar(seed) {
  const s = encodeURIComponent(String(seed || "user"));
  return `https://api.dicebear.com/7.x/initials/svg?seed=${s}`;
}
function fmtDate(date, time) {
  try {
    const iso = date ? `${date}${time ? "T"+time : ""}` : null;
    const d = iso ? new Date(iso) : (date ? new Date(date) : null);
    return d ? d.toLocaleString(undefined, {
      weekday: "short", day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit"
    }) : null;
  } catch { return null; }
}
function toCountdown(date, time) {
  try {
    const iso = date ? `${date}${time ? "T"+time : ""}` : null;
    if (!iso) return null;
    const target = new Date(iso).getTime();
    const now = Date.now();
    const diff = target - now;
    if (diff <= 0) return "en cours / passé";
    const h = Math.floor(diff / (1000 * 60 * 60));
    const m = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    return h ? `${h}h${m.toString().padStart(2,"0")}` : `${m} min`;
  } catch { return null; }
}
function prettyFormat(format) {
  try { return String(format).replaceAll("_", " ").replace(/\b\w/g, c => c.toUpperCase()); }
  catch { return format; }
}
function copyInvite(id) {
  const url = `${window.location.origin}/sessions/${id}`;
  if (navigator.clipboard?.writeText) {
    navigator.clipboard.writeText(url).then(() => alert("Lien copié !")).catch(() => fallbackCopy(url));
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
function normalizeSession(s) {
  return {
    ...s,
    participants: Array.isArray(s?.participants) ? s.participants : [],
    max_players: Number(s?.max_players) || 0,
    team_count: Number(s?.team_count) || (s?.team_mode ? 2 : 1),
    creator: s?.creator || null,
    team_mode: !!s?.team_mode,
  };
}
