import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import LanguageDetector from "i18next-browser-languagedetector";

// Traductions
import en from "./locales/en.json";
import fr from "./locales/fr.json";
import nl from "./locales/nl.json";
import de from "./locales/de.json";

i18n
  .use(LanguageDetector) // détecte langue navigateur
  .use(initReactI18next)
  .init({
    resources: {
      en: { translation: en },
      fr: { translation: fr },
      nl: { translation: nl },
      de: { translation: de },
    },
    lng: "fr",
    fallbackLng: "en",
    interpolation: {
      escapeValue: false,
    },
  });

export default i18n;
