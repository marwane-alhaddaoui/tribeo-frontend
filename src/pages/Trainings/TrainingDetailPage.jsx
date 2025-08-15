import { useEffect, useMemo, useState, useContext, useCallback } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import { getSessionById, deleteSession, saveTrainingAttendance, isTrainingSession } from "../../api/sessionService";
import { AuthContext } from "../../context/AuthContext";
import { QuotasContext } from "../../context/QuotasContext";

export default function TrainingDetailPage() {
  const { groupId, id } = useParams(); // /groups/:groupId/trainings/:id
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);
  const { refresh: refreshQuotas } = useContext(QuotasContext);

  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState(null);

  // état local des présences (userId -> boolean)
  const [presence, setPresence] = useState({});

  const load = useCallback(async () => {
    setLoading(true); setErr(null);
    try {
      const { data } = await getSessionById(id);
      if (!isTrainingSession(data)) {
        setErr("Cette page est réservée aux entraînements.");
      }
      setSession(data || null);

      // seed du state "presence" :
      // - si le BE renvoie déjà un status, adapte ici (ex: data.attendances)
      const participants = Array.isArray(data?.participants) ? data.participants : [];
      const seed = {};
      participants.forEach(p => { seed[p.id] = !!p.present; });
      setPresence(seed);
    } catch (e) {
      setErr("Impossible de charger l'entraînement.");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { load(); }, [load]);

  const isCoachOrAdmin = useMemo(() => {
    const role = String(user?.role || user?.roles || "").toLowerCase();
    return role.includes("coach") || role.includes("admin") || user?.is_staff || user?.is_superuser;
  }, [user]);

  const isCreator = useMemo(() => {
    if (!session || !user) return false;
    const c = session.creator;
    if (!c) return false;
    if (typeof c === "object") {
      return (c.id && user.id && Number(c.id) === Number(user.id)) ||
             (c.email && user.email && String(c.email).toLowerCase() === String(user.email).toLowerCase());
    }
    if (typeof c === "number") return user.id && Number(c) === Number(user.id);
    if (typeof c === "string") {
      return (user.email && c.toLowerCase() === user.email.toLowerCase()) ||
             (user.username && c.toLowerCase() === String(user.username).toLowerCase());
    }
    return false;
  }, [session, user]);

  const canManage = !!(isCreator || isCoachOrAdmin);

  const togglePresence = (uid) => {
    setPresence(prev => ({ ...prev, [uid]: !prev[uid] }));
  };

 const savePresence = async () => {
  if (!canManage) return;
  setSaving(true); setErr(null);
  try {
    const participants = Array.isArray(session?.participants) ? session.participants : [];
    const attendanceRows = participants.map(p => ({
      user_id: p.id,
      present: !!presence[p.id],
    }));

    // IMPORTANT: on passe groupId + session.id + rows
    await saveTrainingAttendance(Number(groupId), Number(session.id), attendanceRows);
    alert("Présences enregistrées.");
  } catch (e) {
    setErr(e?.response?.data?.detail || "Échec de la sauvegarde des présences.");
  } finally {
    setSaving(false);
  }
};

  const handleDelete = async () => {
    if (!canManage) return;
    if (!window.confirm("Supprimer cet entraînement ? Action définitive.")) return;
    try {
      await deleteSession(id);
      try { await refreshQuotas(); } catch {}
      navigate(`/groups/${groupId}`);
    } catch (e) {
      alert(e?.response?.data?.detail || "Suppression impossible.");
    }
  };

  if (loading) return <div style={{opacity:.7}}>Chargement…</div>;
  if (err) return (
    <div style={{display:"grid", gap:8}}>
      <div style={{color:"tomato"}}>{err}</div>
      <Link className="gd-btn" to={`/groups/${groupId}`}>Retour au groupe</Link>
    </div>
  );
  if (!session) return null;

  const participants = Array.isArray(session?.participants) ? session.participants : [];

  return (
    <div className="page-shell" style={{display:"grid", gap:16}}>
      <div style={{display:"flex", justifyContent:"space-between", alignItems:"center"}}>
        <h1 style={{margin:0}}>🏋️ {session.title}</h1>
        <div style={{display:"flex", gap:8}}>
          <Link className="gd-btn" to={`/groups/${groupId}`}>← Groupe</Link>
          {canManage && (
            <button className="gd-btn danger" onClick={handleDelete}>Supprimer</button>
          )}
        </div>
      </div>

      <div style={{opacity:.85}}>
        {session.date} • {session.start_time || "—"} • {session.location || "—"}
      </div>

      {session.description && (
        <div style={{whiteSpace:"pre-wrap", lineHeight:1.5}}>{session.description}</div>
      )}

      <section style={{marginTop:8}}>
        <h2 style={{margin:"12px 0"}}>Présences</h2>
        {participants.length === 0 ? (
          <div style={{opacity:.7}}>Aucun membre rattaché.</div>
        ) : (
          <div style={{display:"grid", gap:8}}>
            {participants.map(p => (
              <label key={p.id}
                     style={{
                       display:"flex", alignItems:"center", gap:10,
                       border:"1px solid #2a2a2a", borderRadius:10, padding:10
                     }}>
                <input
                  type="checkbox"
                  checked={!!presence[p.id]}
                  onChange={() => togglePresence(p.id)}
                  disabled={!canManage}
                />
                <span style={{fontWeight:600}}>{p.username || p.email || p.id}</span>
                <span style={{opacity:.7}}>{p.email}</span>
              </label>
            ))}
          </div>
        )}

        {canManage && (
          <div style={{marginTop:12, display:"flex", gap:8}}>
            <button className="gd-btn primary" onClick={savePresence} disabled={saving}>
              {saving ? "Enregistrement…" : "Enregistrer les présences"}
            </button>
          </div>
        )}
      </section>
    </div>
  );
}
