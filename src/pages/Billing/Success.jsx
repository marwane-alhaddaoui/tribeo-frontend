import { useEffect, useContext } from "react";
import { QuotasContext } from "../../context/QuotasContext";
import { Link } from "react-router-dom";
import { verifySession } from "../../api/billingService"; // ✅
import "../../styles/Billing.css";

export default function BillingSuccess() {
  const { refresh } = useContext(QuotasContext);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const sid = params.get("session_id");

    (async () => {
      try {
        if (sid) await verifySession(sid);   // ✅ met à jour le BillingProfile
      } finally {
        await refresh();                     // puis refresh l’UI
      }
    })();
  }, [refresh]);

  return (
    <div className="billing-wrapper">
      <div className="panel">
        <div className="panel-head">
          <h3 className="panel-title">Paiement confirmé ✅</h3>
        </div>
        <p className="billing-sub">Merci ! Ton plan est mis à jour. Les quotas sont rafraîchis.</p>
        <div className="btns-row" style={{marginTop:10}}>
          <Link to="/billing" className="billing-primary">Retour à l’abonnement</Link>
          <Link to="/sessions" className="billing-secondary">Voir mes sessions</Link>
        </div>
      </div>
    </div>
  );
}
