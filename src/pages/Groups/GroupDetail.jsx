import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { getGroup, joinGroup, leaveGroup, addMember /*, removeMember*/ } from "../../api/groupService";
import GroupMembers from "../../components/GroupMembers";
import "../../styles/GroupDetail.css";

export default function GroupDetail() {
  const { id } = useParams();
  const [group, setGroup] = useState(null);
  const [lookupUserId, setLookupUserId] = useState(""); // TODO: vrai user picker
  const [loading, setLoading] = useState(true);

  const canManage = useMemo(() => !!group?.is_owner_or_manager, [group]);

  const load = async () => {
    setLoading(true);
    try {
      const data = await getGroup(id);
      setGroup(data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [id]);

  const onJoin = async () => setGroup(await joinGroup(id));
  const onLeave = async () => setGroup(await leaveGroup(id));

  const onAdd = async () => {
    if (!lookupUserId) return;
    const data = await addMember(id, Number(lookupUserId));
    setGroup(data);
    setLookupUserId("");
  };

  const onRemove = async (memberEmail) => {
    // À brancher quand on aura user_id depuis un UserPicker (email -> id)
    alert("Pour retirer un membre, il nous faut son user_id. Bientôt avec un UserPicker.");
  };

  if (loading) return <div className="gd-wrap"><p className="gd-loading">Chargement…</p></div>;
  if (!group) return <div className="gd-wrap"><p className="gd-loading">Introuvable</p></div>;

  return (
    <div className="gd-wrap">
      {/* Header */}
      <div className="gd-head">
        <div className="gd-titlebox">
          <h1 className="gd-title">{group.name}</h1>
          <p className="gd-sub">
            <span className="gd-label">Sport</span> <span className="gd-value">{group.sport_name ?? "—"}</span>
            {group.city ? (
              <>
                <span className="gd-sep">·</span>
                <span className="gd-label">Ville</span> <span className="gd-value">{group.city}</span>
              </>
            ) : null}
          </p>
          {group.description ? <p className="gd-desc">{group.description}</p> : null}
        </div>

        <div className="gd-actions">
          {group.is_member ? (
            <button onClick={onLeave} className="btn-ghost">Quitter</button>
          ) : (
            <button onClick={onJoin} className="btn-primary">Rejoindre</button>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="gd-grid">
        <section className="gd-card">
          <h2 className="gd-h2">Membres <span className="gd-count">({group.members?.length ?? 0})</span></h2>
          <GroupMembers emails={group.members || []} canManage={canManage} onRemove={onRemove} />
        </section>

        {canManage && (
          <section className="gd-card">
            <h3 className="gd-h3">Ajouter un membre</h3>
            <div className="gd-form">
              <label className="gd-label" htmlFor="user-id">User ID (temporaire)</label>
              <input
                id="user-id"
                value={lookupUserId}
                onChange={(e) => setLookupUserId(e.target.value)}
                placeholder="Ex: 123"
                className="gd-input"
              />
              <button onClick={onAdd} className="btn-primary">Ajouter</button>
              <p className="gd-hint">⚠️ Bientôt : auto‑complete des users par email.</p>
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
