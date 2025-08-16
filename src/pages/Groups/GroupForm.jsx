// src/pages/Groups/GroupForm.jsx
import { useEffect, useMemo, useRef, useState, useContext } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { createGroup } from "../../api/groupService";
import { listSports } from "../../api/sportService";
import { QuotasContext } from "../../context/QuotasContext";
import "../../styles/GroupForm.css";

export default function GroupForm() {
  const { t } = useTranslation();
  const nav = useNavigate();
  const { quotas, refresh: refreshQuotas, bumpUsage } = useContext(QuotasContext);

  // ----- quotas -----
  const L = quotas?.limits || {};
  const U = quotas?.usage || {};
  const planBlocks = L.can_create_groups === false;
  const limit = L.max_groups;                  // null = ∞
  const used = U.groups_created ?? 0;
  const quotaOK = !planBlocks && (limit == null || used < Number(limit));

  // Form fields
  const [name, setName] = useState("");
  const [city, setCity] = useState("");
  const [description, setDescription] = useState("");
  const [groupType, setGroupType] = useState("OPEN"); // OPEN | PRIVATE | COACH

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
    const nm = s.name || s.label || s.title || String(s.id);
    setSelectedSport({ id: s.id, name: nm });
    setSportQuery(nm);
    setOpen(false);
  };

  const filteredSports = useMemo(() => {
    const tquery = sportQuery.trim().toLowerCase();
    if (!tquery) return sports;
    return sports.filter(s => `${s.name || s.label || s.title || ""}`.toLowerCase().includes(tquery));
  }, [sports, sportQuery]);

  const hint = useMemo(() => {
    if (loadingSports) return t("gform_hint_searching");
    if (open && filteredSports.length === 0) return t("gform_hint_no_sport");
    return null;
  }, [loadingSports, open, filteredSports, t]);

  const onSubmit = async (e) => {
    e.preventDefault();
    setErr(null); setMsg(null);

    if (!name.trim() || !selectedSport?.id) {
      setErr(t("gform_err_required"));
      return;
    }
    if (!quotaOK) {
      setErr(planBlocks ? t("gform_err_plan_blocks") : t("gform_err_quota_month"));
      return;
    }

    setSaving(true);
    try {
      const payload = {
        name: name.trim(),
        sport: selectedSport.id,        // serializer attend "sport" (ID)
        city: city.trim() || undefined,
        description: description.trim() || undefined,
        group_type: groupType,          // OPEN | PRIVATE | COACH
      };
      const created = await createGroup(payload);
      setMsg(t("gform_created"));

      try { bumpUsage({ groups_created: +1 }); } catch {}
      await refreshQuotas();

      nav(`/groups/${created.id}`);
    } catch (e) {
      if (e?.response?.status === 403) {
        setErr(t("gform_err_forbidden"));
      } else if (e?.response?.data) {
        const d = e.response.data;
        const firstKey = Object.keys(d)[0];
        setErr(typeof d === "string" ? d : Array.isArray(d[firstKey]) ? d[firstKey][0] : t("gform_err_create"));
      } else {
        setErr(t("gform_err_create"));
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="gf-wrap">
      <h1 className="gf-title">{t("gform_title")}</h1>

      {(err || msg) && (
        <div style={{ marginBottom: 10, color: err ? "#f66" : "#6f6" }}>
          {err ?? msg}
        </div>
      )}

      <form className="gf-form" onSubmit={onSubmit}>
        {/* Nom */}
        <div>
          <div className="gf-label">{t("gform_label_name")} *</div>
          <input
            className="gf-input"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={t("gform_ph_name")}
          />
        </div>

        {/* Sport (combobox) */}
        <div className="gf-combobox" ref={boxRef}>
          <div className="gf-label">{t("gform_label_sport")} *</div>
          <input
            className="gf-input"
            value={sportQuery}
            onChange={onSportChange}
            onFocus={onSportFocus}
            onKeyDown={onSportKeyDown}
            placeholder={t("gform_ph_sport")}
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
              {t("gform_selected")} <b>{selectedSport.name}</b> <span style={{ opacity:.7 }}> ({t("gform_id")} {selectedSport.id})</span>
            </div>
          )}
        </div>

        {/* Type de groupe */}
        <div>
          <div className="gf-label">{t("gform_label_type")} *</div>
          <select
            className="gf-input"
            value={groupType}
            onChange={(e) => setGroupType(e.target.value)}
          >
            <option value="OPEN">{t("gform_type_open")}</option>
            <option value="PRIVATE">{t("gform_type_private")}</option>
            <option value="COACH">{t("gform_type_coach")}</option>
          </select>
          <div className="gf-empty" style={{ paddingTop: 6 }}>
            {groupType === "OPEN" && t("gform_hint_open")}
            {groupType === "PRIVATE" && t("gform_hint_private")}
            {groupType === "COACH" && t("gform_hint_coach")}
          </div>
        </div>

        {/* Ville */}
        <div>
          <div className="gf-label">{t("gform_label_city")}</div>
          <input
            className="gf-input"
            value={city}
            onChange={(e) => setCity(e.target.value)}
            placeholder={t("gform_ph_city")}
          />
        </div>

        {/* Description */}
        <div>
          <div className="gf-label">{t("gform_label_desc")}</div>
          <textarea
            className="gf-textarea"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder={t("gform_ph_desc")}
          />
        </div>

        {/* Actions */}
        <div className="gf-actions">
          <button
            className="btn-primary"
            type="submit"
            disabled={saving || !name.trim() || !selectedSport?.id || !quotaOK}
            title={
              quotaOK
                ? undefined
                : (planBlocks ? t("gform_title_plan_blocks") : t("gform_title_quota_month"))
            }
          >
            {saving ? t("gform_creating") : t("gform_create")}
          </button>
          <Link to="/groups" style={{ marginLeft: 8 }}>{t("gform_cancel")}</Link>
        </div>

        {/* Hint quotas */}
        <div className="gf-empty" style={{ paddingTop: 10, opacity: .8 }}>
          {limit == null
            ? t("gform_quota_unlimited", { used })
            : t("gform_quota_limited", { used, limit })}
        </div>
      </form>
    </div>
  );
}
