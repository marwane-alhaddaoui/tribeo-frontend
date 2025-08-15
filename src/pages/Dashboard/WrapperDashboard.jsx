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

  if ((user.role || '').toLowerCase() === 'coach') {
    return <CoachDashboard />;
  }
  // ✅ si le rôle est déjà "premium", on sert le PremiumDashboard
  if ((user.role || '').toLowerCase() === 'premium') {
    return <PremiumDashboard />;
  }
    // fallback: plan résolu côté quotas
  if ((quotas?.plan || '').toUpperCase() === 'PREMIUM') {
     return <PremiumDashboard />;
   }

  return <UserDashboard />;
}
