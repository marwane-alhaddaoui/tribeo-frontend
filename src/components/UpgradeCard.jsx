// src/components/UpgradeCard.jsx
import { useContext, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { QuotasContext } from "../context/QuotasContext";
import { createCheckout } from "../api/billingService";

export default function UpgradeCard() {
  const { t } = useTranslation();
  const { quotas, loading } = useContext(QuotasContext);

  const rows = useMemo(() => {
    if (!quotas) return [];
    const L = quotas.limits || {};
    const U = quotas.usage || {};
    const fmt = (v) => (v == null ? "∞" : String(v));
    return [
      [t("upgrade_card.creations_label"), `${U.sessions_created ?? 0} / ${fmt(L.sessions_create_per_month)}`],
      [t("upgrade_card.participations_label"), `${U.sessions_joined ?? 0} / ${fmt(L.sessions_join_per_month)}`],
      [t("upgrade_card.groups_label"), `${U.groups_joined ?? 0} / ${fmt(L.max_groups_joined)}`],
    ];
  }, [quotas, t]);

  const onUpgrade = async (key) => {
    try {
      const url = await createCheckout(key);
      if (url) window.location.href = url;
    } catch {
      alert(t("upgrade_card.payment_error"));
    }
  };

  if (loading) return <div className="card" aria-busy="true">{t("upgrade_card.loading")}</div>;
  if (!quotas) return null;

  const plan = String(quotas.plan || "").toUpperCase();
  const expires = quotas.plan_expires_at
    ? new Date(quotas.plan_expires_at).toLocaleDateString(undefined)
    : null;

  return (
    <div className="card" style={{padding:16, borderRadius:12, boxShadow:"0 2px 8px rgba(0,0,0,.08)"}}>
      <div style={{display:"flex", justifyContent:"space-between", alignItems:"baseline"}}>
        <h3 style={{margin:0}}>{t("upgrade_card.title")}</h3>
        <div style={{opacity:.8}}>
          {plan} {expires ? t("upgrade_card.until_date", { date: expires }) : ""}
        </div>
      </div>

      <table style={{width:"100%", marginTop:12}}>
        <tbody>
          {rows.map(([k, v]) => (
            <tr key={k}>
              <td style={{padding:"6px 0", opacity:.7}}>{k}</td>
              <td style={{padding:"6px 0", textAlign:"right"}}>{v}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <div style={{display:"flex", gap:8, marginTop:12}}>
        <button
          onClick={() => onUpgrade("premium_month")}
          className="btn"
          title={t("upgrade_card.premium_title")}
          aria-label={t("upgrade_card.premium_title")}
        >
          {t("upgrade_card.premium_btn")}
        </button>
        <button
          onClick={() => onUpgrade("coach_month")}
          className="btn btn-outline"
          title={t("upgrade_card.coach_title")}
          aria-label={t("upgrade_card.coach_title")}
        >
          {t("upgrade_card.coach_btn")}
        </button>
      </div>
    </div>
  );
}
