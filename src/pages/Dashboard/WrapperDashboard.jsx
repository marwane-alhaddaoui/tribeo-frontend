// src/pages/Dashboard/index.jsx
import { useContext, useMemo } from "react";
import { Navigate } from "react-router-dom";
import { AuthContext } from "../../context/AuthContext";
import { QuotasContext } from "../../context/QuotasContext";

import UserDashboard from "./UserDashboard";
import CoachDashboard from "./CoachDashboard";
import PremiumDashboard from "./PremiumDashboard";
import AdminDashboard from "./AdminDashboard"; // s
// import AdminDashboard from "./AdminDashboard"; // si tu veux rendre directement ici

export default function Dashboard() {
  const { user } = useContext(AuthContext);
  const { quotas } = useContext(QuotasContext);

  if (!user) return <p>Chargement…</p>;

  const role = useMemo(() => String(user.role || "").toLowerCase(), [user?.role]);
  const plan = useMemo(() => String(quotas?.plan || "").toUpperCase(), [quotas?.plan]);

  // 1) Admin: priorité absolue
  if (role === "admin" || plan === "ADMIN") {
    return <AdminDashboard/>;
  }

  // 2) Coach
  if (role === "coach") return <CoachDashboard />;

  // 3) Premium explicite par rôle
  if (role === "premium") return <PremiumDashboard />;

  // 4) Fallback premium par plan (ex: migration/base de données pas encore alignée)
  if (plan === "PREMIUM") return <PremiumDashboard />;

  // 5) Default: user standard
  return <UserDashboard />;
}
