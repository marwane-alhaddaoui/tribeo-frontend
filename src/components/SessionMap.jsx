import { MapContainer, TileLayer, Popup, CircleMarker } from "react-leaflet";
import { useEffect, useState } from "react";
import { getSessions } from "../api/sessionService";
import "leaflet/dist/leaflet.css";

export default function SessionsMap() {
  const [sessions, setSessions] = useState([]);

  useEffect(() => {
    getSessions().then(setSessions).catch(console.error);
  }, []);

  return (
    <div style={{ height: "30vh", width: "100%", marginBottom: "20px" }}>
      <MapContainer
        center={[48.8566, 2.3522]} // Paris par défaut
        zoom={6}
        style={{ height: "100%", width: "100%" }}
      >
        {/* Fond de carte sombre CARTO */}
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a> contributors &copy; <a href="https://carto.com/">CARTO</a>'
          url="https://basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
        />

        {/* Points rouges */}
        {sessions
          .filter((s) => s.latitude && s.longitude)
          .map((s) => (
            <CircleMarker
              key={s.id}
              center={[s.latitude, s.longitude]}
              radius={6} // taille du point
              color="red" // contour
              fillColor="red" // remplissage
              fillOpacity={1}
            >
              <Popup>
                <h4>{s.title}</h4>
                <p><strong>Sport:</strong> {s.sport?.name}</p>
                <p><strong>Date:</strong> {s.date}</p>
                <p><strong>Lieu:</strong> {s.location}</p>
              </Popup>
            </CircleMarker>
          ))}
      </MapContainer>
    </div>
  );
}
