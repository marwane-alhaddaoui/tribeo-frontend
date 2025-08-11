import { useState } from 'react';

const USERNAME_RX = /^[a-z0-9_]{3,20}$/;

export default function RegisterForm({ onSubmit }) {
  const [formData, setFormData] = useState({
    username: '',
    first_name: '',
    last_name: '',
    email: '',
    password: '',
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    // normaliser visuellement le username (sans bloquer la saisie)
    const v = name === 'username' ? value.trim() : value;
    setFormData((f) => ({ ...f, [name]: v }));
  };

  const validate = () => {
    const e = {};
    if (!USERNAME_RX.test(formData.username.toLowerCase().trim())) {
      e.username = "3–20 caractères, a-z 0-9 _ uniquement";
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      e.email = "Email invalide";
    }
    if (formData.password.length < 6) {
      e.password = "Minimum 6 caractères";
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    setErrors({});
    try {
      // normalisation finale avant envoi
      const payload = {
        ...formData,
        username: formData.username.toLowerCase().trim(),
        email: formData.email.trim(),
      };
      await onSubmit(payload);
    } catch (err) {
      // Mapper erreurs API (DRF)
      const data = err?.response?.data || {};
      const apiErr = {};
      if (data.username) apiErr.username = Array.isArray(data.username) ? data.username[0] : String(data.username);
      if (data.email) apiErr.email = Array.isArray(data.email) ? data.email[0] : String(data.email);
      if (data.password) apiErr.password = Array.isArray(data.password) ? data.password[0] : String(data.password);
      if (data.detail || data.non_field_errors) apiErr.global = data.detail || data.non_field_errors?.[0];
      setErrors(apiErr);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="register-form">
      <div className="input-group">
        <label>Username</label>
        <input
          type="text"
          name="username"
          value={formData.username}
          onChange={handleChange}
          placeholder="ex: john_doe"
          autoComplete="username"
          required
        />
        {errors.username && <p className="err">{errors.username}</p>}
      </div>

      <div className="input-group">
        <label>Prénom</label>
        <input
          type="text"
          name="first_name"
          value={formData.first_name}
          onChange={handleChange}
          autoComplete="given-name"
          required
        />
      </div>

      <div className="input-group">
        <label>Nom</label>
        <input
          type="text"
          name="last_name"
          value={formData.last_name}
          onChange={handleChange}
          autoComplete="family-name"
          required
        />
      </div>

      <div className="input-group">
        <label>Email</label>
        <input
          type="email"
          name="email"
          value={formData.email}
          onChange={handleChange}
          placeholder="ex: john@doe.com"
          autoComplete="email"
          required
        />
        {errors.email && <p className="err">{errors.email}</p>}
      </div>

      <div className="input-group">
        <label>Mot de passe</label>
        <input
          type="password"
          name="password"
          value={formData.password}
          onChange={handleChange}
          placeholder="••••••••"
          autoComplete="new-password"
          required
        />
        {errors.password && <p className="err">{errors.password}</p>}
      </div>

      {errors.global && <p className="err">{errors.global}</p>}

      <button type="submit" className="register-button" disabled={loading}>
        {loading ? "..." : "S'inscrire"}
      </button>
    </form>
  );
}
