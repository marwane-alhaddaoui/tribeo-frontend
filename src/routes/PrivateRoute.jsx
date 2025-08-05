import { useContext } from 'react';
import { Navigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { getToken } from '../utils/storage';

export default function PrivateRoute({ children }) {
  const { user } = useContext(AuthContext);
  const token = getToken();

  // Si aucun token => redirection immédiate
  if (!token) {
    return <Navigate to="/login" />;
  }

  // Si token existe mais user pas encore chargé => on affiche un loader
  if (token && !user) {
    return <div className="text-center mt-10">Chargement...</div>;
  }

  // Si tout est ok => accès autorisé
  return children;
}
