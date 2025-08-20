// src/pages/Groups/GroupsPage.jsx
import { useEffect, useMemo, useState, useContext } from "react";
import { useTranslation } from "react-i18next";
import { listGroups } from "../../api/groupService";
import { listSports } from "../../api/sportService";
import GroupCard from "../../components/GroupCard";
import { Link } from "react-router-dom";
import { AuthContext } from "../../context/AuthContext";
import "../../styles/GroupsPage.css";
import { QuotasContext } from "../../context/QuotasContext";

/** Peut-il créer un groupe ? Rôle > Quotas */
function canCreateGroupFromQuotasOrRole(user, quotas, quotasLoading) {
  if (!user) return false;

  // 1) Bypass staff/admin
  if (user.is_superuser === true || user.is_staff === true) return true;

  // 2) Rôle premium/coach -> autorisé (sauf si le back dit explicitement non)
  const role = String(user.role || quotas?.plan || "").toUpperCase();
  if (role === "PREMIUM" || role === "COACH") {
    if (quotas?.limits?.can_create_groups === false) return false;
    return true;
  }

  // 3) En attendant les quotas pour un user "FREE" -> on ne décide pas
  if (quotasLoading) return false;

  // 4) Quotas
  const L = quotas?.limits || {};
  const U = quotas?.usage || {};
  if (L.can_create_groups === false) return false;

  const rawLimit = L.max_groups; // null => illimité
  const used = Number(U.groups_created ?? 0);

  const isUnlimited =
    rawLimit == null ||
    rawLimit === -1 ||
    rawLimit === "unlimited" ||
    rawLimit === "∞" ||
    rawLimit === "INF" ||
    rawLimit === "inf" ||
    rawLimit === "infinite" ||
    rawLimit === "None" ||
    rawLimit === "none" ||
    rawLimit === "null" ||
    rawLimit === "";

  if (isUnlimited) return true;

  const limit = Number(rawLimit);
  if (!Number.isFinite(limit)) return true; // tolérant

  return used < limit;
}

