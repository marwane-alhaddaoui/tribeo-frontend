// src/components/SessionMap.jsx
import { MapContainer, TileLayer, Popup, CircleMarker, useMap } from "react-leaflet";
import { useEffect, useMemo } from "react";
import "leaflet/dist/leaflet.css";

function FlyToControl({ focus, locked }) {
  const map = useMap();
  useEffect(() => {
    if (locked) return; // 🔒 pas de flyTo pour les visiteurs
    if (focus?.latitude != null && focus?.longitude != null) {
      map.flyTo([focus.latitude, focus.longitude], 13, { duration: 0.75 });
    }
  }, [focus, locked, map]);
  return null;
}

/** Ferme toute popup quand on passe en locked (sécurité absolue) */
function ClosePopupsOnLock({ locked }) {
  const map = useMap();
  useEffect(() => {
    if (locked) map.closePopup();
  }, [locked, map]);
  return null;
}

export default function SessionMap({
  sessions = [],
  focus = null,
  height = "30vh",
  locked = false, // 👈 NEW: visiteur = true
}) {
  const markers = useMemo(
    () =>
      Array.isArray(sessions)
        ? sessions.filter((s) => typeof s?.latitude === "number" && typeof s?.longitude === "number")
        : [],
    [sessions]
  );

  const isFocused = (s) => focus && s && s.id === focus.id;

  // centre par défaut
  const center = useMemo(() => {
    if (!locked && focus?.latitude != null && focus?.longitude != null) {
      return [focus.latitude, focus.longitude];
    }
    if (markers.length) return [markers[0].latitude, markers[0].longitude];
    // Paris par défaut
    return [48.8566, 2.3522];
  }, [focus, markers, locked]);

  return (
    <div
      id="sessions-map"
      style={{ position: "relative", height, width: "100%", marginBottom: "20px", borderRadius: 16, overflow: "hidden" }}
    >
      <MapContainer
        center={center}
        zoom={6}
        style={{ height: "100%", width: "100%" }}
        attributionControl={false}
        // 🔒 coupe TOUTES les interactions en visiteur
        scrollWheelZoom={!locked}
        dragging={!locked}
        doubleClickZoom={!locked}
        boxZoom={!locked}
        touchZoom={!locked}
        keyboard={!locked}
      >
        <TileLayer
          attribution='&copy; OSM contributors &copy; CARTO'
          url="https://basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
        />

        <FlyToControl focus={focus} locked={locked} />
        <ClosePopupsOnLock locked={locked} />

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
              interactive={!locked}              // 🔒 pas d'interaction sur le marker
              eventHandlers={
                locked
                  ? {
                      click: (e) => e.originalEvent?.stopPropagation?.(),
                      dblclick: (e) => e.originalEvent?.stopPropagation?.(),
                      contextmenu: (e) => e.originalEvent?.stopPropagation?.(),
                    }
                  : undefined
              }
            >
              {/* ✅ popups seulement si connecté */}
              {!locked && (
                <Popup>
                  <h4 style={{ margin: 0 }}>{s.title}</h4>
                  {s.sport?.name && (
                    <p style={{ margin: "4px 0" }}>
                      <strong>Sport:</strong> {s.sport.name}
                    </p>
                  )}
                  <p style={{ margin: "4px 0" }}>
                    <strong>Date:</strong> {s.date}
                    {s.start_time ? ` • ${s.start_time}` : ""}
                  </p>
                  {s.location && (
                    <p style={{ margin: "4px 0" }}>
                      <strong>Lieu:</strong> {s.location}
                    </p>
                  )}
                </Popup>
              )}
            </CircleMarker>
          );
        })}
      </MapContainer>

      {/* Overlay qui capte les clics pour empêcher toute popup en mode visiteur */}
      {locked && (
        <div
          aria-hidden="true"
          style={{
            position: "absolute",
            inset: 0,
            borderRadius: 16,
            pointerEvents: "auto", // <- capture les clics
            background: "linear-gradient(180deg, rgba(18,18,18,0) 65%, rgba(18,18,18,.45))",
            display: "flex",
            alignItems: "flex-end",
            justifyContent: "flex-end",
          }}
          onClick={(e) => e.stopPropagation()}
          onMouseDown={(e) => e.stopPropagation()}
        >
          <div
            style={{
              margin: 10,
              padding: "8px 10px",
              fontWeight: 700,
              fontSize: ".9rem",
              background: "rgba(21,21,22,.68)",
              color: "#eaeaea",
              border: "1px solid #262728",
              borderRadius: 10,
              boxShadow: "0 6px 20px rgba(0,0,0,.35), inset 0 0 0 1px rgba(255,45,45,.03)",
            }}
          >
            Prévisualisation — connecte‑toi pour voir les détails.
          </div>
        </div>
      )}
    </div>
  );
}
