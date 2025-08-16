// src/components/auth/LoginPage.jsx
import { useContext, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { AuthContext } from '../../context/AuthContext';
import LoginForm from './LoginForm';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import logo from '../../assets/logo_v2_2.png';
import '../../styles/LoginPage.css';

export default function LoginPage() {
  const { t } = useTranslation();
  const { user, login } = useContext(AuthContext);
  const navigate = useNavigate();
  const location = useLocation();
  const [error, setError] = useState('');

  useEffect(() => {
    if (user) navigate('/sessions', { replace: true });
  }, [user, navigate]);

  const handleLogin = async (emailOrUser, password) => {
    try {
      await login(emailOrUser, password);
      const dest = location.state?.from?.pathname || '/sessions';
      navigate(dest, { replace: true });
    } catch {
      setError(t('auth.login_error'));
    }
  };

  return (
    <div className="login-page">
      <div className="lp-bg lp-bg-radial" />
      <div className="lp-bg lp-bg-mesh" />
      <div className="lp-noise" />

      <main className="login-card">
        <img src={logo} alt={t('logo_alt')} className="lp-logo" />
        <h1 className="login-title">{t('auth.login_title')}</h1>
        <p className="login-subtitle">{t('auth.login_subtitle')}</p>

        {error && <p className="login-error">{error}</p>}

        <LoginForm onSubmit={handleLogin} />

        <div className="lp-actions">
          <Link to="/forgot-password" className="lp-link">{t('auth.forgot_password')}</Link>
          <span className="lp-dot">•</span>
          <Link to="/register" className="lp-link">{t('auth.create_account')}</Link>
        </div>
      </main>
    </div>
  );
}
