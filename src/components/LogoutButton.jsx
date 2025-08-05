import { useContext } from 'react';
import { AuthContext } from '../context/AuthContext';

export default function LogoutButton() {
  const { user, logout } = useContext(AuthContext);

  return (
    <div className="flex items-center gap-4">
      {user && (
        <>
          <span className="text-gray-700 font-medium">
            Bonjour, {user.first_name || user.email}
          </span>
          <button
            onClick={logout}
            className="bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600"
          >
            Déconnexion
          </button>
        </>
      )}
    </div>
  );
}
