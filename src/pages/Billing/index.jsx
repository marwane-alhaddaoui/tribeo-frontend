import { useContext, useEffect, useMemo, useState } from "react";
import { QuotasContext } from "../../context/QuotasContext";
import { createCheckout } from "../../api/billingService";
import { Link } from "react-router-dom";
import "../../styles/Billing.css";

function Progress({ used = 0, limit = null }) {
  if (limit == null) {
    return (
      <div className="progress">
        <div className="progress-fill" style={{ width: "100%" }} />
      </div>
    );
  }
  const pct = Math.max(0, Math.min(100, Math.floor((used / Math.max(1, limit)) * 100)));
  return (
    <div className="progress">
      <div className="progress-fill" style={{ width: `${pct}%` }} />
    </div>
  );
}

function StatRow({ label, used = 0, limit = null }) {
  return (
    <tr className="quota-row">
      <td className="quota-cell quota-label">{label}</td>
      <td className="quota-cell quota-count">
        {used} / {limit == null ? "∞" : limit}
        <Progress used={used} limit={limit} />
      </td>
    </tr>
  );
}

function PlanBadge({ plan }) {
  const p = (plan || "FREE").toUpperCase();
  const cls = p === "COACH" ? "coach" : p === "PREMIUM" ? "premium" : "free";
  return <span className={`plan-badge ${cls}`}>{p}</span>;
}

export default function BillingPage() {
  const { quotas, loading, refresh } = useContext(QuotasContext);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
    useEffect(() => {
    // initial + focus + visibilité
    refresh();
    const onFocus = () => refresh();
    const onVisible = () => { if (document.visibilityState === "visible") refresh(); };
    window.addEventListener("focus", onFocus);
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      window.removeEventListener("focus", onFocus);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [refresh]);

  const L = quotas?.limits || {};
  const U = quotas?.usage || {};
  const plan = (quotas?.plan ?? "FREE").toUpperCase();
  const expires = quotas?.plan_expires_at ? new Date(quotas.plan_expires_at) : null;

  const kv = useMemo(
    () => [
      [
        "Plan actuel",
        <>
          <PlanBadge plan={plan} />
          {expires ? (
            <span style={{ marginLeft: 8, color: "var(--muted)" }}>
              (expire le {expires.toLocaleDateString()})
            </span>
          ) : null}
        </>,
      ],
    ],
    [plan, expires]
  );

  const tiers = [
    {
      key: "free",
      title: "Free",
      sub: "Commence sans pression",
      price: "0€",
      per: "/mois",
      feats: ["Accès de base", "Quotas limités", "Pas de sessions d’entraînement (coach)"],
      checkout: false,
    },
    {
      key: "premium_month",
      title: "Premium",
      sub: "Pour pratiquer plus souvent",
      price: "7,99€",
      per: "/mois",
      feats: ["Quotas boostés", "Groupes illimités", "Support prioritaire", "Pas de sessions d’entraînement (coach)"],
      checkout: true,
    },
    {
      key: "coach_month",
      title: "Coach",
      sub: "Crée et gère des entraînements",
      price: "7,99€",
      per: "/mois",
      feats: [
        "Créer des sessions d’entraînement (limitées)",
        "Outils coach & analytics",
        "Gestion d’équipe",
        "Sessions normales illimitées",
      ],
      checkout: true,
    },
  ];

  const isCurrent = (t) => (t.title || "").toUpperCase() === plan;

  const onUpgrade = async (productKey) => {
    setErr("");
    setBusy(true);
    try {
      const url = await createCheckout(productKey);
      if (url) window.location.href = url;
      else setErr("Checkout indisponible.");
    } catch (e) {
      setErr(e?.response?.data?.error || e.message || "Erreur inconnue.");
    } finally {
      setBusy(false);
    }
  };
  const trainingsLimit =
  L?.can_create_trainings
    ? (L?.trainings_create_per_month ?? null) // null => ∞
    : 0; // plan qui n'autorise pas → 0
    
  return (
    <div className="billing-wrapper">
      <div className="billing-head">
        <div>
          <h1 className="billing-title">Abonnement & Limites</h1>
          <div className="billing-sub">Gère ton plan, vois tes quotas et upgrade en 1 clic.</div>
        </div>
        <div className="btns-row">
          <Link to="/profile" className="billing-secondary">Profil</Link>
          <button className="billing-secondary" onClick={refresh} disabled={loading}>Rafraîchir</button>
        </div>
      </div>

      <div className="billing-grid">
        {/* Col gauche: plan actuel + quotas */}
        <div className="panel">
          <div className="panel-head">
            <h3 className="panel-title">Plan & Infos</h3>
            <PlanBadge plan={plan} />
          </div>

          <div className="kv" style={{ marginBottom: 14 }}>
            {kv.map(([k, v]) => (
              <div className="kv-item" key={k}>
                <span className="kv-label">{k}</span>
                <span className="kv-value">{v}</span>
              </div>
            ))}
          </div>

          <div className="panel-head" style={{ marginTop: 6 }}>
            <h3 className="panel-title">Quotas du mois</h3>
          </div>

          {loading ? (
            <div className="billing-sub">Chargement quotas…</div>
          ) : (
           <table className="quota-table">
            <tbody>
                <StatRow
                label="Créations de sessions"
                used={U.sessions_created ?? 0}
                limit={L.sessions_create_per_month}
              />
              
                <StatRow
                  label="Entraînements créés"
                  used={U.trainings_created ?? 0}
                  limit={trainingsLimit}
                />
              <StatRow
                label="Participations aux sessions"
                used={U.participations ?? 0}
                limit={L.sessions_join_per_month}
              />
              <StatRow
                label="Groupes créés"
                used={U.groups_created ?? 0}
                limit={L.max_groups}
              />
            </tbody>
          </table>
          )}
        </div>

        {/* Col droite: pricing / upgrade (3 cartes) */}
        <div className="panel panel-2">
          <div className="panel-head">
            <h3 className="panel-title">Choisir un plan</h3>
          </div>

          {err && <div className="err-text">{err}</div>}

          <div className="pricing-list">
            {tiers.map((t) => {
              const current = isCurrent(t);
              return (
                <div key={t.key} className={`pricing-card ${current ? "current" : ""}`}>
                  <div className="pricing-left">
                    <h4 className="pricing-title">
                      {t.title} {current && <span className="current-chip">Plan actuel</span>}
                    </h4>
                    <div className="pricing-sub">{t.sub}</div>
                    <div className="pricing-feats">
                      {t.feats.map((f) => (
                        <span className="feat" key={f}>
                          {f}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div className="pricing-right">
                    <div className="price">
                      {t.price} <small>{t.per}</small>
                    </div>
                    <div className="btns-row">
                      {t.checkout ? (
                        <button
                          className="billing-primary"
                          onClick={() => onUpgrade(t.key)}
                          disabled={busy || current}
                          title={current ? "Déjà sur ce plan" : "Passer sur ce plan"}
                        >
                          {current ? "Sélectionné" : `Passer ${t.title}`}
                        </button>
                      ) : (
                        <span className="pricing-note">Inclus par défaut • Aucun paiement requis</span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="billing-sub" style={{ marginTop: 12 }}>
            • Le plan <b>Coach</b> permet de <b>créer des sessions d’entraînement</b> (nombre limité).<br />
            • Le plan <b>Premium</b> ne permet pas la création d’entraînements coach, mais offre une création de session illimité.<br />
          </div>
        </div>
      </div>
    </div>
  );
}
