// src/components/UserPicker.jsx
import { useEffect, useMemo, useRef, useState } from "react";
import { searchUsers } from "../api/userService";
import "../styles/UserPicker.css";

export default function UserPicker({ onSelect, placeholder = "Rechercher (username / email)" }) {
  const [q, setQ] = useState("");
  const [list, setList] = useState([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [idx, setIdx] = useState(-1);
  const boxRef = useRef(null);
  const debounceRef = useRef(null);

  useEffect(() => {
    const handler = (e) => { if (!boxRef.current?.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const fetch = async (term) => {
    if (!term || term.trim().length < 2) { setList([]); return; }
    try {
      setLoading(true);
      const data = await searchUsers(term.trim());
      setList(Array.isArray(data) ? data.slice(0, 8) : []);
      setOpen(true); setIdx(-1);
    } finally {
      setLoading(false);
    }
  };

  const onChange = (e) => {
    const v = e.target.value;
    setQ(v);
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => fetch(v), 250);
  };

  const select = (u) => {
    if (!u) return;
    onSelect?.(u);
    setQ(u.username || u.email || "");
    setOpen(false);
  };

  const onKeyDown = (e) => {
    if (!open || list.length === 0) return;
    if (e.key === "ArrowDown") { e.preventDefault(); setIdx((i) => Math.min(i + 1, list.length - 1)); }
    else if (e.key === "ArrowUp") { e.preventDefault(); setIdx((i) => Math.max(i - 1, 0)); }
    else if (e.key === "Enter") { e.preventDefault(); select(list[idx] || list[0]); }
    else if (e.key === "Escape") setOpen(false);
  };

  const hint = useMemo(() => {
    if (loading) return "Recherche…";
    if (open && list.length === 0 && q.trim().length >= 2) return "Aucun résultat";
    return null;
  }, [loading, open, list, q]);

  return (
    <div className="up-wrap" ref={boxRef}>
      <input
        className="up-input"
        value={q}
        onChange={onChange}
        onFocus={() => q.trim().length >= 2 && setOpen(true)}
        onKeyDown={onKeyDown}
        placeholder={placeholder}
      />
      {open && (list.length > 0 || hint) && (
        <div className="up-pop">
          {list.map((u, i) => (
            <div
              key={u.id}
              className={`up-item ${i === idx ? "active" : ""}`}
              onMouseDown={() => select(u)}
            >
              <div className="up-line1">{u.username || u.email}</div>
              <div className="up-line2">{u.first_name} {u.last_name} • {u.email}</div>
            </div>
          ))}
          {hint && <div className="up-hint">{hint}</div>}
        </div>
      )}
    </div>
  );
}
