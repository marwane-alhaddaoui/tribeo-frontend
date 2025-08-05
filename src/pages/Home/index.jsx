import { Link } from 'react-router-dom';
import { useContext } from 'react';
import { AuthContext } from '../../context/AuthContext';

export default function HomePage() {
  const { user } = useContext(AuthContext);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen px-4 text-center bg-gray-50">
      <h1 className="text-5xl font-extrabold text-blue-600 mb-4">Tribeo</h1>
      <p className="text-xl text-gray-700 mb-8 max-w-xl">
        Organise tes sessions sportives entre amis ou en équipes, découvre de nouveaux partenaires, et développe ta passion du sport local.
      </p>

      {user ? (
        <Link
          to="/dashboard"
          className="bg-blue-600 text-white px-6 py-3 rounded-full hover:bg-blue-700 transition"
        >
          Aller à mon espace
        </Link>
      ) : (
        <div className="flex gap-4">
          <Link
            to="/login"
            className="bg-blue-600 text-white px-6 py-3 rounded-full hover:bg-blue-700 transition"
          >
            Connexion
          </Link>
          <Link
            to="/register"
            className="bg-gray-200 text-gray-800 px-6 py-3 rounded-full hover:bg-gray-300 transition"
          >
            Inscription
          </Link>
        </div>
      )}
    </div>
  );
}
