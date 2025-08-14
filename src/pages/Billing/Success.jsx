import { useEffect, useContext } from "react";
import { QuotasContext } from "../../context/QuotasContext";
import { AuthContext } from "../../context/AuthContext";
import { Link } from "react-router-dom";
import { verifySession } from "../../api/billingService";
import "../../styles/Billing.css";

export default function BillingSuccess() {
  const { refresh } = useContext(QuotasContext);
  const { refreshProfile, setUser } = useContext(AuthContext);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const session_id = params.get("session_id");

    (async () => {
      try {
        if (session_id) {
          // 1) applique l'abonnement côté back
          const res = await verifySession(session_id); // { status, plan, subscription_id, role }

          // 2) patch optimiste pour un rendu instant (facultatif)
          if (res?.role || res?.plan) {
            setUser((u) => u ? {
              ...u,
              role: res.role ?? u.role,
              plan: (res.plan || u.plan || "").toString().toUpperCase(),
            } : u);
          }

          // 3) source de vérité: re-fetch du profil (met à jour user.role sans reload)
          await refreshProfile();

          // 4) nettoie le query param pour éviter de re-vérifier au F5
          window.history.replaceState({}, "", window.location.pathname);
        }
        // 5) quotas/plan côté UI
        await refresh();
      } catch (e) {
        // tu peux logger/afficher un message si besoin
        console.error("[billing success]", e);
      }
    })();
  }, [refresh, refreshProfile, setUser]);

  return (
    <div className="billing-wrapper">
      <div className="panel">
        <div className="panel-head">
          <h3 className="panel-title">Paiement confirmé ✅</h3>
        </div>
        <p className="billing-sub">
          Merci ! Ton abonnement est mis à jour. Si tu ne vois pas le changement,
          clique sur “Retour à l’abonnement”.
        </p>
        <div className="btns-row" style={{marginTop:10}}>
          <Link to="/billing" className="billing-primary">Retour à l’abonnement</Link>
          <Link to="/sessions" className="billing-secondary">Voir mes sessions</Link>
        </div>
      </div>
    </div>
  );
}
