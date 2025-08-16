import { useTranslation } from "react-i18next";
import { Globe } from "lucide-react";

export default function LanguageSwitcher({ onClick }) {
  const { i18n } = useTranslation();
  const toggle = () => {
    const next = i18n.language?.startsWith("fr") ? "en" : "fr";
    i18n.changeLanguage(next);
    if (onClick) onClick();
  };

  // réutilise les styles boutons de ta nav (.header__nav button)
  return (
    <button
      onClick={toggle}
      className="lang-switcher"
      title={i18n.language?.startsWith("fr") ? "Switch to English" : "Passer en français"}
      aria-label={i18n.language?.startsWith("fr") ? "Switch to English" : "Passer en français"}
    >
      <Globe size={16} />
      <span className="lang-code">{i18n.language?.toUpperCase() || "FR"}</span>
    </button>
  );
}
