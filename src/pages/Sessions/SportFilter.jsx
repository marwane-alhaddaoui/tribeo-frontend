// src/pages/Sessions/SportFilter.jsx
import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { getSports } from "../../api/sessionService";

/* Transforme un label DB en slug stable pour i18n (ex: "Table Tennis" -> "table_tennis") */
function toSlug(s) {
  return String(s || "")
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "") // accents
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

/* Libellé traduit si dispo: t("sports_names.<slug>"), sinon libellé DB */
function useSportLabel() {
  const { t } = useTranslation();
  return (rawName, providedSlug) => {
    const slug = (providedSlug && String(providedSlug).trim())
      ? String(providedSlug).trim().toLowerCase()
      : toSlug(rawName);
    const key = `sports_names.${slug}`;
    const translated = t(key);
    // Si la clé n'existe pas, t(key) renvoie "sports_names.<slug>" → fallback nom DB
    return translated === key ? rawName : translated;
  };
}

export default function SportFilter({ selected, onSelect }) {
  const { t } = useTranslation();
  const labelSport = useSportLabel();

  const [sports, setSports] = useState([]);
  const viewportRef = useRef(null);

  useEffect(() => {
    getSports()
      .then((data) => {
        const arr = Array.isArray(data) ? data : [];
        // On stocke nom DB + slug (priorité au slug DB)
        const mapped = arr.map((s) => {
          const raw = s.name || s.label || s.title || "Unknown";
          const slug =
            (s.slug && String(s.slug).trim())
              ? String(s.slug).trim().toLowerCase()
              : toSlug(raw);
          return { id: s.id, rawName: raw, slug };
        });
        setSports(mapped);
      })
      .catch(() => setSports([]));
  }, []);

  // Scroll horizontal au trackpad/roulette
  useEffect(() => {
    const el = viewportRef.current;
    if (!el) return;
    const onWheel = (e) => {
      if (el.scrollWidth <= el.clientWidth) return;
      const delta = Math.abs(e.deltaY) > Math.abs(e.deltaX) ? e.deltaY : e.deltaX;
      if (delta !== 0) {
        el.scrollLeft += delta;
        e.preventDefault();
      }
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, []);

  return (
    <div
      ref={viewportRef}
      className="sport-filters"
      aria-label={t("sport_filter_aria")}
      style={{
        width: "100%",
        maxWidth: "100%",
        minWidth: 0,
        display: "block",
        overflowX: "auto",
        overflowY: "hidden",
        WebkitOverflowScrolling: "touch",
        touchAction: "pan-x",
      }}
    >
      <div
        className="sport-filters__track"
        style={{
          display: "inline-flex",
          gap: 10,
          padding: 10,
          whiteSpace: "nowrap",
        }}
      >
        {/* Bouton "Tous les sports" */}
        <button
          key="all"
          onClick={() => onSelect("")}
          className={`sport-button ${selected === "" ? "active" : ""}`}
          aria-pressed={selected === ""}
          style={{ flex: "0 0 auto", whiteSpace: "nowrap" }}
          title={t("sport_filter_all_title")}
        >
          {t("sport_filter_all")}
        </button>

        {/* Sports DB → traduction via sports_names.<slug> si dispo */}
        {sports.map((sport) => (
          <button
            key={sport.id}
            onClick={() => onSelect(sport.id)}
            className={`sport-button ${selected === sport.id ? "active" : ""}`}
            aria-pressed={selected === sport.id}
            style={{ flex: "0 0 auto", whiteSpace: "nowrap" }}
            title={t("sport_filter_select_title", { name: labelSport(sport.rawName, sport.slug) })}
          >
            {labelSport(sport.rawName, sport.slug)}
          </button>
        ))}
      </div>
    </div>
  );
}
