import { MapContainer, TileLayer, Popup, CircleMarker, useMap } from "react-leaflet";
import { useEffect, useMemo } from "react";
import "leaflet/dist/leaflet.css";

function FlyToControl({ focus }) {
  const map = useMap();
  useEffect(() => {
    if (focus?.latitude && focus?.longitude) {
      map.flyTo([focus.latitude, focus.longitude], 13, { duration: 0.75 });
    }
  }, [focus, map]);
  return null;
}

export default function SessionMap({ sessions = [], focus = null, height = "30vh" }) {
  const markers = Array.isArray(sessions)
    ? sessions.filter((s) => s.latitude && s.longitude)
    : [];

  const isFocused = (s) =>
    focus && s && s.id === focus.id;

  // centre par défaut
  const center = useMemo(() => {
    if (focus?.latitude && focus?.longitude) return [focus.latitude, focus.longitude];
    // Paris par défaut
    return [48.8566, 2.3522];
  }, [focus]);

  return (
    <div id="sessions-map" style={{ height, width: "100%", marginBottom: "20px" }}>
      <MapContainer center={center} zoom={6} style={{ height: "100%", width: "100%" }}>
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a> contributors &copy; <a href="https://carto.com/">CARTO</a>'
          url="https://basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
        />

        {/* contrôleur de zoom */}
        <FlyToControl focus={focus} />

        {/* Points */}
        {markers.map((s) => {
          const focused = isFocused(s);
          return (
            <CircleMarker
              key={s.id}
              center={[s.latitude, s.longitude]}
              radius={focused ? 9 : 6}
              color={focused ? "#ffcc00" : "red"}
              fillColor={focused ? "#ffcc00" : "red"}
              fillOpacity={1}
            >
              <Popup>
                <h4 style={{ margin: 0 }}>{s.title}</h4>
                {s.sport?.name && <p style={{ margin: "4px 0" }}><strong>Sport:</strong> {s.sport.name}</p>}
                <p style={{ margin: "4px 0" }}><strong>Date:</strong> {s.date}{s.start_time ? ` • ${s.start_time}` : ""}</p>
                {s.location && <p style={{ margin: "4px 0" }}><strong>Lieu:</strong> {s.location}</p>}
              </Popup>
            </CircleMarker>
          );
        })}
      </MapContainer>
    </div>
  );
}
