// src/components/QuotasBanner.jsx
import { useContext } from "react";
import { useTranslation } from "react-i18next";
import { QuotasContext } from "../context/QuotasContext";

function fmt(v) {
  return v === null || v === undefined ? "∞" : String(v);
}

export default function QuotasBanner({ className = "" }) {
  const { t } = useTranslation();
  const { quotas, loading, error } = useContext(QuotasContext);

  if (error) return null;

  if (loading && !quotas) {
    return (
      <div className={`quotas-banner ${className}`} aria-busy="true">
        <span className="plan-badge">…</span>
        <span>{t("quotas_banner.creations_label")}: —</span>
        <span>{t("quotas_banner.participations_label")}: —</span>
        <span>{t("quotas_banner.groups_label")}: —</span>
      </div>
    );
  }

  if (!quotas?.limits || !quotas?.usage) return null;

  const { limits: L, usage: U, plan } = quotas;

  return (
    <div className={`quotas-banner ${className}`}>
      {plan && (
        <span
          className={`plan-badge plan-${String(plan).toLowerCase()}`}
          title={t("quotas_banner.plan_title", { plan: String(plan).toUpperCase() })}
        >
          {String(plan).toUpperCase()}
        </span>
      )}

      <span>
        {t("quotas_banner.creations_label")}: {U.sessions_created ?? 0} / {fmt(L.sessions_create_per_month)}
      </span>

      <span>
        {t("quotas_banner.participations_label")}: {U.sessions_joined ?? 0} / {fmt(L.sessions_join_per_month)}
      </span>

      <span>
        {t("quotas_banner.groups_label")}: {U.groups_joined ?? 0} / {fmt(L.max_groups_joined)}
      </span>
    </div>
  );
}
