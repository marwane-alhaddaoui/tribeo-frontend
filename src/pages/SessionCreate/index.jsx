import { useState, useEffect, useContext, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { createSession, getSports } from "../../api/sessionService";
import { getGroupsByCoach } from "../../api/groupService";
import { AuthContext } from "../../context/AuthContext";
import "../../styles/CreateSession.css";
import AddressAutocomplete from "../../components/AddressAutocomplete";

export default function CreateSessionPage() {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();

  const [sports, setSports] = useState([]);
  const [groups, setGroups] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [touched, setTouched] = useState({});

  const isCoachOrAdmin = user?.role === "coach" || user?.role === "admin";

  const [form, setForm] = useState({
    title: "",
    sport_id: "",
    description: "",
    location: "",
    latitude: null,
    longitude: null,
    date: "",
    start_time: "",
    visibility: isCoachOrAdmin ? "PUBLIC" : "PUBLIC",
    group_id: "",
    team_mode: true,
    max_players: 10,
    min_players_per_team: 2,
    max_players_per_team: 5,
  });

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

  // ---- VALIDATION ----
  const errors = useMemo(() => {
    const errs = {};
    if (!form.title || form.title.trim().length < 3) errs.title = "Min. 3 caractères";
    if (!form.sport_id) errs.sport_id = "Choisis un sport";
    if (!form.description || form.description.trim().length < 10) errs.description = "Min. 10 caractères";
    if (!form.location || !form.latitude || !form.longitude) errs.location = "Sélectionne une adresse via l’autocomplete";
    if (!form.date) errs.date = "Obligatoire";
    if (!form.start_time) errs.start_time = "Obligatoire";

    if (eventDate) {
      const now = new Date();
      if (eventDate.getTime() < now.getTime() + 5 * 60 * 1000) {
        errs.date = "La date/heure doit être dans le futur (≥ 5 min)";
      }
    }

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

    if (isCoachOrAdmin && form.visibility === "GROUP" && !form.group_id) {
      errs.group_id = "Sélectionne un groupe";
    }
    return errs;
  }, [form, eventDate, isCoachOrAdmin]);

  const isValid = Object.keys(errors).length === 0;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setTouched({
      title: true,
      sport_id: true,
      description: true,
      location: true,
      date: true,
      start_time: true,
      max_players: true,
      min_players_per_team: true,
      max_players_per_team: true,
      group_id: true,
    });
    if (!isValid) return;

    setSubmitting(true);
    setError("");
    try {
      await createSession(form);
      navigate("/dashboard");
    } catch (err) {
      const message = err?.response?.data ? JSON.stringify(err.response.data) : err.message;
      setError("Erreur: " + message);
    } finally {
      setSubmitting(false);
    }
  };

  // ---- UI dérivée ----
  const minTotalPlayers = form.team_mode ? Number(form.min_players_per_team || 0) * 2 : 2;
  const cap = Number(form.max_players || 0);
  const teamsTip = form.team_mode
    ? `Min ${minTotalPlayers} joueurs pour 2 équipes • Capacité ${cap}`
    : `Capacité ${cap} joueurs`;

  return (
    <div className="create-session-container">
      <h2 className="create-session-title">🏆 Créer une session sportive</h2>
      {error && <p className="error-message">{error}</p>}

      {/* 👇 wrapper centré */}
      <div className="cs-shell">
        <div className="create-session-layout">
          {/* COLONNE FORM */}
          <form onSubmit={handleSubmit} className="create-session-form" noValidate>
            {/* Section: Base */}
            <div className="cs-section">
              <div className="cs-row">
                <div className="cs-field">
                  <label>Titre</label>
                  <input
                    name="title"
                    value={form.title}
                    onChange={handleChange}
                    onBlur={() => setTouched((t) => ({ ...t, title: true }))}
                    aria-invalid={touched.title && !!errors.title}
                  />
                  {touched.title && errors.title && <small className="field-error">{errors.title}</small>}
                </div>

                <div className="cs-field">
                  <label>Sport</label>
                  <select
                    name="sport_id"
                    value={form.sport_id}
                    onChange={handleChange}
                    onBlur={() => setTouched((t) => ({ ...t, sport_id: true }))}
                    aria-invalid={touched.sport_id && !!errors.sport_id}
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
                  value={form.description}
                  onChange={handleChange}
                  onBlur={() => setTouched((t) => ({ ...t, description: true }))}
                  aria-invalid={touched.description && !!errors.description}
                  rows={4}
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

            {/* Section: Visibilité (coach/admin uniquement) */}
            {isCoachOrAdmin && (
              <div className="cs-section">
                <div className="cs-row">
                  <div className="cs-field">
                    <label>Visibilité</label>
                    <select
                      name="visibility"
                      value={form.visibility}
                      onChange={(e) => {
                        const v = e.target.value;
                        setForm((f) => ({
                          ...f,
                          visibility: v,
                          group_id: v === "GROUP" ? f.group_id : "",
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
                        value={form.group_id}
                        onChange={handleChange}
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
              <div className="cs-row">
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
            </div>

            <div className="cs-actions">
              <button
                type="submit"
                className="btn-save-session"
                disabled={submitting || !isValid}
                aria-disabled={submitting || !isValid}
              >
                {submitting ? "Création…" : "Créer la session"}
              </button>
            </div>
          </form>

          {/* COLONNE ASIDE */}
          <aside className="create-session-aside">
            <div className="aside-card">
              <h3>Aperçu & checklist</h3>
              <ul className="checklist">
                <li className={form.title.trim().length >= 3 ? "ok" : ""}>Titre défini</li>
                <li className={form.sport_id ? "ok" : ""}>Sport choisi</li>
                <li className={form.description.trim().length >= 10 ? "ok" : ""}>Description suffisante</li>
                <li className={form.latitude && form.longitude ? "ok" : ""}>Localisation sélectionnée</li>
                <li className={eventDate && !errors.date ? "ok" : ""}>Date & heure valides</li>
                <li className={!errors.max_players ? "ok" : ""}>Capacité cohérente</li>
                {isCoachOrAdmin && form.visibility === "GROUP" && (
                  <li className={form.group_id ? "ok" : ""}>Groupe choisi</li>
                )}
              </ul>

              {form.latitude && form.longitude && (
                <a
                  className="map-link"
                  href={`https://www.google.com/maps?q=${form.latitude},${form.longitude}`}
                  target="_blank"
                  rel="noreferrer"
                >
                  Ouvrir l’emplacement sur Google Maps ↗
                </a>
              )}
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
