// src/components/auth/LoginForm.jsx
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

export default function LoginForm({ onSubmit }) {
  const { t } = useTranslation();
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPwd, setShowPwd] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await onSubmit(identifier.trim(), password);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="login-form">
      <div className="input-group">
        <label htmlFor="identifier">{t('auth.email_or_username')}</label>
        <input
          id="identifier"
          type="text"
          inputMode="email"
          autoComplete="username"
          value={identifier}
          onChange={(e) => setIdentifier(e.target.value)}
          placeholder={t('auth.email_or_username')}
          required
        />
      </div>

      <div className="input-group">
        <label htmlFor="password">{t('auth.password')}</label>
        <div className="pwd-wrap">
          <input
            id="password"
            type={showPwd ? 'text' : 'password'}
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder={t('auth.password')}
            required
          />
          <button
            type="button"
            className="pwd-toggle"
            aria-label={showPwd ? t('auth.hide_password') : t('auth.show_password')}
            onClick={() => setShowPwd(v => !v)}
          >
            {showPwd ? t('auth.hide') : t('auth.show')}
          </button>
        </div>
      </div>

      <button
        type="submit"
        className={`btn-primary ${loading ? 'is-loading' : ''}`}
        disabled={loading}
        aria-busy={loading}
      >
        <span className="btn-label">{t('auth.submit_login')}</span>

        {loading && (
          <svg className="spinner-ring" viewBox="0 0 50 50" aria-hidden="true">
            <circle className="path" cx="25" cy="25" r="20" fill="none" strokeWidth="5"/>
          </svg>
        )}
      </button>
    </form>
  );
}
