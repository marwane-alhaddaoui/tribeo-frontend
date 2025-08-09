import { useContext } from 'react';
import { AuthContext } from '../../context/AuthContext';
import UserDashboard from './UserDashboard';
import CoachDashboard from './CoachDashboard';

export default function Dashboard() {
  const { user } = useContext(AuthContext);

  if (!user) return <p>Chargement...</p>;

  if (user.role === 'coach') {
    return <CoachDashboard />;
  }

  return <UserDashboard />;
}
