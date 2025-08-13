import { useEffect, useMemo, useState } from "react";
import { getGroup } from "../api/groupService"; // utile pour avoir les noms des membres internes
import { getTrainingAttendance, saveTrainingAttendance } from "../api/sessionService";

/* ---------------------------
   Helpers
---------------------------- */
function asInt(v) {
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}
function normArray(x) {
  return Array.isArray(x) ? x : [];
}

/**
 * Construit un "id synthétique" pour piloter le Set de présents :
 * - membres internes : id positif = user_id
 * - externes : id négatif = -external_attendee_id
 */
function makeSyntheticId(userId, externalAttendeeId) {
  if (externalAttendeeId != null) return -Math.abs(Number(externalAttendeeId));
  return asInt(userId);
}

/* ============================
   Composant
============================ */
export default function TrainingAttendanceModal({ groupId, sessionId, onClose }) {
  const gid = asInt(groupId);
  const sid = asInt(sessionId);
  const sidValid = sid != null && sid > 0;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState(null);

  // members = [{ id(synth), user_id?, external_attendee_id?, username?, email?, first_name?, last_name?, external?, note? }]
  const [members, setMembers] = useState([]);
  const [present, setPresent] = useState(new Set()); // Set<number> (ids synthétiques)
  const [lastSavedAt, setLastSavedAt] = useState(null);

  // Fermer avec ESC
  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && onClose?.();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  // Normalise la réponse de GET /attendance en {members[], presentIds:Set}
  const normalizeAttendancePayload = (arr, groupLookup = new Map()) => {
    const items = Array.isArray(arr)
      ? arr
      : Array.isArray(arr?.attendance)
        ? arr.attendance
        : Array.isArray(arr?.attendees)
          ? arr.attendees
          : [];

    const map = new Map(); // key: synthetic id
    const presentIds = new Set();

    for (const r of items) {
      const userId = asInt(r?.user_id ?? r?.id);
      const extId = asInt(r?.external_attendee_id);
      const synthId = makeSyntheticId(userId, extId);
      if (synthId == null) continue;

      // Compléter affichage avec info groupe si dispo (username/email)
      const gInfo = userId != null ? groupLookup.get(userId) : null;

      const m = {
        id: synthId,
        user_id: userId ?? null,
        external_attendee_id: extId ?? null,
        username: r?.username ?? gInfo?.username ?? null,
        email: r?.email ?? gInfo?.email ?? null,
        first_name: r?.first_name ?? null,
        last_name: r?.last_name ?? null,
        role: r?.role ?? null,
        external: !!r?.external || extId != null,
        note: r?.note ?? "",
      };
      map.set(synthId, m);

      if (r?.present === true) presentIds.add(synthId);
    }

    const merged = Array.from(map.values()).sort((a, b) => a.id - b.id);
    return { merged, presentIds };
  };

  useEffect(() => {
    let alive = true;
    (async () => {
      setErr(null);
      if (!sidValid) {
        setLoading(false);
        setErr("ID de session invalide.");
        return;
      }
      setLoading(true);

      try {
        // 1) Charger le groupe pour enrichir (username/email) — best effort
        let groupLookup = new Map();
        try {
          const g = await getGroup(gid);
          const raw = normArray(g?.members);
          groupLookup = new Map(
            raw
              .map((m) => ({
                id: asInt(m?.id ?? m?.user_id),
                username: m?.username ?? m?.user?.username ?? null,
                email: m?.email ?? m?.user?.email ?? null,
                user_role: m?.user_role ?? m?.role ?? null,
              }))
              .filter((m) => m.id != null && String(m.user_role || "").toLowerCase() !== "coach")
              .map((m) => [m.id, { username: m.username, email: m.email }])
          );
        } catch {
          // si le GET groupe échoue, on continue sans enrichissement
          groupLookup = new Map();
        }

        // 2) Charger la présence (internes + externes)
        const res = await getTrainingAttendance(gid, sid);
        const { merged, presentIds } = normalizeAttendancePayload(res, groupLookup);

        if (alive) {
          setMembers(merged);
          setPresent(presentIds);
        }
      } catch {
        if (alive) {
          setErr("Chargement impossible.");
          setMembers([]);
          setPresent(new Set());
        }
      } finally {
        if (alive) setLoading(false);
      }
    })();

    return () => {
      alive = false;
    };
  }, [gid, sid, sidValid]);

  const toggle = (syntheticId) => {
    setPresent((prev) => {
      const n = new Set(prev);
      if (n.has(syntheticId)) n.delete(syntheticId);
      else n.add(syntheticId);
      return n;
    });
  };

  const setAll = (value) => {
    if (value) {
      setPresent(new Set(members.map((m) => m.id)));
    } else {
      setPresent(new Set());
    }
  };
  const invertAll = () => {
    setPresent((prev) => {
      const n = new Set();
      for (const m of members) {
        if (!prev.has(m.id)) n.add(m.id);
      }
      return n;
    });
  };

  // Construit le payload { user_id | external_attendee_id, present, note? }
  const rowsToSave = useMemo(
    () =>
      members.map((m) => {
        const base = { present: present.has(m.id), note: m.note || "" };
        if (m.external_attendee_id != null) {
          return { ...base, external_attendee_id: m.external_attendee_id };
        }
        // interne
        return { ...base, user_id: m.user_id ?? m.id };
      }),
    [members, present]
  );

  const stats = useMemo(() => {
    const total = members.length;
    const nbPresent = present.size;
    const nbAbsent = Math.max(0, total - nbPresent);
    const pct = total ? Math.round((nbPresent / total) * 100) : 0;
    const externals = members.filter((m) => m.external).length;
    return { total, nbPresent, nbAbsent, pct, externals };
  }, [members, present]);

  const submit = async () => {
    if (!sidValid) return;
    setSaving(true);
    setErr(null);
    try {
      // 1) save
      await saveTrainingAttendance(gid, sid, rowsToSave);

      // 2) refetch état réellement persisté
      try {
        const fresh = await getTrainingAttendance(gid, sid);
        const { merged, presentIds } = (function () {
          const items = Array.isArray(fresh)
            ? fresh
            : Array.isArray(fresh?.attendance)
              ? fresh.attendance
              : Array.isArray(fresh?.attendees)
                ? fresh.attendees
                : [];
          // pas d’enrichissement groupe sur le refetch (inutile)
          const map = new Map();
          const pset = new Set();
          for (const r of items) {
            const userId = asInt(r?.user_id ?? r?.id);
            const extId = asInt(r?.external_attendee_id);
            const synthId = makeSyntheticId(userId, extId);
            if (synthId == null) continue;
            map.set(synthId, {
              id: synthId,
              user_id: userId ?? null,
              external_attendee_id: extId ?? null,
              username: r?.username ?? null,
              email: r?.email ?? null,
              first_name: r?.first_name ?? null,
              last_name: r?.last_name ?? null,
              role: r?.role ?? null,
              external: !!r?.external || extId != null,
              note: r?.note ?? "",
            });
            if (r?.present === true) pset.add(synthId);
          }
          return { merged: Array.from(map.values()).sort((a, b) => a.id - b.id), presentIds: pset };
        })();
        setMembers(merged);
        setPresent(presentIds);
      } catch (refreshErr) {
        console.warn("attendance.refresh après save a échoué", refreshErr);
      }

      setLastSavedAt(new Date()); // recap
    } catch (e) {
      if (e?.response?.status === 404) {
        setErr("API de présence non disponible côté serveur.");
      } else {
        setErr("Sauvegarde impossible.");
      }
    } finally {
      setSaving(false);
    }
  };

  const savedMsg = lastSavedAt
    ? `Dernier enregistrement : ${lastSavedAt.toLocaleTimeString()}`
    : null;

  return (
    <div
      className="modal-backdrop"
      onClick={(e) => { if (e.target === e.currentTarget) onClose?.(); }}
    >
      <div className="modal-card">
        <div className="modal-head" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <h3>Feuille de présence</h3>
          <button className="gd-btn" onClick={onClose}>Fermer</button>
        </div>

        {loading ? (
          <div>Chargement…</div>
        ) : err ? (
          <div style={{ color: "tomato", marginBottom: 8 }}>{err}</div>
        ) : (
          <>
            {/* RÉCAP */}
            <div className="att-recap" style={{ display: "flex", gap: 12, alignItems: "center", marginBottom: 10 }}>
              <span><strong>{stats.nbPresent}</strong> / {stats.total} présents</span>
              <span>({stats.pct}%)</span>
              {stats.externals > 0 && (
                <span style={{ opacity: 0.8 }}>• {stats.externals} externes</span>
              )}
              {savedMsg && <span style={{ marginLeft: "auto", opacity: 0.7 }}>{savedMsg}</span>}
            </div>

            {/* ACTIONS RAPIDES */}
            <div className="att-bulk" style={{ display: "flex", gap: 8, marginBottom: 10 }}>
              <button className="gd-btn" onClick={() => setAll(true)}>Tout présent</button>
              <button className="gd-btn" onClick={() => setAll(false)}>Tout absent</button>
              <button className="gd-btn" onClick={invertAll}>Inverser</button>
            </div>

            {/* LISTE */}
            <ul className="att-list">
              {members.length ? (
                members.map((m) => {
                  const label =
                    m.username ||
                    m.email ||
                    [m.first_name, m.last_name].filter(Boolean).join(" ") ||
                    (m.user_id != null ? m.user_id : `Ext #${Math.abs(m.id)}`);

                  return (
                    <li key={m.id} className="att-row" style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <label className="att-left" style={{ display: "flex", gap: 8, alignItems: "center" }}>
                        <input
                          type="checkbox"
                          checked={present.has(m.id)}
                          onChange={() => toggle(m.id)}
                        />
                        <span>{label}</span>
                      </label>
                      {m.external && (
                        <span style={{
                          marginLeft: "auto",
                          fontSize: 12,
                          padding: "2px 8px",
                          border: "1px solid #999",
                          borderRadius: 999,
                          opacity: 0.8,
                        }}>
                          externe
                        </span>
                      )}
                    </li>
                  );
                })
              ) : (
                <li className="att-row">Aucun membre à afficher.</li>
              )}
            </ul>

            <div className="modal-actions" style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
              <button className="gd-btn primary" onClick={submit} disabled={saving || !sidValid}>
                {saving ? "Enregistrement…" : "Enregistrer"}
              </button>
              <button className="gd-btn" onClick={onClose} disabled={saving}>Annuler</button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
