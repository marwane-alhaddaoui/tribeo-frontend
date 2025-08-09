import { Link } from 'react-router-dom';
import { useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import logo from '../assets/logo_v2_2.png';
import './Header.css';

export default function Header() {
  const { user, logout } = useContext(AuthContext);

  return (
    <header className="header">
      <div className="header__container">
        <div className="header__logo">
          <Link to="/">
            <img src={logo} alt="Tribeo Logo" style={{ height: '165px' }} />
          </Link>
        </div>
        <nav className="header__nav">
          <Link to="/">Accueil</Link>
          {user ? (
            <>
              <Link to="/sessions">Sessions</Link>

              {/* 🔹 Dashboard selon le rôle */}
              {user.role === 'admin' && (
                <Link to="/admin/dashboard">Dashboard Admin</Link>
              )}
              {user.role === 'coach' && (
                <Link to="/dashboard">Dashboard Coach</Link>
              )}
              {user.role === 'user' && (
                <Link to="/dashboard">Dashboard</Link>
              )}


              <Link to="/sessions/create">Créer</Link>
              <Link to="/profile">Profile</Link>
              <button onClick={logout}>Déconnexion</button>
            </>
          ) : (
            <>
              <Link to="/login">Connexion</Link>
              <Link to="/register">Inscription</Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
