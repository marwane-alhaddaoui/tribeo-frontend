// src/pages/Sessions/SportFilter.jsx
import { useEffect, useRef, useState } from "react";
import { getSports } from "../../api/sessionService";

export default function SportFilter({ selected, onSelect }) {
  const [sports, setSports] = useState([]);
  const viewportRef = useRef(null);

  useEffect(() => {
    getSports().then((data) => {
      if (Array.isArray(data)) {
        setSports([{ id: "", name: "Tous les sports" }, ...data]);
      } else {
        setSports([{ id: "", name: "Tous les sports" }]);
      }
    }).catch(() => setSports([{ id: "", name: "Tous les sports" }]));
  }, []);

  // Roulette/trackpad : vertical -> horizontal (desktop)
  useEffect(() => {
    const el = viewportRef.current;
    if (!el) return;
    const onWheel = (e) => {
      if (el.scrollWidth <= el.clientWidth) return;
      const delta = Math.abs(e.deltaY) > Math.abs(e.deltaX) ? e.deltaY : e.deltaX;
      if (delta !== 0) {
        el.scrollLeft += delta;
        e.preventDefault();
      }
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, []);

  return (
    <div
      ref={viewportRef}
      className="sport-filters"
      // 🎯 viewport scrollable
      style={{
        width: "100%",          // ⬅️ force la largeur au contenant
        maxWidth: "100%",
        minWidth: 0,
        display: "block",
        overflowX: "auto",
        overflowY: "hidden",
        WebkitOverflowScrolling: "touch",
        touchAction: "pan-x",
      }}
    >
      <div
        className="sport-filters__track"
        // piste sur 1 seule ligne
        style={{
          display: "inline-flex",
          gap: 10,
          padding: 10,
          whiteSpace: "nowrap",
        }}
      >
        {sports.map((sport) => (
          <button
            key={sport.id || "all"}
            onClick={() => onSelect(sport.id)}
            className={`sport-button ${selected === sport.id ? "active" : ""}`}
            style={{ flex: "0 0 auto", whiteSpace: "nowrap" }}
          >
            {sport.name}
          </button>
        ))}
      </div>
    </div>
  );
}
