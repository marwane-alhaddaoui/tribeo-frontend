import { useEffect, useState } from "react";

export default function GroupJoinRequests({
  groupId,
  loader,
  api: { listJoinRequests, approveJoinReq, rejectJoinReq },
  onCount, // (n:number) => void
}) {
  const [loading, setLoading] = useState(true);
  const [op, setOp] = useState(false);
  const [err, setErr] = useState(null);
  const [reqs, setReqs] = useState([]);

  const load = async () => {
    try {
      setLoading(true);
      setErr(null);
      const data = await listJoinRequests(groupId);
      const arr = Array.isArray(data) ? data : [];
      setReqs(arr);
      onCount?.(arr.length);
    } catch (e) {
      console.error(e);
      setErr("Impossible de charger les demandes.");
      onCount?.(0);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [groupId]);

  const handle = async (rid, action) => {
    try {
      setOp(true);
      if (action === "approve") await approveJoinReq(groupId, rid);
      else await rejectJoinReq(groupId, rid);
      await load();
      await loader?.();
    } catch (e) {
      console.error(e);
      alert("Échec de l’action.");
    } finally {
      setOp(false);
    }
  };

  if (loading) return <div>Chargement…</div>;
  if (err) return <div className="gjr-empty">{err}</div>;
  if (!reqs.length) return <div className="gjr-empty">Aucune demande.</div>;

  return (
    <div className="gjr-wrap">
      <ul className="gjr-list">
        {reqs.map((r) => {
          const user = r?.user || {};
          const name = user.username || user.email || `#${user.id || r.id}`;
          const subtitle = user.email && user.username ? user.email : (user.email || "");
          return (
            <li className="gjr-item" key={r.id || name}>
              <div>
                <div className="gjr-name">{name}</div>
                {subtitle ? <div className="gjr-meta">{subtitle}</div> : null}
              </div>
              <div className="gjr-actions">
                <button className="gjr-btn" disabled={op} onClick={() => handle(r.id, "reject")}>
                  Refuser
                </button>
                <button className="gjr-btn primary" disabled={op} onClick={() => handle(r.id, "approve")}>
                  Accepter
                </button>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
