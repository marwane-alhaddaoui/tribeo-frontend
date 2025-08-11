// src/components/sessions/CreateSessionCTA.jsx
import { useContext } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import "./createSessionCta.css";

export default function CreateSessionCTA({ variant = "button", visibleFor = null }) {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const location = useLocation();

  const isVisitor = !user;                     // 👈 visiteur ?
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
    navigate("/sessions/create");
  };

  if (!canSee()) return null;

  if (variant === "fab") {
    return (
      <button
        className={`fab-create-session ${isVisitor ? "is-visitor" : ""}`}
        onClick={handleClick}
        aria-label={isVisitor ? "Se connecter pour créer une session" : "Créer une session"}
        title={isVisitor ? "Connecte-toi pour créer une session" : "Créer une session"}
      >
        {isVisitor ? "🔒" : "+"}
      </button>
    );
  }

  return (
    <button
      className={`btn-create-session ${isVisitor ? "is-visitor" : ""}`}
      onClick={handleClick}
      // on reste cliquable pour rediriger vers /login, mais on le grise visuellement
      aria-label={isVisitor ? "Se connecter pour créer une session" : "Créer une session"}
      title={isVisitor ? "Connecte-toi pour créer une session" : "Créer une session"}
    >
      {isVisitor ? "🔒 Se connecter pour créer" : "+ Créer une session"}
    </button>
  );
}
