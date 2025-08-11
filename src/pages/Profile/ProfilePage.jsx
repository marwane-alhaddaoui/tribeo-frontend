import { useContext, useMemo, useState } from 'react';
import { AuthContext } from '../../context/AuthContext';
import { updateMe } from '../../api/authService';
import '../../styles/ProfilePage.css';

const USERNAME_RX = /^[a-z0-9_]{3,20}$/;

export default function ProfilePage() {
  const { user, setUser, logout } = useContext(AuthContext);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState(null);
  const [err, setErr] = useState(null);

  const [form, setForm] = useState(() => ({
    username: user?.username || '',
    first_name: user?.first_name || '',
    last_name: user?.last_name || '',
    // email en lecture seule côté backend -> on ne l'édite pas ici
  }));

  const dirty = useMemo(() => {
    if (!user) return false;
    return (
      form.username.trim().toLowerCase() !== (user.username || '').toLowerCase() ||
      form.first_name !== (user.first_name || '') ||
      form.last_name !== (user.last_name || '')
    );
  }, [form, user]);

  if (!user) return <div className="profile-loading">Chargement...</div>;

  const onChange = (e) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
  };

  const startEdit = () => {
    setMsg(null); setErr(null);
    setForm({
      username: user.username || '',
      first_name: user.first_name || '',
      last_name: user.last_name || '',
    });
    setEditing(true);
  };

  const cancelEdit = () => {
    setMsg(null); setErr(null);
    setEditing(false);
  };

  const onSave = async (e) => {
    e?.preventDefault?.();
    setSaving(true);
    setMsg(null);
    setErr(null);

    // validations
    const u = form.username.trim().toLowerCase();
    if (!USERNAME_RX.test(u)) {
      setSaving(false);
      setErr("Username invalide (3–20, a-z 0-9 _)");
      return;
    }

    const payload = {};
    if (u !== (user.username || '').toLowerCase()) payload.username = u;
    if (form.first_name !== (user.first_name || '')) payload.first_name = form.first_name;
    if (form.last_name !== (user.last_name || '')) payload.last_name = form.last_name;

    if (!Object.keys(payload).length) {
      setSaving(false);
      setEditing(false);
      return;
    }

    try {
      const { data } = await updateMe(payload);
      setUser?.(data);
      setMsg('Profil mis à jour ✅');
      setEditing(false);
    } catch (error) {
      const api = error?.response?.data || {};
      const firstError =
        api.username?.[0] || api.first_name?.[0] || api.last_name?.[0] ||
        api.detail || "Impossible de mettre à jour le profil";
      setErr(firstError);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="profile-wrapper">
      <div className="profile-card">
        <h1 className="profile-title">Mon profil</h1>
        <p className="profile-subtitle">Informations liées à ton compte</p>

        <div className="profile-info">
          {/* Username */}
          <div className="profile-row">
            <label className="profile-label">Identifiant</label>
            {editing ? (
              <input
                className="profile-input"
                name="username"
                value={form.username}
                onChange={onChange}
                placeholder="ex: john_doe"
                autoComplete="username"
              />
            ) : (
              <span className="profile-value">@{user.username}</span>
            )}
          </div>

          {/* First name */}
          <div className="profile-row">
            <label className="profile-label">Prénom</label>
            {editing ? (
              <input
                className="profile-input"
                name="first_name"
                value={form.first_name}
                onChange={onChange}
                autoComplete="given-name"
              />
            ) : (
              <span className="profile-value">{user.first_name}</span>
            )}
          </div>

          {/* Last name */}
          <div className="profile-row">
            <label className="profile-label">Nom</label>
            {editing ? (
              <input
                className="profile-input"
                name="last_name"
                value={form.last_name}
                onChange={onChange}
                autoComplete="family-name"
              />
            ) : (
              <span className="profile-value">{user.last_name}</span>
            )}
          </div>

          {/* Email (lecture seule) */}
          <div className="profile-row">
            <label className="profile-label">Email</label>
            <span className="profile-value">{user.email}</span>
          </div>

          {/* Rôle (lecture seule) */}
          <div className="profile-row">
            <label className="profile-label">Rôle</label>
            <span className="profile-value">{user.role}</span>
          </div>

          {msg && <p className="profile-success">{msg}</p>}
          {err && <p className="profile-error">{err}</p>}
        </div>

        <div className="profile-actions">
          {editing ? (
            <>
              <button className="profile-button outline" onClick={cancelEdit} disabled={saving}>
                Annuler
              </button>
              <button
                className="profile-button"
                onClick={onSave}
                disabled={saving || !dirty}
                title={!dirty ? "Aucun changement" : ""}
              >
                {saving ? '...' : 'Sauvegarder'}
              </button>
            </>
          ) : (
            <>
              <button className="profile-button" onClick={startEdit}>
                Modifier
              </button>
              <button className="profile-button outline" onClick={logout}>
                Se déconnecter
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
