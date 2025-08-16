// src/pages/Groups/GroupDetail.jsx
import { useEffect, useMemo, useState, useContext } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
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
import "../../styles/GroupDetail.css";

// 👇 Chat
import chatService from "../../api/chatService";
import ChatPanel from "../../components/ChatPanel";
import "../../styles/ChatPanel.css";

// 👇 Sessions du groupe (TRAINING)
import GroupSessionsTab from "../../components/GroupSessionsTab";

// 👇 Membres combinés
import AllMembers from "../../components/AllMembers";

//invitation
import GroupJoinRequests from "../../components/GroupJoinRequests";

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
  const { t } = useTranslation();
  const { id } = useParams();
  const navigate = useNavigate();
  const groupId = Number(id);
  const { user } = useContext(AuthContext);

  const [group, setGroup] = useState(null);
  const [loading, setLoading] = useState(true);
  const [opLoading, setOpLoading] = useState(false);
  const [err, setErr] = useState(null);
  const [msg, setMsg] = useState(null);

  // 🔢 compteur d'externes (remonté par ExternalMembers)
  const [externalCount, setExternalCount] = useState(0);

  // onglet: "overview" | "members" | "chat" | "requests" | "sessions"
  const [tab, setTab] = useState("overview");
  const [reqCount, setReqCount] = useState(null);

  const reload = async () => {
    try {
      const fresh = await getGroup(groupId);
      setGroup(fresh);
    } catch {
      setErr(t("gd_reload_failed"));
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
        setErr(t("gd_load_failed"));
      } finally {
        setLoading(false);
      }
    })();
  }, [groupId, t]);

  const isMember = !!group?.is_member;
  const isOwnerOrManager = !!group?.is_owner_or_manager;

  const typeLabel =
    group?.group_type === "PRIVATE" ? t("gd_type_private")
    : group?.group_type === "COACH" ? t("gd_type_coach")
    : t("gd_type_public");

  const typeClass =
    group?.group_type === "PRIVATE" ? "chip-private"
    : group?.group_type === "COACH" ? "chip-coach"
    : "chip-public";

  const sportLabel = group?.sport_name ?? group?.sport?.name ?? group?.sport ?? "—";
  const members = useMemo(() => group?.members ?? [], [group]);

  const joinPolicy =
    group?.group_type === "PRIVATE" ? t("gd_join_policy_private")
    : group?.group_type === "COACH" ? t("gd_join_policy_coach")
    : t("gd_join_policy_open");

  // ---- Permissions robustes ----
  const userEmail = user?.email?.toLowerCase?.() || "";
  const coachEmail = (group?.coach?.email || "").toLowerCase();
  const rolesStr = (user?.roles || user?.role || []).toString().toUpperCase();

  const isAdminLike =
    user?.is_superuser === true ||
    user?.is_staff === true ||
    user?.is_admin === true ||
    rolesStr.includes("ADMIN");

  // 👇 c'est le créateur/coach du groupe ?
  const isGroupCoach = group?.is_group_coach === true || (!!coachEmail && coachEmail === userEmail) || rolesStr.includes("COACH");

  const canDelete = isOwnerOrManager || isAdminLike || isGroupCoach;
  const canCreateTraining = group?.group_type === "COACH" && group?.is_group_coach === true;

  // ---- Actions principales ----
  const handleJoin = async () => {
    if (!group || group.group_type === "COACH") return;
    setOpLoading(true); setErr(null); setMsg(null);
    try {
      await joinGroup(groupId);
      await reload();
      setMsg(group.group_type === "PRIVATE" ? t("gd_request_sent") : t("gd_join_success"));
    } catch (e) {
      const raw =
        e?.response?.data?.detail ||
        e?.response?.data?.error ||
        String(e);

      if (/Nombre maximal de groupes/i.test(raw)) {
        const go = confirm(t("gd_quota_reached_prompt"));
        if (go) navigate("/profile");
        setOpLoading(false);
        return;
      }

      setErr(t("gd_action_failed"));
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
      setMsg(t("gd_leave_success"));
    } catch {
      setErr(t("gd_action_failed"));
    } finally {
      setOpLoading(false);
    }
  };

  const handleAddMember = async (u) => {
    if (!u?.id) return;
    try {
      setOpLoading(true);
      await addMember(groupId, u.id);
      await reload();
      setMsg(t("gd_member_added", { who: u.username || u.email || u.id }));
    } catch {
      setErr(t("gd_add_member_failed"));
    } finally {
      setOpLoading(false);
    }
  };

  const handleRemoveMember = async (m) => {
    if (!m?.id) return;
    if (!window.confirm(t("gd_remove_member_confirm"))) return;
    try {
      setOpLoading(true);
      await removeMember(groupId, m.id);
      await reload();
      setMsg(t("gd_member_removed"));
    } catch {
      setErr(t("gd_remove_member_failed"));
    } finally {
      setOpLoading(false);
    }
  };

  const handleDeleteGroup = async () => {
    if (!window.confirm(t("gd_delete_confirm"))) return;
    setOpLoading(true); setErr(null); setMsg(null);
    try {
      await deleteGroup(groupId);
      navigate("/groups");
    } catch {
      setErr(t("gd_delete_failed"));
    } finally {
      setOpLoading(false);
    }
  };

  if (loading) return <div className="gd-skel">{t("gd_loading")}</div>;
  if (!group)   return <div className="gd-empty">{t("gd_not_found")}</div>;

  // 👉 total internes + externes pour l’affichage
  const internalCount = group?.members_count ?? (group?.members?.length ?? 0);
  const totalMembers = internalCount + (externalCount || 0);

  return (
    <div className="gd">
      {(msg || err) && (
        <div className={`toast ${err ? "error" : "success"}`}>{err ?? msg}</div>
      )}

      {/* Header */}
      <header className="gd-header">
        <div>
          <h1 className="gd-title">{group.name}</h1>
        </div>

        <div className="gd-actions">
          {/* 🔒 Le créateur/coach ne voit pas "Quitter" */}
          {!isMember ? (
            group.group_type === "COACH" ? (
              <button className="gd-btn" disabled title={t("gd_invitation_required_title")}>
                {t("gd_invitation_only")}
              </button>
            ) : (
              <button className="gd-btn primary" onClick={handleJoin} disabled={opLoading}>
                {group.group_type === "PRIVATE" ? t("gd_request_join") : t("gd_join")}
              </button>
            )
          ) : (
            !isGroupCoach && (
              <button className="gd-btn" onClick={handleLeave} disabled={opLoading}>
                {t("gd_leave")}
              </button>
            )
          )}
        </div>
      </header>

      {/* Meta ligne sous le header */}
      <div className="gd-meta">
        <span className={`gd-chip ${typeClass}`}>
          {typeLabel}
        </span>
        <span className="gd-meta-sub">
          {safe(group.city)} • {sportLabel} • {t("gd_members_count", { count: totalMembers })}
        </span>
      </div>

      {/* Tabs */}
      <nav className="gd-tabs">
        <button onClick={() => setTab("overview")}  className={tab==="overview"  ? "active" : ""}>{t("gd_tab_overview")}</button>
        <button onClick={() => setTab("members")}   className={tab==="members"   ? "active" : ""}>
          {t("gd_tab_members")} ({totalMembers})
        </button>
        <button onClick={() => setTab("chat")} className={tab==="chat" ? "active" : ""}>
          {t("gd_tab_chat")}
        </button>
        {isMember && (
          <button onClick={() => setTab("sessions")} className={tab==="sessions" ? "active" : ""}>
            {t("gd_tab_sessions")}
          </button>
        )}
        {isOwnerOrManager && (
          <button onClick={() => setTab("requests")}  className={tab==="requests"  ? "active" : ""}>
            {t("gd_tab_requests", { count: reqCount ?? 0, context: reqCount === 0 || reqCount == null ? "none" : "some" })}
          </button>
        )}
      </nav>

      {/* Panels */}
      {tab === "overview" && (
        <section className="gd-section gd-overview">
          <div className="gd-over-left">
            <h2>{t("gd_about")}</h2>
            <p className="gd-desc">{safe(group.description)}</p>

            <div className="gd-rules">
              <h3>{t("gd_access_rules")}</h3>
              <ul>
                <li><span className="dot" /> <strong>{t("gd_membership")}</strong> {joinPolicy}</li>
                <li><span className="dot" /> <strong>{t("gd_type")}</strong> {typeLabel}</li>
              </ul>
            </div>
          </div>

          <aside className="gd-over-right">
            <div className="gd-facts">
              <FactCard label={t("gd_fact_coach")} value={safe(group?.coach?.username || group?.coach?.email || group?.coach_name || "Coach")} />
              <FactCard label={t("gd_fact_sport")} value={safe(sportLabel)} />
              <FactCard label={t("gd_fact_city")} value={safe(group?.city)} />
              <FactCard label={t("gd_fact_members")} value={String(totalMembers)} />
              <FactCard label={t("gd_fact_created")} value={fmtDate(group?.created_at)} />
              <FactCard label={t("gd_fact_updated")} value={fmtDate(group?.updated_at)} />
            </div>
          </aside>
        </section>
      )}

      {tab === "members" && (
        <section className="gd-section">
          <AllMembers
            members={members}
            canManage={isOwnerOrManager}
            onAddInternal={handleAddMember}
            onRemoveInternal={handleRemoveMember}
            groupId={groupId}
            loader={reload}
            api={{ listExternalMembers, addExternalMember, deleteExternalMember, onCount: setExternalCount }}
          />
        </section>
      )}

      {tab === "chat" && (
        <section className="gd-section">
          <ChatPanel
            api={chatService.group(groupId)}
            canRead={isMember}
            canWrite={isMember}
            canModerate={isOwnerOrManager}
          />
        </section>
      )}

      {tab === "sessions" && isMember && (
        <section className="gd-section">
          <GroupSessionsTab
            groupId={groupId}
            canCreateTraining={canCreateTraining}
          />
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

      {(isOwnerOrManager || isAdminLike || isGroupCoach) && (
        <section className="gd-section danger-zone">
          <h2>{t("gd_danger_zone_title")}</h2>
          <p>{t("gd_danger_zone_text_prefix")} <strong>{t("gd_definitive")}</strong>. {t("gd_danger_zone_text_suffix")}</p>
          <button className="gd-btn danger" onClick={handleDeleteGroup} disabled={opLoading}>
            🗑 {t("gd_delete_group")}
          </button>
        </section>
      )}
    </div>
  );
}
