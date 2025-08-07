import { useContext } from 'react';
import { AuthContext } from '../../context/AuthContext';
import '../../styles/ProfilePage.css';

export default function ProfilePage() {
  const { user, logout } = useContext(AuthContext);

  if (!user) return <div className="profile-loading">Chargement...</div>;

  return (
    <div className="profile-wrapper">
      <div className="profile-card">
        <h1 className="profile-title">Mon profil</h1>
        <p className="profile-subtitle">Informations liées à ton compte</p>

        <div className="profile-info">
          <p><strong>Nom :</strong> {user.first_name} {user.last_name}</p>
          <p><strong>Email :</strong> {user.email}</p>
          <p><strong>Rôle :</strong> {user.role}</p>
        </div>

        <button className="profile-button" onClick={logout}>Se déconnecter</button>
      </div>
    </div>
  );
}
