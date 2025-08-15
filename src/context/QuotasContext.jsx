import { createContext, useContext, useEffect, useState, useCallback } from "react";
import { getQuotas } from "../api/billingService";
import { AuthContext } from "./AuthContext";

/**
 * quotas = {
 *   plan: "FREE"|"PREMIUM"|"COACH"|...,
 *   plan_expires_at: Date|null,
 *   limits: {
 *     sessions_create_per_month: number|null,
 *     sessions_join_per_month:   number|null,
 *     max_groups:                number|null,
 *     can_create_groups:         boolean|null,
 *     trainings_create_per_month:number|null,
 *     can_create_trainings:      boolean|null
 *   },
 *   usage: {
 *     sessions_created:  number,
 *     participations:    number,
 *     groups_created:    number,
 *     trainings_created: number
 *   }
 * }
 */
function clamp(n) { return n < 0 ? 0 : n; }

export const QuotasContext = createContext({
  quotas: null,
  refresh: async () => {},
  bumpUsage: () => {},
  loading: false,
  error: null,
  getCreateAllowance: () => ({ limit: null, used: 0, allowed: true, reason: null }),
});

function coerceBool(v) {
  if (typeof v === "boolean") return v;
  if (typeof v === "string") {
    const s = v.trim().toLowerCase();
    if (["true","1","yes","y"].includes(s))  return true;
    if (["false","0","no","n"].includes(s)) return false;
  }
  return v == null ? null : Boolean(v);
}

function coerceLimitNumber(v) {
  // valeurs “illimitées”
  const unlimitedSet = new Set([
    null, undefined, -1,
    "unlimited", "∞", "inf", "infinite", "none", "null", ""
  ]);
  if (typeof v === "string" && unlimitedSet.has(v.trim().toLowerCase())) return null;
  if (unlimitedSet.has(v)) return null;

  const n = Number(v);
  return Number.isFinite(n) ? n : null; // non numérique → illimité
}

function coerceUsageNumber(v) {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

/** Ancien format (fallback) */
function normalizeFromOldFormat(raw) {
  const q = raw?.quotas || {};
  return {
    plan: (raw?.plan || "FREE").toUpperCase(),
    plan_expires_at: null,
    limits: {
      sessions_create_per_month: coerceLimitNumber(q.max_sessions),
      sessions_join_per_month:   coerceLimitNumber(q.max_participations),
      max_groups:                coerceLimitNumber(q.max_groups),
      can_create_groups:         coerceBool(q.can_create_groups),
      // anciens payloads n’avaient pas de training
      trainings_create_per_month: null,
      can_create_trainings:       null,
    },
    usage: {
      sessions_created:  0,
      participations:    0,
      groups_created:    0,
      trainings_created: 0,
    },
  };
}

/** Nouveau format (serializer quotas du backend) */
function normalizeFromNewFormat(raw) {
  const L = raw?.limits || {};
  const U = raw?.usage || {};
  return {
    plan: (raw?.plan || "FREE").toUpperCase(),
    plan_expires_at: raw?.plan_expires_at ?? null,
    limits: {
      sessions_create_per_month:  coerceLimitNumber(L.sessions_create_per_month),
      sessions_join_per_month:    coerceLimitNumber(L.sessions_join_per_month),
      max_groups:                 coerceLimitNumber(L.max_groups),
      can_create_groups:          coerceBool(L.can_create_groups),
      // NEW — training
      trainings_create_per_month: coerceLimitNumber(
        L.trainings_create_per_month ?? L.max_trainings
      ),
      can_create_trainings:       coerceBool(
        L.can_create_trainings ?? (L.trainings_create_per_month != null)
      ),
    },
    usage: {
      sessions_created:  coerceUsageNumber(U.sessions_created),
      participations:    coerceUsageNumber(U.participations ?? U.sessions_joined),
      groups_created:    coerceUsageNumber(U.groups_created ?? U.groups_joined),
      trainings_created: coerceUsageNumber(U.trainings_created),
    },
  };
}

export const QuotasProvider = ({ children }) => {
  const { token } = useContext(AuthContext);
  const [quotas, setQuotas] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setErr] = useState(null);

  const refresh = useCallback(async () => {
    if (!token) { setQuotas(null); return; }
    try {
      setLoading(true);
      setErr(null);
      const raw = await getQuotas();

      let normalized;
      if (raw?.limits) {
        // Nouveau format (serializer quotas)
        normalized = normalizeFromNewFormat(raw);
      } else {
        // Ancien format (QuotasView)
        normalized = normalizeFromOldFormat(raw);
      }

      setQuotas(normalized);
    } catch (e) {
      setErr(e);
    } finally {
      setLoading(false);
    }
  }, [token]);

  // Update optimiste: bouge l'UI tout de suite, puis re-sync silencieux
  const bumpUsage = useCallback((delta) => {
    setQuotas((prev) => {
      if (!prev) return prev;
      const u = prev.usage || {};
      return {
        ...prev,
        usage: {
          sessions_created:  clamp((u.sessions_created  ?? 0) + (delta.sessions_created  ?? 0)),
          participations:    clamp((u.participations    ?? 0) + (delta.participations    ?? 0)),
          groups_created:    clamp((u.groups_created    ?? 0) + (delta.groups_created    ?? 0)),
          // NEW — training
          trainings_created: clamp((u.trainings_created ?? 0) + (delta.trainings_created ?? 0)),
        }
      };
    });
    // petit re-sync pour coller au back
    setTimeout(() => { refresh(); }, 1000);
  }, [refresh]);

  // Helper pratique pour les écrans de création
  // Retourne {limit, used, allowed, reason}
  const getCreateAllowance = useCallback((eventType) => {
    const L = quotas?.limits || {};
    const U = quotas?.usage  || {};
    const isTraining = String(eventType || "").toUpperCase() === "TRAINING";

    const limit = isTraining
      ? (L.trainings_create_per_month ?? L.sessions_create_per_month)
      : L.sessions_create_per_month;

    const used  = isTraining
      ? (U.trainings_created ?? U.sessions_created ?? 0)
      : (U.sessions_created ?? 0);

    const allowedByFlag  = isTraining ? (L.can_create_trainings !== false) : true;
    const allowedByCount = (limit == null) || (Number(used) < Number(limit));

    return {
      limit,
      used,
      allowed: Boolean(allowedByFlag && allowedByCount),
      reason: !allowedByFlag
        ? "plan_disallows_training"
        : (!allowedByCount ? "quota_exceeded" : null),
    };
  }, [quotas]);

  useEffect(() => { refresh(); }, [refresh]);

  // Bus global: les services (join/leave/create) peuvent déclencher un refresh
  useEffect(() => {
    const h = () => refresh();
    window.addEventListener("quotas:refresh", h);
    return () => window.removeEventListener("quotas:refresh", h);
  }, [refresh]);

  return (
    <QuotasContext.Provider value={{ quotas, refresh, bumpUsage, loading, error, getCreateAllowance }}>
      {children}
    </QuotasContext.Provider>
  );
};
