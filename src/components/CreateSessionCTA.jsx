import { useContext } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { AuthContext } from "../context/AuthContext";
import { QuotasContext } from "../context/QuotasContext";
import "./createSessionCta.css";

export default function CreateSessionCTA({ variant = "button", visibleFor = null }) {
  const { user } = useContext(AuthContext);
  const { quotas } = useContext(QuotasContext);
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useTranslation();

  const isVisitor = !user;

  const quotaBlocked = (() => {
    if (!quotas || !quotas.limits) return false;
    const lim = quotas.limits.sessions_create_per_month;
    const used = quotas.usage?.sessions_created ?? 0;
    return lim != null && used >= lim;
  })();

  const canSee = () => {
    if (!visibleFor) return true;
    const role = user?.role || "visitor";
    return visibleFor.includes(role);
  };

  const handleClick = () => {
    if (isVisitor) {
      navigate("/login", { state: { from: location } });
      return;
    }
    if (quotaBlocked) {
      const go = confirm(t("create_session_cta_quota_confirm"));
      if (go) navigate("/profile");
      return;
    }
    navigate("/sessions/create");
  };

  if (!canSee()) return null;

  if (variant === "fab") {
    return (
      <button
        className={`fab-create-session ${(isVisitor || quotaBlocked) ? "is-visitor" : ""}`}
        onClick={handleClick}
        aria-label={
          isVisitor
            ? t("create_session_cta_login_aria")
            : (quotaBlocked ? t("create_session_cta_quota_aria") : t("create_session_cta_aria"))
        }
        title={
          isVisitor
            ? t("create_session_cta_login_title")
            : (quotaBlocked ? t("create_session_cta_quota_title") : t("create_session_cta_title"))
        }
      >
        {isVisitor ? "🔒" : (quotaBlocked ? "🔒" : "+")}
      </button>
    );
  }

  return (
    <button
      className={`btn-create-session ${(isVisitor || quotaBlocked) ? "is-visitor" : ""}`}
      onClick={handleClick}
      aria-label={
        isVisitor
          ? t("create_session_cta_login_aria")
          : (quotaBlocked ? t("create_session_cta_quota_aria") : t("create_session_cta_aria"))
      }
      title={
        isVisitor
          ? t("create_session_cta_login_title")
          : (quotaBlocked ? t("create_session_cta_quota_title") : t("create_session_cta_title"))
      }
    >
      {isVisitor
        ? `🔒 ${t("create_session_cta_login_btn")}`
        : (quotaBlocked ? `🔒 ${t("create_session_cta_quota_btn")}` : `+ ${t("create_session_cta_btn")}`)}
    </button>
  );
}
