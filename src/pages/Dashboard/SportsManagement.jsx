import { useEffect, useState } from "react";
import axiosClient from "../../api/axiosClient";
import "../../styles/SportsManagement.css";

export default function SportsManagement() {
  const [sports, setSports] = useState([]);
  const [search, setSearch] = useState("");
  const [editingSport, setEditingSport] = useState(null);
  const [form, setForm] = useState({ name: "", icon: null });
  const [error, setError] = useState("");

  // Récupération des sports
  const fetchSports = async () => {
    try {
      const res = await axiosClient.get("/sports/");
      setSports(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error("Erreur récupération sports", err);
      setError("Impossible de charger les sports.");
    }
  };

  useEffect(() => {
    fetchSports();
  }, []);

  // Changement des inputs
  const handleChange = (e) => {
    const { name, value, files } = e.target;
    if (name === "icon" && files.length > 0) {
      setForm({ ...form, icon: files[0] });
    } else {
      setForm({ ...form, [name]: value });
    }
  };

  // Sauvegarder sport (ajout ou édition)
  const handleSave = async () => {
    try {
      const formData = new FormData();
      formData.append("name", form.name);
      if (form.icon) {
        formData.append("icon", form.icon);
      }

      if (editingSport?.id) {
        await axiosClient.put(`/sports/${editingSport.id}/`, formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });
      } else {
        await axiosClient.post("/sports/", formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });
      }

      setEditingSport(null);
      setForm({ name: "", icon: null });
      fetchSports();
    } catch (err) {
      console.error("Erreur enregistrement sport", err);
      setError("Impossible d'enregistrer le sport.");
    }
  };

  // Suppression
  const handleDelete = async (id) => {
    if (!window.confirm("Supprimer ce sport ?")) return;
    try {
      await axiosClient.delete(`/sports/${id}/`);
      fetchSports();
    } catch (err) {
      console.error("Erreur suppression sport", err);
      setError("Impossible de supprimer le sport.");
    }
  };

  const filteredSports = sports.filter((s) =>
    s.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="admin-dashboard">
      <h2 className="admin-title">🏆 Gestion des sports</h2>

      {/* Barre d'action */}
      <div className="admin-nav">
        <input
          type="text"
          placeholder="Rechercher un sport..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="search-bar"
        />
        <button
          className="btn-add"
          onClick={() => {
            setEditingSport({});
            setForm({ name: "", icon: null });
          }}
        >
          ➕ Ajouter un sport
        </button>
      </div>

      {error && <p className="text-red-500 mb-4">{error}</p>}

      {/* Table */}
      {filteredSports.length > 0 ? (
        <table className="admin-table">
          <thead>
            <tr>
              <th>Nom</th>
              <th>Icône</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredSports.map((s) => (
              <tr key={s.id}>
                <td>{s.name}</td>
                <td>
                  {s.icon && (
                    <img
                      src={s.icon}
                      alt={s.name}
                      className="sport-icon"
                    />
                  )}
                </td>
                <td>
                  <button
                    className="btn-edit"
                    onClick={() => {
                      setEditingSport(s);
                      setForm({ name: s.name, icon: null });
                    }}
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
        <p>Aucun sport trouvé.</p>
      )}

      {/* Modal */}
      {editingSport && (
        <div className="modal-overlay">
          <div className="modal">
            <h3>{editingSport.id ? "Modifier le sport" : "Ajouter un sport"}</h3>
            <label>Nom</label>
            <input
              type="text"
              name="name"
              value={form.name}
              onChange={handleChange}
            />
            <label>Icône</label>
            <input
              type="file"
              name="icon"
              accept="image/*"
              onChange={handleChange}
            />
            <div className="modal-buttons">
              <button
                className="btn-cancel"
                onClick={() => setEditingSport(null)}
              >
                Annuler
              </button>
              <button className="btn-save" onClick={handleSave}>
                Sauvegarder
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
