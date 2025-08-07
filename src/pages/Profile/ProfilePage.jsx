import { useContext } from 'react';
import { AuthContext } from '../../context/AuthContext';

export default function ProfilePage() {
  const { user } = useContext(AuthContext);

  if (!user) return <p>Chargement des infos...</p>;

  return (
    <div className="profile-page">
      <h1>Mon profil</h1>
      <div className="profile-info">
        <p><strong>Prénom :</strong> {user.first_name}</p>
        <p><strong>Nom :</strong> {user.last_name}</p>
        <p><strong>Email :</strong> {user.email}</p>
        {/* Tu peux afficher plus d'infos selon ce que le backend fournit */}
      </div>
    </div>
  );
}
