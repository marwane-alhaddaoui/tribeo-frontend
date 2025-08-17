import { useTranslation } from "react-i18next";
import { Globe, Check } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";

/**
 * LanguageSwitcher
 * - Menu déroulant (desktop & mobile-friendly)
 * - Navigation clavier: Enter/Espace pour ouvrir, ↑/↓ pour parcourir, Enter pour choisir, Esc pour fermer
 * - Clic extérieur pour fermer
 * - Persistance dans localStorage
 * - Support RTL automatique pour langues RTL (ex: ar)
 *
 * Props:
 * - languages?: [{ code: string; label: string }]   // Optionnel — sinon défaut fr/en/nl/de
 * - onChange?: (code: string) => void               // Optionnel — callback après changement
 * - className?: string                              // Optionnel — styles de bouton/container
 */
export default function LanguageSwitcher({
  languages,
  onChange,
  className = "",
}) {
  const { i18n } = useTranslation();
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const rootRef = useRef(null);
  const buttonRef = useRef(null);
  const listRef = useRef(null);

  // Langues disponibles (ordre d’affichage)
  const langs = useMemo(
    () =>
      languages?.length
        ? languages
        : [
            { code: "fr", label: "FR" },
            { code: "en", label: "EN" },
            { code: "nl", label: "NE" },
            { code: "de", label: "DE" },
            // Ajoute ici si tu veux, ex: { code: "ar", label: "العربية" }
          ],
    [languages]
  );

  // Langue courante (normalisation ex: "fr-BE" -> "fr")
  const current = (i18n.language || "fr").toLowerCase();
  const currentBase = current.split("-")[0]; // "fr-BE" -> "fr"

  // Détecte si RTL
  const isRTL = useMemo(() => {
    const rtlSet = new Set(["ar", "fa", "he", "ur"]);
    return rtlSet.has(currentBase);
  }, [currentBase]);

  // Applique la direction RTL/LTR au document si besoin
  useEffect(() => {
    if (typeof document !== "undefined") {
      document.dir = isRTL ? "rtl" : "ltr";
    }
  }, [isRTL]);

  // Persistance localStorage (facultatif mais pratique)
  useEffect(() => {
    try {
      const saved = localStorage.getItem("lang");
      if (saved && saved !== current) {
        // Si tu veux forcer le chargement initial depuis localStorage, décommente
        // i18n.changeLanguage(saved);
      }
    } catch (_) {}
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const openMenu = () => {
    setOpen(true);
    // index actif = langue courante
    const idx = langs.findIndex((l) => current.startsWith(l.code));
    setActiveIndex(idx >= 0 ? idx : 0);
  };
  const closeMenu = () => {
    setOpen(false);
    setActiveIndex(-1);
    buttonRef.current?.focus();
  };

  const changeLang = (code) => {
    i18n.changeLanguage(code);
    try {
      localStorage.setItem("lang", code);
    } catch (_) {}
    onChange?.(code);
    setOpen(false);
  };

  // Clic extérieur
  useEffect(() => {
    const onDocClick = (e) => {
      if (!open) return;
      if (rootRef.current && !rootRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, [open]);

  // Clavier sur le bouton
  const onButtonKeyDown = (e) => {
    if (e.key === "ArrowDown" || e.key === "ArrowUp" || e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      if (!open) openMenu();
      else if (e.key === "ArrowDown") {
        setActiveIndex((i) => (i + 1) % langs.length);
      } else if (e.key === "ArrowUp") {
        setActiveIndex((i) => (i - 1 + langs.length) % langs.length);
      }
    }
  };

  // Clavier sur la liste
  const onListKeyDown = (e) => {
    if (e.key === "Escape") {
      e.preventDefault();
      closeMenu();
      return;
    }
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((i) => (i + 1) % langs.length);
      return;
    }
    if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((i) => (i - 1 + langs.length) % langs.length);
      return;
    }
    if (e.key === "Home") {
      e.preventDefault();
      setActiveIndex(0);
      return;
    }
    if (e.key === "End") {
      e.preventDefault();
      setActiveIndex(langs.length - 1);
      return;
    }
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      const chosen = langs[activeIndex] || langs[0];
      changeLang(chosen.code);
    }
  };

  const title =
    currentBase === "fr"
      ? "Changer de langue"
      : currentBase === "nl"
      ? "Taal wijzigen"
      : currentBase === "de"
      ? "Sprache wechseln"
      : "Change language";

  const ariaLabel = title;

  return (
    <div ref={rootRef} className={`lang-switcher ${className}`} data-open={open ? "true" : "false"}>
      <button
        ref={buttonRef}
        type="button"
        className="lang-btn"
        onClick={() => (open ? closeMenu() : openMenu())}
        onKeyDown={onButtonKeyDown}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={ariaLabel}
        title={title}
      >
        <Globe size={16} aria-hidden="true" />
        <span className="lang-code">{(currentBase || "fr").toUpperCase()}</span>
      </button>

      {open && (
        <ul
          ref={listRef}
          className="lang-menu"
          role="listbox"
          aria-label={title}
          tabIndex={-1}
          onKeyDown={onListKeyDown}
        >
          {langs.map((lang, idx) => {
            const selected = current.startsWith(lang.code);
            const focused = idx === activeIndex;
            return (
              <li key={lang.code} role="option" aria-selected={selected}>
                <button
                  type="button"
                  className={`lang-option ${selected ? "active" : ""} ${focused ? "focused" : ""}`}
                  onMouseEnter={() => setActiveIndex(idx)}
                  onClick={() => changeLang(lang.code)}
                >
                  <span className="lang-label">{lang.label}</span>
                  {selected && <Check size={14} className="lang-check" aria-hidden="true" />}
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
