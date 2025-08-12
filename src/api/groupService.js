// src/api/groupService.js
import axios from "./axiosClient";

// LISTE (avec filtres optionnels ?q=, ?sport=?, ?city=?)
export const listGroups = async (params = {}) => {
  const res = await axios.get("/groups/", { params });
  return res.data;
};

// DÉTAIL
export const getGroup = async (id) => {
  const res = await axios.get(`/groups/${id}/`);
  return res.data;
};

// CRÉATION
export const createGroup = async (payload) => {
  // payload: { name, sport, city?, description? }
  const res = await axios.post("/groups/", payload);
  return res.data;
};

// JOIN / LEAVE
export const joinGroup = async (id) => {
  const res = await axios.post(`/groups/${id}/join/`);
  return res.data;
};
export const leaveGroup = async (id) => {
  const res = await axios.post(`/groups/${id}/leave/`);
  return res.data;
};

// GESTION MEMBRES (owner/manager only)
export const addMember = async (id, userId) => {
  const res = await axios.post(`/groups/${id}/add-member/`, { user_id: userId });
  return res.data;
};
export const removeMember = async (id, userId) => {
  const res = await axios.post(`/groups/${id}/remove-member/`, { user_id: userId });
  return res.data;
};

// Compat: ancien front attendait getGroupsByCoach
export const getGroupsByCoach = async () => {
  const data = await listGroups();
  // si le dashboard coach ne doit voir QUE les groupes qu'il gère :
  return Array.isArray(data) ? data.filter(g => g.is_owner_or_manager) : [];
  // Si tu préfères tout renvoyer:
  // return data;
};
