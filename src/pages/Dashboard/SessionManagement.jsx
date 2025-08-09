import { useEffect, useState } from "react";
import {
  getAllSessionsAdmin,
  deleteSession,
  updateSession,
} from "../../api/adminService";

export default function SessionManagement() {
  const [sessions, setSessions] = useState([]);
  const [search, setSearch] = useState("");
  const [editingSession, setEditingSession] = useState(null);

  const fetchSessions = () => {
    getAllSessionsAdmin().then(setSessions).catch(console.error);
  };

  useEffect(() => {
    fetchSessions();
  }, []);

  const handleDelete = (id) => {
    if (window.confirm("❌ Supprimer cette session ?")) {
      deleteSession(id).then(fetchSessions).catch(console.error);
    }
  };

  const filteredSessions = sessions.filter((s) =>
    `${s.title} ${s.sport} ${s.location} ${s.date}`
      .toLowerCase()
      .includes(search.toLowerCase())
  );

  return (
    <div>
      <h2>Gestion des sessions</h2>

      {/* Barre de recherche */}
      <input
        type="text"
        placeholder="Rechercher une session..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="search-bar"
      />

      {filteredSessions.length > 0 ? (
        <table className="admin-table">
          <thead>
            <tr>
              <th>Titre</th>
              <th>Sport</th>
              <th>Date</th>
              <th>Lieu</th>
              <th>Max joueurs</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredSessions.map((s) => (
              <tr key={s.id}>
                <td>{s.title}</td>
                <td>{s.sport}</td>
                <td>{s.date}</td>
                <td>{s.location}</td>
                <td>{s.max_players}</td>
                <td>
                  <button
                    className="btn-edit"
                    onClick={() => setEditingSession(s)}
                  >
                    ✏ Modifier
                  </button>
                  <button
                    className="btn-delete"
                    onClick={() => handleDelete(s.id)}
                  >
                    🗑 Supprimer
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <p>Aucune session trouvée.</p>
      )}

      {/* Modal d'édition */}
      {editingSession && (
        <div className="modal-overlay">
          <div className="modal">
            <h3>Modifier la session</h3>
            <label>Titre</label>
            <input
              type="text"
              value={editingSession.title}
              onChange={(e) =>
                setEditingSession({ ...editingSession, title: e.target.value })
              }
            />

            <label>Sport</label>
            <input
              type="text"
              value={editingSession.sport}
              onChange={(e) =>
                setEditingSession({ ...editingSession, sport: e.target.value })
              }
            />

            <label>Date</label>
            <input
              type="date"
              value={editingSession.date}
              onChange={(e) =>
                setEditingSession({ ...editingSession, date: e.target.value })
              }
            />

            <label>Lieu</label>
            <input
              type="text"
              value={editingSession.location}
              onChange={(e) =>
                setEditingSession({
                  ...editingSession,
                  location: e.target.value,
                })
              }
            />

            <label>Max joueurs</label>
            <input
              type="number"
              value={editingSession.max_players}
              onChange={(e) =>
                setEditingSession({
                  ...editingSession,
                  max_players: e.target.value,
                })
              }
            />

            <div className="modal-buttons">
              <button
                className="btn-cancel"
                onClick={() => setEditingSession(null)}
              >
                Annuler
              </button>
              <button
                className="btn-save"
                onClick={() => {
                  updateSession(editingSession.id, editingSession)
                    .then(() => {
                      fetchSessions();
                      setEditingSession(null);
                    })
                    .catch(console.error);
                }}
              >
                Sauvegarder
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
