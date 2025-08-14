import { useContext, useMemo } from "react";
import { QuotasContext } from "../context/QuotasContext";
import { createCheckout } from "../api/billingService";

export default function UpgradeCard() {
  const { quotas, loading } = useContext(QuotasContext);

  const rows = useMemo(() => {
    if (!quotas) return [];
    const L = quotas.limits || {};
    const U = quotas.usage || {};
    const fmt = (v) => (v == null ? "∞" : String(v));
    return [
      ["Créations / mois", `${U.sessions_created ?? 0} / ${fmt(L.sessions_create_per_month)}`],
      ["Participations / mois", `${U.sessions_joined ?? 0} / ${fmt(L.sessions_join_per_month)}`],
      ["Groupes actifs max", `${U.groups_joined ?? 0} / ${fmt(L.max_groups_joined)}`],
    ];
  }, [quotas]);

  const onUpgrade = async (key) => {
    try {
      const url = await createCheckout(key);
      if (url) window.location.href = url;
    } catch {
      alert("Erreur de paiement. Réessaie.");
    }
  };

  if (loading) return <div className="card">Chargement du plan…</div>;
  if (!quotas) return null;

  return (
    <div className="card" style={{padding:16, borderRadius:12, boxShadow:"0 2px 8px rgba(0,0,0,.08)"}}>
      <div style={{display:"flex", justifyContent:"space-between", alignItems:"baseline"}}>
        <h3 style={{margin:0}}>Mon plan</h3>
        <div style={{opacity:.8}}>
          {quotas.plan} {quotas.plan_expires_at ? `· jusqu’au ${new Date(quotas.plan_expires_at).toLocaleDateString()}` : ""}
        </div>
      </div>

      <table style={{width:"100%", marginTop:12}}>
        <tbody>
          {rows.map(([k,v]) => (
            <tr key={k}>
              <td style={{padding:"6px 0", opacity:.7}}>{k}</td>
              <td style={{padding:"6px 0", textAlign:"right"}}>{v}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <div style={{display:"flex", gap:8, marginTop:12}}>
        <button onClick={() => onUpgrade("premium_month")} className="btn">Passer Premium</button>
        <button onClick={() => onUpgrade("coach_month")} className="btn btn-outline">Devenir Coach</button>
      </div>
    </div>
  );
}
