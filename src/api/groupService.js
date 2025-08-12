// src/api/groupService.js
import axios from "./axiosClient";

/* =========================
   GROUPS (list / detail / CRUD)
   ========================= */

export const listGroups = async (params = {}) => {
  // Filtres possibles: q, sport, city, scope?
  const res = await axios.get("/groups/", { params });
  return res.data;
};

export const getGroup = async (id) => {
  const res = await axios.get(`/groups/${id}/`);
  return res.data;
};

export const createGroup = async (payload) => {
  // payload: { name, sport_id, city?, description? }
  const res = await axios.post("/groups/", payload);
  return res.data;
};

export const updateGroup = async (id, payload) => {
  const res = await axios.patch(`/groups/${id}/`, payload);
  return res.data;
};

export const deleteGroup = async (id) => {
  const res = await axios.delete(`/groups/${id}/`);
  return res.data;
};

/* =========================
   MEMBERSHIP (join / leave)
   ========================= */

export const joinGroup = async (id) => {
  const res = await axios.post(`/groups/${id}/join/`);
  return res.data;
};

export const leaveGroup = async (id) => {
  const res = await axios.post(`/groups/${id}/leave/`);
  return res.data;
};

/* =========================================
   MEMBERS (internal users of the application)
   ========================================= */

export const addMember = async (groupId, userId) => {
  // backend: POST /groups/:pk/add-member/  { user_id }
  const res = await axios.post(`/groups/${groupId}/add-member/`, { user_id: userId });
  return res.data;
};

export const removeMember = async (groupId, userId) => {
  // backend: POST /groups/:pk/remove-member/  { user_id }
  const res = await axios.post(`/groups/${groupId}/remove-member/`, { user_id: userId });
  return res.data;
};

/* =========================
   JOIN REQUESTS (PRIVATE)
   ========================= */

export const listJoinRequests = async (groupId) => {
  const res = await axios.get(`/groups/${groupId}/requests/`);
  return res.data;
};

export const approveJoinReq = async (groupId, requestId) => {
  const res = await axios.post(`/groups/${groupId}/requests/${requestId}/approve/`);
  return res.data;
};

export const rejectJoinReq = async (groupId, requestId) => {
  const res = await axios.post(`/groups/${groupId}/requests/${requestId}/reject/`);
  return res.data;
};

/* =========================================
   EXTERNAL MEMBERS (non-registered people)
   ========================================= */

export const listExternalMembers = async (groupId) => {
  // backend: GET /groups/:pk/external-members/
  const res = await axios.get(`/groups/${groupId}/external-members/`);
  return res.data;
};

export const addExternalMember = async (groupId, payload) => {
  // backend: POST /groups/:pk/external-members/  { first_name, last_name, note? }
  const res = await axios.post(`/groups/${groupId}/external-members/`, payload);
  return res.data;
};

export const deleteExternalMember = async (externalMemberId) => {
  // backend: DELETE /groups/external-members/:eid/   (⚠️ pas de :pk dans l’URL)
  const res = await axios.delete(`/groups/external-members/${externalMemberId}/`);
  return res.data;
};

/* =========================================
   Helper: groups I manage (owner/manager)
   ========================================= */

export const getGroupsByCoach = async () => {
  const data = await listGroups({ scope: "my" }).catch(() => listGroups());
  return Array.isArray(data) ? data.filter((g) => g?.is_owner_or_manager) : [];
};
