// src/components/ExternalMembers.jsx
import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import "../styles/ExternalMembers.css";

export default function ExternalMembers({
  groupId,
  loader, // () => Promise<void>
  api: { listExternalMembers, addExternalMember, deleteExternalMember, onCount },
}) {
  const { t } = useTranslation();
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [op, setOp] = useState(false);
  const [err, setErr] = useState(null);

  const [form, setForm] = useState({ first_name: "", last_name: "", note: "" });
  const [q, setQ] = useState("");

  // 👉 Seuls les props fournis côté parent débloquent la gestion
  const canManage =
    typeof addExternalMember === "function" &&
    typeof deleteExternalMember === "function";

  const load = async () => {
    try {
      setLoading(true);
      setErr(null);
      const data = await listExternalMembers(groupId);
      const arr = Array.isArray(data) ? data : [];
      setList(arr);
      if (typeof onCount === "function") onCount(arr.length);
    } catch (e) {
      console.error(e);
      setErr(t("external_members.load_error"));
      if (typeof onCount === "function") onCount(0);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [groupId]);

  const onChange = (e) =>
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    if (!canManage) return; // sécurité
    const { first_name, last_name } = form;
    if (!first_name.trim() || !last_name.trim()) return;
    try {
      setOp(true);
      await addExternalMember(groupId, form);
      setForm({ first_name: "", last_name: "", note: "" });
      await load();
      await loader?.();
    } catch (e) {
      console.error(e);
      alert(t("external_members.add_error"));
    } finally {
      setOp(false);
    }
  };

  const remove = async (id) => {
    if (!canManage) return; // sécurité
    if (!window.confirm(t("external_members.delete_confirm"))) return;
    try {
      setOp(true);
      await deleteExternalMember(id);
      await load();
      await loader?.();
    } catch (e) {
      console.error(e);
      alert(t("external_members.delete_error"));
    } finally {
      setOp(false);
    }
  };

  const filtered = useMemo(() => {
    const tq = q.trim().toLowerCase();
    if (!tq) return list;
    return list.filter(
      (m) =>
        `${m.first_name} ${m.last_name}`.toLowerCase().includes(tq) ||
        (m.note || "").toLowerCase().includes(tq)
    );
  }, [list, q]);

  if (loading) return <div className="em-wrap">{t("external_members.loading")}</div>;
  if (err) return <div className="em-wrap error">{err}</div>;

  return (
    <div className="em-wrap">
      {/* 🔒 Le formulaire n’apparaît que si le parent a donné les handlers */}
      {canManage && (
        <form className="em-form" onSubmit={submit}>
          <input
            name="first_name"
            placeholder={t("external_members.first_name_ph")}
            value={form.first_name}
            onChange={onChange}
            aria-label={t("external_members.first_name_ph")}
          />
          <input
            name="last_name"
            placeholder={t("external_members.last_name_ph")}
            value={form.last_name}
            onChange={onChange}
            aria-label={t("external_members.last_name_ph")}
          />
          <input
            name="note"
            placeholder={t("external_members.note_ph")}
            value={form.note}
            onChange={onChange}
            aria-label={t("external_members.note_ph")}
          />
          <button
            disabled={op || !form.first_name.trim() || !form.last_name.trim()}
            className="em-btn primary"
          >
            {t("external_members.add_btn")}
          </button>
        </form>
      )}

      <div className="em-tools">
        <input
          className="em-filter"
          placeholder={t("external_members.filter_ph")}
          value={q}
          onChange={(e) => setQ(e.target.value)}
          aria-label={t("external_members.filter_ph")}
        />
      </div>

      {filtered.length === 0 ? (
        <div className="em-empty">{t("external_members.empty")}</div>
      ) : (
        <ul className="em-list">
          {filtered.map((m) => (
            <li key={m.id} className="em-item">
              <div className="em-name">
                {m.first_name} {m.last_name}
              </div>
              {m.note && <div className="em-note">{m.note}</div>}

              {/* 🔒 Le bouton “Supprimer” n’apparaît que pour les gestionnaires */}
              {canManage && (
                <button className="em-btn" disabled={op} onClick={() => remove(m.id)}>
                  {t("external_members.delete_btn")}
                </button>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
