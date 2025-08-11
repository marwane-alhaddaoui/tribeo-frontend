import { useState } from 'react';

export default function LoginForm({ onSubmit }) {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(identifier.trim(), password);
  };

  return (
    <form onSubmit={handleSubmit} className="login-form">
      <div className="input-group">
        <label>Email ou username</label>
        <input
          type="text"
          value={identifier}
          onChange={(e) => setIdentifier(e.target.value)}
          placeholder="email ou @username"
          autoComplete="username"
          required
        />
      </div>

      <div className="input-group">
        <label>Mot de passe</label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="••••••••"
          autoComplete="current-password"
          required
        />
      </div>

      <button type="submit" className="login-button">Se connecter</button>
    </form>
  );
}
