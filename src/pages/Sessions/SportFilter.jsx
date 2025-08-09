import { useEffect, useState } from "react";
import { getSports } from "../../api/sessionService";

export default function SportFilter({ selected, onSelect }) {
  const [sports, setSports] = useState([]);

  useEffect(() => {
    getSports().then((data) => {
      if (Array.isArray(data)) {
        setSports(["Tous les sports", ...data.map((s) => s.name)]);
      }
    });
  }, []);

  return (
    <div className="sport-filters">
      {sports.map((sport) => (
        <button
          key={sport}
          onClick={() => onSelect(sport === "Tous les sports" ? "" : sport)}
          className={`sport-button ${
            selected === sport || (sport === "Tous les sports" && selected === "")
              ? "active"
              : ""
          }`}
        >
          {sport}
        </button>
      ))}
    </div>
  );
}
