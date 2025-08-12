// src/components/ExternalMembers.jsx
import { useEffect, useMemo, useState } from "react";
import "../styles/ExternalMembers.css";

export default function ExternalMembers({
  groupId,
  loader, // () => Promise<void>
  api: { listExternalMembers, addExternalMember, deleteExternalMember },
}) {
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [op, setOp] = useState(false);
  const [err, setErr] = useState(null);

  const [form, setForm] = useState({ first_name: "", last_name: "", note: "" });
  const [q, setQ] = useState("");

  const load = async () => {
    try {
      setLoading(true);
      setErr(null);
      const data = await listExternalMembers(groupId);
      setList(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error(e);
      setErr("Impossible de charger les membres externes.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); /* eslint-disable-next-line */ }, [groupId]);

  const onChange = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
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
      alert("Échec de l’ajout du membre externe.");
    } finally {
      setOp(false);
    }
  };

  const remove = async (id) => {
    if (!window.confirm("Supprimer ce membre externe ?")) return;
    try {
      setOp(true);
      await deleteExternalMember(id);
      await load();
      await loader?.();
    } catch (e) {
      console.error(e);
      alert("Échec de la suppression.");
    } finally {
      setOp(false);
    }
  };

  const filtered = useMemo(() => {
    const t = q.trim().toLowerCase();
    if (!t) return list;
    return list.filter(m =>
      `${m.first_name} ${m.last_name}`.toLowerCase().includes(t) ||
      (m.note || "").toLowerCase().includes(t)
    );
  }, [list, q]);

  if (loading) return <div className="em-wrap">Chargement…</div>;
  if (err) return <div className="em-wrap error">{err}</div>;

  return (
    <div className="em-wrap">
      <form className="em-form" onSubmit={submit}>
        <input name="first_name" placeholder="Prénom" value={form.first_name} onChange={onChange} />
        <input name="last_name" placeholder="Nom" value={form.last_name} onChange={onChange} />
        <input name="note" placeholder="Note (optionnel)" value={form.note} onChange={onChange} />
        <button disabled={op || !form.first_name.trim() || !form.last_name.trim()} className="em-btn primary">
          Ajouter
        </button>
      </form>

      <div className="em-tools">
        <input
          className="em-filter"
          placeholder="Filtrer un membre externe (nom / note)"
          value={q}
          onChange={(e)=>setQ(e.target.value)}
        />
      </div>

      {filtered.length === 0 ? (
        <div className="em-empty">Aucun membre externe.</div>
      ) : (
        <ul className="em-list">
          {filtered.map((m) => (
            <li key={m.id} className="em-item">
              <div className="em-name">{m.first_name} {m.last_name}</div>
              {m.note && <div className="em-note">{m.note}</div>}
              <button className="em-btn" disabled={op} onClick={() => remove(m.id)}>Supprimer</button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
