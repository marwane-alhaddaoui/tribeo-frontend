import { useEffect, useMemo, useState, useContext } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  getGroup,
  joinGroup,
  leaveGroup,
  addMember,
  removeMember,
  listJoinRequests,
  approveJoinReq,
  rejectJoinReq,
  listExternalMembers,
  addExternalMember,
  deleteExternalMember,
  deleteGroup,
} from "../../api/groupService";

import { AuthContext } from "../../context/AuthContext";
import GroupMembers from "../../components/GroupMembers";
import GroupJoinRequests from "../../components/GroupJoinRequests";
import ExternalMembers from "../../components/ExternalMembers";
import UserPicker from "../../components/UserPicker";
import "../../styles/GroupDetail.css";

// ---------- helpers ----------
function fmtDate(iso) {
  if (!iso) return "—";
  try {
    const d = new Date(iso);
    return d.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "2-digit" });
  } catch {
    return "—";
  }
}
function safe(v) {
  return v && String(v).trim() ? v : "—";
}
function FactCard({ label, value, hint }) {
  return (
    <div className="gd-fact">
      <div className="gd-fact-label">{label}</div>
      <div className="gd-fact-value">{value}</div>
      {hint ? <div className="gd-fact-hint">{hint}</div> : null}
    </div>
  );
}

