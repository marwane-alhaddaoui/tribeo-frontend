// src/components/LocationFilter.jsx
import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import "../../styles/SessionPage.css";

/* Helpers de normalisation */
const norm = (s) => String(s ?? "").trim();
const key = (s) => norm(s).toLowerCase();

/* Extraction robuste ville/pays depuis divers schémas */
function extractCountryCity(s = {}) {
  let country =
    s.country || s.country_name || s.countryCode || s.country_code || s.location_country || "";
  let city =
    s.city || s.town || s.locality || s.location_city || "";

  // Fallback très simple depuis address/location "Ville, Pays"
  const addr = s.address || s.location || "";
  if ((!country || !city) && addr) {
    const parts = addr.split(",").map((p) => norm(p));
    if (parts.length >= 2) {
      if (!country) country = parts[parts.length - 1];
      if (!city) city = parts[parts.length - 2] || parts[0];
    } else if (parts.length === 1 && !city) {
      city = parts[0];
    }
  }

  // Nettoyage basique
  country = norm(country);
  city = norm(city);

  return { country, city };
}

export default function LocationFilter({ sessions = [], country, city, onChange, disabled }) {
  const { t, i18n } = useTranslation();
  const collator = new Intl.Collator(i18n.language || "en", { sensitivity: "base" });

  // Liste des pays possibles à partir des sessions déjà fetchées
  const countries = useMemo(() => {
    const set = new Map();
    (sessions || []).forEach((s) => {
      const { country } = extractCountryCity(s);
      if (country) set.set(key(country), country);
    });
    return Array.from(set.values()).sort(collator.compare);
  }, [sessions, collator]);

  // Liste des villes dépendante du pays choisi (ou toutes si aucun pays)
  const cities = useMemo(() => {
    const set = new Map();
    (sessions || []).forEach((s) => {
      const loc = extractCountryCity(s);
      if (country && key(loc.country) !== key(country)) return;
      if (loc.city) set.set(key(loc.city), loc.city);
    });
    return Array.from(set.values()).sort(collator.compare);
  }, [sessions, country, collator]);

  const handleCountry = (e) => {
    const nextCountry = e.target.value || "";
    // reset city si elle n'existe pas dans le nouveau pays
    const validCity = cities.some((c) => key(c) === key(city)) ? city : "";
    onChange?.({ country: nextCountry, city: nextCountry ? "" : validCity });
  };

  const handleCity = (e) => {
    onChange?.({ country, city: e.target.value || "" });
  };

  return (
    <div className={`location-filters ${disabled ? "is-disabled" : ""}`}>
      <select
        className="select-pill"
        value={country}
        onChange={handleCountry}
        disabled={disabled}
        aria-label={t("location_filter.aria_country")}
      >
        <option value="">{t("location_filter.country_all")}</option>
        {countries.map((c) => (
          <option key={c} value={c}>{c}</option>
        ))}
      </select>

      <select
        className="select-pill"
        value={city}
        onChange={handleCity}
        disabled={disabled || (!country && cities.length === 0)}
        aria-label={t("location_filter.aria_city")}
      >
        <option value="">
          {country ? t("location_filter.city_all_in_country") : t("location_filter.city_all")}
        </option>
        {cities.map((v) => (
          <option key={v} value={v}>{v}</option>
        ))}
      </select>
    </div>
  );
}

/* Optionnel: export util pour réutiliser côté page */
export { extractCountryCity };
