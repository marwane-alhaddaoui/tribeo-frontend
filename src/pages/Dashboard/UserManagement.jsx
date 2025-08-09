import { useEffect, useState } from "react";
import { getAllUsers, deleteUser, updateUser } from "../../api/adminService";

import "../../styles/AdminModal.css";

export default function UserManagement() {
  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState("");
  const [editingUser, setEditingUser] = useState(null);

  const fetchUsers = () => {
    getAllUsers().then(setUsers).catch(console.error);
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleDelete = (id) => {
    if (window.confirm("❌ Supprimer cet utilisateur ?")) {
      deleteUser(id).then(fetchUsers).catch(console.error);
    }
  };

  const filteredUsers = users.filter((u) =>
    `${u.first_name} ${u.last_name} ${u.email}`
      .toLowerCase()
      .includes(search.toLowerCase())
  );

  return (
    <div>
      <h2>Gestion des utilisateurs</h2>

      {/* Barre de recherche */}
      <input
        type="text"
        placeholder="Rechercher un utilisateur..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="search-bar"
      />

      {filteredUsers.length > 0 ? (
        <table className="admin-table">
          <thead>
            <tr>
              <th>Prénom</th>
              <th>Nom</th>
              <th>Email</th>
              <th>Rôle</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredUsers.map((u) => (
              <tr key={u.id}>
                <td>{u.first_name}</td>
                <td>{u.last_name}</td>
                <td>{u.email}</td>
                <td>{u.role}</td>
                <td>
                  <button
                    className="btn-edit"
                    onClick={() => setEditingUser(u)}
                  >
                    ✏ Modifier
                  </button>
                  <button
                    className="btn-delete"
                    onClick={() => handleDelete(u.id)}
                  >
                    🗑 Supprimer
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <p>Aucun utilisateur trouvé.</p>
      )}

      {/* Modal d'édition */}
      {editingUser && (
        <div className="modal-overlay">
          <div className="modal">
            <h3>Modifier l'utilisateur</h3>
            <label>Prénom</label>
            <input
              type="text"
              value={editingUser.first_name}
              onChange={(e) =>
                setEditingUser({ ...editingUser, first_name: e.target.value })
              }
            />

            <label>Nom</label>
            <input
              type="text"
              value={editingUser.last_name}
              onChange={(e) =>
                setEditingUser({ ...editingUser, last_name: e.target.value })
              }
            />

            <label>Email</label>
            <input
              type="email"
              value={editingUser.email}
              onChange={(e) =>
                setEditingUser({ ...editingUser, email: e.target.value })
              }
            />

            <label>Rôle</label>
            <select
              value={editingUser.role}
              onChange={(e) =>
                setEditingUser({ ...editingUser, role: e.target.value })
              }
            >
              <option value="admin">Admin</option>
              <option value="coach">Coach</option>
              <option value="user">User</option>
            </select>

            <div className="modal-buttons">
              <button
                className="btn-cancel"
                onClick={() => setEditingUser(null)}
              >
                Annuler
              </button>
              <button
                className="btn-save"
                onClick={() => {
                  updateUser(editingUser.id, editingUser)
                    .then(() => {
                      fetchUsers();
                      setEditingUser(null);
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
