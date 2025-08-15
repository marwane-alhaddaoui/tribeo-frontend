// src/api/sessionService.js
import axiosClient from "./axiosClient";

/* ---------------------------
   Utils
---------------------------- */
const normalizeList = (data) =>
  Array.isArray(data?.results) ? data.results : data;

/** Essaie d'extraire un ID de session, peu importe le shape renvoyé par l'API */
export function extractSessionId(s) {
  if (!s) return null;

  // champs probables
  const direct =
    s.id ??
    s.session_id ??
    s.pk ??
    s.sessionId ??
    (s.session && s.session.id) ??
    null;

  if (direct != null && !Number.isNaN(Number(direct))) {
    return Number(direct);
  }

  // parfois l'API renvoie une URL/uri du style ".../sessions/41/"
  const uri = s.url ?? s.uri ?? s.resource ?? null;
  if (typeof uri === "string") {
    const m = uri.match(/\/sessions\/(\d+)\//i);
    if (m && m[1]) return Number(m[1]);
  }

  return null;
}

/* ---------------------------
   Sessions (général)
---------------------------- */

export const getSessions = async (filters = {}) => {
  const queryParams = new URLSearchParams(filters).toString();
  const url = queryParams ? `/sessions/?${queryParams}` : "/sessions/";
  try {
    const res = await axiosClient.get(url);
    return normalizeList(res.data);
  } catch (err) {
    console.error("Erreur récupération des sessions", err);
    return [];
  }
};

export const getSessionById = (id) => axiosClient.get(`/sessions/${id}/`);

// alias historique
export const getSessionDetail = getSessionById;

export const createSession = (data) => axiosClient.post("/sessions/", data);

export const joinSession = (id) => axiosClient.post(`/sessions/${id}/join/`);

export const leaveSession = (id) => axiosClient.post(`/sessions/${id}/leave/`);

export const publishSession = (id) =>
  axiosClient.post(`/sessions/${id}/publish/`);

export const lockSession = (id) =>
  axiosClient.post(`/sessions/${id}/lock/`);

export const finishSession = (id) =>
  axiosClient.post(`/sessions/${id}/finish/`);


export const cancelSession = (id) =>
  axiosClient.post(`/sessions/${id}/cancel/`);

export const deleteSession = (id) =>
  axiosClient.delete(`/sport_sessions/${id}/`);

// calendrier (coach) — gardé tel quel
export const getMySessionsInRange = async ({ start, end }) => {
  const params = { mine: true, date_from: start, date_to: end };
  return getSessions(params);
};

/* ---------------------------
   Sports
---------------------------- */
export const getSports = async () => {
  const response = await axiosClient.get("/sports/");
  return response.data;
};

export const createSport = (data) => axiosClient.post("/sports/", data);

/* ---------------------------
   TRAINING (groupe)
---------------------------- */

/** Liste des trainings d'un groupe (on passe par le listing standard filtré) */
export const listGroupTrainings = async (groupId, extra = {}) => {
  return getSessions({ group_id: groupId, event_type: "TRAINING", ...extra });
};

/** Création d'un training (le sport est hérité du groupe côté BE) */
export const createGroupTraining = async (payload) => {
  const {
    groupId,
    latitude,
    longitude,
    end_time,
    city,
    sport_id, // ignoré côté FE
    ...rest
  } = payload;

  const body = {
    ...rest,
    group_id: groupId,
    event_type: "TRAINING",
    visibility: "GROUP",
  };
  return axiosClient.post("/sessions/", body);
};

/** Suppression d'un training (on supprime la session idempotente côté /sport_sessions/) */
export const deleteGroupTraining = (groupId, sessionId) =>
  axiosClient.delete(`/sessions/${sessionId}/`);

/** Est-ce une session d'entraînement ? */
export const isTrainingSession = (s) =>
  String(s?.event_type || "").toUpperCase() === "TRAINING";

/* ---------------------------
   Attendance (feuille de présence)
---------------------------- */
/** ATTENTION :
 *  - certains backends exposent /groups/:gid/trainings/:sid/attendance/
 *  - d'autres /sessions/:sid/attendance/
 *  => on tente la route "group" puis fallback "session"
 */

export async function getTrainingAttendance(groupId, sessionId) {
  // essaye d'abord la route "group", mais fallback quoi qu'il arrive si ça ne répond pas 200
  try {
    const { data } = await axiosClient.get(
      `/groups/${groupId}/trainings/${sessionId}/attendance/`
    );
    return data?.attendance ?? data ?? [];
  } catch (e) {
    // ✅ tente toujours la route session si la group-route échoue
    try {
      const { data } = await axiosClient.get(`/sessions/${sessionId}/attendance/`);
      return data?.attendance ?? data ?? [];
    } catch (e2) {
      throw e2; // remonte la vraie erreur si les deux échouent
    }
  }
}

export async function saveTrainingAttendance(groupId, sessionId, attendanceRows) {
  try {
    return await axiosClient.post(
      `/groups/${groupId}/trainings/${sessionId}/attendance/`,
      { attendance: attendanceRows }
    );
  } catch (e) {
    try {
      return await axiosClient.post(`/sessions/${sessionId}/attendance/`, {
        attendance: attendanceRows,
      });
    } catch (e2) {
      throw e2;
    }
  }
}
