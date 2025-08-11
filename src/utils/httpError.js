// Utilitaire pour extraire un message lisible depuis une erreur Axios/DRF
export function extractApiError(err) {
  const data = err?.response?.data;

  // Pas de payload côté serveur → message Axios
  if (!data) return err?.message || "Erreur inconnue";

  // Chaîne brute
  if (typeof data === "string") return data;

  // Pattern DRF standard
  if (data.detail) return String(data.detail);

  // DRF: non_field_errors en priorité
  if (Array.isArray(data?.non_field_errors) && data.non_field_errors.length) {
    return String(data.non_field_errors[0]);
  }

  // Premier champ + premier message
  if (typeof data === "object") {
    const keys = Object.keys(data);
    if (keys.length) {
      const k = keys[0];
      const v = data[k];
      if (Array.isArray(v) && v.length) return `${k}: ${v[0]}`;
      if (typeof v === "string") return `${k}: ${v}`;
      // nested object → fallback JSON
      try {
        return JSON.stringify(data);
      } catch {
        return "Erreur de validation.";
      }
    }
  }

  return "Erreur de validation.";
}
