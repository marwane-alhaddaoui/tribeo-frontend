// src/pages/Billing/BillingSuccess.jsx
import { useEffect, useContext, useRef } from "react";
import { Link, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { QuotasContext } from "../../context/QuotasContext";
import { AuthContext } from "../../context/AuthContext";
import { verifySession } from "../../api/billingService";
import "../../styles/Billing.css";

export default function BillingSuccess() {
  const { t } = useTranslation();
  const { refresh: refreshQuotas } = useContext(QuotasContext);
  const { refreshProfile, setUser } = useContext(AuthContext);
  const location = useLocation();

  // Empêche l’exécution double en dev (StrictMode)
  const ranRef = useRef(false);

  useEffect(() => {
    if (ranRef.current) return;
    ranRef.current = true;

    const params = new URLSearchParams(location.search);
    const session_id = params.get("session_id"); // Stripe Checkout session id

    (async () => {
      try {
        if (session_id) {
          // 1) Applique l’abonnement côté backend
          const res = await verifySession(session_id); // { status, plan, subscription_id, role }

          // 2) Patch optimiste (pour badge/menus)
          if (res?.role) {
            setUser((u) => (u ? { ...u, role: res.role } : u));
          }

          // 3) Nettoie l’URL (éviter re-vérif au refresh)
          window.history.replaceState({}, "", location.pathname);
        }

        // 4) Recharge profil + quotas
        await Promise.all([refreshProfile(), refreshQuotas()]);
      } catch (e) {
        console.error("[billing success]", e);
        try { await Promise.all([refreshProfile(), refreshQuotas()]); } catch {}
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname, location.search]);

  return (
    <div className="billing-wrapper">
      <div className="panel">
        <div className="panel-head">
          <h3 className="panel-title">{t("billing.success.title")}</h3>
        </div>
        <p className="billing-sub">
          {t("billing.success.subtitle")}
        </p>
        <div className="btns-row" style={{ marginTop: 10 }}>
          <Link to="/billing" className="billing-primary">
            {t("billing.success.back_to_billing")}
          </Link>
          <Link to="/sessions" className="billing-secondary">
            {t("billing.success.view_sessions")}
          </Link>
        </div>
      </div>
    </div>
  );
}
