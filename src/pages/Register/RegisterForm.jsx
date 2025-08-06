import { useState } from 'react';

export default function RegisterForm({ onSubmit }) {
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    password: '',
  });

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="register-form">
  <div className="input-group">
    <label>Prénom</label>
    <input
      type="text"
      name="first_name"
      value={formData.first_name}
      onChange={handleChange}
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
      required
    />
  </div>

  <div className="input-group">
    <label>Mot de passe</label>
    <input
      type="password"
      name="password"
      value={formData.password}
      onChange={handleChange}
      required
    />
  </div>

  <button type="submit" className="register-button">
    S'inscrire
  </button>
</form>
  );
}
