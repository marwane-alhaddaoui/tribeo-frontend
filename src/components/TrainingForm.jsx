// src/components/TrainingForm.jsx
import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { createGroupTraining } from "../api/sessionService";
import { getGroup } from "../api/groupService";
import AddressAutocomplete from "./AddressAutocomplete";
import "../styles/CreateSession.css";

export default function TrainingForm({ groupId, onClose, onCreated }) {
  const { t } = useTranslation();

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
        setError(t("training_form.group_load_error"));
      } finally {
        setLoading(false);
      }
    })();
  }, [groupId, t]);

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
      const t0 = form.start_time || "00:00";
      return new Date(`${form.date}T${t0}`);
    } catch { return null; }
  }, [form.date, form.start_time]);

  const errors = useMemo(() => {
    const errs = {};
    if (!form.title || form.title.trim().length < 3) errs.title = t("training_form.err_title_min");
    if (!form.description || form.description.trim().length < 10) errs.description = t("training_form.err_description_min");
    if (!form.location || !form.latitude || !form.longitude) errs.location = t("training_form.err_location_select");
    if (!form.date) errs.date = t("training_form.err_required");
    if (!form.start_time) errs.start_time = t("training_form.err_required");
    if (eventDate) {
      const now = new Date();
      if (eventDate.getTime() < now.getTime() + 5 * 60 * 1000) {
        errs.date = t("training_form.err_datetime_future");
      }
    }
    if (!form.max_players || Number(form.max_players) < 1) errs.max_players = t("training_form.err_ge1");

    if (form.team_mode) {
      const minT = Number(form.min_players_per_team || 0);
      const maxT = Number(form.max_players_per_team || 0);
      const cap = Number(form.max_players || 0);
      if (minT < 1) errs.min_players_per_team = t("training_form.err_ge1");
      if (maxT < 1) errs.max_players_per_team = t("training_form.err_ge1");
      if (minT > maxT) errs.max_players_per_team = t("training_form.err_max_ge_min");
      if (2 * minT > cap) errs.max_players = t("training_form.err_cap_insufficient");
    }
    return errs;
  }, [form, eventDate, t]);

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
    } catch (e2) {
      const msg = e2?.response?.data;
      setError(typeof msg === "string" ? msg : (msg?.detail || t("training_form.create_error")));
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div>{t("training_form.loading")}</div>;

  const sportName = group?.sport_name ?? group?.sport?.name ?? "—";
  const minTotalPlayers = form.team_mode ? Number(form.min_players_per_team || 0) * 2 : 2;
  const cap = Number(form.max_players || 0);

  return (
    <div className="create-session-container">
      <h3 className="create-session-title">💪 {t("training_form.title")}</h3>
      {error && <p className="error-message">{error}</p>}

      <div className="cs-shell">
        <form onSubmit={submit} className="create-session-form" noValidate>
          <div className="cs-section">
            <div className="cs-row">
              <div className="cs-field">
                <label htmlFor="tf-title">{t("training_form.field_title")}</label>
                <input
                  id="tf-title"
                  name="title"
                  value={form.title}
                  onChange={handleChange}
                  onBlur={() => setTouched((t0) => ({ ...t0, title: true }))}
                  aria-invalid={touched.title && !!errors.title}
                />
                {touched.title && errors.title && <small className="field-error">{errors.title}</small>}
              </div>

              {/* Sport (readonly, hérité du groupe) */}
              <div className="cs-field">
                <label>{t("training_form.field_sport")}</label>
                <div className="readonly-pill">
                  {sportName} <span className="hint">• {t("training_form.inherited_from_group")}</span>
                </div>
              </div>
            </div>

            <div className="cs-field">
              <label htmlFor="tf-description">{t("training_form.field_description")}</label>
              <textarea
                id="tf-description"
                name="description"
                rows={4}
                value={form.description}
                onChange={handleChange}
                onBlur={() => setTouched((t0) => ({ ...t0, description: true }))}
                aria-invalid={touched.description && !!errors.description}
              />
              {touched.description && errors.description && <small className="field-error">{errors.description}</small>}
            </div>
          </div>

          <div className="cs-section">
            <div className="cs-field">
              <label htmlFor="tf-location">{t("training_form.field_location")}</label>
              <AddressAutocomplete value={form.location} onSelect={handleAddressSelect} />
              <div className="cs-hint-row">
                {form.latitude && form.longitude ? (
                  <span className="ok">✓ {t("training_form.loc_ok")}</span>
                ) : (
                  <span className="warn">{t("training_form.loc_hint")}</span>
                )}
                {touched.location && errors.location && <small className="field-error">{errors.location}</small>}
              </div>
            </div>

            <div className="cs-row">
              <div className="cs-field">
                <label htmlFor="tf-date">{t("training_form.field_date")}</label>
                <input
                  id="tf-date"
                  type="date"
                  name="date"
                  value={form.date}
                  onChange={handleChange}
                  onBlur={() => setTouched((t0) => ({ ...t0, date: true }))}
                  aria-invalid={touched.date && !!errors.date}
                  required
                />
                {touched.date && errors.date && <small className="field-error">{errors.date}</small>}
              </div>

              <div className="cs-field">
                <label htmlFor="tf-start">{t("training_form.field_start_time")}</label>
                <input
                  id="tf-start"
                  type="time"
                  name="start_time"
                  value={form.start_time}
                  onChange={handleChange}
                  onBlur={() => setTouched((t0) => ({ ...t0, start_time: true }))}
                  aria-invalid={touched.start_time && !!errors.start_time}
                  required
                />
                {touched.start_time && errors.start_time && <small className="field-error">{errors.start_time}</small>}
              </div>
            </div>
          </div>

          <div className="cs-section">
            <div className="cs-row">
              <label className="switch">
                <input
                  type="checkbox"
                  name="team_mode"
                  checked={form.team_mode}
                  onChange={handleChange}
                  aria-label={t("training_form.team_mode")}
                />
                <span>{t("training_form.team_mode")}</span>
              </label>
              <div className="cs-tip">
                {form.team_mode
                  ? t("training_form.tip_team", { minTotalPlayers, cap })
                  : t("training_form.tip_solo", { cap })}
              </div>
            </div>

            <div className="cs-row">
              <div className="cs-field">
                <label htmlFor="tf-max">{t("training_form.field_max_players")}</label>
                <input
                  id="tf-max"
                  type="number"
                  name="max_players"
                  min="1"
                  value={form.max_players}
                  onChange={handleChange}
                  onBlur={() => setTouched((t0) => ({ ...t0, max_players: true }))}
                  aria-invalid={touched.max_players && !!errors.max_players}
                  required
                />
                {touched.max_players && errors.max_players && <small className="field-error">{errors.max_players}</small>}
              </div>

              <div className="cs-field">
                <label htmlFor="tf-min-team">{t("training_form.field_min_per_team")}</label>
                <input
                  id="tf-min-team"
                  type="number"
                  name="min_players_per_team"
                  min="1"
                  value={form.min_players_per_team}
                  onChange={handleChange}
                  onBlur={() => setTouched((t0) => ({ ...t0, min_players_per_team: true }))}
                  aria-invalid={touched.min_players_per_team && !!errors.min_players_per_team}
                  disabled={!form.team_mode}
                  required={form.team_mode}
                />
                {touched.min_players_per_team && errors.min_players_per_team && (
                  <small className="field-error">{errors.min_players_per_team}</small>
                )}
              </div>

              <div className="cs-field">
                <label htmlFor="tf-max-team">{t("training_form.field_max_per_team")}</label>
                <input
                  id="tf-max-team"
                  type="number"
                  name="max_players_per_team"
                  min="1"
                  value={form.max_players_per_team}
                  onChange={handleChange}
                  onBlur={() => setTouched((t0) => ({ ...t0, max_players_per_team: true }))}
                  aria-invalid={touched.max_players_per_team && !!errors.max_players_per_team}
                  disabled={!form.team_mode}
                  required={form.team_mode}
                />
                {touched.max_players_per_team && errors.max_players_per_team && (
                  <small className="field-error">{errors.max_players_per_team}</small>
                )}
              </div>
            </div>
          </div>

          <div className="cs-actions">
            <button type="submit" className="btn-save-session" disabled={saving || !isValid}>
              {saving ? t("training_form.creating") : t("training_form.create_btn")}
            </button>
            <button type="button" className="btn btn-ghost" onClick={onClose} style={{ marginLeft: 8 }}>
              {t("training_form.cancel_btn")}
            </button>
          </div>

          {form.latitude && form.longitude && (
            <a
              className="map-link"
              href={`https://www.google.com/maps?q=${form.latitude},${form.longitude}`}
              target="_blank"
              rel="noreferrer"
              style={{ marginTop: 12, display: "inline-block" }}
              title={t("training_form.open_in_maps_title")}
            >
              {t("training_form.open_in_maps")}
            </a>
          )}
        </form>
      </div>
    </div>
  );
}
