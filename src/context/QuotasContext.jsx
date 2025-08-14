import { createContext, useContext, useEffect, useState, useCallback } from "react";
import { getQuotas } from "../api/billingService";
import { AuthContext } from "./AuthContext";

export const QuotasContext = createContext({ quotas:null, refresh:async()=>{}, loading:false, error:null });

export const QuotasProvider = ({ children }) => {
  const { user, token } = useContext(AuthContext);
  const [quotas, setQuotas] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setErr] = useState(null);

  const refresh = useCallback(async () => {
  if (!token) { setQuotas(null); return; }
  try {
    setLoading(true);
    setErr(null);
    const raw = await getQuotas();

    // Normalisation pour supporter l'ancien format {plan, quotas:{...}}
    let normalized = raw;
    if (!raw?.limits) {
      const q = raw?.quotas || {};
      normalized = {
        plan: raw?.plan || "free",
        plan_expires_at: null,
        limits: {
          sessions_create_per_month: q.max_sessions ?? null,
          sessions_join_per_month:   q.max_participations ?? null,
          max_groups_joined:         q.max_groups ?? null,
        },
        // Pas d'usage détaillé côté back → valeurs safe
        usage: {
          sessions_created: 0,
          sessions_joined:  0,
          groups_joined:    0,
        },
      };
    }

    setQuotas(normalized);
  } catch (e) {
    setErr(e);
  } finally {
    setLoading(false);
  }
}, [token]);

  useEffect(() => { refresh(); }, [refresh]);

  return (
    <QuotasContext.Provider value={{ quotas, refresh, loading, error }}>
      {children}
    </QuotasContext.Provider>
  );
};
