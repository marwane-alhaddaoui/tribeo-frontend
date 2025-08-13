// src/components/GroupTrainingList.jsx
import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  listGroupTrainings,
  deleteGroupTraining,
  isTrainingSession,
  extractSessionId,
} from "../api/sessionService";
import TrainingAttendanceModal from "./TrainingAttendanceModal";

export default function GroupTrainingList({ groupId, canManage }) {
  const nav = useNavigate();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState(null);

  const [att, setAtt] = useState({ open: false, sessionId: null });

  const load = async () => {
    setLoading(true);
    setErr(null);
    try {
      const data = await listGroupTrainings(groupId, {
        ordering: "-date,-start_time",
      });
      setRows(Array.isArray(data) ? data : []);
    } catch {
      setErr("Impossible de charger les entraînements.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [groupId]);

  const handleDelete = async (sid) => {
    if (!window.confirm("Supprimer cet entraînement ?")) return;
    try {
      await deleteGroupTraining(groupId, sid);
      await load();
    } catch {
      alert("Suppression impossible.");
    }
  };

  const openAttendance = useCallback((sidRaw) => {
    const sid = Number(sidRaw);
    if (!Number.isFinite(sid) || sid <= 0) {
      console.warn("openAttendance: invalid session id", sidRaw);
      return;
    }
    setAtt({ open: true, sessionId: sid });
  }, []);

  const closeAttendance = useCallback(() => {
    setAtt({ open: false, sessionId: null });
  }, []);

  if (loading) return <div>Chargement…</div>;
  if (err) return <div style={{ color: "tomato" }}>{err}</div>;
  if (!rows.length) return <div>Aucun entraînement pour le moment.</div>;

  return (
    <div className="gtl">
      <ul className="gtl-list">
        {rows.map((s, i) => {
          const sid = extractSessionId(s);
          const sidValid = Number.isFinite(Number(sid)) && Number(sid) > 0;
          return (
            <li key={sid ?? `s-${i}`} className="gtl-item" data-session-id={sid ?? ""}>
              <div className="gtl-main">
                <div className="gtl-title">
                  <strong>{s.title || "—"}</strong>
                  {isTrainingSession(s) && <span className="gtl-chip">Training</span>}
                  {sidValid && <span className="gtl-id"># {Number(sid)}</span>}
                </div>
                <div className="gtl-sub">
                  <span>{s.date ?? "—"} {s.start_time ?? ""}</span>
                  <span>• {s.location ?? "—"}</span>
                  {typeof s.max_players === "number" && s.max_players > 0 && (
                    <span>• {(s.participants?.length ?? 0)}/{s.max_players}</span>
                  )}
                </div>
              </div>

              <div className="gtl-actions">
                <button
                  className="gd-btn"
                  onClick={() => sidValid && nav(`/sessions/${Number(sid)}`)}
                  disabled={!sidValid}
                  title={!sidValid ? "ID de session manquant" : "Ouvrir les détails"}
                >
                  Détails
                </button>

                {canManage && (
                  <>
                    <button
                      className="gd-btn"
                      onClick={() => sidValid && openAttendance(Number(sid))}
                      disabled={!sidValid}
                      title={!sidValid ? "ID de session manquant" : "Feuille de présence"}
                    >
                      Feuille de présence
                    </button>
                    <button
                      className="gd-btn danger"
                      onClick={() => sidValid && handleDelete(Number(sid))}
                      disabled={!sidValid}
                    >
                      Supprimer
                    </button>
                  </>
                )}
              </div>
            </li>
          );
        })}
      </ul>

      {att.open && Number.isFinite(att.sessionId) && att.sessionId > 0 && (
        <TrainingAttendanceModal
          groupId={groupId}
          sessionId={att.sessionId}
          onClose={closeAttendance}
        />
      )}
    </div>
  );
}
