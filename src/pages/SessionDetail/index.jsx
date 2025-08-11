// pages/Sessions/SessionDetailPage.jsx
import { useParams } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";
import { getSessionById, joinSession, leaveSession } from "../../api/sessionService";
import SessionSlots from "../../components/SessionSlots"; // cf. plus bas
import "../../components/SessionSlots.css";

export default function SessionDetailPage() {
  const { id } = useParams();
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // suppose que tu stockes l'email user (ex. après login)
  const currentUserEmail = useMemo(() => {
    try { return JSON.parse(localStorage.getItem("user"))?.email ?? null; } catch { return null; }
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const { data } = await getSessionById(id);
        setSession(data);
      } catch (e) {
        console.error(e);
        setError("Impossible de charger la session.");
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  const handleJoin = async () => {
    if (!currentUserEmail) return alert("Connecte-toi pour rejoindre.");
    try {
      // Optimistic UI (ajoute l'email si place dispo)
      setSession(prev => {
        if (!prev) return prev;
        const alreadyIn = (prev.participants || []).includes(currentUserEmail);
        const full = (prev.participants?.length || 0) >= (prev.max_players || 0);
        if (alreadyIn || full) return prev;
        return {
          ...prev,
          participants: [...(prev.participants || []), currentUserEmail],
          available_slots: Math.max((prev.available_slots ?? 0) - 1, 0),
        };
      });
      await joinSession(id); // POST /sessions/:id/join
    } catch (e) {
      // rollback simple: refetch
      const { data } = await getSessionById(id);
      setSession(data);
      alert("Impossible de rejoindre (session pleine ou autre règle).");
    }
  };

  const handleLeave = async () => {
    if (!currentUserEmail) return;
    try {
      setSession(prev => {
        if (!prev) return prev;
        return {
          ...prev,
          participants: (prev.participants || []).filter(p => p !== currentUserEmail),
          available_slots: (prev.available_slots ?? 0) + 1,
        };
      });
      await leaveSession(id); // POST /sessions/:id/leave
    } catch (e) {
      const { data } = await getSessionById(id);
      setSession(data);
      alert("Impossible de quitter.");
    }
  };

  if (loading) return <p className="text-center mt-10">Chargement...</p>;
  if (error) return <p className="text-center mt-10 text-red-500">{error}</p>;
  if (!session) return null;

  const dateStr = fmtDate(session.date, session.start_time);
  const isIn = (session.participants || []).includes(currentUserEmail);

  // Construire les "slots visuels" à partir des participants (emails) + max_players
  const slots = toSlots(session.participants, session.max_players, currentUserEmail);

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <header className="space-y-2">
        <h1 className="text-2xl font-bold">{session.title}</h1>

        <div className="flex flex-wrap gap-3 text-gray-400">
          <Meta label="Sport" value={session.sport?.name ?? "—"} />
          <Meta label="Lieu" value={session.location ?? "—"} />
          <Meta label="Date" value={dateStr ?? "—"} />
          <Meta label="Capacité" value={`${session.max_players ?? 0} places`} />
          <Meta label="Restant" value={`${session.available_slots ?? Math.max((session.max_players||0) - (session.participants?.length||0), 0)}`} />
          {session.visibility && <Meta label="Visibilité" value={session.visibility} />}
          {session.format && <Meta label="Format" value={session.format} />}
        </div>

        <div className="flex gap-8 items-center mt-2">
          {!isIn ? (
            <button
              onClick={handleJoin}
              className="px-4 py-2 rounded-md border border-[#ff2d2d] text-white hover:bg-[#ff2d2d] transition"
              disabled={(session.participants?.length || 0) >= (session.max_players || 0)}
            >
              Rejoindre
            </button>
          ) : (
            <button
              onClick={handleLeave}
              className="px-4 py-2 rounded-md border border-[#2a2a2a] text-white hover:bg-[#151515] transition"
            >
              Quitter
            </button>
          )}
        </div>
      </header>

      {/* Slots visuels : auto-assign (click = join/leave) */}
      <section>
        <SessionSlots
          sport={(session.sport?.slug || session.sport?.name || "generic").toLowerCase()}
          mode={mapFormatToMode(session.format, session.team_mode)}
          capacity={session.max_players}
          slots={slots}
          currentUserId={currentUserEmail}        // ici on utilise l'email comme id
          onJoin={() => handleJoin()}             // click sur un slot vide => join()
          onLeave={() => handleLeave()}           // click sur ton slot => leave()
        />
      </section>

      {/* Participants (emails) */}
      <section className="space-y-2">
        <h2 className="text-xl font-semibold">Participants</h2>
        {Array.isArray(session.participants) && session.participants.length ? (
          <ul className="grid gap-2">
            {session.participants.map((email) => (
              <li key={email} className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full border border-[#2a2a2a] grid place-items-center text-sm">
                  {initials(email)}
                </div>
                <span className="text-gray-100">{email}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-gray-500">Aucun participant pour le moment.</p>
        )}
      </section>

      {/* Description */}
      {session.description && (
        <section className="prose prose-invert max-w-none">
          <h2>Description</h2>
          <p>{session.description}</p>
        </section>
      )}
    </div>
  );
}

/* ---------- UI bits ---------- */
function Meta({ label, value }) {
  return (
    <span className="inline-flex items-center gap-2">
      <span className="text-gray-500">{label} :</span>
      <span className="text-gray-200">{value ?? "—"}</span>
    </span>
  );
}

function initials(emailOrName = "") {
  const s = String(emailOrName);
  if (s.includes("@")) return s[0].toUpperCase();
  return s.split(/\s+/).map(w => w[0]?.toUpperCase() || "").join("").slice(0,2) || "U";
}

function fmtDate(date, time) {
  try {
    // si tu stockes séparé: date (YYYY-MM-DD) + start_time (HH:MM:SS)
    const iso = date ? `${date}${time ? "T"+time : ""}` : null;
    const d = iso ? new Date(iso) : (date ? new Date(date) : null);
    return d ? d.toLocaleString() : null;
  } catch { return null; }
}

/* ---------- mapping & slots ---------- */
function mapFormatToMode(format, team_mode) {
  // adapte si tu as des valeurs d’enum différentes
  // VERSUS_1V1 → "1v1", VERSUS_TEAM → "5v5" (ou selon max_players), SOLO/FFA -> "solo"/"ffa"
  if (!format) return team_mode ? "5v5" : "solo";
  const f = String(format).toLowerCase();
  if (f.includes("1v1")) return "1v1";
  if (f.includes("versus")) return team_mode ? "5v5" : "ffa";
  if (f.includes("solo")) return "solo";
  if (f.includes("ffa")) return "ffa";
  return team_mode ? "5v5" : "solo";
}

function toSlots(participants, max, currentUserEmail) {
  const total = Number(max) || 0;
  const arr = Array.from({ length: total }, (_, i) => ({ index: i, user: null }));
  const list = Array.isArray(participants) ? participants.slice(0, total) : [];
  for (let i = 0; i < list.length; i++) {
    const email = list[i];
    arr[i] = {
      index: i,
      user: { id: email, name: email, avatar: null, isMe: email === currentUserEmail },
    };
  }
  return arr;
}
