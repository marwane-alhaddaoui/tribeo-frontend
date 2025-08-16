// src/components/GroupJoinRequests.jsx
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

export default function GroupJoinRequests({
  groupId,
  loader,
  api: { listJoinRequests, approveJoinReq, rejectJoinReq },
  onCount, // (n:number) => void
}) {
  const { t } = useTranslation();
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
      setErr(t("group_join_requests.load_error"));
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
      alert(t("group_join_requests.action_error"));
    } finally {
      setOp(false);
    }
  };

  if (loading) return <div>{t("group_join_requests.loading")}</div>;
  if (err) return <div className="gjr-empty">{err}</div>;
  if (!reqs.length) return <div className="gjr-empty">{t("group_join_requests.empty")}</div>;

  return (
    <div className="gjr-wrap">
      <ul className="gjr-list">
        {reqs.map((r) => {
          const user = r?.user || {};
          const name = user.username || user.email || `#${user.id || r.id}`;
          const subtitle =
            user.email && user.username ? user.email : (user.email || "");
          return (
            <li className="gjr-item" key={r.id || name}>
              <div>
                <div className="gjr-name">{name}</div>
                {subtitle ? <div className="gjr-meta">{subtitle}</div> : null}
              </div>
              <div className="gjr-actions">
                <button
                  className="gjr-btn"
                  disabled={op}
                  onClick={() => handle(r.id, "reject")}
                  aria-label={t("group_join_requests.reject_aria", { name })}
                  title={t("group_join_requests.reject_title")}
                >
                  {t("group_join_requests.reject_btn")}
                </button>
                <button
                  className="gjr-btn primary"
                  disabled={op}
                  onClick={() => handle(r.id, "approve")}
                  aria-label={t("group_join_requests.approve_aria", { name })}
                  title={t("group_join_requests.approve_title")}
                >
                  {t("group_join_requests.approve_btn")}
                </button>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
