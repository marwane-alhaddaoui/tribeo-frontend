import { useContext, useState } from 'react';
import { AuthContext } from '../../context/AuthContext';
import { registerUser } from '../../api/AuthService';
import RegisterForm from './RegisterForm';
import { useNavigate } from 'react-router-dom';
import '../../styles/RegisterPage.css';

export default function RegisterPage() {
  const { login } = useContext(AuthContext);
  const navigate = useNavigate();
  const [error, setError] = useState('');

  const handleRegister = async (data) => {
    try {
      // 1️⃣ Crée l'utilisateur
      await registerUser(data);

      // 2️⃣ Connecte automatiquement l'utilisateur
      await login(data.email, data.password);

      // 3️⃣ Redirige vers l'accueil/dashboard
      navigate('/');
    } catch (err) {
      setError("Erreur lors de l'inscription. Vérifiez vos informations.");
    }
  };

  return (
  <div className="register-page">
    <div className="register-card">
      <h1 className="register-title">Créer un compte</h1>
      <p className="register-subtitle">Rejoins ta tribu sportive</p>
      {error && <p className="register-error">{error}</p>}
      <RegisterForm onSubmit={handleRegister} />
    </div>
  </div>
);

}
