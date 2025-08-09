import { useState } from "react";

export default function AddressAutocomplete({ value, onSelect }) {
  const [suggestions, setSuggestions] = useState([]);
  const [inputValue, setInputValue] = useState(value || "");

  const fetchSuggestions = async (query) => {
    if (query.length < 3) {
      setSuggestions([]);
      return;
    }
    const res = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}`
    );
    const data = await res.json();
    setSuggestions(data);
  };

  const handleChange = (e) => {
    const val = e.target.value;
    setInputValue(val);
    fetchSuggestions(val);

    // ❌ Si l'utilisateur tape, on invalide lat/lon
    onSelect(val, null, null);
  };

  const handleSelect = (place) => {
    const location = place.display_name;
    const latitude = parseFloat(place.lat);
    const longitude = parseFloat(place.lon);

    setInputValue(location);
    setSuggestions([]);

    // ✅ On envoie adresse + coordonnées valides
    onSelect(location, latitude, longitude);
  };

  return (
    <div style={{ position: "relative" }}>
      <input
        type="text"
        placeholder="Tapez une adresse..."
        value={inputValue}
        onChange={handleChange}
        style={{
          width: "100%",
          padding: "10px",
          backgroundColor: "#1e1e1e",
          color: "#fff",
          border: "1px solid #555",
          borderRadius: "4px"
        }}
      />
      {suggestions.length > 0 && (
        <ul style={{
          position: "absolute",
          zIndex: 1000,
          background: "#2a2a2a",
          border: "1px solid #444",
          width: "100%",
          maxHeight: "150px",
          overflowY: "auto",
          listStyle: "none",
          margin: 0,
          padding: 0
        }}>
          {suggestions.map((s, i) => (
            <li
              key={i}
              style={{
                padding: "8px",
                cursor: "pointer",
                color: "#fff",
                borderBottom: "1px solid #444"
              }}
              onClick={() => handleSelect(s)}
              onMouseEnter={(e) => e.target.style.backgroundColor = "#3a3a3a"}
              onMouseLeave={(e) => e.target.style.backgroundColor = "transparent"}
            >
              {s.display_name}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
