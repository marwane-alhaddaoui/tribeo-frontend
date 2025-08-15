import { useState, useEffect, useContext, useMemo } from "react";
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
        // TRAINING => on force GROUP + on désactive le team mode côté UI
        return { ...f, event_type: v, visibility: "GROUP", team_mode: false };
      } else {
        // On sort du mode GROUP par défaut, et on vide group_id
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
      const t = form.start_time || "00:00";
      return new Date(`${form.date}T${t}`);
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
  // Flag plan (si exposé)
  const planAllowsTraining = !isTraining || (L.can_create_trainings !== false);
  const canCreateOverall = Boolean(planAllowsTraining && canCreateThisType);

  /* ---------- validation ---------- */
  const errors = useMemo(() => {
    const errs = {};
    if (!form.title || form.title.trim().length < 3) errs.title = "Min. 3 caractères";

    // sport requis uniquement si pas GROUP avec group_id
    const needsSport = !(form.visibility === "GROUP" && form.group_id);
    if (needsSport && !form.sport_id) errs.sport_id = "Choisis un sport";

    if (!form.description || form.description.trim().length < 10)
      errs.description = "Min. 10 caractères";

    if (!form.location || !form.latitude || !form.longitude)
      errs.location = "Sélectionne une adresse via l’autocomplete";

    if (!form.date) errs.date = "Obligatoire";
    if (!form.start_time) errs.start_time = "Obligatoire";

    if (eventDate) {
      const now = new Date();
      if (eventDate.getTime() < now.getTime() + 5 * 60 * 1000) {
        errs.date = "La date/heure doit être dans le futur (≥ 5 min)";
      }
    }

    // Équipes/Capacité : si TRAINING → on désactive la validation des équipes
    if (!isTraining) {
      if (!form.max_players || Number(form.max_players) < 1) errs.max_players = "≥ 1";

      if (form.team_mode) {
        const minT = Number(form.min_players_per_team || 0);
        const maxT = Number(form.max_players_per_team || 0);
        const cap = Number(form.max_players || 0);
        if (minT < 1) errs.min_players_per_team = "≥ 1";
        if (maxT < 1) errs.max_players_per_team = "≥ 1";
        if (minT > maxT) errs.max_players_per_team = "Doit être ≥ min/équipe";
        if (2 * minT > cap) errs.max_players = "Capacité insuffisante pour 2 équipes (min/équipe)";
      }
    }

    if (isCoachOrAdmin && form.visibility === "GROUP" && !form.group_id) {
      errs.group_id = "Sélectionne un groupe";
    }

    // Blocage quotas (message gentil)
    if (!canCreateOverall) {
      errs._quota = isTraining
        ? "Quota d’entraînements atteint ou plan non autorisé."
        : "Quota de créations de sessions atteint pour ce mois.";
    }

    return errs;
  }, [form, eventDate, isCoachOrAdmin, isTraining, canCreateOverall]);

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
      // base
      const base = { ...form };

      // Règles rôle/type (le back revérifie aussi)
      if (!isCoachOrAdmin) {
        base.event_type = "FRIENDLY";
        base.visibility = "PUBLIC";
        delete base.group_id;
      } else {
        if (String(base.event_type).toUpperCase() === "TRAINING") {
          base.visibility = "GROUP";
          base.team_mode = false; // pas d’équipes pour un training
          // on évite d'envoyer ces champs
          base.min_players_per_team = null;
          base.max_players_per_team = null;

          if (!base.group_id) {
            setError("Pour un entraînement, sélectionne un groupe.");
            setSubmitting(false);
            return;
          }
        }
      }

      // héritage sport via GROUP
      if (base.visibility === "GROUP" && base.group_id) delete base.sport_id;

      // normalisation heure + garde-fou
      const nt = normalizeTime(base.start_time);
      if (!nt) {
        setError("Heure de début invalide. Utilise HH:MM (ex: 14:30).");
        setSubmitting(false);
        return;
      }
      base.start_time = nt;

      // casts FK si présents
      if (base.sport_id !== "" && base.sport_id != null) base.sport_id = Number(base.sport_id);
      if (base.group_id !== "" && base.group_id != null) base.group_id = Number(base.group_id);

      // cast num/booleans (si non-training)
      if (!isTraining) {
        base.max_players = Number(base.max_players ?? 0);
        base.min_players_per_team = base.team_mode ? Number(base.min_players_per_team ?? 0) : null;
        base.max_players_per_team = base.team_mode ? Number(base.max_players_per_team ?? 0) : null;
        base.team_mode = Boolean(base.team_mode);
      }

      const payload = sanitizeStringsDeep(base);

      const created = await createSession(payload);
      const createdId = extractSessionId(created);

      // 🔄 refresh quotas (usage.*_created++)
      await refreshQuotas();

      if (createdId) {
        navigate(`/sessions/${createdId}`);
      } else {
        navigate("/dashboard");
      }
    } catch (err) {
      const message = err?.response?.data ? JSON.stringify(err.response.data) : err.message;
      setError("Erreur: " + message);
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
    const label = isTraining ? "Créations d’entraînements" : "Créations de sessions";
    return limitForType == null
      ? `${label} : ${usedForType} / ∞`
      : `${label} : ${usedForType} / ${limitForType}`;
  }, [isTraining, limitForType, usedForType]);

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
                <label>Titre</label>
                <input
                  name="title"
                  className={fieldClass("title")}
                  value={form.title}
                  onChange={handleChange}
                  onBlur={() => setTouched((t) => ({ ...t, title: true }))}
                  aria-invalid={touched.title && !!errors.title}
                  placeholder="Ex. Foot du dimanche matin"
                />
                {touched.title && errors.title && <small className="field-error">{errors.title}</small>}
              </div>

              <div className="cs-field">
                <label>Sport</label>
                <select
                  name="sport_id"
                  className={fieldClass("sport_id")}
                  value={form.sport_id}
                  onChange={handleChange}
                  onBlur={() => setTouched((t) => ({ ...t, sport_id: true }))}
                  aria-invalid={touched.sport_id && !!errors.sport_id}
                  disabled={form.visibility === "GROUP" && !!form.group_id}
                >
                  <option value="">Sélectionner un sport</option>
                  {sports.map((s) => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
                {touched.sport_id && errors.sport_id && <small className="field-error">{errors.sport_id}</small>}
              </div>
            </div>

            <div className="cs-field">
              <label>Description</label>
              <textarea
                name="description"
                className={fieldClass("description")}
                value={form.description}
                onChange={handleChange}
                onBlur={() => setTouched((t) => ({ ...t, description: true }))}
                aria-invalid={touched.description && !!errors.description}
                rows={4}
                placeholder="Détails, niveau, matériel, règles..."
              />
              {touched.description && errors.description && <small className="field-error">{errors.description}</small>}
            </div>
          </div>

          {/* Section: Lieu & Date */}
          <div className="cs-section">
            <div className="cs-field">
              <label>Lieu</label>
              <AddressAutocomplete value={form.location} onSelect={handleAddressSelect} />
              <div className="cs-hint-row">
                {form.latitude && form.longitude ? (
                  <span className="ok">✓ localisation OK</span>
                ) : (
                  <span className="warn">Sélectionne une adresse dans la liste</span>
                )}
                {touched.location && errors.location && <small className="field-error">{errors.location}</small>}
              </div>
            </div>

            <div className="cs-row">
              <div className="cs-field">
                <label>Date</label>
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
                <label>Heure de début</label>
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
                  <label>Type de session</label>
                  <select
                    name="event_type"
                    className="input"
                    value={form.event_type}
                    onChange={handleEventTypeChange}
                  >
                    <option value="TRAINING">Entraînement</option>
                    <option value="FRIENDLY">Match amical</option>
                    <option value="COMPETITION">Compétition</option>
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
                  <label>Visibilité</label>
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
                        sport_id: v === "GROUP" ? "" : f.sport_id, // sport hérité quand GROUP
                      }));
                    }}
                  >
                    <option value="PUBLIC">Publique</option>
                    <option value="PRIVATE">Privée</option>
                    <option value="GROUP">Groupe</option>
                  </select>
                </div>

                {form.visibility === "GROUP" && (
                  <div className="cs-field">
                    <label>Groupe</label>
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
                      <option value="">Sélectionner un groupe</option>
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
            {/* Quand TRAINING, on désactive le team mode et la capacité manuelle */}
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
                    <span>Mode équipe</span>
                  </label>
                  <div className="cs-tip">
                    En entraînement de groupe, les membres du groupe sont ajoutés automatiquement.
                  </div>
                </div>

                <div className="cs-row">
                  <div className="cs-field">
                    <label>Participants</label>
                    <input
                      className="input"
                      readOnly
                      value={
                        form.group_id
                          ? "Les membres du groupe seront ajoutés automatiquement"
                          : "Sélectionne un groupe"
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
                    <span>Mode équipe</span>
                  </label>
                  <div className="cs-tip">
                    {form.team_mode
                      ? `Min ${minTotalPlayers} joueurs pour 2 équipes • Capacité ${cap}`
                      : `Capacité ${cap} joueurs`}
                  </div>
                </div>

                <div className="cs-row">
                  <div className="cs-field">
                    <label>Max joueurs</label>
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
                    <label>Min joueurs/équipe</label>
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
                    <label>Max joueurs/équipe</label>
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
                  : (isTraining ? "Quota entraînements atteint / plan non autorisé" : "Quota de créations de sessions atteint")
              }
            >
              {submitting ? "Création…" : "Créer la session"}
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
