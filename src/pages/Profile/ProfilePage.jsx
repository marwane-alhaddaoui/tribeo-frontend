import { useContext, useEffect, useMemo, useState } from 'react';
import { AuthContext } from '../../context/AuthContext';
import { updateMe } from '../../api/authService';
import fallbackAvatar from '../../assets/avatar.png';
import '../../styles/ProfilePage.css';
import UpgradeCard from "../../components/UpgradeCard";

const USERNAME_RX = /^[a-z0-9_]{3,20}$/;

export default function ProfilePage() {
  const { user, setUser, logout } = useContext(AuthContext);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState(null);
  const [err, setErr] = useState(null);

  // Avatar
  const initialAvatar = user?.avatar_src || fallbackAvatar;
  const [avatarPreview, setAvatarPreview] = useState(initialAvatar);
  const [avatarUrlInput, setAvatarUrlInput] = useState('');

  // Form profil
  const [form, setForm] = useState(() => ({
    username: user?.username || '',
    first_name: user?.first_name || '',
    last_name: user?.last_name || '',
  }));

  const dirty = useMemo(() => {
    if (!user) return false;
    return (
      form.username.trim().toLowerCase() !== (user.username || '').toLowerCase() ||
      form.first_name !== (user.first_name || '') ||
      form.last_name !== (user.last_name || '')
    );
  }, [form, user]);

  useEffect(() => {
    setAvatarPreview(user?.avatar_src || fallbackAvatar);
  }, [user]);

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
    setAvatarPreview(user?.avatar_src || fallbackAvatar);
    setAvatarUrlInput('');
    setEditing(false);
  };

  // ---- Avatar handlers ----
  const onSelectFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setAvatarPreview(URL.createObjectURL(file));
    setMsg(null); setErr(null);
    try {
      const fd = new FormData();
      fd.append('avatar', file);
      const { data } = await updateMe(fd);
      setUser?.(data);
      setAvatarPreview(data.avatar_src || fallbackAvatar);
      setMsg('Avatar mis à jour ✅');
      setAvatarUrlInput('');
    } catch {
      setErr('Upload impossible');
      setAvatarPreview(user?.avatar_src || fallbackAvatar);
    } finally {
      e.target.value = '';
    }
  };

  const onSetAvatarUrl = async (e) => {
    e.preventDefault();
    const url = avatarUrlInput.trim();
    if (!url) return;
    setMsg(null); setErr(null);
    try {
      const { data } = await updateMe({ avatar_url: url });
      setUser?.(data);
      setAvatarPreview(data.avatar_src || fallbackAvatar);
      setMsg('Avatar URL enregistré ✅');
      setAvatarUrlInput('');
    } catch (error) {
      const api = error?.response?.data || {};
      setErr(api.avatar_url?.[0] || api.detail || 'URL invalide ou non acceptée');
    }
  };

  const onResetAvatar = async () => {
    setMsg(null); setErr(null);
    try {
      const { data } = await updateMe({ avatar: null, avatar_url: null });
      setUser?.(data);
      setAvatarPreview(data.avatar_src || fallbackAvatar);
      setMsg('Avatar réinitialisé ✅');
      setAvatarUrlInput('');
    } catch {
      setErr('Impossible de réinitialiser');
    }
  };

  // ---- Sauvegarde profil ----
  const onSave = async (e) => {
    e?.preventDefault?.();
    setSaving(true);
    setMsg(null);
    setErr(null);

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
      <div className="profile-shell">
        <header className="profile-head">
          <div>
            <h1 className="profile-title">Mon profil</h1>
            <p className="profile-subtitle">Gère ton identité et ton avatar.</p>
          </div>
          <div className="profile-head-actions">
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
                <button className="profile-button" onClick={startEdit}>Modifier</button>
                <button className="profile-button outline" onClick={logout}>Se déconnecter</button>
              </>
            )}
          </div>
        </header>

        <div className="profile-card two-col">
          {/* Col gauche : avatar */}
          <aside className="profile-avatar">
            <div className="avatar-frame">
              <img
                src={avatarPreview}
                alt="Avatar"
                className="avatar-img"
                onError={(e) => {
                  if (e.currentTarget.src !== fallbackAvatar) {
                    e.currentTarget.src = fallbackAvatar;
                  }
                }}
              />
            </div>

            {editing && (
              <div className="avatar-actions">
                <label className="avatar-upload-btn">
                  Uploader une image
                  <input
                    type="file"
                    accept="image/*"
                    onChange={onSelectFile}
                    style={{ display: 'none' }}
                  />
                </label>

                <form onSubmit={onSetAvatarUrl} className="avatar-url-form">
                  <input
                    type="url"
                    placeholder="https://exemple.com/mon-image.jpg"
                    value={avatarUrlInput}
                    onChange={(e) => setAvatarUrlInput(e.target.value)}
                  />
                  <button type="submit" className="profile-button">Utiliser URL</button>
                </form>

                <button className="profile-button ghost" onClick={onResetAvatar}>
                  Réinitialiser l’avatar
                </button>
              </div>
            )}
          </aside>

          {/* Col droite : infos */}
          <section className="profile-info">
            <div className="profile-row">
              <span className="profile-label">Identifiant</span>
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

            <div className="profile-row">
              <span className="profile-label">Prénom</span>
              {editing ? (
                <input
                  className="profile-input"
                  name="first_name"
                  value={form.first_name}
                  onChange={onChange}
                  autoComplete="given-name"
                />
              ) : (
                <span className="profile-value">{user.first_name || <em>—</em>}</span>
              )}
            </div>

            <div className="profile-row">
              <span className="profile-label">Nom</span>
              {editing ? (
                <input
                  className="profile-input"
                  name="last_name"
                  value={form.last_name}
                  onChange={onChange}
                  autoComplete="family-name"
                />
              ) : (
                <span className="profile-value">{user.last_name || <em>—</em>}</span>
              )}
            </div>

            <div className="profile-row">
              <span className="profile-label">Email</span>
              <span className="profile-value">{user.email}</span>
            </div>

            <div className="profile-row">
              <span className="profile-label">Rôle</span>
              <span className="profile-value">{user.role}</span>
            </div>

            {msg && <p className="profile-success">{msg}</p>}
            {err && <p className="profile-error">{err}</p>}

            {/* Ici, affichage de la carte d'upgrade */}
            <UpgradeCard />
          </section>
        </div>
      </div>
    </div>
  );
}
