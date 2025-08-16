// src/components/Header.jsx
import { Link } from 'react-router-dom';
import { useContext, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Globe } from 'lucide-react';
import { AuthContext } from '../context/AuthContext';
import logo from '../assets/logo_v2_2.png';
import './Header.css';
import { QuotasContext } from "../context/QuotasContext";
import LanguageSwitcher from "./LanguageSwitcher";

export default function Header() {
  const { t } = useTranslation();
  const { user, logout } = useContext(AuthContext);
  const { quotas } = useContext(QuotasContext);
  const [open, setOpen] = useState(false);       // drawer mobile
  const [langOpen, setLangOpen] = useState(false); // menu langues (mobile top-right)
  const langMenuRef = useRef(null);
  const isAuthed = Boolean(user);
  const homeHref = isAuthed ? '/sessions' : '/';

  const userLabel = (u) => (!u ? t('profile') : (u.username || t('profile')));

  const nameColorClass = (role) => {
    const r = String(role || "").toLowerCase();
    if (r === "coach") return "name-coach";
    if (r === "premium") return "name-premium";
    if (r === "admin") return "name-admin";
    if (r === "user") return "name-user";
    return "name-user";
  };

  useEffect(() => {
    document.body.classList.toggle('no-scroll', open);
    return () => document.body.classList.remove('no-scroll');
  }, [open]);

  // Ferme le menu langues si clic en dehors
  useEffect(() => {
    function onDocClick(e) {
      if (!langMenuRef.current) return;
      if (!langMenuRef.current.contains(e.target)) setLangOpen(false);
    }
    if (langOpen) document.addEventListener('click', onDocClick);
    return () => document.removeEventListener('click', onDocClick);
  }, [langOpen]);

  const closeMenu = () => setOpen(false);

  return (
    <header className={`header ${open ? 'is-open' : ''}`}>
      <div className="header__container">
        {/* Logo toujours visible (desktop + mobile) */}
        <div className="header__logo">
          <Link to={homeHref} onClick={() => { closeMenu(); setLangOpen(false); }}>
            <img src={logo} alt={t('logo_alt')} />
          </Link>
        </div>

        {/* NAV DESKTOP */}
        <nav className="header__nav">
          {!isAuthed && <Link to="/" onClick={closeMenu}>{t('home')}</Link>}
          <Link to="/sessions" onClick={closeMenu}>{t('sessions')}</Link>
          <Link to="/groups" onClick={closeMenu}>{t('groups')}</Link>

          {isAuthed ? (
            <>
              {user.role === 'admin'
                ? <Link to="/admin/dashboard" onClick={closeMenu}>{t('dashboard')}</Link>
                : <Link to="/dashboard" onClick={closeMenu}>{t('dashboard')}</Link>}
              <Link to="/billing" onClick={closeMenu}>{t('billing_label')}</Link>

              <span className="header-profile-with-badge">
                <Link
                  to="/profile"
                  onClick={closeMenu}
                  title={t('view_profile')}
                  className={`user-name ${nameColorClass(user?.role)}`}
                >
                  {userLabel(user)}
                </Link>
              </span>

              <button onClick={logout}>{t('logout')}</button>
            </>
          ) : (
            <>
              <Link to="/login" onClick={closeMenu}>{t('login')}</Link>
              <Link to="/register" className="cta" onClick={closeMenu}>{t('register')}</Link>
            </>
          )}

          {/* Switcher de langue (desktop, dans la nav) */}
          <LanguageSwitcher />
        </nav>

        {/* ACTIONS DROITES (toujours visibles) : Globe (mobile) + Burger */}
        <div className="header__actions">
          {/* Icône globe visible hors burger en mobile */}
          <div className="lang-inline" ref={langMenuRef}>
            <button
              className="lang-icon-btn"
              title={t('switch_language') || 'Switch language'}
              aria-label={t('switch_language') || 'Switch language'}
              onClick={() => setLangOpen(v => !v)}
            >
              <Globe size={18} />
            </button>

            {/* Menu langues (FR/EN) */}
            {langOpen && (
              <div className="lang-menu">
                <button onClick={() => { window.i18next?.changeLanguage?.('fr'); setLangOpen(false); }}>
                  🇫🇷 FR
                </button>
                <button onClick={() => { window.i18next?.changeLanguage?.('en'); setLangOpen(false); }}>
                  🇬🇧 EN
                </button>
              </div>
            )}
          </div>

          {/* BURGER */}
          <button
            className="hamburger"
            aria-label={t('menu')}
            aria-controls="mobile-drawer"
            aria-expanded={open ? 'true' : 'false'}
            onClick={() => { setOpen(!open); setLangOpen(false); }}
          >
            <span /><span /><span />
          </button>
        </div>
      </div>

      <div className={`mobile-backdrop ${open ? 'show' : ''}`} onClick={() => { closeMenu(); setLangOpen(false); }} />

      {/* Drawer mobile */}
      <nav id="mobile-drawer" className={`mobile-drawer ${open ? 'open' : ''}`}>
        <div className="mobile-drawer__inner">
          <div className="mobile-top">
            {/* Le logo interne du drawer reste caché (ton CSS le masque), pas grave */}
            <img src={logo} alt="Tribeo" className="mobile-logo" />
            <button className="mobile-close" onClick={closeMenu} aria-label={t('close')}>✕</button>
          </div>

          <div className="mobile-links">
            {!isAuthed && <Link to="/" onClick={closeMenu}>{t('home')}</Link>}
            <Link to="/sessions" onClick={closeMenu}>{t('sessions')}</Link>
            <Link to="/groups" onClick={closeMenu}>{t('groups')}</Link>
            {isAuthed && <Link to="/billing" onClick={closeMenu}>{t('billing_label')}</Link>}

            {isAuthed ? (
              <>
                {user.role === 'admin'
                  ? <Link to="/admin/dashboard" onClick={closeMenu}>{t('dashboard')}</Link>
                  : <Link to="/dashboard" onClick={closeMenu}>{t('dashboard')}</Link>}

                <div className="mobile-profile-with-badge">
                  <Link
                    to="/profile"
                    onClick={closeMenu}
                    title={t('view_profile')}
                    className={`user-name ${nameColorClass(user?.role)}`}
                  >
                    {userLabel(user)}
                  </Link>
                </div>

                <button
                  className="mobile-logout"
                  onClick={() => { closeMenu(); logout(); }}
                >
                  {t('logout')}
                </button>
              </>
            ) : (
              <>
                <Link to="/login" onClick={closeMenu}>{t('login')}</Link>
                <Link to="/register" className="mobile-cta" onClick={closeMenu}>{t('register')}</Link>
              </>
            )}

            {/* Switcher langue aussi dans le drawer si tu veux le garder */}
            <div className="mt-4">
              <LanguageSwitcher />
            </div>
          </div>
        </div>
      </nav>
    </header>
  );
}

// Expose i18next sur window pour le mini menu (évite d’importer ici)
import i18n from "../i18n";
if (typeof window !== "undefined") window.i18next = i18n;
