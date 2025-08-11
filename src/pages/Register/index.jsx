// src/pages/Register/index.jsx
import { useContext, useEffect, useState } from 'react';
import { AuthContext } from '../../context/AuthContext';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import logo from '../../assets/logo_v2_2.png';
import '../../styles/RegisterPage.css';

const USERNAME_RX = /^[a-z0-9_]{3,20}$/;

export default function RegisterPage() {
  const { user, register } = useContext(AuthContext);
  const navigate = useNavigate();
  const location = useLocation();
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (user) navigate('/sessions', { replace: true });
  }, [user, navigate]);

  const handleRegister = async (formData) => {
    try {
      setError('');
      setSubmitting(true);

      // Validations rapides
      const username = String(formData.username || '').trim();
      if (!USERNAME_RX.test(username)) {
        throw new Error("Nom d'utilisateur invalide (3-20 chars, a-z, 0-9, _).");
      }
      formData.username = username.toLowerCase();

      // (Optionnel) garde-fous si l'utilisateur laisse vide
      formData.first_name = String(formData.first_name || '').trim();
      formData.last_name  = String(formData.last_name  || '').trim();
      if (!formData.first_name || !formData.last_name) {
        throw new Error("Prénom et nom sont requis.");
      }

      await register(formData);

      const dest = location.state?.from?.pathname || '/sessions';
      navigate(dest, { replace: true });
    } catch (e) {
      setError(e?.message || 'Inscription échouée. Vérifie les champs et réessaie.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="register-page">
      <div className="rp-bg rp-bg-radial" />
      <div className="rp-bg rp-bg-mesh" />
      <div className="rp-noise" />

      <main className="register-card">
        <img src={logo} alt="Tribeo" className="rp-logo" />
        <h1 className="register-title">Créer un compte</h1>
        <p className="register-subtitle">Rejoins ta tribu sportive en quelques secondes.</p>

        {error && <p className="register-error">{error}</p>}

        <form
          className="register-form"
          onSubmit={(e) => {
            e.preventDefault();
            const data = Object.fromEntries(new FormData(e.target).entries());
            handleRegister(data);
          }}
        >
          {/* Nom / Prénom (requis par le backend) */}
          <div className="input-row">
            <div className="input-group">
              <label>Prénom</label>
              <input
                type="text"
                name="first_name"
                placeholder="Votre prénom"
                required
                minLength={2}
              />
            </div>
            <div className="input-group">
              <label>Nom</label>
              <input
                type="text"
                name="last_name"
                placeholder="Votre nom"
                required
                minLength={2}
              />
            </div>
          </div>

          <div className="input-group">
            <label>Nom d'utilisateur</label>
            <input
              type="text"
              name="username"
              placeholder="Votre pseudo"
              required
              minLength={3}
              maxLength={20}
              pattern="[a-z0-9_]+"
              title="3-20 caractères, minuscules, chiffres, underscore"
            />
          </div>

          <div className="input-group">
            <label>Email</label>
            <input type="email" name="email" placeholder="Votre email" required />
          </div>

          <div className="input-group">
            <label>Mot de passe</label>
            <input type="password" name="password" placeholder="Votre mot de passe" required minLength={8} />
          </div>

          <button type="submit" className="register-button" disabled={submitting}>
            {submitting ? 'Création…' : 'S’inscrire'}
          </button>
        </form>

        <div className="rp-actions">
          <span className="rp-text">Déjà un compte ?</span>
          <Link to="/login" className="rp-link">Se connecter</Link>
        </div>
      </main>
    </div>
  );
}
