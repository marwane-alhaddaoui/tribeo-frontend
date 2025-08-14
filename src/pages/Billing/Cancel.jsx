import { Link } from "react-router-dom";
import "../../styles/Billing.css";

export default function BillingCancel() {
  return (
    <div className="billing-wrapper">
      <div className="panel">
        <div className="panel-head">
          <h3 className="panel-title">Paiement annulé ❌</h3>
        </div>
        <p className="billing-sub">Aucun changement de plan. Tu peux réessayer quand tu veux.</p>
        <div className="btns-row" style={{marginTop:10}}>
          <Link to="/billing" className="billing-primary">Retour à l’abonnement</Link>
        </div>
      </div>
    </div>
  );
}
