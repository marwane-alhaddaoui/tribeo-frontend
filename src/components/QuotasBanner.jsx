// src/components/QuotasBanner.jsx
import { useContext } from "react";
import { QuotasContext } from "../context/QuotasContext";

function fmt(v) {
  return v === null || v === undefined ? "∞" : String(v);
}

export default function QuotasBanner({ className = "" }) {
  const { quotas, loading, error } = useContext(QuotasContext);

  if (error) return null;
  if (loading && !quotas) {
    return (
      <div className={`quotas-banner ${className}`} aria-busy="true">
        <span className="plan-badge">…</span>
        <span>Créations / mois: —</span>
        <span>Participations / mois: —</span>
        <span>Groupes actifs max: —</span>
      </div>
    );
  }

  if (!quotas?.limits || !quotas?.usage) return null;

  const { limits: L, usage: U, plan } = quotas;

  return (
    <div className={`quotas-banner ${className}`}>
      {plan && (
        <span className={`plan-badge plan-${String(plan).toLowerCase()}`}>
          {String(plan).toUpperCase()}
        </span>
      )}

      <span>
        Créations / mois: {U.sessions_created ?? 0} / {fmt(L.sessions_create_per_month)}
      </span>

      <span>
        Participations / mois: {U.sessions_joined ?? 0} / {fmt(L.sessions_join_per_month)}
      </span>

      <span>
        Groupes actifs max: {U.groups_joined ?? 0} / {fmt(L.max_groups_joined)}
      </span>
    </div>
  );
}
