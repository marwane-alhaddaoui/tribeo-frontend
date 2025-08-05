import { useContext, useState } from 'react';
import { AuthContext } from '../../context/AuthContext';
import { registerUser } from '../../api/authService';
import RegisterForm from './RegisterForm';
import { useNavigate } from 'react-router-dom';

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
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div>
        {error && <p className="text-red-500 mb-3">{error}</p>}
        <RegisterForm onSubmit={handleRegister} />
      </div>
    </div>
  );
}
