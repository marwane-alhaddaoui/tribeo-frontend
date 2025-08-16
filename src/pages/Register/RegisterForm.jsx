// src/components/auth/RegisterForm.jsx
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

const USERNAME_RX = /^[a-z0-9_]{3,20}$/;

export default function RegisterForm({ onSubmit }) {
  const { t } = useTranslation();
  const [formData, setFormData] = useState({
    username: '',
    first_name: '',
    last_name: '',
    email: '',
    password: '',
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const MIN_PWD = 8;

  const handleChange = (e) => {
    const { name, value } = e.target;
    const v = name === 'username' ? value.trim() : value;
    setFormData((f) => ({ ...f, [name]: v }));
  };

  const validate = () => {
    const e = {};
    if (!USERNAME_RX.test((formData.username || '').toLowerCase().trim())) {
      e.username = t('auth.username_invalid');
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email || '')) {
      e.email = t('auth.email_invalid');
    }
    if ((formData.password || '').length < MIN_PWD) {
      e.password = t('auth.password_min', { count: MIN_PWD });
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    setErrors({});
    try {
      const payload = {
        ...formData,
        username: (formData.username || '').toLowerCase().trim(),
        email: (formData.email || '').trim(),
      };
      await onSubmit(payload);
    } catch (err) {
      // Map erreurs DRF
      const data = err?.response?.data || {};
      const apiErr = {};
      if (data.username) apiErr.username = Array.isArray(data.username) ? data.username[0] : String(data.username);
      if (data.email) apiErr.email = Array.isArray(data.email) ? data.email[0] : String(data.email);
      if (data.password) apiErr.password = Array.isArray(data.password) ? data.password[0] : String(data.password);
      if (data.detail || data.non_field_errors) apiErr.global = String(data.detail || data.non_field_errors?.[0]);
      setErrors(apiErr);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="register-form">
      <div className="input-group">
        <label htmlFor="username">{t('auth.username')}</label>
        <input
          id="username"
          type="text"
          name="username"
          value={formData.username}
          onChange={handleChange}
          placeholder={t('auth.username_placeholder')}
          autoComplete="username"
          minLength={3}
          maxLength={20}
          pattern="[a-z0-9_]+"
          title={t('auth.username_title')}
          required
        />
        {errors.username && <p className="err">{errors.username}</p>}
      </div>

      <div className="input-group">
        <label htmlFor="first_name">{t('auth.first_name')}</label>
        <input
          id="first_name"
          type="text"
          name="first_name"
          value={formData.first_name}
          onChange={handleChange}
          placeholder={t('auth.first_name_placeholder')}
          autoComplete="given-name"
          minLength={2}
          required
        />
      </div>

      <div className="input-group">
        <label htmlFor="last_name">{t('auth.last_name')}</label>
        <input
          id="last_name"
          type="text"
          name="last_name"
          value={formData.last_name}
          onChange={handleChange}
          placeholder={t('auth.last_name_placeholder')}
          autoComplete="family-name"
          minLength={2}
          required
        />
      </div>

      <div className="input-group">
        <label htmlFor="email">{t('auth.email')}</label>
        <input
          id="email"
          type="email"
          name="email"
          value={formData.email}
          onChange={handleChange}
          placeholder={t('auth.email_placeholder')}
          autoComplete="email"
          required
        />
        {errors.email && <p className="err">{errors.email}</p>}
      </div>

      <div className="input-group">
        <label htmlFor="password">{t('auth.password')}</label>
        <input
          id="password"
          type="password"
          name="password"
          value={formData.password}
          onChange={handleChange}
          placeholder={t('auth.password_placeholder')}
          autoComplete="new-password"
          minLength={MIN_PWD}
          required
        />
        {errors.password && <p className="err">{errors.password}</p>}
      </div>

      {errors.global && <p className="err">{errors.global}</p>}

      <button type="submit" className="register-button" disabled={loading}>
        {loading ? t('auth.creating') : t('auth.register_cta')}
      </button>
    </form>
  );
}
