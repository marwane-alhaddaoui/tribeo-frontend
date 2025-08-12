import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { createGroup } from "../../api/groupService";
import { listSports, findSportByName } from "../../api/sportService";
import "../../styles/GroupForm.css";

export default function GroupForm() {
  const nav = useNavigate();

  const [name, setName] = useState("");
  const [sportQuery, setSportQuery] = useState(""); // ce que tape l'utilisateur
  const [sports, setSports] = useState([]);         // liste globale
  const [selectedSport, setSelectedSport] = useState(null); // {id,name} sélectionné
  const [city, setCity] = useState("");
  const [description, setDescription] = useState("");
  const [openList, setOpenList] = useState(false);
  const [loading, setLoading] = useState(true);

  // Charge la liste des sports au montage
  useEffect(() => {
    (async () => {
      try {
        const data = await listSports();
        setSports(Array.isArray(data) ? data : []);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // Filtre local des sports selon la saisie
  const filtered = useMemo(() => {
    const q = sportQuery.trim().toLowerCase();
    if (!q) return sports.slice(0, 8);
    return sports.filter((s) => s?.name?.toLowerCase().includes(q)).slice(0, 8);
  }, [sports, sportQuery]);

  const onPick = (s) => {
    setSelectedSport(s);
    setSportQuery(s?.name || "");
    setOpenList(false);
  };

  const onSubmit = async (e) => {
    e.preventDefault();

    // 1) on essaie l’item sélectionné
    let sportId = selectedSport?.id;

    // 2) sinon, tentative de résolution exacte côté API (nom -> id)
    if (!sportId && sportQuery) {
      const found = await findSportByName(sportQuery);
      if (found) {
        sportId = found.id;
        setSelectedSport(found);
      }
    }

    if (!sportId) {
      alert("Sélectionne un sport dans la liste (ou tape son nom exact).");
      return;
    }

    const payload = {
      name,
      sport: Number(sportId),
      city: city || undefined,
      description: description || undefined,
    };

    const created = await createGroup(payload);
    nav(`/groups/${created.id}`);
  };

  return (
    <div className="gf-wrap">
      <h1 className="gf-title">Créer un groupe</h1>

      <form onSubmit={onSubmit} className="gf-form">
        {/* Nom */}
        <label className="gf-label">Nom du groupe</label>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Ex: Titans FC"
          className="gf-input"
          required
        />

        {/* Sport (autocomplete par nom) */}
        <label className="gf-label">Sport</label>
        <div className="gf-combobox" onBlur={() => setTimeout(() => setOpenList(false), 150)}>
          <input
            value={sportQuery}
            onChange={(e) => {
              setSportQuery(e.target.value);
              setSelectedSport(null);
              setOpenList(true);
            }}
            onFocus={() => setOpenList(true)}
            placeholder={loading ? "Chargement des sports..." : "Tape le nom du sport"}
            className="gf-input"
            aria-autocomplete="list"
            aria-expanded={openList}
          />
          {openList && !loading && (
            <div className="gf-list">
              {filtered.length ? (
                filtered.map((s) => (
                  <button
                    type="button"
                    key={s.id}
                    className={`gf-item ${selectedSport?.id === s.id ? "is-active" : ""}`}
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => onPick(s)}
                  >
                    {s.name}
                  </button>
                ))
              ) : (
                <div className="gf-empty">Aucun sport trouvé.</div>
              )}
            </div>
          )}
        </div>

        {/* Ville */}
        <label className="gf-label">Ville (optionnel)</label>
        <input
          value={city}
          onChange={(e) => setCity(e.target.value)}
          placeholder="Ex: Bruxelles"
          className="gf-input"
        />

        {/* Description */}
        <label className="gf-label">Description (optionnel)</label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Décris ton groupe…"
          className="gf-textarea"
        />

        <div className="gf-actions">
          <button type="submit" className="btn-primary">
            Créer le groupe
          </button>
        </div>
      </form>
    </div>
  );
}
