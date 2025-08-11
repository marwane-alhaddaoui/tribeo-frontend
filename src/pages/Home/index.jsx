import { Link } from "react-router-dom";
import "../../styles/HomePage.css";

/**
 * Composant d'accueil sans données fake.
 * Passe des props réelles pour afficher les sections optionnelles.
 *
 * @param {Object} props
 * @param {Object} [props.stats]   - { players: number, sessions: number, fillRate: string|number }
 * @param {Array}  [props.partners]- tableau de noms/logos (strings) ex: ["Club Five", "RunCrew"]
 * @param {Array}  [props.testimonials] - [{ text, user }]
 * @param {Array}  [props.pricing] - [{ badge?, title, price, items: string[], hot?, to, ctaLabel }]
 */
export default function HomePremium({
  stats,
  partners = [],
  testimonials = [],
  pricing = [],
}) {
  const hasStats = stats && (stats.players || stats.sessions || stats.fillRate);
  const hasPartners = partners.length > 0;
  const hasTestimonials = testimonials.length > 0;
  const hasPricing = pricing.length > 0;

  return (
    <div className="lp">
      {/* ====== HERO ====== */}
      <section className="lp-hero">
        <div className="lp-hero__bg" />
        <div className="lp-hero__content">
          <h1 className="lp-title">
            Organise. <span className="accent">Rejoins.</span> Performe.
          </h1>
          <p className="lp-sub">
            La plateforme moderne pour gérer tes sessions sportives, trouver des partenaires
            et piloter ta communauté — sans blabla, juste ce qu’il faut.
          </p>

          <div className="lp-hero__cta">
            <Link to="/register" className="btn primary lg">Créer mon compte</Link>
            <Link to="/sessions" className="btn outline lg">Voir les sessions</Link>
          </div>

          {hasStats && (
            <div className="lp-metrics">
              {typeof stats.players !== "undefined" && (
                <Metric num={formatMetric(stats.players)} label="Joueurs" />
              )}
              {typeof stats.sessions !== "undefined" && (
                <Metric num={formatMetric(stats.sessions)} label="Sessions" />
              )}
              {typeof stats.fillRate !== "undefined" && (
                <Metric num={`${stats.fillRate}${String(stats.fillRate).toString().includes("%") ? "" : "%"}`} label="Taux de remplissage" />
              )}
            </div>
          )}
        </div>
      </section>

      {/* ====== TRUST / LOGOS (affiché seulement si partners) ====== */}
      {hasPartners && (
        <section className="lp-logos">
          <span className="lp-logos__label">Ils utilisent Tribeo</span>
          <div className="lp-logos__row">
            {partners.map((p, i) => (
              <div className="logo-pseudo" key={i}>{p}</div>
            ))}
          </div>
        </section>
      )}

      {/* ====== FEATURES ====== */}
      <section id="features" className="lp-section">
        <h2 className="lp-h2">Pensé pour les joueurs et les coachs</h2>
        <p className="lp-lead">Tout ce qu’il faut pour organiser, remplir et suivre tes sessions.</p>

        <div className="grid-3">
          <Feature icon="⚡"  title="Création éclair" desc="Crée une session en quelques secondes avec capacité, visibilité et règles." />
          <Feature icon="🎯"  title="Matching intelligent" desc="Trouve des partenaires compatibles selon sport, niveau et disponibilités." />
          <Feature icon="🗺️" title="Carto & proximité" desc="Carte intégrée, filtres, et itinéraires immédiats." />
          <Feature icon="🧩" title="Gestion des équipes" desc="Répartition, ajustements visuels, équilibre des matchs." />
          <Feature icon="🔔" title="Notifications" desc="Rappels utiles, confirmations et changements." />
          <Feature icon="📈" title="Statistiques" desc="Historique, assiduité, taux de remplissage, partenaires réguliers." />
        </div>
      </section>

      {/* ====== HOW IT WORKS ====== */}
      <section id="how" className="lp-section alt">
        <h2 className="lp-h2">Comment ça marche</h2>
        <div className="how-steps">
          <Step n="1" title="Crée ta session" desc="Titre, sport, lieu, date, capacité — c’est prêt." />
          <Step n="2" title="Partage & remplis" desc="Invitations privées ou découverte publique." />
          <Step n="3" title="Joue & mesure" desc="Check-in, équipes équilibrées, stats automatiques." />
        </div>
      </section>

      {/* ====== SOCIAL PROOF (affiché seulement si testimonials) ====== */}
      {hasTestimonials && (
        <section className="lp-section">
          <h2 className="lp-h2">Ce que la communauté dit</h2>
          <div className="grid-3 testimonials">
            {testimonials.map((t, i) => (
              <Testi key={i} text={t.text} user={t.user} />
            ))}
          </div>
        </section>
      )}

      {/* ====== PRICING (affiché seulement si pricing) ====== */}
      {hasPricing && (
        <section id="pricing" className="lp-section alt">
          <h2 className="lp-h2">Tarifs</h2>
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
        <h2 className="lp-final__title">Prêt à lancer ta prochaine session ?</h2>
        <p className="lp-final__sub">Rejoins Tribeo gratuitement et passe au niveau supérieur.</p>
        <div className="lp-final__cta">
          <Link to="/register" className="btn primary lg">Créer mon compte</Link>
          <Link to="/sessions" className="btn outline lg">Voir les sessions</Link>
        </div>
      </section>

      <footer className="lp-footer">
        <div className="lp-footer__inner">
          <span>© {new Date().getFullYear()} Tribeo</span>
          <nav className="lp-footer__links">
            <a href="#features">Fonctionnalités</a>
            <a href="#how">Comment</a>
            {hasPricing && <a href="#pricing">Tarifs</a>}
            <Link to="/login">Connexion</Link>
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
      {cta && <Link to={cta.to} className={`btn ${hot ? "primary" : "outline"}`}>{cta.label}</Link>}
    </div>
  );
}

/* ====== helpers ====== */
function formatMetric(v) {
  if (typeof v === "number") {
    if (v >= 1000000) return `${(v/1_000_000).toFixed(1)}M+`;
    if (v >= 1000)    return `${(v/1000).toFixed(1)}k+`;
    return v.toString();
  }
  return v; // string déjà formatée
}
