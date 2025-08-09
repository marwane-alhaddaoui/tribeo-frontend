import { useEffect, useState } from "react";
import { getSports } from "../../api/sessionService";

export default function SportFilter({ selected, onSelect }) {
  const [sports, setSports] = useState([]);

  useEffect(() => {
    getSports().then((data) => {
      if (Array.isArray(data)) {
        // On stocke id et name
        setSports([{ id: "", name: "Tous les sports" }, ...data]);
      }
    });
  }, []);

  return (
    <div className="sport-filters">
      {sports.map((sport) => (
        <button
          key={sport.id || "all"}
          onClick={() => onSelect(sport.id)}
          className={`sport-button ${selected === sport.id ? "active" : ""}`}
        >
          {sport.name}
        </button>
      ))}
    </div>
  );
}