export default function GroupDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const groupId = Number(id);
  const { user } = useContext(AuthContext);

  const [group, setGroup] = useState(null);
  const [loading, setLoading] = useState(true);
  const [opLoading, setOpLoading] = useState(false);
  const [err, setErr] = useState(null);
  const [msg, setMsg] = useState(null);

  // onglet: "overview" | "members" | "requests" | "externals"
  const [tab, setTab] = useState("overview");
  const [reqCount, setReqCount] = useState(null); // compteur demandes (réglé par enfant)

  const reload = async () => {
    try {
      const fresh = await getGroup(groupId);
      setGroup(fresh);
    } catch {
      setErr("Impossible de recharger le groupe.");
    }
  };

  useEffect(() => {
    (async () => {
      setLoading(true);
      setErr(null);
      try {
        const data = await getGroup(groupId);
        setGroup(data);
      } catch {
        setErr("Impossible de charger le groupe.");
      } finally {
        setLoading(false);
      }
    })();
  }, [groupId]);

  const isMember = !!group?.is_member;
  const isOwnerOrManager = !!group?.is_owner_or_manager;

  const typeLabel =
    group?.group_type === "PRIVATE" ? "Privé" :
    group?.group_type === "COACH"   ? "Coach-only" : "Public";
  const typeClass =
    group?.group_type === "PRIVATE" ? "chip-private" :
    group?.group_type === "COACH"   ? "chip-coach"   : "chip-public";

  const sportLabel = group?.sport_name ?? group?.sport?.name ?? group?.sport ?? "—";
  const membersCount = Array.isArray(group?.members) ? group.members.length : (group?.members_count ?? 0);
  const members = useMemo(() => group?.members ?? [], [group]);

  const coachLabel =
    group?.coach?.username || group?.coach?.email || group?.coach_name || "Coach";
  const joinPolicy =
    group?.group_type === "PRIVATE" ? "Sur demande (validation requise)" :
    group?.group_type === "COACH"   ? "Sur invitation du coach" :
    "Ouvert";

  const createdAt = fmtDate(group?.created_at);
  const updatedAt = fmtDate(group?.updated_at);

  // ---- Permissions robustes pour supprimer ----
  const userEmail = user?.email?.toLowerCase?.() || "";
  const coachEmail = (group?.coach?.email || "").toLowerCase();
  const rolesStr = (user?.roles || user?.role || []).toString().toUpperCase();

  const isAdminLike =
    user?.is_superuser === true ||
    user?.is_staff === true ||
    user?.is_admin === true ||
    rolesStr.includes("ADMIN");

  const isCoachOwner = !!user && (!!coachEmail && coachEmail === userEmail || rolesStr.includes("COACH"));

  const canDelete = isOwnerOrManager || isAdminLike || isCoachOwner;

  // ---- Actions principales ----
  const handleJoin = async () => {
    if (!group || group.group_type === "COACH") return;
    setOpLoading(true); setErr(null); setMsg(null);
    try {
      await joinGroup(groupId);
      await reload();
      setMsg(group.group_type === "PRIVATE" ? "Demande envoyée." : "Tu as rejoint le groupe.");
    } catch {
      setErr("Action impossible.");
    } finally {
      setOpLoading(false);
    }
  };

  const handleLeave = async () => {
    if (!group) return;
    setOpLoading(true); setErr(null); setMsg(null);
    try {
      await leaveGroup(groupId);
      await reload();
      setMsg("Tu as quitté le groupe.");
    } catch {
      setErr("Action impossible.");
    } finally {
      setOpLoading(false);
    }
  };

  // ---- Gestion des membres ----
  const handleAddMember = async (u) => {
    if (!u?.id) return;
    try {
      setOpLoading(true);
      await addMember(groupId, u.id);
      await reload();
      setMsg(`Membre ajouté: ${u.username || u.email || u.id}`);
    } catch {
      setErr("Ajout du membre impossible.");
    } finally {
      setOpLoading(false);
    }
  };

  const handleRemoveMember = async (m) => {
    if (!m?.id) return;
    if (!window.confirm("Retirer ce membre du groupe ?")) return;
    try {
      setOpLoading(true);
      await removeMember(groupId, m.id);
      await reload();
      setMsg("Membre retiré.");
    } catch {
      setErr("Suppression du membre impossible.");
    } finally {
      setOpLoading(false);
    }
  };

  // ---- Suppression du groupe ----
  const handleDeleteGroup = async () => {
    if (!window.confirm("Supprimer ce groupe ? Cette action est définitive.")) return;
    setOpLoading(true); setErr(null); setMsg(null);
    try {
      await deleteGroup(groupId);
      navigate("/groups");
    } catch {
      setErr("Suppression du groupe impossible.");
    } finally {
      setOpLoading(false);
    }
  };

  if (loading) return <div className="gd-skel">Chargement…</div>;
  if (!group)   return <div className="gd-empty">Groupe introuvable.</div>;

  return (
    <div className="gd">
      {(msg || err) && (
        <div className={`toast ${err ? "error" : "success"}`}>{err ?? msg}</div>
      )}

      {/* Header */}
      <header className="gd-header">
        <div>
          <h1 className="gd-title">{group.name}</h1>
          <div className="gd-meta">
            <span className={`gd-chip ${typeClass}`}>{typeLabel}</span>
            <span className="gd-meta-sub">
              {safe(group.city)} • {sportLabel} • {membersCount} membre{membersCount > 1 ? "s" : ""}
            </span>
          </div>
        </div>

        <div className="gd-actions">
          {!isMember ? (
            group.group_type === "COACH" ? (
              <button className="gd-btn" disabled title="Invitation requise par le coach">
                Sur invitation
              </button>
            ) : (
              <button className="gd-btn primary" onClick={handleJoin} disabled={opLoading}>
                {group.group_type === "PRIVATE" ? "Demander à rejoindre" : "Rejoindre"}
              </button>
            )
          ) : (
            <button className="gd-btn" onClick={handleLeave} disabled={opLoading}>
              Quitter
            </button>
          )}
        </div>
      </header>

      {/* Tabs */}
      <nav className="gd-tabs">
        <button onClick={() => setTab("overview")}  className={tab==="overview"  ? "active" : ""}>Aperçu</button>
        <button onClick={() => setTab("members")}   className={tab==="members"   ? "active" : ""}>Membres ({membersCount})</button>
        {isOwnerOrManager && (
          <>
            <button onClick={() => setTab("requests")}  className={tab==="requests"  ? "active" : ""}>
              Demandes{reqCount !== null ? ` (${reqCount})` : ""}
            </button>
            <button onClick={() => setTab("externals")} className={tab==="externals" ? "active" : ""}>
              Externes
            </button>
          </>
        )}
      </nav>

      {/* Panels */}
      {tab === "overview" && (
        <section className="gd-section gd-overview">
          <div className="gd-over-left">
            <h2>À propos</h2>
            <p className="gd-desc">{safe(group.description)}</p>

            <div className="gd-rules">
              <h3>Règles d’accès</h3>
              <ul>
                <li><span className="dot" /> <strong>Adhésion :</strong> {joinPolicy}</li>
                <li><span className="dot" /> <strong>Type :</strong> {typeLabel}</li>
              </ul>
            </div>
          </div>

          <aside className="gd-over-right">
            <div className="gd-facts">
              <FactCard label="Coach" value={safe(coachLabel)} />
              <FactCard label="Sport" value={safe(sportLabel)} />
              <FactCard label="Ville" value={safe(group.city)} />
              <FactCard label="Membres" value={String(membersCount)} />
              <FactCard label="Créé le" value={createdAt} />
              <FactCard label="Mis à jour" value={updatedAt} />
            </div>
          </aside>
        </section>
      )}

      {tab === "members" && (
        <section className="gd-section">
          {isOwnerOrManager && (
            <div style={{ marginBottom: 12 }}>
              <UserPicker onSelect={handleAddMember} placeholder="Ajouter un membre (username / email)" />
            </div>
          )}
          <GroupMembers members={members} canManage={isOwnerOrManager} onRemove={handleRemoveMember} />
        </section>
      )}

      {tab === "requests" && isOwnerOrManager && (
        <section className="gd-section">
          <GroupJoinRequests
            groupId={groupId}
            loader={reload}
            api={{ listJoinRequests, approveJoinReq, rejectJoinReq }}
            onCount={setReqCount}
          />
        </section>
      )}

      {tab === "externals" && isOwnerOrManager && (
        <section className="gd-section">
          <ExternalMembers
            groupId={groupId}
            loader={reload}
            api={{ listExternalMembers, addExternalMember, deleteExternalMember }}
          />
        </section>
      )}

      {/* Danger zone — visible si droits */}
      {canDelete && (
        <section className="gd-section danger-zone">
          <h2>Zone dangereuse</h2>
          <p>La suppression est <strong>définitive</strong>. Vérifie bien avant de continuer.</p>
          <button className="gd-btn danger" onClick={handleDeleteGroup} disabled={opLoading}>
            🗑 Supprimer le groupe
          </button>
        </section>
      )}
    </div>
  );
}
