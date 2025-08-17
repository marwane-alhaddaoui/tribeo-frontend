import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import "../../styles/HomePage.css";

/**
 * Page d’accueil alignée sur les features réelles
 * Toutes les traductions passent par le prefix custom "lp.*"
 */
export default function HomePremium({
  stats,
  partners = [],
  testimonials = [],
  pricing = [],
}) {
  const { t } = useTranslation();
  const hasStats = !!stats && (stats.players || stats.sessions || stats.fillRate);
  const hasPartners = partners.length > 0;
  const hasTestimonials = testimonials.length > 0;
  const hasPricing = pricing.length > 0;

  return (
    <div className="lp">
      {/* ====== HERO ====== */}
      <section className="lp-hero">
        <div className="lp-hero__bg" />
        <div className="lp-hero__content">
          <h1
            className="lp-title"
            dangerouslySetInnerHTML={{ __html: t("lp.hero.title") }}
          />
          <p className="lp-sub">{t("lp.hero.subtitle")}</p>

          <div className="lp-hero__cta">
            <Link to="/register" className="btn primary lg">
              {t("lp.hero.cta_register")}
            </Link>
            <Link to="/sessions" className="btn outline lg">
              {t("lp.hero.cta_sessions")}
            </Link>
          </div>

          {hasStats && (
            <div className="lp-metrics">
              {typeof stats.players !== "undefined" && (
                <Metric num={formatMetric(stats.players)} label={t("lp.metrics.players")} />
              )}
              {typeof stats.sessions !== "undefined" && (
                <Metric num={formatMetric(stats.sessions)} label={t("lp.metrics.sessions")} />
              )}
              {typeof stats.fillRate !== "undefined" && (
                <Metric
                  num={`${stats.fillRate}${String(stats.fillRate).includes("%") ? "" : "%"}`}
                  label={t("lp.metrics.fill_rate")}
                />
              )}
            </div>
          )}
        </div>
      </section>

      {/* ====== TRUST / LOGOS ====== */}
      {hasPartners && (
        <section className="lp-logos">
          <span className="lp-logos__label">{t("lp.partners_label")}</span>
          <div className="lp-logos__row">
            {partners.map((p, i) => (
              <div className="logo-pseudo" key={i}>{p}</div>
            ))}
          </div>
        </section>
      )}

      {/* ====== FEATURES ====== */}
      <section id="features" className="lp-section">
        <h2 className="lp-h2">{t("lp.features.title")}</h2>
        <p className="lp-lead">{t("lp.features.subtitle")}</p>

        <div className="grid-3">
          <Feature icon="⚡" title={t("lp.features.create_session.title")} desc={t("lp.features.create_session.desc")} />
          <Feature icon="🔎" title={t("lp.features.search.title")} desc={t("lp.features.search.desc")} />
          <Feature icon="👥" title={t("lp.features.groups.title")} desc={t("lp.features.groups.desc")} />
          <Feature icon="🏋️" title={t("lp.features.trainings.title")} desc={t("lp.features.trainings.desc")} />
          <Feature icon="🧩" title={t("lp.features.teams.title")} desc={t("lp.features.teams.desc")} />
          <Feature icon="💳" title={t("lp.features.plans.title")} desc={t("lp.features.plans.desc")} />
        </div>
      </section>

      {/* ====== HOW IT WORKS ====== */}
      <section id="how" className="lp-section alt">
        <h2 className="lp-h2">{t("lp.how.title")}</h2>
        <div className="how-steps">
          <Step n="1" title={t("lp.how.steps.1.title")} desc={t("lp.how.steps.1.desc")} />
          <Step n="2" title={t("lp.how.steps.2.title")} desc={t("lp.how.steps.2.desc")} />
          <Step n="3" title={t("lp.how.steps.3.title")} desc={t("lp.how.steps.3.desc")} />
        </div>
      </section>

      {/* ====== SOCIAL PROOF ====== */}
      {hasTestimonials && (
        <section className="lp-section">
          <h2 className="lp-h2">{t("lp.testimonials.title")}</h2>
          <div className="grid-3 testimonials">
            {testimonials.map((tst, i) => (
              <Testi key={i} text={tst.text} user={tst.user} />
            ))}
          </div>
        </section>
      )}

      {/* ====== PRICING ====== */}
      {hasPricing && (
        <section id="pricing" className="lp-section alt">
          <h2 className="lp-h2">{t("lp.pricing.title")}</h2>
          <div className="grid-3 pricing">
            {pricing.map((p, i) => (
              <Price
                key={i}
                badge={p.badge}
                title={p.title}
                price={p.price}
                items={p.items || []}
                hot={!!p.hot}
                cta={p.to && p.ctaLabel ? { to: p.to, label: p.ctaLabel } : null}
              />
            ))}
          </div>
        </section>
      )}

      {/* ====== FINAL CTA ====== */}
      <section className="lp-final">
        <h2 className="lp-final__title">{t("lp.final.title")}</h2>
        <p className="lp-final__sub">{t("lp.final.subtitle")}</p>
        <div className="lp-final__cta">
          <Link to="/register" className="btn primary lg">{t("lp.final.cta_register")}</Link>
          <Link to="/sessions" className="btn outline lg">{t("lp.final.cta_sessions")}</Link>
        </div>
      </section>

      <footer className="lp-footer">
        <div className="lp-footer__inner">
          <span>© {new Date().getFullYear()} Tribeo</span>
          <nav className="lp-footer__links">
            <a href="#features">{t("lp.footer.features")}</a>
            <a href="#how">{t("lp.footer.how")}</a>
            {hasPricing && <a href="#pricing">{t("lp.footer.pricing")}</a>}
            <Link to="/login">{t("lp.footer.login")}</Link>
          </nav>
        </div>
      </footer>
    </div>
  );
}

/* ====== MINI SUB-COMPOS ====== */
function Metric({ num, label }) {
  return (
    <div className="metric">
      <div className="metric__num">{num}</div>
      <div className="metric__label">{label}</div>
    </div>
  );
}
function Feature({ title, desc, icon }) {
  return (
    <div className="feature">
      <div className="feature__icon">{icon}</div>
      <div className="feature__title">{title}</div>
      <div className="feature__desc">{desc}</div>
    </div>
  );
}
function Step({ n, title, desc }) {
  return (
    <div className="step">
      <div className="step__n">{n}</div>
      <div className="step__body">
        <div className="step__title">{title}</div>
        <div className="step__desc">{desc}</div>
      </div>
    </div>
  );
}
function Testi({ text, user }) {
  return (
    <div className="testi">
      <p className="testi__text">“{text}”</p>
      <p className="testi__user">{user}</p>
    </div>
  );
}
function Price({ badge, title, price, items = [], hot = false, cta }) {
  return (
    <div className={`price ${hot ? "price--hot" : ""}`}>
      {badge && <div className="price__badge">{badge}</div>}
      <div className="price__title">{title}</div>
      <div className="price__price">{price}</div>
      <ul className="price__list">
        {items.map((it, i) => <li key={i}>{it}</li>)}
      </ul>
      {cta && (
        <Link to={cta.to} className={`btn ${hot ? "primary" : "outline"}`}>
          {cta.label}
        </Link>
      )}
    </div>
  );
}

/* ====== helpers ====== */
function formatMetric(v) {
  if (typeof v === "number") {
    if (v >= 1_000_000) return `${(v/1_000_000).toFixed(1)}M+`;
    if (v >= 1_000)    return `${(v/1_000).toFixed(1)}k+`;
    return v.toString();
  }
  return v;
}
