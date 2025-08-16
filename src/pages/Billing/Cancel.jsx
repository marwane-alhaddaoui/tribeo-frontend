// src/pages/Billing/BillingCancel.jsx
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import "../../styles/Billing.css";

export default function BillingCancel() {
  const { t } = useTranslation();

  return (
    <div className="billing-wrapper">
      <div className="panel">
        <div className="panel-head">
          <h3 className="panel-title">{t("billing_cancel.title")}</h3>
        </div>
        <p className="billing-sub">{t("billing_cancel.subtitle")}</p>
        <div className="btns-row" style={{ marginTop: 10 }}>
          <Link to="/billing" className="billing-primary">
            {t("billing_cancel.back_button")}
          </Link>
        </div>
      </div>
    </div>
  );
}
