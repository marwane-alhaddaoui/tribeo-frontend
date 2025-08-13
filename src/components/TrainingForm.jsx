// src/components/TrainingForm.jsx
import { useEffect, useMemo, useState } from "react";
import { createGroupTraining } from "../api/sessionService";
import { getGroup } from "../api/groupService";
import AddressAutocomplete from "./AddressAutocomplete";
import "../styles/CreateSession.css";

export default function TrainingForm({ groupId, onClose, onCreated }) {
  const [group, setGroup] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [touched, setTouched] = useState({});

  const [form, setForm] = useState({
    title: "",
    description: "",
    location: "",
    latitude: null,
    longitude: null,
    date: "",
    start_time: "",
    team_mode: true,
    max_players: 10,
    min_players_per_team: 2,
    max_players_per_team: 5,
  });

  useEffect(() => {
    (async () => {
      try {
        const g = await getGroup(groupId);
        setGroup(g);
      } catch {
        setError("Impossible de charger le groupe.");
      } finally {
        setLoading(false);
      }
    })();
  }, [groupId]);

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
    } catch { return null; }
  }, [form.date, form.start_time]);

  const errors = useMemo(() => {
    const errs = {};
    if (!form.title || form.title.trim().length < 3) errs.title = "Min. 3 caractères";
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
    return errs;
  }, [form, eventDate]);

  const isValid = Object.keys(errors).length === 0;

  const submit = async (e) => {
    e?.preventDefault?.();
    setTouched({
      title: true, description: true, location: true, date: true,
      start_time: true, max_players: true, min_players_per_team: true, max_players_per_team: true,
    });
    if (!isValid) return;

    setSaving(true); setError("");
    try {
      const { latitude, longitude, ...rest } = form;
      await createGroupTraining({ ...rest, groupId });
      onCreated?.();
    } catch (e) {
      const msg = e?.response?.data;
      setError(typeof msg === "string" ? msg : (msg?.detail || "Erreur à la création"));
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div>Chargement…</div>;

  const sportName = group?.sport_name ?? group?.sport?.name ?? "—";
  const minTotalPlayers = form.team_mode ? Number(form.min_players_per_team || 0) * 2 : 2;
  const cap = Number(form.max_players || 0);

  return (
    <div className="create-session-container">
      <h3 className="create-session-title">💪 Nouvel entraînement (groupe)</h3>
      {error && <p className="error-message">{error}</p>}

      <div className="cs-shell">
        <form onSubmit={submit} className="create-session-form" noValidate>
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

              {/* Sport en lecture seule, hérité du groupe */}
              <div className="cs-field">
                <label>Sport</label>
                <div className="readonly-pill">{sportName} <span className="hint">• hérité du groupe</span></div>
              </div>
            </div>

            <div className="cs-field">
              <label>Description</label>
              <textarea
                name="description" rows={4} value={form.description}
                onChange={handleChange}
                onBlur={() => setTouched((t) => ({ ...t, description: true }))}
                aria-invalid={touched.description && !!errors.description}
              />
              {touched.description && errors.description && <small className="field-error">{errors.description}</small>}
            </div>
          </div>

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
                  type="date" name="date" value={form.date} onChange={handleChange}
                  onBlur={() => setTouched((t) => ({ ...t, date: true }))}
                  aria-invalid={touched.date && !!errors.date} required
                />
                {touched.date && errors.date && <small className="field-error">{errors.date}</small>}
              </div>

              <div className="cs-field">
                <label>Heure de début</label>
                <input
                  type="time" name="start_time" value={form.start_time} onChange={handleChange}
                  onBlur={() => setTouched((t) => ({ ...t, start_time: true }))}
                  aria-invalid={touched.start_time && !!errors.start_time} required
                />
                {touched.start_time && errors.start_time && <small className="field-error">{errors.start_time}</small>}
              </div>
            </div>
          </div>

          <div className="cs-section">
            <div className="cs-row">
              <label className="switch">
                <input type="checkbox" name="team_mode" checked={form.team_mode} onChange={handleChange} />
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
                  type="number" name="max_players" min="1" value={form.max_players} onChange={handleChange}
                  onBlur={() => setTouched((t) => ({ ...t, max_players: true }))}
                  aria-invalid={touched.max_players && !!errors.max_players} required
                />
                {touched.max_players && errors.max_players && <small className="field-error">{errors.max_players}</small>}
              </div>

              <div className="cs-field">
                <label>Min joueurs/équipe</label>
                <input
                  type="number" name="min_players_per_team" min="1" value={form.min_players_per_team} onChange={handleChange}
                  onBlur={() => setTouched((t) => ({ ...t, min_players_per_team: true }))}
                  aria-invalid={touched.min_players_per_team && !!errors.min_players_per_team}
                  disabled={!form.team_mode} required={form.team_mode}
                />
                {touched.min_players_per_team && errors.min_players_per_team && <small className="field-error">{errors.min_players_per_team}</small>}
              </div>

              <div className="cs-field">
                <label>Max joueurs/équipe</label>
                <input
                  type="number" name="max_players_per_team" min="1" value={form.max_players_per_team} onChange={handleChange}
                  onBlur={() => setTouched((t) => ({ ...t, max_players_per_team: true }))}
                  aria-invalid={touched.max_players_per_team && !!errors.max_players_per_team}
                  disabled={!form.team_mode} required={form.team_mode}
                />
                {touched.max_players_per_team && errors.max_players_per_team && <small className="field-error">{errors.max_players_per_team}</small>}
              </div>
            </div>
          </div>

          <div className="cs-actions">
            <button type="submit" className="btn-save-session" disabled={saving || !isValid}>
              {saving ? "Création…" : "Créer l’entraînement"}
            </button>
            <button type="button" className="btn btn-ghost" onClick={onClose} style={{ marginLeft: 8 }}>
              Annuler
            </button>
          </div>

          {form.latitude && form.longitude && (
            <a
              className="map-link"
              href={`https://www.google.com/maps?q=${form.latitude},${form.longitude}`}
              target="_blank" rel="noreferrer" style={{ marginTop: 12, display: "inline-block" }}
            >
              Ouvrir l’emplacement sur Google Maps ↗
            </a>
          )}
        </form>
      </div>
    </div>
  );
}
