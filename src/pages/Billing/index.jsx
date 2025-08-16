// src/pages/Billing/index.jsx
import { useContext, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
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
  const { t } = useTranslation();
  return (
    <tr className="quota-row">
      <td className="quota-cell quota-label">{label}</td>
      <td className="quota-cell quota-count">
        {used} / {limit == null ? t("common.infinity") : limit}
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
  const { t } = useTranslation();
  const { quotas, loading, refresh } = useContext(QuotasContext);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  useEffect(() => {
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
        t("billing.current_plan"),
        <>
          <PlanBadge plan={plan} />
          {expires ? (
            <span style={{ marginLeft: 8, color: "var(--muted)" }}>
              {t("billing.expires_on", { date: expires.toLocaleDateString() })}
            </span>
          ) : null}
        </>,
      ],
    ],
    [plan, expires, t]
  );

  const tiers = [
    {
      key: "free",
      title: t("billing.tiers.free.title"),
      sub: t("billing.tiers.free.sub"),
      price: t("billing.tiers.free.price"),
      per: t("billing.per_month"),
      feats: [
        t("billing.tiers.free.feat_basic"),
        t("billing.tiers.free.feat_quotas"),
        t("billing.tiers.free.feat_no_trainings")
      ],
      checkout: false,
    },
    {
      key: "premium_month",
      title: t("billing.tiers.premium.title"),
      sub: t("billing.tiers.premium.sub"),
      price: t("billing.tiers.premium.price"),
      per: t("billing.per_month"),
      feats: [
        t("billing.tiers.premium.feat_boost"),
        t("billing.tiers.premium.feat_groups"),
        t("billing.tiers.premium.feat_support"),
        t("billing.tiers.premium.feat_no_trainings")
      ],
      checkout: true,
    },
    {
      key: "coach_month",
      title: t("billing.tiers.coach.title"),
      sub: t("billing.tiers.coach.sub"),
      price: t("billing.tiers.coach.price"),
      per: t("billing.per_month"),
      feats: [
        t("billing.tiers.coach.feat_trainings"),
        t("billing.tiers.coach.feat_tools"),
        t("billing.tiers.coach.feat_team_mgmt"),
        t("billing.tiers.coach.feat_sessions_unlimited")
      ],
      checkout: true,
    },
  ];

  const isCurrent = (t0) => (t0.title || "").toUpperCase() === plan;

  const onUpgrade = async (productKey) => {
    setErr("");
    setBusy(true);
    try {
      const url = await createCheckout(productKey);
      if (url) window.location.href = url;
      else setErr(t("billing.checkout_unavailable"));
    } catch (e) {
      setErr(e?.response?.data?.error || e.message || t("billing.unknown_error"));
    } finally {
      setBusy(false);
    }
  };

  const trainingsLimit =
    L?.can_create_trainings
      ? (L?.trainings_create_per_month ?? null) // null => ∞
      : 0;

  return (
    <div className="billing-wrapper">
      <div className="billing-head">
        <div>
          <h1 className="billing-title">{t("billing.title")}</h1>
          <div className="billing-sub">{t("billing.subtitle")}</div>
        </div>
      </div>

      {/* === GRID === */}
      <div className="plans-grid">
        {/* Carte 1 : Mon plan & quotas */}
        <div className="panel card-current">
          <div className="panel-head">
            <h3 className="panel-title">{t("billing.my_plan")}</h3>
            <PlanBadge plan={plan} />
          </div>

          <div className="kv" style={{ marginBottom: 10 }}>
            {kv.map(([k, v]) => (
              <div className="kv-item" key={k}>
                <span className="kv-label">{k}</span>
                <span className="kv-value">{v}</span>
              </div>
            ))}
          </div>

          <div className="panel-head" style={{ marginTop: 6 }}>
            <h3 className="panel-title">{t("billing.monthly_quotas")}</h3>
          </div>

          {loading ? (
            <div className="billing-sub">{t("billing.loading_quotas")}</div>
          ) : (
            <table className="quota-table">
              <tbody>
                <StatRow
                  label={t("billing.q.sessions_created")}
                  used={U.sessions_created ?? 0}
                  limit={L.sessions_create_per_month}
                />
                <StatRow
                  label={t("billing.q.trainings_created")}
                  used={U.trainings_created ?? 0}
                  limit={trainingsLimit}
                />
                <StatRow
                  label={t("billing.q.participations")}
                  used={U.participations ?? 0}
                  limit={L.sessions_join_per_month}
                />
                <StatRow
                  label={t("billing.q.groups_created")}
                  used={U.groups_created ?? 0}
                  limit={L.max_groups}
                />
              </tbody>
            </table>
          )}
        </div>

        {/* Erreur globale */}
        {err && <div className="err-text" style={{ gridColumn: "1 / -1" }}>{err}</div>}

        {/* Cartes plans */}
        {tiers.map((t0) => {
          const current = isCurrent(t0);
          return (
            <div key={t0.key} className={`pricing-card ${current ? "current" : ""}`}>
              <div className="pricing-left">
                <h4 className="pricing-title">
                  {t0.title} {current && <span className="current-chip">{t("billing.current_chip")}</span>}
                </h4>
                <div className="pricing-sub">{t0.sub}</div>
                <div className="pricing-feats">
                  {t0.feats.map((f) => (
                    <span className="feat" key={f}>{f}</span>
                  ))}
                </div>
              </div>
              <div className="pricing-right">
                <div className="price">
                  {t0.price} <small>{t0.per}</small>
                </div>
                <div className="btns-row">
                  {t0.checkout ? (
                    <button
                      className="billing-primary"
                      onClick={() => onUpgrade(t0.key)}
                      disabled={busy || current}
                      title={current ? t("billing.already_on_plan") : t("billing.switch_to_plan", { plan: t0.title })}
                    >
                      {current ? t("billing.selected") : t("billing.switch_to_plan", { plan: t0.title })}
                    </button>
                  ) : (
                    <span className="pricing-note">{t("billing.included_note")}</span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* note explicative */}
      <div className="billing-sub" style={{ marginTop: 12 }}>
        {t("billing.notes.line_coach")}<br />
        {t("billing.notes.line_premium")}
      </div>
    </div>
  );
}
