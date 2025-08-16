// src/pages/Sessions/CreateSessionPage.jsx
import { useState, useEffect, useContext, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { createSession, getSports, extractSessionId } from "../../api/sessionService";
import { getGroupsByCoach } from "../../api/groupService";
import { AuthContext } from "../../context/AuthContext";
import { QuotasContext } from "../../context/QuotasContext";
import "../../styles/CreateSession.css";
import AddressAutocomplete from "../../components/AddressAutocomplete";

/* ---------- helpers date/heure ---------- */
function pad2(n) { return n < 10 ? "0"+n : String(n); }
function todayYMD() {
  const d = new Date();
  return `${d.getFullYear()}-${pad2(d.getMonth()+1)}-${pad2(d.getDate())}`;
}
function nextHourHM() {
  const d = new Date();
  d.setHours(d.getHours() + 1);
  return `${pad2(d.getHours())}:${pad2(d.getMinutes())}`;
}
// Normalise "start_time": accepte "HH:MM" / "HH:MM:SS" → renvoie "HH:MM:SS"
function normalizeTime(input){
  const raw = decodeURIComponent(String(input || "").trim());
  const m = raw.match(/^(\d{1,2}):(\d{2})(?::(\d{2}))?$/);
  if (!m) return "";
  const hh = pad2(Number(m[1]));
  const mm = pad2(Number(m[2]));
  const ss = pad2(Number(m[3] ?? 0));
  return `${hh}:${mm}:${ss}`;
}

/* ---------- sanitation (pas d'URL-encoding) ---------- */
function sanitizeStringsDeep(obj){
  const out = {};
  for (const [k,v] of Object.entries(obj)){
    if (v == null) { out[k] = v; continue; }
    if (typeof v === "string"){
      out[k] = v.trim().replace(/\s+/g," ");
    } else {
      out[k] = v;
    }
  }
  return out;
}

export default function CreateSessionPage() {
  const { t } = useTranslation();
  const { user } = useContext(AuthContext);
  const { quotas, refresh: refreshQuotas } = useContext(QuotasContext);
  const navigate = useNavigate();

  const [sports, setSports] = useState([]);
  const [groups, setGroups] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [touched, setTouched] = useState({});

  const isCoachOrAdmin = ["coach", "admin"].includes((user?.role || "").toLowerCase());

  // préremplissage
  const [form, setForm] = useState(() => ({
    title: "",
    sport_id: "",
    description: "",
    location: "",
    latitude: null,
    longitude: null,
    date: todayYMD(),
    start_time: nextHourHM(),
    event_type: isCoachOrAdmin ? "TRAINING" : "FRIENDLY",
    visibility: isCoachOrAdmin ? "GROUP" : "PUBLIC",
    group_id: "",
    team_mode: true,
    max_players: 10,
    min_players_per_team: 2,
    max_players_per_team: 5,
  }));

  const isTraining = isCoachOrAdmin && String(form.event_type).toUpperCase() === "TRAINING";

  useEffect(() => {
    getSports().then(setSports).catch(console.error);
    if (isCoachOrAdmin) {
      getGroupsByCoach().then(setGroups).catch(console.error);
    }
  }, [isCoachOrAdmin]);

  const setField = (name, value) => setForm((f) => ({ ...f, [name]: value }));

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setField(name, type === "checkbox" ? checked : value);
  };

  const handleEventTypeChange = (e) => {
    const v = e.target.value; // TRAINING | FRIENDLY | COMPETITION
    setForm((f) => {
      if (v === "TRAINING") {
        return { ...f, event_type: v, visibility: "GROUP", team_mode: false };
      } else {
        const nextVis = f.visibility === "GROUP" ? "PUBLIC" : f.visibility;
        return { ...f, event_type: v, visibility: nextVis, group_id: "" };
      }
    });
  };

  const handleAddressSelect = (location, latitude, longitude) => {
    setForm((f) => ({ ...f, location, latitude, longitude }));
  };

  const eventDate = useMemo(() => {
    if (!form.date) return null;
    try {
      const tHM = form.start_time || "00:00";
      return new Date(`${form.date}T${tHM}`);
    } catch {
      return null;
    }
  }, [form.date, form.start_time]);

  /* ---------- quotas (sessions vs trainings) ---------- */
  const L = quotas?.limits || {};
  const U = quotas?.usage || {};
  const limitForType = isTraining
    ? (L.trainings_create_per_month ?? L.sessions_create_per_month)
    : L.sessions_create_per_month; // null = ∞
  const usedForType = isTraining
    ? (U.trainings_created ?? U.sessions_created ?? 0)
    : (U.sessions_created ?? 0);
  const canCreateThisType = limitForType == null || Number(usedForType) < Number(limitForType);
  const planAllowsTraining = !isTraining || (L.can_create_trainings !== false);
  const canCreateOverall = Boolean(planAllowsTraining && canCreateThisType);

  /* ---------- validation ---------- */
  const errors = useMemo(() => {
    const errs = {};
    if (!form.title || form.title.trim().length < 3) errs.title = t('session.create.err_min_chars');

    // sport requis uniquement si pas GROUP avec group_id
    const needsSport = !(form.visibility === "GROUP" && form.group_id);
    if (needsSport && !form.sport_id) errs.sport_id = t('session.create.choose_sport');

    if (!form.description || form.description.trim().length < 10)
      errs.description = t('session.create.err_min_desc');

    if (!form.location || !form.latitude || !form.longitude)
      errs.location = t('session.create.err_location');

    if (!form.date) errs.date = t('session.create.required');
    if (!form.start_time) errs.start_time = t('session.create.required');

    if (eventDate) {
      const now = new Date();
      if (eventDate.getTime() < now.getTime() + 5 * 60 * 1000) {
        errs.date = t('session.create.future_5min');
      }
    }

    if (!isTraining) {
      if (!form.max_players || Number(form.max_players) < 1) errs.max_players = t('session.create.ge1');

      if (form.team_mode) {
        const minT = Number(form.min_players_per_team || 0);
        const maxT = Number(form.max_players_per_team || 0);
        const cap = Number(form.max_players || 0);
        if (minT < 1) errs.min_players_per_team = t('session.create.ge1');
        if (maxT < 1) errs.max_players_per_team = t('session.create.ge1');
        if (minT > maxT) errs.max_players_per_team = t('session.create.must_be_greater_equal_min_team');
        if (2 * minT > cap) errs.max_players = t('session.create.insufficient_capacity_two_teams');
      }
    }

    if (isCoachOrAdmin && form.visibility === "GROUP" && !form.group_id) {
      errs.group_id = t('session.create.select_group_required');
    }

    if (!canCreateOverall) {
      errs._quota = isTraining
        ? t('session.create.quota_trainings_reached_or_plan')
        : t('session.create.quota_sessions_reached');
    }

    return errs;
  }, [form, eventDate, isCoachOrAdmin, isTraining, canCreateOverall, t]);

  const isValid = Object.keys(errors).filter(k => k !== "_quota").length === 0 && canCreateOverall;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setTouched({
      title: true, sport_id: true, description: true, location: true,
      date: true, start_time: true,
      max_players: true, min_players_per_team: true, max_players_per_team: true,
      group_id: true,
    });
    if (!isValid) return;

    setSubmitting(true);
    setError("");
    try {
      const base = { ...form };

      if (!isCoachOrAdmin) {
        base.event_type = "FRIENDLY";
        base.visibility = "PUBLIC";
        delete base.group_id;
      } else {
        if (String(base.event_type).toUpperCase() === "TRAINING") {
          base.visibility = "GROUP";
          base.team_mode = false;
          base.min_players_per_team = null;
          base.max_players_per_team = null;

          if (!base.group_id) {
            setError(t('session.create.training_select_group'));
            setSubmitting(false);
            return;
          }
        }
      }

      if (base.visibility === "GROUP" && base.group_id) delete base.sport_id;

      const nt = normalizeTime(base.start_time);
      if (!nt) {
        setError(t('session.create.invalid_time_hhmm'));
        setSubmitting(false);
        return;
      }
      base.start_time = nt;

      if (base.sport_id !== "" && base.sport_id != null) base.sport_id = Number(base.sport_id);
      if (base.group_id !== "" && base.group_id != null) base.group_id = Number(base.group_id);

      if (!isTraining) {
        base.max_players = Number(base.max_players ?? 0);
        base.min_players_per_team = base.team_mode ? Number(base.min_players_per_team ?? 0) : null;
        base.max_players_per_team = base.team_mode ? Number(base.max_players_per_team ?? 0) : null;
        base.team_mode = Boolean(base.team_mode);
      }

      const payload = sanitizeStringsDeep(base);

      const created = await createSession(payload);
      const createdId = extractSessionId(created);

      await refreshQuotas();

      if (createdId) {
        navigate(`/sessions/${createdId}`);
      } else {
        navigate("/dashboard");
      }
    } catch (err) {
      const message = err?.response?.data ? JSON.stringify(err.response.data) : err.message;
      setError(t('session.create.error_prefix') + message);
    } finally {
      setSubmitting(false);
    }
  };

  /* ---------- UI dérivée ---------- */
  const minTotalPlayers = form.team_mode ? Number(form.min_players_per_team || 0) * 2 : 2;
  const cap = Number(form.max_players || 0);

  const fieldClass = (name) =>
    `input ${touched[name] ? (errors[name] ? "invalid" : "valid") : ""}`;

  // Hint quotas lisible selon type
  const quotaHint = useMemo(() => {
    const label = isTraining ? t('session.create.creations_trainings') : t('session.create.creations_sessions');
    return limitForType == null
      ? `${label} : ${usedForType} / ${t('session.create.infinity')}`
      : `${label} : ${usedForType} / ${limitForType}`;
  }, [isTraining, limitForType, usedForType, t]);

  return (
    <div className="create-session-container">
      {error && <p className="error-message">{error}</p>}
      {errors._quota && (
        <p className="error-message" style={{ marginTop: 8 }}>
          {errors._quota}
        </p>
      )}

      <div className="cs-shell">
        <form onSubmit={handleSubmit} className="create-session-form" noValidate>
          {/* Section: Base */}
          <div className="cs-section">
            <div className="cs-row">
              <div className="cs-field">
                <label>{t('session.create.title_label')}</label>
                <input
                  name="title"
                  className={fieldClass("title")}
                  value={form.title}
                  onChange={handleChange}
                  onBlur={() => setTouched((t) => ({ ...t, title: true }))}
                  aria-invalid={touched.title && !!errors.title}
                  placeholder={t('session.create.title_placeholder')}
                />
                {touched.title && errors.title && <small className="field-error">{errors.title}</small>}
              </div>

              <div className="cs-field">
                <label>{t('session.create.sport_label')}</label>
                <select
                  name="sport_id"
                  className={fieldClass("sport_id")}
                  value={form.sport_id}
                  onChange={handleChange}
                  onBlur={() => setTouched((t) => ({ ...t, sport_id: true }))}
                  aria-invalid={touched.sport_id && !!errors.sport_id}
                  disabled={form.visibility === "GROUP" && !!form.group_id}
                >
                  <option value="">{t('session.create.sport_placeholder')}</option>
                  {sports.map((s) => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
                {touched.sport_id && errors.sport_id && <small className="field-error">{errors.sport_id}</small>}
              </div>
            </div>

            <div className="cs-field">
              <label>{t('session.create.description_label')}</label>
              <textarea
                name="description"
                className={fieldClass("description")}
                value={form.description}
                onChange={handleChange}
                onBlur={() => setTouched((t) => ({ ...t, description: true }))}
                aria-invalid={touched.description && !!errors.description}
                rows={4}
                placeholder={t('session.create.description_placeholder')}
              />
              {touched.description && errors.description && <small className="field-error">{errors.description}</small>}
            </div>
          </div>

          {/* Section: Lieu & Date */}
          <div className="cs-section">
            <div className="cs-field">
              <label>{t('session.create.location_label')}</label>
              <AddressAutocomplete value={form.location} onSelect={handleAddressSelect} />
              <div className="cs-hint-row">
                {form.latitude && form.longitude ? (
                  <span className="ok">✓ {t('session.create.location_ok')}</span>
                ) : (
                  <span className="warn">{t('session.create.location_select')}</span>
                )}
                {touched.location && errors.location && <small className="field-error">{errors.location}</small>}
              </div>
            </div>

            <div className="cs-row">
              <div className="cs-field">
                <label>{t('session.create.date_label')}</label>
                <input
                  type="date"
                  name="date"
                  className={fieldClass("date")}
                  value={form.date}
                  onChange={handleChange}
                  onBlur={() => setTouched((t) => ({ ...t, date: true }))}
                  aria-invalid={touched.date && !!errors.date}
                  required
                />
                {touched.date && errors.date && <small className="field-error">{errors.date}</small>}
              </div>

              <div className="cs-field">
                <label>{t('session.create.time_label')}</label>
                <input
                  type="time"
                  name="start_time"
                  className={fieldClass("start_time")}
                  value={form.start_time}
                  onChange={handleChange}
                  onBlur={() => setTouched((t) => ({ ...t, start_time: true }))}
                  aria-invalid={touched.start_time && !!errors.start_time}
                  required
                />
                {touched.start_time && errors.start_time && <small className="field-error">{errors.start_time}</small>}
              </div>
            </div>
          </div>

          {/* Section: Type de session (coach/admin) */}
          {isCoachOrAdmin && (
            <div className="cs-section">
              <div className="cs-row">
                <div className="cs-field">
                  <label>{t('session.create.type_label')}</label>
                  <select
                    name="event_type"
                    className="input"
                    value={form.event_type}
                    onChange={handleEventTypeChange}
                  >
                    <option value="TRAINING">{t('session.create.type_training')}</option>
                    <option value="FRIENDLY">{t('session.create.type_friendly')}</option>
                    <option value="COMPETITION">{t('session.create.type_competition')}</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* Section: Visibilité (coach/admin) */}
          {isCoachOrAdmin && (
            <div className="cs-section">
              <div className="cs-row">
                <div className="cs-field">
                  <label>{t('session.create.visibility_label')}</label>
                  <select
                    name="visibility"
                    className="input"
                    value={form.visibility}
                    disabled={form.event_type === "TRAINING"}
                    onChange={(e) => {
                      const v = e.target.value;
                      setForm((f) => ({
                        ...f,
                        visibility: v,
                        group_id: v === "GROUP" ? f.group_id : "",
                        sport_id: v === "GROUP" ? "" : f.sport_id,
                      }));
                    }}
                  >
                    <option value="PUBLIC">{t('session.create.visibility_public')}</option>
                    <option value="PRIVATE">{t('session.create.visibility_private')}</option>
                    <option value="GROUP">{t('session.create.visibility_group')}</option>
                  </select>
                </div>

                {form.visibility === "GROUP" && (
                  <div className="cs-field">
                    <label>{t('session.create.group_label')}</label>
                    <select
                      name="group_id"
                      className={fieldClass("group_id")}
                      value={form.group_id}
                      onChange={(e) => {
                        const val = e.target.value;
                        setForm((f) => ({ ...f, group_id: val, sport_id: "" }));
                      }}
                      onBlur={() => setTouched((t) => ({ ...t, group_id: true }))}
                      aria-invalid={touched.group_id && !!errors.group_id}
                      required
                    >
                      <option value="">{t('session.create.group_placeholder')}</option>
                      {groups.map((g) => (
                        <option key={g.id} value={g.id}>{g.name}</option>
                      ))}
                    </select>
                    {touched.group_id && errors.group_id && <small className="field-error">{errors.group_id}</small>}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Section: Équipes & Capacité */}
          <div className="cs-section">
            {isTraining ? (
              <>
                <div className="cs-row cs-row-inline">
                  <label className="switch">
                    <input
                      type="checkbox"
                      name="team_mode"
                      checked={false}
                      disabled
                      readOnly
                    />
                    <span>{t('session.create.team_mode_label')}</span>
                  </label>
                  <div className="cs-tip">
                    {t('session.create.trainings_group_members_auto')}
                  </div>
                </div>

                <div className="cs-row">
                  <div className="cs-field">
                    <label>{t('session.create.participants_label')}</label>
                    <input
                      className="input"
                      readOnly
                      value={
                        form.group_id
                          ? t('session.create.participants_auto_from_group')
                          : t('session.create.select_group')
                      }
                    />
                  </div>
                </div>
              </>
            ) : (
              <>
                <div className="cs-row cs-row-inline">
                  <label className="switch">
                    <input
                      type="checkbox"
                      name="team_mode"
                      checked={form.team_mode}
                      onChange={handleChange}
                    />
                    <span>{t('session.create.team_mode_label')}</span>
                  </label>
                  <div className="cs-tip">
                    {form.team_mode
                      ? t('session.create.team_tip_on', { minTotalPlayers, cap })
                      : t('session.create.team_tip_off', { cap })}
                  </div>
                </div>

                <div className="cs-row">
                  <div className="cs-field">
                    <label>{t('session.create.max_players_label')}</label>
                    <input
                      type="number"
                      name="max_players"
                      className={fieldClass("max_players")}
                      min="1"
                      value={form.max_players}
                      onChange={handleChange}
                      onBlur={() => setTouched((t) => ({ ...t, max_players: true }))}
                      aria-invalid={touched.max_players && !!errors.max_players}
                      required
                    />
                    {touched.max_players && errors.max_players && <small className="field-error">{errors.max_players}</small>}
                  </div>

                  <div className="cs-field">
                    <label>{t('session.create.min_players_per_team_label')}</label>
                    <input
                      type="number"
                      name="min_players_per_team"
                      className={fieldClass("min_players_per_team")}
                      min="1"
                      value={form.min_players_per_team}
                      onChange={handleChange}
                      onBlur={() => setTouched((t) => ({ ...t, min_players_per_team: true }))}
                      aria-invalid={touched.min_players_per_team && !!errors.min_players_per_team}
                      disabled={!form.team_mode}
                      required={form.team_mode}
                    />
                    {touched.min_players_per_team && errors.min_players_per_team && <small className="field-error">{errors.min_players_per_team}</small>}
                  </div>

                  <div className="cs-field">
                    <label>{t('session.create.max_players_per_team_label')}</label>
                    <input
                      type="number"
                      name="max_players_per_team"
                      className={fieldClass("max_players_per_team")}
                      min="1"
                      value={form.max_players_per_team}
                      onChange={handleChange}
                      onBlur={() => setTouched((t) => ({ ...t, max_players_per_team: true }))}
                      aria-invalid={touched.max_players_per_team && !!errors.max_players_per_team}
                      disabled={!form.team_mode}
                      required={form.team_mode}
                    />
                    {touched.max_players_per_team && errors.max_players_per_team && <small className="field-error">{errors.max_players_per_team}</small>}
                  </div>
                </div>
              </>
            )}
          </div>

          <div className="cs-actions">
            <button
              type="submit"
              className="btn-save-session"
              disabled={submitting || !isValid}
              aria-disabled={submitting || !isValid}
              title={
                canCreateOverall
                  ? undefined
                  : (isTraining ? t('session.create.title_quota_trainings') : t('session.create.title_quota_sessions'))
              }
            >
              {submitting ? t('session.create.submit_creating') : t('session.create.submit_create')}
            </button>
          </div>

          {/* Hint quotas */}
          <div className="cs-tip" style={{ marginTop: 8, opacity: .8 }}>
            {quotaHint}
          </div>
        </form>
      </div>
    </div>
  );
}
