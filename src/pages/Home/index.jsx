import { Link } from 'react-router-dom';
import { useContext } from 'react';
import { AuthContext } from '../../context/AuthContext';
import '../../styles/HomePage.css'; // ✅ CSS classique

export default function HomePage() {
  const { user } = useContext(AuthContext);

  return (
    <div className="hero">
      <div className="overlay" />

      <div className="content">
        <h1 className="title">Tribeo</h1>
        <p className="subtitle">
          Organise tes sessions sportives entre amis ou en équipes, découvre de nouveaux partenaires,
          et développe ta passion du sport local.
        </p>

        {user ? (
          <Link to="/dashboard" className="button primary">
            Aller à mon espace
          </Link>
        ) : (
          <div className="buttonGroup">
            <Link to="/login" className="button primary">
              Connexion
            </Link>
            <Link to="/register" className="button secondary">
              Inscription
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
