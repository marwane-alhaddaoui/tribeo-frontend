import { useEffect, useState } from "react";
import { getAllUsers, deleteUser, updateUser } from "../../api/adminService";
import "../../styles/AdminModal.css";

export default function UserManagement() {
  const [users, setUsers] = useState([]);
  const [editingUser, setEditingUser] = useState(null);
  const [formData, setFormData] = useState({ email: "", first_name: "", last_name: "", role: "" });

  const fetchUsers = () => {
    getAllUsers().then(setUsers).catch(console.error);
  };

  const handleDelete = (id) => {
    if (window.confirm("❌ Supprimer cet utilisateur ?")) {
      deleteUser(id).then(fetchUsers).catch(console.error);
    }
  };

  const handleEditClick = (user) => {
    setEditingUser(user);
    setFormData({
      email: user.email,
      first_name: user.first_name,
      last_name: user.last_name,
      role: user.role,
    });
  };

  const handleSave = () => {
    updateUser(editingUser.id, formData)
      .then(() => {
        setEditingUser(null);
        fetchUsers();
      })
      .catch(console.error);
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  return (
    <div>
      <h2>Liste des utilisateurs</h2>
      {users.length > 0 ? (
        <table className="admin-table">
          <thead>
            <tr>
              <th>Email</th>
              <th>Prénom</th>
              <th>Nom</th>
              <th>Rôle</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id}>
                <td>{u.email}</td>
                <td>{u.first_name}</td>
                <td>{u.last_name}</td>
                <td>{u.role}</td>
                <td>
                  <button className="btn-edit" onClick={() => handleEditClick(u)}>✏ Modifier</button>
                  <button className="btn-delete" onClick={() => handleDelete(u.id)}>🗑 Supprimer</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <p>Aucun utilisateur trouvé.</p>
      )}

      {/* Modal */}
      {editingUser && (
        <div className="modal-overlay">
          <div className="modal">
            <h3>Modifier l'utilisateur</h3>

            <label>Email</label>
            <input
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            />

            <label>Prénom</label>
            <input
              value={formData.first_name}
              onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
            />

            <label>Nom</label>
            <input
              value={formData.last_name}
              onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
            />

            <label>Rôle</label>
            <input
              value={formData.role}
              onChange={(e) => setFormData({ ...formData, role: e.target.value })}
            />

            <div className="modal-buttons">
              <button className="btn-cancel" onClick={() => setEditingUser(null)}>Annuler</button>
              <button className="btn-save" onClick={handleSave}>💾 Sauvegarder</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
