// src/pages/Sessions/SessionsPage.jsx
import { useEffect, useState, useContext, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { getSessions, joinSession, leaveSession } from "../../api/sessionService";
import SportFilter from "./SportFilter";
import SessionCard from "./SessionCard";
import "../../styles/SessionPage.css";
import SessionMap from "../../components/SessionMap";
import CreateSessionCTA from "../../components/CreateSessionCTA";
import { AuthContext } from "../../context/AuthContext";

/* ====================== Helpers ====================== */
const SESSION_FILTERS = { ALL: "ALL", OPEN: "OPEN", FULL: "FULL" };

const norm = (s) => String(s ?? "").trim();
const normKey = (s) => norm(s).toLowerCase();

function isFull(session) {
  const capacity = Number(session?.max_players ?? session?.capacity ?? session?.max_participants ?? 0);
  const count = Array.isArray(session?.participants)
    ? session.participants.length
    : Number(session?.participants_count ?? 0);
  return capacity > 0 && count >= capacity;
}

function getStartEndMs(s = {}) {
  const startIso = s.start || (s.date ? `${s.date}${s.start_time ? "T" + s.start_time : ""}` : null);
  const endIso = s.end || (s.date && s.end_time ? `${s.date}T${s.end_time}` : null) || null;
  const startMs = startIso ? Date.parse(startIso) : null;
  const endMs = endIso ? Date.parse(endIso) : (startMs != null ? startMs + 2 * 60 * 60 * 1000 : null);
  return { startMs, endMs };
}
function isArchived(session) {
  const { startMs, endMs } = getStartEndMs(session);
  const now = Date.now();
  const status = String(session?.status || "").toUpperCase();
  const isPast = startMs ? now > (endMs ?? startMs) : false;
  const finishedOrCanceled = status === "FINISHED" || status === "CANCELED";
  return isPast || finishedOrCanceled;
}
function compareUpcoming(a, b) {
  const { startMs: sa, endMs: ea } = getStartEndMs(a);
  const { startMs: sb, endMs: eb } = getStartEndMs(b);
  const now = Date.now();
  const aOngoing = sa != null && ea != null && now >= sa && now <= ea;
  const bOngoing = sb != null && eb != null && now >= sb && now <= eb;
  if (aOngoing !== bOngoing) return aOngoing ? -1 : 1;
  return ((sa ?? Infinity) - now) - ((sb ?? Infinity) - now);
}
function compareArchive(a, b) {
  const { startMs: sa } = getStartEndMs(a);
  const { startMs: sb } = getStartEndMs(b);
  if (sa == null && sb == null) return 0;
  if (sa == null) return 1;
  if (sb == null) return -1;
  return sb - sa;
}
function extractCountryCity(s = {}) {
  let country = s.country || s.country_name || s.countryCode || s.country_code || s.location_country || "";
  let city = s.city || s.town || s.locality || s.location_city || "";
  const addr = s.address || s.location || "";
  if ((!country || !city) && addr) {
    const parts = addr.split(",").map((p) => norm(p));
    if (parts.length >= 2) {
      if (!country) country = parts[parts.length - 1];
      if (!city) city = parts[parts.length - 2] || parts[0];
    } else if (parts.length === 1 && !city) {
      city = parts[0];
    }
  }
  return { country: norm(country), city: norm(city) };
}

/* ====================== Page ====================== */
export default function SessionsPage() {
  const { user } = useContext(AuthContext);
  const isVisitor = !user;
  const { t } = useTranslation();

  const [sessions, setSessions] = useState([]);
  const [selectedSport, setSelectedSport] = useState("");
  const [search, setSearch] = useState("");
  const [focused, setFocused] = useState(null);

  const [tab, setTab] = useState("UPCOMING");
  const [stateFilter, setStateFilter] = useState(SESSION_FILTERS.ALL);

  const [country, setCountry] = useState("");
  const [city, setCity] = useState("");

  const fetchSessions = () => {
    const filters = { is_public: true };
    if (!isVisitor) {
      if (selectedSport) filters.sport_id = selectedSport;
      if (search.trim()) filters.search = search.trim();
      if (country) filters.country = country;
      if (city) filters.city = city;
    }
    getSessions(filters).then(setSessions).catch(console.error);
  };

  useEffect(() => {
    fetchSessions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedSport, search, country, city]);

  const countries = useMemo(() => {
    const set = new Map();
    (sessions || []).forEach((s) => {
      const { country } = extractCountryCity(s);
      if (country) set.set(normKey(country), country);
    });
    return Array.from(set.values()).sort((a, b) => a.localeCompare(b, "fr"));
  }, [sessions]);

  const cities = useMemo(() => {
    const set = new Map();
    (sessions || []).forEach((s) => {
      const loc = extractCountryCity(s);
      if (country && normKey(loc.country) !== normKey(country)) return;
      if (loc.city) set.set(normKey(loc.city), loc.city);
    });
    return Array.from(set.values()).sort((a, b) => a.localeCompare(b, "fr"));
  }, [sessions, country]);

  const handleFocus = (s) => {
    if (isVisitor) return;
    if (!s?.latitude || !s?.longitude) return;
    setFocused(s);
    const el = document.getElementById("sessions-map");
    if (el) el.scrollIntoView({ behavior: "smooth", block: "center" });
  };

  const handleJoin = async (id) => {
    if (isVisitor) return;
    try {
      await joinSession(id);
      alert(t("sessions_index_join_success"));
      fetchSessions();
    } catch (err) {
      alert(`❌ ${err?.response?.data?.detail || t("sessions_index_join_error")}`);
    }
  };

  const handleLeave = async (id) => {
    if (isVisitor) return;
    try {
      await leaveSession(id);
      alert(t("sessions_index_leave_success"));
      fetchSessions();
    } catch (err) {
      alert(`❌ ${err?.response?.data?.detail || t("sessions_index_leave_error")}`);
    }
  };

  const onChangeSearch = (e) => { if (!isVisitor) setSearch(e.target.value); };
  const onSelectSport = (sId) => { if (!isVisitor) setSelectedSport(sId); };

  const sessionsByLocation = useMemo(() => {
    if (!country && !city) return sessions || [];
    return (sessions || []).filter((s) => {
      const loc = extractCountryCity(s);
      if (country && normKey(loc.country) !== normKey(country)) return false;
      if (city && normKey(loc.city) !== normKey(city)) return false;
      return true;
    });
  }, [sessions, country, city]);

  const upcoming = useMemo(
    () => (Array.isArray(sessionsByLocation) ? sessionsByLocation.filter((s) => !isArchived(s)) : []),
    [sessionsByLocation]
  );

  const upcomingFiltered = useMemo(() => {
    if (!Array.isArray(upcoming)) return [];
    if (stateFilter === SESSION_FILTERS.ALL) return upcoming;
    if (stateFilter === SESSION_FILTERS.OPEN) {
      return upcoming.filter((s) => {
        const status = String(s?.status || "").toUpperCase();
        const badStatus = ["FINISHED", "CANCELED", "LOCKED"].includes(status);
        return !badStatus && !isFull(s);
      });
    }
    if (stateFilter === SESSION_FILTERS.FULL) return upcoming.filter((s) => isFull(s));
    return upcoming;
  }, [upcoming, stateFilter]);

  const upcomingOrdered = useMemo(() => {
    const arr = [...upcomingFiltered];
    arr.sort(compareUpcoming);
    return arr;
  }, [upcomingFiltered]);

  const archivesOrdered = useMemo(() => {
    const arr = Array.isArray(sessionsByLocation) ? sessionsByLocation.filter(isArchived) : [];
    arr.sort(compareArchive);
    return arr;
  }, [sessionsByLocation]);

  useEffect(() => {
    const list = tab === "UPCOMING" ? upcomingOrdered : archivesOrdered;
    if (focused && !list.some((s) => s.id === focused.id)) setFocused(null);
  }, [tab, upcomingOrdered, archivesOrdered, focused]);

  const onChangeCountry = (e) => {
    const next = e.target.value || "";
    setCountry(next);
    setCity((prev) => (prev && cities.some((c) => normKey(c) === normKey(prev)) ? prev : ""));
  };
  const onChangeCity = (e) => setCity(e.target.value || "");

  return (
    <div className="sessions-wrapper">
      <div className="sessions-toolbar">
        <h1 className="sessions-title">{t("sessions_index_title")}</h1>
        <CreateSessionCTA variant="button" />
      </div>

      <div className={`sessions-controls ${isVisitor ? "is-disabled" : ""}`}>
        <div className="seg" role="tablist" aria-label={t("sessions_index_tabs_aria")}>
          <button
            type="button"
            className={`seg-btn ${tab === "UPCOMING" ? "active" : ""}`}
            onClick={() => setTab("UPCOMING")}
            role="tab"
            aria-selected={tab === "UPCOMING"}
          >
            {t("sessions_index_tab_upcoming")}
          </button>
          <button
            type="button"
            className={`seg-btn ${tab === "ARCHIVE" ? "active" : ""}`}
            onClick={() => setTab("ARCHIVE")}
            role="tab"
            aria-selected={tab === "ARCHIVE"}
          >
            {t("sessions_index_tab_archive")}
          </button>
        </div>

        <span className="seg-sep" aria-hidden="true"></span>

        {tab === "UPCOMING" && (
          <div className="seg" aria-label={t("sessions_index_filters_state_aria")}>
            {[
              { key: SESSION_FILTERS.ALL, label: t("sessions_index_filter_all") },
              { key: SESSION_FILTERS.OPEN, label: t("sessions_index_filter_open") },
              { key: SESSION_FILTERS.FULL, label: t("sessions_index_filter_full") },
            ].map((it) => (
              <button
                key={it.key}
                type="button"
                onClick={() => !isVisitor && setStateFilter(it.key)}
                disabled={isVisitor}
                className={`seg-btn ${stateFilter === it.key ? "active" : ""}`}
              >
                {it.label}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className={`sessions-filters ${isVisitor ? "is-disabled" : ""}`}>
        <input
          type="text"
          placeholder={t("sessions_index_search_placeholder")}
          value={search}
          onChange={onChangeSearch}
          className="search-input"
          disabled={isVisitor}
        />

        <SportFilter selected={selectedSport} onSelect={onSelectSport} disabled={isVisitor} />

        <div className={`location-filters ${isVisitor ? "is-disabled" : ""}`} style={{ width: "100%" }}>
          <select
            className="select-pill"
            value={country}
            onChange={onChangeCountry}
            disabled={isVisitor || countries.length === 0}
            aria-label={t("sessions_index_filter_country")}
          >
            <option value="">{t("sessions_index_countries_all")}</option>
            {countries.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>

          <select
            className="select-pill"
            value={city}
            onChange={onChangeCity}
            disabled={isVisitor || (country ? cities.length === 0 : countries.length === 0 && cities.length === 0)}
            aria-label={t("sessions_index_filter_city")}
          >
            <option value="">{t("sessions_index_cities_all")}</option>
            {cities.map((v) => (
              <option key={v} value={v}>{v}</option>
            ))}
          </select>
        </div>
      </div>

      {tab === "UPCOMING" && (
        <SessionMap sessions={upcomingOrdered} focus={focused} locked={isVisitor} />
      )}

      <div className={`sessions-grid ${isVisitor && tab === "UPCOMING" ? "grid-locked" : ""}`}>
        {tab === "UPCOMING" ? (
          upcomingOrdered.length ? (
            upcomingOrdered.map((s) => (
              <SessionCard
                key={s.id}
                session={s}
                onJoin={isVisitor ? undefined : handleJoin}
                onLeave={isVisitor ? undefined : handleLeave}
                onFocus={isVisitor ? undefined : handleFocus}
              />
            ))
          ) : (
            <p className="sessions-empty">{t("sessions_index_empty_upcoming")}</p>
          )
        ) : archivesOrdered.length ? (
          archivesOrdered.map((s) => (
            <SessionCard
              key={s.id}
              session={s}
              onFocus={undefined}
              onJoin={undefined}
              onLeave={undefined}
            />
          ))
        ) : (
          <p className="sessions-empty">{t("sessions_index_empty_archive")}</p>
        )}
      </div>
    </div>
  );
}
