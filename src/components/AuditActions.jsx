// src/admin/components/AuditActions.jsx
import { exportAuditCsv, deleteAuditLogs } from "../api/adminService";

export default function AuditActions() {
  const handleExport = async () => {
    try {
      const { blob, filename } = await exportAuditCsv();
      const url = URL.createObjectURL(new Blob([blob], { type: "text/csv;charset=utf-8" }));
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (e) {
      console.error(e);
      alert("❌ Export échoué.");
    }
  };

  const handleDelete = async () => {
    if (!window.confirm("⚠️ Supprimer *tous* les logs ? Action irréversible.")) return;
    try {
      const r = await deleteAuditLogs();
      alert(`✅ Logs supprimés: ${r?.deleted ?? 0}`);
    } catch (e) {
      console.error(e);
      alert("❌ Suppression échouée.");
    }
  };

  return (
    <div style={{ display: "flex", gap: 8 }}>
      <button
        onClick={handleExport}
        className="px-3 py-2 rounded bg-blue-600 text-white hover:opacity-90"
      >
        Export Logs
      </button>
      <button
        onClick={handleDelete}
        className="px-3 py-2 rounded bg-red-600 text-white hover:opacity-90"
      >
        Delete Logs
      </button>
    </div>
  );
}
