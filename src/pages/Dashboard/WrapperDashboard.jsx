import { useContext } from 'react';
import { AuthContext } from '../../context/AuthContext';
import UserDashboard from './UserDashboard';
import CoachDashboard from './CoachDashboard';
import PremiumDashboard from './PremiumDashboard';
import { QuotasContext } from '../../context/QuotasContext';

export default function Dashboard() {
  const { user } = useContext(AuthContext);
  const { quotas } = useContext(QuotasContext);

  if (!user) return <p>Chargement...</p>;

  if (user.role === 'coach') {
    return <CoachDashboard />;
  }
  if ((quotas?.plan || '').toUpperCase() === 'PREMIUM') {
    return <PremiumDashboard />;
  }

  return <UserDashboard />;
}
