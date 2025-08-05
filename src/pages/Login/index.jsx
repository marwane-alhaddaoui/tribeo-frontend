import { useContext, useState } from 'react';
import { AuthContext } from '../../context/AuthContext';
import LoginForm from './LoginForm';
import { useNavigate } from 'react-router-dom';

export default function LoginPage() {
  const { login } = useContext(AuthContext);
  const navigate = useNavigate();
  const [error, setError] = useState('');

  const handleLogin = async (email, password) => {
    try {
      await login(email, password);
      navigate('/'); // redirection vers la page d'accueil ou dashboard
    } catch (err) {
      setError('Identifiants invalides. Veuillez réessayer.');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div>
        {error && <p className="text-red-500 mb-3">{error}</p>}
        <LoginForm onSubmit={handleLogin} />
      </div>
    </div>
  );
}
