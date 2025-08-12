// src/components/Header.jsx
import { Link } from 'react-router-dom';
import { useContext, useEffect, useState } from 'react';
import { AuthContext } from '../context/AuthContext';
import logo from '../assets/logo_v2_2.png';
import './Header.css';

export default function Header() {
  const { user, logout } = useContext(AuthContext);
  const [open, setOpen] = useState(false);
  const isAuthed = Boolean(user);
  const homeHref = isAuthed ? '/sessions' : '/';

  useEffect(() => {
    document.body.classList.toggle('no-scroll', open);
    return () => document.body.classList.remove('no-scroll');
  }, [open]);

  const closeMenu = () => setOpen(false);

  return (
    <header className={`header ${open ? 'is-open' : ''}`}>
      <div className="header__container">
        <div className="header__logo">
          <Link to={homeHref} onClick={closeMenu}>
            <img src={logo} alt="Tribeo Logo" />
          </Link>
        </div>

        {/* NAV DESKTOP */}
        <nav className="header__nav">
          {!isAuthed && <Link to="/" onClick={closeMenu}>Accueil</Link>}
          {/* Sessions et Groupes toujours visibles */}
          <Link to="/sessions" onClick={closeMenu}>Sessions</Link>
          <Link to="/groups" onClick={closeMenu}>Groupes</Link>

          {isAuthed ? (
            <>
              {user.role === 'admin' && (
                <Link to="/admin/dashboard" onClick={closeMenu}>Dashboard Admin</Link>
              )}
              {user.role === 'coach' && (
                <Link to="/dashboard" onClick={closeMenu}>Dashboard Coach</Link>
              )}
              {user.role === 'user' && (
                <Link to="/dashboard" onClick={closeMenu}>Dashboard</Link>
              )}
              <Link to="/profile" onClick={closeMenu}>Profile</Link>
              <button onClick={logout}>Déconnexion</button>
            </>
          ) : (
            <>
              <Link to="/login" onClick={closeMenu}>Connexion</Link>
              <Link to="/register" className="cta" onClick={closeMenu}>Inscription</Link>
            </>
          )}
        </nav>

        {/* BURGER */}
        <button
          className="hamburger"
          aria-label="Menu"
          aria-controls="mobile-drawer"
          aria-expanded={open ? 'true' : 'false'}
          onClick={() => setOpen(!open)}
        >
          <span /><span /><span />
        </button>
      </div>

      <div className={`mobile-backdrop ${open ? 'show' : ''}`} onClick={closeMenu} />

      {/* Drawer mobile */}
      <nav id="mobile-drawer" className={`mobile-drawer ${open ? 'open' : ''}`}>
        <div className="mobile-drawer__inner">
          <div className="mobile-top">
            <img src={logo} alt="Tribeo" className="mobile-logo" />
            <button className="mobile-close" onClick={closeMenu} aria-label="Fermer">✕</button>
          </div>

          <div className="mobile-links">
            {!isAuthed && <Link to="/" onClick={closeMenu}>Accueil</Link>}
            {/* Sessions et Groupes toujours visibles */}
            <Link to="/sessions" onClick={closeMenu}>Sessions</Link>
            <Link to="/groups" onClick={closeMenu}>Groupes</Link>

            {isAuthed ? (
              <>
                {user.role === 'admin' && <Link to="/admin/dashboard" onClick={closeMenu}>Dashboard Admin</Link>}
                {user.role === 'coach' && <Link to="/dashboard" onClick={closeMenu}>Dashboard Coach</Link>}
                {user.role === 'user' && <Link to="/dashboard" onClick={closeMenu}>Dashboard</Link>}
                <Link to="/profile" onClick={closeMenu}>Profile</Link>
                <button
                  className="mobile-logout"
                  onClick={() => { closeMenu(); logout(); }}
                >
                  Déconnexion
                </button>
              </>
            ) : (
              <>
                <Link to="/login" onClick={closeMenu}>Connexion</Link>
                <Link to="/register" className="mobile-cta" onClick={closeMenu}>Inscription</Link>
              </>
            )}
          </div>
        </div>
      </nav>
    </header>
  );
}
