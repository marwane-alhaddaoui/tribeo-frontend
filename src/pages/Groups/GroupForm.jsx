import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { createGroup } from "../../api/groupService";
import { listSports } from "../../api/sportService"; // <- ton service
import "../../styles/GroupForm.css";

export default function GroupForm() {
  const nav = useNavigate();

  // Form fields
  const [name, setName] = useState("");
  const [city, setCity] = useState("");
  const [description, setDescription] = useState("");
  const [groupType, setGroupType] = useState("OPEN"); // <- NEW (OPEN | PRIVATE | COACH)

  // Combobox Sport
  const [sportQuery, setSportQuery] = useState("");
  const [sports, setSports] = useState([]);
  const [open, setOpen] = useState(false);
  const [idx, setIdx] = useState(-1);
  const [loadingSports, setLoadingSports] = useState(false);
  const [selectedSport, setSelectedSport] = useState(null); // { id, name }

  const boxRef = useRef(null);
  const debounceRef = useRef(null);

  // Submit state
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState(null);
  const [msg, setMsg] = useState(null);

  useEffect(() => {
    const handler = (e) => { if (!boxRef.current?.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // Fetch sports (debounced)
  const fetchSports = async (term) => {
    setLoadingSports(true);
    try {
      const data = await listSports(term);
      setSports(Array.isArray(data) ? data : []);
      setOpen(true); setIdx(-1);
    } finally {
      setLoadingSports(false);
    }
  };

  const onSportChange = (e) => {
    const v = e.target.value;
    setSportQuery(v);
    setSelectedSport(null);
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => fetchSports(v), 250);
  };

  const onSportFocus = () => {
    if (sports.length === 0) fetchSports("");
    setOpen(true);
  };

  const onSportKeyDown = (e) => {
    if (!open || sports.length === 0) return;
    if (e.key === "ArrowDown") { e.preventDefault(); setIdx((i) => Math.min(i + 1, sports.length - 1)); }
    else if (e.key === "ArrowUp") { e.preventDefault(); setIdx((i) => Math.max(i - 1, 0)); }
    else if (e.key === "Enter") { e.preventDefault(); const s = sports[idx] || sports[0]; if (s) selectSport(s); }
    else if (e.key === "Escape") setOpen(false);
  };

  const selectSport = (s) => {
    setSelectedSport({ id: s.id, name: s.name || s.label || s.title || String(s.id) });
    setSportQuery(s.name || s.label || s.title || String(s.id));
    setOpen(false);
  };

  const filteredSports = useMemo(() => {
    const t = sportQuery.trim().toLowerCase();
    if (!t) return sports;
    return sports.filter(s => `${s.name || s.label || s.title || ""}`.toLowerCase().includes(t));
  }, [sports, sportQuery]);

  const hint = useMemo(() => {
    if (loadingSports) return "Recherche…";
    if (open && filteredSports.length === 0) return "Aucun sport";
    return null;
  }, [loadingSports, open, filteredSports]);

  const onSubmit = async (e) => {
    e.preventDefault();
    setErr(null); setMsg(null);

    if (!name.trim() || !selectedSport?.id) {
      setErr("Nom et sport sont obligatoires.");
      return;
    }

    setSaving(true);
    try {
      const payload = {
        name: name.trim(),
        sport: selectedSport.id,        // le serializer attend "sport" (ID)
        city: city.trim() || undefined,
        description: description.trim() || undefined,
        group_type: groupType,          // <- NEW : OPEN | PRIVATE | COACH
      };
      const created = await createGroup(payload);
      setMsg("Groupe créé.");
      nav(`/groups/${created.id}`);
    } catch (e) {
      if (e?.response?.status === 403) {
        setErr("Tu dois être coach (ou admin) pour créer un groupe.");
      } else if (e?.response?.data) {
        const d = e.response.data;
        const firstKey = Object.keys(d)[0];
        setErr(typeof d === "string" ? d : Array.isArray(d[firstKey]) ? d[firstKey][0] : "Création impossible.");
      } else {
        setErr("Création impossible.");
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="gf-wrap">
      <h1 className="gf-title">Créer un groupe</h1>

      {(err || msg) && (
        <div style={{ marginBottom: 10, color: err ? "#f66" : "#6f6" }}>
          {err ?? msg}
        </div>
      )}

      <form className="gf-form" onSubmit={onSubmit}>
        {/* Nom */}
        <div>
          <div className="gf-label">Nom *</div>
          <input
            className="gf-input"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Nom du groupe"
          />
        </div>

        {/* Sport (combobox) */}
        <div className="gf-combobox" ref={boxRef}>
          <div className="gf-label">Sport *</div>
          <input
            className="gf-input"
            value={sportQuery}
            onChange={onSportChange}
            onFocus={onSportFocus}
            onKeyDown={onSportKeyDown}
            placeholder="Tape pour rechercher un sport"
            autoComplete="off"
          />
          {open && (filteredSports.length > 0 || hint) && (
            <div className="gf-list">
              {filteredSports.map((s, i) => (
                <button
                  type="button"
                  key={s.id}
                  className={`gf-item ${i === idx ? "is-active" : ""}`}
                  onMouseDown={() => selectSport(s)}
                >
                  {(s.name || s.label || s.title)} <span style={{ opacity:.6, marginLeft:8 }}>#{s.id}</span>
                </button>
              ))}
              {hint && <div className="gf-empty">{hint}</div>}
            </div>
          )}
          {selectedSport && (
            <div className="gf-empty" style={{ paddingTop: 6 }}>
              Sélectionné : <b>{selectedSport.name}</b> <span style={{ opacity:.7 }}> (id {selectedSport.id})</span>
            </div>
          )}
        </div>

        {/* Type de groupe */}
        <div>
          <div className="gf-label">Type de groupe *</div>
          <select
            className="gf-input"
            value={groupType}
            onChange={(e) => setGroupType(e.target.value)}
          >
            <option value="OPEN">Ouvert (adhésion directe)</option>
            <option value="PRIVATE">Privé (demande/validation)</option>
            <option value="COACH">Coach (invitation uniquement)</option>
          </select>
          <div className="gf-empty" style={{ paddingTop: 6 }}>
            {groupType === "OPEN" && "N'importe qui peut rejoindre directement."}
            {groupType === "PRIVATE" && "Les utilisateurs envoient une demande, que tu acceptes ou refuses."}
            {groupType === "COACH" && "Sur invitation seulement (bouton \"Rejoindre\" désactivé)."}
          </div>
        </div>

        {/* Ville */}
        <div>
          <div className="gf-label">Ville</div>
          <input
            className="gf-input"
            value={city}
            onChange={(e) => setCity(e.target.value)}
            placeholder="ex: Bruxelles"
          />
        </div>

        {/* Description */}
        <div>
          <div className="gf-label">Description</div>
          <textarea
            className="gf-textarea"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Infos utiles, règles du groupe, etc."
          />
        </div>

        {/* Actions */}
        <div className="gf-actions">
          <button className="btn-primary" type="submit" disabled={saving || !name.trim() || !selectedSport?.id}>
            {saving ? "Création…" : "Créer"}
          </button>
          <Link to="/groups" style={{ marginLeft: 8 }}>Annuler</Link>
        </div>
      </form>
    </div>
  );
}
