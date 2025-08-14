// src/components/sessions/CreateSessionCTA.jsx
import { useContext } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import { QuotasContext } from "../context/QuotasContext";
import "./createSessionCta.css";

export default function CreateSessionCTA({ variant = "button", visibleFor = null }) {
  const { user } = useContext(AuthContext);
  const { quotas } = useContext(QuotasContext); // 👈 Ajout quotas
  const navigate = useNavigate();
  const location = useLocation();

  const isVisitor = !user;

  const quotaBlocked = (() => {
    if (!quotas || !quotas.limits) return false;
    const lim = quotas.limits.sessions_create_per_month;
    const used = quotas.usage?.sessions_created ?? 0;
    return lim != null && used >= lim; // bloqué si quota plein
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
      const go = confirm("Tu as atteint le quota de création. Passer Premium ?");
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
            ? "Se connecter pour créer une session"
            : (quotaBlocked ? "Quota atteint — passer Premium" : "Créer une session")
        }
        title={
          isVisitor
            ? "Connecte-toi pour créer une session"
            : (quotaBlocked ? "Quota atteint — passer Premium" : "Créer une session")
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
          ? "Se connecter pour créer une session"
          : (quotaBlocked ? "Quota atteint — passer Premium" : "Créer une session")
      }
      title={
        isVisitor
          ? "Connecte-toi pour créer une session"
          : (quotaBlocked ? "Quota atteint — passer Premium" : "Créer une session")
      }
    >
      {isVisitor
        ? "🔒 Se connecter pour créer"
        : (quotaBlocked ? "🔒 Quota atteint — Upgrade" : "+ Créer une session")}
    </button>
  );
}
