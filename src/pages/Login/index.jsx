import { useContext, useState } from 'react';
import { AuthContext } from '../../context/AuthContext';
import LoginForm from './LoginForm';
import { useNavigate } from 'react-router-dom';
import '../../styles/LoginPage.css'; // ← ton nouveau fichier CSS

export default function LoginPage() {
  const { login } = useContext(AuthContext);
  const navigate = useNavigate();
  const [error, setError] = useState('');

  const handleLogin = async (email, password) => {
    try {
      await login(email, password);
      navigate('/');
    } catch (err) {
      setError('Identifiants invalides. Veuillez réessayer.');
    }
  };

  return (
    <div className="login-page">
      <div className="login-card">
        <h1 className="login-title">Connexion</h1>
        <p className="login-subtitle">Organise ton sport avec ta tribu</p>
        {error && <p className="login-error">{error}</p>}
        <LoginForm onSubmit={handleLogin} />
      </div>
    </div>
  );
}
