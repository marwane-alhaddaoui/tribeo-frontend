// src/pages/Register/index.jsx
import { useContext, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { AuthContext } from '../../context/AuthContext';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import logo from '../../assets/logo_v2_2.png';
import '../../styles/RegisterPage.css';

const USERNAME_RX = /^[a-z0-9_]{3,20}$/;

export default function RegisterPage() {
  const { t } = useTranslation();
  const { user, register } = useContext(AuthContext);
  const navigate = useNavigate();
  const location = useLocation();
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (user) navigate('/sessions', { replace: true });
  }, [user, navigate]);

  const handleRegister = async (formData) => {
    try {
      setError('');
      setSubmitting(true);

      // Validations rapides i18n
      const username = String(formData.username || '').trim();
      if (!USERNAME_RX.test(username)) {
        throw new Error(t('auth.username_invalid'));
      }
      formData.username = username.toLowerCase();

      formData.first_name = String(formData.first_name || '').trim();
      formData.last_name  = String(formData.last_name  || '').trim();
      if (!formData.first_name || !formData.last_name) {
        throw new Error(t('auth.first_last_required'));
      }

      await register(formData);

      const dest = location.state?.from?.pathname || '/sessions';
      navigate(dest, { replace: true });
    } catch (e) {
      setError(e?.message || t('auth.register_failed'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="register-page">
      <div className="rp-bg rp-bg-radial" />
      <div className="rp-bg rp-bg-mesh" />
      <div className="rp-noise" />

      <main className="register-card">
        <img src={logo} alt={t('logo_alt')} className="rp-logo" />
        <h1 className="register-title">{t('auth.register_title')}</h1>
        <p className="register-subtitle">{t('auth.register_subtitle')}</p>

        {error && <p className="register-error">{error}</p>}

        <form
          className="register-form"
          onSubmit={(e) => {
            e.preventDefault();
            const data = Object.fromEntries(new FormData(e.target).entries());
            handleRegister(data);
          }}
        >
          {/* Nom / Prénom */}
          <div className="input-row">
            <div className="input-group">
              <label htmlFor="first_name">{t('auth.first_name')}</label>
              <input
                id="first_name"
                type="text"
                name="first_name"
                placeholder={t('auth.first_name_placeholder')}
                required
                minLength={2}
                autoComplete="given-name"
              />
            </div>
            <div className="input-group">
              <label htmlFor="last_name">{t('auth.last_name')}</label>
              <input
                id="last_name"
                type="text"
                name="last_name"
                placeholder={t('auth.last_name_placeholder')}
                required
                minLength={2}
                autoComplete="family-name"
              />
            </div>
          </div>

          <div className="input-group">
            <label htmlFor="username">{t('auth.username')}</label>
            <input
              id="username"
              type="text"
              name="username"
              placeholder={t('auth.username_placeholder')}
              required
              minLength={3}
              maxLength={20}
              pattern="[a-z0-9_]+"
              title={t('auth.username_title')}
              autoComplete="username"
            />
          </div>

          <div className="input-group">
            <label htmlFor="email">{t('auth.email')}</label>
            <input
              id="email"
              type="email"
              name="email"
              placeholder={t('auth.email_placeholder')}
              required
              autoComplete="email"
            />
          </div>

          <div className="input-group">
            <label htmlFor="password">{t('auth.password')}</label>
            <input
              id="password"
              type="password"
              name="password"
              placeholder={t('auth.password_placeholder')}
              required
              minLength={8}
              autoComplete="new-password"
            />
          </div>

          <button type="submit" className="register-button" disabled={submitting}>
            {submitting ? t('auth.creating') : t('auth.register_cta')}
          </button>
        </form>

        <div className="rp-actions">
          <span className="rp-text">{t('auth.already_have_account')}</span>
          <Link to="/login" className="rp-link">{t('auth.login_link')}</Link>
        </div>
      </main>
    </div>
  );
}
