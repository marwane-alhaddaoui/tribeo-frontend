// src/components/GroupSessionsTab.jsx
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  listGroupTrainings,
  deleteGroupTraining,
  isTrainingSession,
  extractSessionId,
} from "../api/sessionService";
import TrainingForm from "./TrainingForm";
import TrainingAttendanceModal from "./TrainingAttendanceModal";

function fmt(date, time) {
  try {
    const iso = date ? `${date}${time ? "T" + time : ""}` : null;
    const d = iso ? new Date(iso) : (date ? new Date(date) : null);
    return d
      ? d.toLocaleString(undefined, {
          weekday: "short",
          day: "2-digit",
          month: "short",
          hour: "2-digit",
          minute: "2-digit",
        })
      : "—";
  } catch {
    return "—";
  }
}

export default function GroupSessionsTab({ groupId, canCreateTraining }) {
  const { t } = useTranslation();
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [creating, setCreating] = useState(false);

  const [attOpen, setAttOpen] = useState(false);
  const [attSession, setAttSession] = useState(null);

  const load = async () => {
    setLoading(true);
    setErr("");
    try {
      const data = await listGroupTrainings(groupId, { ordering: "-date,-start_time" });
      setList(Array.isArray(data) ? data : []);
    } catch {
      setErr(t("group_sessions_tab.load_error"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [groupId]); // eslint-disable-line react-hooks/exhaustive-deps

  const onDelete = async (s) => {
    if (!window.confirm(t("group_sessions_tab.delete_confirm"))) return;
    try {
      await deleteGroupTraining(groupId, s.id);
      await load();
    } catch {
      alert(t("group_sessions_tab.delete_error"));
    }
  };

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
        <h3 style={{ margin: 0 }}>{t("group_sessions_tab.title")}</h3>
        {canCreateTraining && (
          <button className="btn primary" onClick={() => setCreating(true)}>
            {t("group_sessions_tab.create_btn")}
          </button>
        )}
      </div>

      {err && <div className="toast error" style={{ marginBottom: 8 }}>{err}</div>}

      {loading ? (
        <div>{t("group_sessions_tab.loading")}</div>
      ) : list.length ? (
        <div className="gt-list">
          {list.map((s) => (
            <div key={s.id} className="gt-item">
              <div className="gt-main">
                <div className="gt-title">{s.title}</div>
                <div className="gt-sub">
                  <span>{fmt(s.date, s.start_time)}</span>
                  <span>•</span>
                  <span>{s.location || "—"}</span>
                  <span>•</span>
                  <span>{(s.participants?.length ?? 0)}/{s.max_players ?? 0}</span>
                </div>
              </div>

              <div className="gt-actions">
                {/* Détails */}
                <a
                  className="btn"
                  href={`/sessions/${s.id}`}
                  title={t("group_sessions_tab.details_title")}
                  aria-label={t("group_sessions_tab.details_aria", { title: s.title })}
                >
                  {t("group_sessions_tab.details_btn")}
                </a>

                {/* Coach: présence + suppression */}
                {canCreateTraining && isTrainingSession(s) && (
                  <>
                    <button
                      className="btn"
                      onClick={() => {
                        setAttSession(s);
                        setAttOpen(true);
                      }}
                      title={t("group_sessions_tab.attendance_title")}
                    >
                      {t("group_sessions_tab.attendance_btn")}
                    </button>
                    <button className="btn danger" onClick={() => onDelete(s)}>
                      {t("group_sessions_tab.delete_btn")}
                    </button>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div>{t("group_sessions_tab.empty")}</div>
      )}

      {creating && (
        <div className="modal-backdrop">
          <div className="modal-card" style={{ maxWidth: 720 }}>
            <TrainingForm
              groupId={groupId}
              onCreated={() => {
                setCreating(false);
                load();
              }}
              onClose={() => setCreating(false)}
            />
          </div>
        </div>
      )}

      {attOpen &&
        attSession &&
        Number.isFinite(Number(extractSessionId(attSession))) &&
        Number(extractSessionId(attSession)) > 0 && (
          <TrainingAttendanceModal
            groupId={groupId}
            sessionId={Number(extractSessionId(attSession))}
            onClose={() => {
              setAttOpen(false);
              setAttSession(null);
            }}
          />
        )}

      <style>{`
        .gt-list{display:grid;gap:10px}
        .gt-item{display:flex;align-items:center;justify-content:space-between;border:1px solid #333;border-radius:12px;padding:12px;background:#0f0f0f}
        .gt-title{font-weight:700}
        .gt-sub{opacity:.8;display:flex;gap:6px;font-size:.95rem}
        .gt-actions{display:flex;gap:8px}
        .btn{background:#222;border:1px solid #444;border-radius:8px;padding:8px 10px}
        .btn.primary{background:#2563eb;border-color:#2563eb;color:#fff}
        .btn.danger{background:#3a0d0d;border-color:#6b1111;color:#ffb4b4}
        .toast.error{color:#ffb4b4}
        .modal-backdrop{position:fixed;inset:0;background:rgba(0,0,0,.6);display:flex;align-items:center;justify-content:center;z-index:50}
        .modal-card{background:#111;border:1px solid #333;border-radius:12px;padding:16px;width:100%}
      `}</style>
    </div>
  );
}
