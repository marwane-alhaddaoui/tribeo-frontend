import { useEffect, useRef, useState } from "react";

export default function AddressAutocomplete({
  value = "",
  onSelect,            // (label, lat, lon)
  minChars = 3,
  debounceMs = 500,
  countryCodes = "",   // ex: "fr,be"
}) {
  const [inputValue, setInputValue] = useState(value || "");
  const [suggestions, setSuggestions] = useState([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const toStr = (v) => (v ?? "").toString();
  const trimStr = (v) => toStr(v).trim();

  useEffect(() => { setInputValue(value || ""); }, [value]);

  const cacheRef = useRef(new Map());
  const abortRef = useRef(null);
  const fetchTimerRef = useRef(null);
  const clearTimerRef = useRef(null);
  const lastChosenRef = useRef("");   // dernière adresse validée
  const lastFetchedRef = useRef("");  // dernier texte fetché
  const boxRef = useRef(null);

  const buildUrl = (q) => {
    const base = "https://nominatim.openstreetmap.org/search";
    const p = new URLSearchParams({
      format: "json",
      limit: "8",
      addressdetails: "0",
      "accept-language": "fr",
      q,
    });
    if (countryCodes) p.set("countrycodes", countryCodes);
    return `${base}?${p.toString()}`;
  };

  const fetchSuggestions = async (q) => {
    const key = trimStr(q).toLowerCase();
    if (cacheRef.current.has(key)) {
      setSuggestions(cacheRef.current.get(key));
      setLoading(false);
      setOpen(true);
      return;
    }
    if (abortRef.current) abortRef.current.abort();
    const ac = new AbortController();
    abortRef.current = ac;

    try {
      setLoading(true);
      const res = await fetch(buildUrl(q), { signal: ac.signal, headers: { Accept: "application/json" } });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      const mapped = data.map((d) => ({
        id: d.place_id,
        label: d.display_name,
        lat: parseFloat(d.lat),
        lon: parseFloat(d.lon),
      }));
      cacheRef.current.set(key, mapped);
      setSuggestions(mapped);
      setOpen(true);
    } catch (e) {
      if (e.name !== "AbortError") {
        console.warn("autocomplete error:", e);
        setSuggestions([]);
        setOpen(false);
      }
    } finally {
      setLoading(false);
    }
  };

  // Debounce RECHERCHE + clear coords après PAUSE (pas à chaque lettre)
  useEffect(() => {
    const q = trimStr(inputValue);

    // clear coords seulement si on modifie le texte (différent de la dernière sélection)
    if (q !== trimStr(lastChosenRef.current)) {
      if (clearTimerRef.current) clearTimeout(clearTimerRef.current);
      clearTimerRef.current = setTimeout(() => {
        onSelect?.(toStr(inputValue), null, null);
      }, 450);
    }

    if (q.length < minChars) {
      if (abortRef.current) abortRef.current.abort();
      setSuggestions([]);
      setOpen(false);
      setLoading(false);
      return;
    }

    if (lastFetchedRef.current === q) return;

    if (fetchTimerRef.current) clearTimeout(fetchTimerRef.current);
    fetchTimerRef.current = setTimeout(() => {
      lastFetchedRef.current = q;
      fetchSuggestions(q);
    }, debounceMs);

    return () => {
      if (fetchTimerRef.current) clearTimeout(fetchTimerRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inputValue, minChars, debounceMs]);

  // Close on click outside
  useEffect(() => {
    const onDown = (e) => {
      if (boxRef.current && !boxRef.current.contains(e.target)) setOpen(false);
    };
    window.addEventListener("mousedown", onDown);
    return () => window.removeEventListener("mousedown", onDown);
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (fetchTimerRef.current) clearTimeout(fetchTimerRef.current);
      if (clearTimerRef.current) clearTimeout(clearTimerRef.current);
      if (abortRef.current) abortRef.current.abort();
    };
  }, []);

  const handleChange = (e) => setInputValue(e.target.value);

  const handleSelect = (place) => {
  // stoppe tout timer/requête en cours
  if (fetchTimerRef.current) clearTimeout(fetchTimerRef.current);
  if (clearTimerRef.current) clearTimeout(clearTimerRef.current);
  if (abortRef.current) abortRef.current.abort();

  const location  = (place?.label ?? place?.display_name ?? "").toString();
  const latitude  = Number(place?.lat);
  const longitude = Number(place?.lon);

  lastChosenRef.current   = location;
  lastFetchedRef.current  = location.trim(); // évite refetch immédiat
  setInputValue(location);
  setSuggestions([]);
  setOpen(false);

  onSelect?.(location, latitude, longitude);
};

  const qLen = trimStr(inputValue).length;
  const canOpen = qLen >= minChars && suggestions.length > 0;

  return (
    <div ref={boxRef} style={{ position: "relative" }}>
      <input
        type="text"
        placeholder="Tapez une adresse…"
        value={toStr(inputValue)}
        onChange={handleChange}
        onFocus={() => canOpen && setOpen(true)}
        autoComplete="off"
        style={{
          width: "100%",
          padding: "10px",
          backgroundColor: "#1e1e1e",
          color: "#fff",
          border: "1px solid #555",
          borderRadius: "8px",
        }}
      />

      {(loading || (open && suggestions.length)) && (
        <ul
          style={{
            position: "absolute",
            zIndex: 1000,
            background: "#2a2a2a",
            border: "1px solid #444",
            width: "100%",
            maxHeight: "220px",
            overflowY: "auto",
            listStyle: "none",
            margin: "6px 0 0",
            padding: 0,
            borderRadius: "8px",
            boxShadow: "0 10px 24px rgba(0,0,0,.35)",
          }}
        >
          {loading && <li style={{ padding: 10, color: "#bbb" }}>Recherche…</li>}
          {!loading &&
            suggestions.map((s) => (
              <li
                key={s.id}
                onClick={() => handleSelect(s)}
                title={toStr(s.label)}
                style={{
                  padding: "10px",
                  cursor: "pointer",
                  color: "#fff",
                  borderBottom: "1px solid #3a3a3a",
                }}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.backgroundColor = "#3a3a3a")
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.backgroundColor = "transparent")
                }
              >
                {toStr(s.label)}
              </li>
            ))}
          {!loading && !suggestions.length && open && (
            <li style={{ padding: 10, color: "#bbb" }}>Aucun résultat</li>
          )}
        </ul>
      )}

      {qLen > 0 && qLen < minChars && (
        <div style={{ marginTop: 6, fontSize: 12, color: "#ffd27d" }}>
          Tape au moins {minChars} caractères…
        </div>
      )}
    </div>
  );
}
