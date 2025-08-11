// components/SessionSlots.jsx
import { useMemo } from "react";
import "./SessionSlots.css";

export default function SessionSlots({
  sport = "generic",
  mode = "solo",
  capacity = 10,
  slots = [],                  // [{ index, user: {id, name, avatar}? }]
  onJoin,                      // () => void
  onLeave,                     // () => void
  currentUserId,
  layout: layoutProp,
}) {
  const layout = useMemo(() => {
    if (layoutProp) return layoutProp;
    if (["football","futsal","basket","hand","volley"].includes(sport)) return "half";
    if (["tennis","padel"].includes(sport)) return "grid";
    if (["running","trail","yoga","crossfit","boxing"].includes(sport)) return "line";
    return "grid";
  }, [sport, layoutProp]);

  const normalized = useMemo(() => normalizeSlots(capacity, slots), [capacity, slots]);

  return (
    <div className={`slots-wrap slots-${layout}`}>
      <div className="field">
        {normalized.map((s, i) => {
          const isMe = s.user && (s.user.id === currentUserId);
          const filled = !!s.user;
          const onClick = () => {
            if (filled) { if (isMe) onLeave?.(i); }
            else onJoin?.(i);
          };
          return (
            <button
              key={i}
              className={`slot ${filled ? "filled" : "empty"} ${isMe ? "mine" : ""}`}
              onClick={onClick}
              title={filled ? (s.user.name || "Occupé") : "Rejoindre"}
            >
              {filled ? avatarOrInitials(s.user) : "+"}
            </button>
          );
        })}
      </div>
      <div className="legend">
        <span className="dot empty" /> Libre
        <span className="dot filled" /> Occupé
        <span className="dot mine" /> Toi
      </div>
    </div>
  );
}

function normalizeSlots(total, slots) {
  const out = Array.from({ length: total }, (_, i) => ({ index: i, user: null }));
  for (const s of slots || []) if (s && Number.isInteger(s.index) && s.index < total) out[s.index] = s;
  return out;
}

function avatarOrInitials(user) {
  if (user?.avatar) return <img src={user.avatar} alt={user.name || "User"} />;
  const initials = (user?.name || "?").split(" ").map(w => w[0]).join("").slice(0,2).toUpperCase();
  return <span>{initials}</span>;
}
