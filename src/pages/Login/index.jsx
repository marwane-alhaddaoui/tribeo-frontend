// src/components/auth/LoginPage.jsx
import { useContext, useEffect, useState } from 'react';
import { AuthContext } from '../../context/AuthContext';
import LoginForm from './LoginForm';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import logo from '../../assets/logo_v2_2.png';
import '../../styles/LoginPage.css';

export default function LoginPage() {
  const { user, login } = useContext(AuthContext);
  const navigate = useNavigate();
  const location = useLocation();                // 👈 pour récupérer l'URL d’origine
  const [error, setError] = useState('');

  // Si déjà connecté, éviter la page login
  useEffect(() => {
    if (user) navigate('/sessions', { replace: true });  // 👈 direct Sessions
  }, [user, navigate]);

  const handleLogin = async (emailOrUser, password) => {
    try {
      await login(emailOrUser, password);

      // 👇 si on vient d’une page protégée => on y retourne, sinon /sessions
      const dest = location.state?.from?.pathname || '/sessions';
      navigate(dest, { replace: true });                 // 👈 éviter back vers /login
    } catch {
      setError('Identifiants invalides. Veuillez réessayer.');
    }
  };

  return (
    <div className="login-page">
      <div className="lp-bg lp-bg-radial" />
      <div className="lp-bg lp-bg-mesh" />
      <div className="lp-noise" />

      <main className="login-card">
        <img src={logo} alt="Tribeo" className="lp-logo" />
        <h1 className="login-title">Connexion</h1>
        <p className="login-subtitle">Organise ton sport, facilement.</p>

        {error && <p className="login-error">{error}</p>}

        <LoginForm onSubmit={handleLogin} />

        <div className="lp-actions">
          <Link to="/forgot-password" className="lp-link">Mot de passe oublié ?</Link>
          <span className="lp-dot">•</span>
          <Link to="/register" className="lp-link">Créer un compte</Link>
        </div>
      </main>
    </div>
  );
}
