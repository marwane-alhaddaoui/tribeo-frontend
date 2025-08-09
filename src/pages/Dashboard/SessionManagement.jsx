import { useEffect, useState } from "react";
import { getAllSessionsAdmin, deleteSession, updateSession } from "../../api/adminService";
import "../../styles/AdminModal.css"; // ✅ On le crée juste après

export default function SessionManagement() {
  const [sessions, setSessions] = useState([]);
  const [editingSession, setEditingSession] = useState(null); // session en cours d'édition
  const [formData, setFormData] = useState({});

  const fetchSessions = () => {
    getAllSessionsAdmin().then(setSessions).catch(console.error);
  };

  const handleDelete = (id) => {
    if (window.confirm("❌ Supprimer cette session ?")) {
      deleteSession(id).then(fetchSessions).catch(console.error);
    }
  };

  const handleEditClick = (session) => {
    setEditingSession(session);
    setFormData(session);
  };

  const handleCloseModal = () => {
    setEditingSession(null);
    setFormData({});
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSave = () => {
    updateSession(editingSession.id, formData)
      .then(() => {
        fetchSessions();
        handleCloseModal();
      })
      .catch(console.error);
  };

  useEffect(() => {
    fetchSessions();
  }, []);

  return (
    <div>
      <h2>Liste des sessions</h2>
      {sessions.length > 0 ? (
        <table className="admin-table">
          <thead>
            <tr>
              <th>Titre</th>
              <th>Sport</th>
              <th>Date</th>
              <th>Lieu</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {sessions.map((s) => (
              <tr key={s.id}>
                <td>{s.title}</td>
                <td>{s.sport}</td>
                <td>{s.date}</td>
                <td>{s.location}</td>
                <td>
                  <button className="btn-delete" onClick={() => handleDelete(s.id)}>🗑 Supprimer</button>
                  <button className="btn-edit" onClick={() => handleEditClick(s)}>✏ Modifier</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <p>Aucune session trouvée.</p>
      )}

      {/* ✅ Modal d'édition */}
      {editingSession && (
        <div className="modal-overlay">
          <div className="modal">
            <h3>Modifier la session</h3>
            <label>
              Titre :
              <input type="text" name="title" value={formData.title || ""} onChange={handleChange} />
            </label>
            <label>
              Sport :
              <input type="text" name="sport" value={formData.sport || ""} onChange={handleChange} />
            </label>
            <label>
              Date :
              <input type="date" name="date" value={formData.date || ""} onChange={handleChange} />
            </label>
            <label>
              Lieu :
              <input type="text" name="location" value={formData.location || ""} onChange={handleChange} />
            </label>

            <div className="modal-buttons">
              <button className="btn-cancel" onClick={handleCloseModal}>Annuler</button>
              <button className="btn-save" onClick={handleSave}>💾 Sauvegarder</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
