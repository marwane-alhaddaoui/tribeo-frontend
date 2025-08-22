import { useContext, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { AuthContext } from '../../context/AuthContext';
import { updateMe, deleteMe } from '../../api/authService';
import fallbackAvatar from '../../assets/avatar.png';
import '../../styles/ProfilePage.css';
import UpgradeCard from "../../components/UpgradeCard";

const USERNAME_RX = /^[a-z0-9_]{3,20}$/;

export default function ProfilePage() {
  const { t } = useTranslation();
  const { user, setUser, logout } = useContext(AuthContext);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState(null);
  const [err, setErr] = useState(null);

  // Danger zone / delete account
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [confirmText, setConfirmText] = useState('');
  const [deleting, setDeleting] = useState(false);
  const canConfirmDelete = confirmText.trim().toUpperCase() === 'DELETE';

  const openDelete = () => { setConfirmText(''); setShowDeleteModal(true); };
  const closeDelete = () => { if (!deleting) setShowDeleteModal(false); };
  const onDeleteAccount = async () => {
    if (!canConfirmDelete) return;
    setDeleting(true);
    try {
      await deleteMe();
      await logout?.();
    } catch (e) {
      // Optionnel: setErr(t('profile.delete_failed')) si tu ajoutes la clé i18n
    } finally {
      setDeleting(false);
      setShowDeleteModal(false);
    }
  };

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

  if (!user) return <div className="profile-loading">{t('profile.loading')}</div>;

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
      setMsg(t('profile.avatar_updated'));
      setAvatarUrlInput('');
    } catch {
      setErr(t('profile.upload_failed'));
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
      setMsg(t('profile.avatar_url_saved'));
      setAvatarUrlInput('');
    } catch (error) {
      const api = error?.response?.data || {};
      setErr(api.avatar_url?.[0] || api.detail || t('profile.invalid_or_rejected_url'));
    }
  };

  const onResetAvatar = async () => {
    setMsg(null); setErr(null);
    try {
      const { data } = await updateMe({ avatar: null, avatar_url: null });
      setUser?.(data);
      setAvatarPreview(data.avatar_src || fallbackAvatar);
      setMsg(t('profile.avatar_reset'));
      setAvatarUrlInput('');
    } catch {
      setErr(t('profile.reset_failed'));
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
      setErr(t('auth.username_invalid'));
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
      setMsg(t('profile.updated'));
      setEditing(false);
    } catch (error) {
      const api = error?.response?.data || {};
      const firstError =
        api.username?.[0] || api.first_name?.[0] || api.last_name?.[0] ||
        api.detail || t('profile.update_failed');
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
            <h1 className="profile-title">{t('profile.title')}</h1>
            <p className="profile-subtitle">{t('profile.subtitle')}</p>
          </div>
          <div className="profile-head-actions">
            {editing ? (
              <>
                <button className="profile-button outline" onClick={cancelEdit} disabled={saving}>
                  {t('common.cancel')}
                </button>
                <button
                  className="profile-button"
                  onClick={onSave}
                  disabled={saving || !dirty}
                  title={!dirty ? t('profile.no_changes') : ''}
                >
                  {saving ? '…' : t('common.save')}
                </button>
              </>
            ) : (
              <>
                <button className="profile-button" onClick={startEdit}>{t('common.edit')}</button>
                <button className="profile-button outline" onClick={logout}>{t('common.logout')}</button>
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
                alt={t('profile.avatar_alt')}
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
                  {t('profile.upload_image')}
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
                    placeholder={t('profile.avatar_url_placeholder')}
                    value={avatarUrlInput}
                    onChange={(e) => setAvatarUrlInput(e.target.value)}
                  />
                  <button type="submit" className="profile-button">{t('profile.use_url')}</button>
                </form>

                <button className="profile-button ghost" onClick={onResetAvatar}>
                  {t('profile.reset_avatar')}
                </button>
              </div>
            )}
          </aside>

          {/* Col droite : infos */}
          <section className="profile-info">
            <div className="profile-row">
              <span className="profile-label">{t('profile.identifier')}</span>
              {editing ? (
                <input
                  className="profile-input"
                  name="username"
                  value={form.username}
                  onChange={onChange}
                  placeholder={t('profile.identifier_placeholder')}
                  autoComplete="username"
                />
              ) : (
                <span className="profile-value">@{user.username}</span>
              )}
            </div>

            <div className="profile-row">
              <span className="profile-label">{t('auth.first_name')}</span>
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
              <span className="profile-label">{t('auth.last_name')}</span>
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
              <span className="profile-label">{t('auth.email')}</span>
              <span className="profile-value">{user.email}</span>
            </div>

            <div className="profile-row">
              <span className="profile-label">{t('profile.role')}</span>
              <span className="profile-value">{user.role}</span>
            </div>

            {msg && <p className="profile-success">{msg}</p>}
            {err && <p className="profile-error">{err}</p>}
          </section>
        </div>

        {/* --- Danger Zone --- */}
        <section className="danger-zone" style={{ borderTop: '1px solid #eee', marginTop: 24, paddingTop: 16 }}>
          <h2 style={{ marginBottom: 8 }}>Danger zone</h2>
          <p style={{ marginBottom: 12 }}>
            Supprimer définitivement votre compte et les données associées. Cette action est irréversible.
          </p>
          <button
            className="btn-danger"
            onClick={openDelete}
            style={{ background: '#c0392b', color: '#fff', border: 'none', padding: '8px 12px', borderRadius: 8 }}
          >
            Delete my account
          </button>
        </section>

        {/* Modal de confirmation */}
        {showDeleteModal && (
          <div
            className="modal-backdrop"
            style={{
              position: 'fixed', inset: 0, background: 'rgba(0,0,0,.45)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
            }}
          >
            <div
              className="modal"
              style={{ background: '#fff', width: 'min(520px, 92vw)', borderRadius: 12, padding: 20, boxShadow: '0 10px 30px rgba(0,0,0,.2)' }}
            >
              <h3 style={{ marginBottom: 8 }}>Confirmer la suppression</h3>
              <p style={{ marginBottom: 12 }}>
                Tapez <strong>DELETE</strong> pour confirmer la suppression définitive de votre compte.
              </p>
              <input
                value={confirmText}
                onChange={(e) => setConfirmText(e.target.value)}
                placeholder="DELETE"
                autoFocus
                style={{ width: '100%', padding: 10, border: '1px solid #ddd', borderRadius: 8 }}
              />
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 16 }}>
                <button className="profile-button outline" onClick={closeDelete} disabled={deleting}>
                  {t('common.cancel')}
                </button>
                <button
                  className="btn-danger"
                  onClick={onDeleteAccount}
                  disabled={!canConfirmDelete || deleting}
                  title={!canConfirmDelete ? 'Tapez DELETE pour activer' : ''}
                  style={{ background: '#c0392b', color: '#fff', border: 'none', padding: '8px 12px', borderRadius: 8 }}
                >
                  {deleting ? '…' : 'Supprimer mon compte'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