export default function GroupsPage() {
  const { t } = useTranslation();
  const { user } = useContext(AuthContext);
  const { quotas, loading: quotasLoading } = useContext(QuotasContext);

  const isVisitor = !user;
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);

  // filtres
  const [q, setQ] = useState("");
  const [sport, setSport] = useState(""); // on stocke l'ID du sport choisi
  const [city, setCity] = useState("");

  // liste des sports pour le select
  const [sports, setSports] = useState([]);
  const [sportsLoading, setSportsLoading] = useState(true);

  const allowCreate = canCreateGroupFromQuotasOrRole(user, quotas, quotasLoading);

  const fetchSports = async () => {
    try {
      setSportsLoading(true);
      const data = await listSports();
      const arr = Array.isArray(data) ? data : [];
      setSports(
        arr
          .filter((s) => s && s.id != null)
          .map((s) => ({ id: s.id, label: s.name || s.label || String(s.id) }))
          .sort((a, b) =>
            a.label.localeCompare(b.label, undefined, { sensitivity: "base" })
          )
      );
    } catch {
      setSports([]);
    } finally {
      setSportsLoading(false);
    }
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      const data = await listGroups({
        q: q || undefined,
        sport: sport || undefined, // envoie toujours l'ID au backend
        city: city || undefined,
      });
      // Exclure les groupes COACH de la liste publique
      const filtered = Array.isArray(data)
        ? data.filter((g) => g.group_type !== "COACH")
        : [];
      setGroups(filtered);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSports();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (quotas) console.debug("[GroupsPage] quotas:", quotas);
  }, [quotas]);

  const onSearch = (e) => {
    e.preventDefault();
    if (isVisitor) return; // 🔒 blocage visiteur
    fetchData();
  };

  const onReset = () => {
    if (isVisitor) return; // 🔒 blocage visiteur
    setQ(""); setSport(""); setCity("");
    setTimeout(fetchData, 0);
  };

  const resultText = useMemo(() => {
    const n = groups.length;
    if (loading) return t("gp_loading");
    return t("gp_results", { count: n });
  }, [groups, loading, t]);

  // Tooltip explicite (utilise le rôle + état de chargement)
  const role = String(user?.role || quotas?.plan || "").toUpperCase();
  const createTitle = isVisitor
    ? t("gp_cta_title_login")
    : quotasLoading
      ? (role === "PREMIUM" || role === "COACH"
          ? t("gp_cta_title_check_premium")
          : t("gp_cta_title_check_quotas"))
      : (quotas?.limits?.can_create_groups === false
          ? t("gp_cta_title_forbidden")
          : t("gp_cta_title_quota_reached"));

  const selectedSportLabel = useMemo(() => {
    const s = sports.find((x) => String(x.id) === String(sport));
    return s?.label || "";
  }, [sports, sport]);

  return (
    <div className="groups-wrap">
      {/* Header */}
      <div className="groups-head">
        <div>
          <h1 className="groups-title">{t("gp_title")}</h1>
          <p className="groups-sub">{t("gp_subtitle")}</p>
        </div>

        {allowCreate ? (
          <Link to="/groups/new" className="btn-primary" title={t("gp_create_title")}>
            {t("gp_create_button")}
          </Link>
        ) : (
          <button
            className="btn-primary btn-disabled"
            disabled
            title={createTitle}
            aria-disabled="true"
            type="button"
          >
            {t("gp_create_button")}
          </button>
        )}
      </div>

      {/* Filtres */}
      <form onSubmit={onSearch} className={`groups-filters ${isVisitor ? "is-disabled" : ""}`}>
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder={t("gp_ph_search")}
          className="gf-input"
          disabled={isVisitor}
        />

        {/* Select des sports (libellés) */}
        <select
          value={sport}
          onChange={(e) => setSport(e.target.value)}
          className="gf-input"
          disabled={isVisitor || sportsLoading || sports.length === 0}
          aria-label={t("gp_ph_sport")}
        >
          <option value="">{t("gp_sport_any", { defaultValue: "Tous les sports" })}</option>
          {sports.map((s) => (
            <option key={s.id} value={String(s.id)}>
              {s.label}
            </option>
          ))}
        </select>

        <input
          value={city}
          onChange={(e) => setCity(e.target.value)}
          placeholder={t("gp_ph_city")}
          className="gf-input"
          disabled={isVisitor}
        />
        <div className="gf-actions">
          <button className="gf-button" type="submit" disabled={isVisitor}>{t("gp_filter")}</button>
          <button className="gf-reset" type="button" onClick={onReset} disabled={isVisitor}>{t("gp_reset")}</button>
        </div>
      </form>

      {/* Résumé résultats */}
      <div className="groups-bar">
        <span className="groups-count">{resultText}</span>
        {(q || sport || city) && (
          <div className="groups-active-filters">
            {q && <span className="chip">{t("gp_chip_q")}: {q}</span>}
            {sport && <span className="chip">{t("gp_chip_sport")}: {selectedSportLabel || sport}</span>}
            {city && <span className="chip">{t("gp_chip_city")}: {city}</span>}
          </div>
        )}
      </div>

      {/* Bandeau visiteur */}
      {isVisitor && (
        <div className="groups-locked-banner">
          <div className="glb-text">
            <strong>{t("gp_preview_strong")}</strong> — {t("gp_preview_text")}
          </div>
          <div className="glb-actions">
            <Link className="btn-primary" to="/login">{t("gp_login")}</Link>
            <Link className="btn-ghost" to="/register">{t("gp_register")}</Link>
          </div>
        </div>
      )}

      {/* Liste / états */}
      {loading ? (
        <div className={`groups-grid ${isVisitor ? "grid-locked" : ""}`}>
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="sk-card" />
          ))}
        </div>
      ) : groups.length ? (
        <div className={`groups-grid ${isVisitor ? "grid-locked" : ""}`}>
          {groups.map((g) => (
            <GroupCard key={g.id} group={g} locked={isVisitor} />
          ))}
        </div>
      ) : (
        <div className="groups-empty">
          <p>{t("gp_empty_filters")}</p>
          <div className="groups-empty-actions">
            <button className="btn-ghost" onClick={onReset} disabled={isVisitor}>{t("gp_reset")}</button>
            {allowCreate ? (
              <Link to="/groups/new" className="btn-primary">{t("gp_create_first")}</Link>
            ) : (
              <button className="btn-primary btn-disabled" disabled aria-disabled="true" type="button">
                {t("gp_create_first")}
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
