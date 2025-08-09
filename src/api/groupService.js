// src/axios/groupService.js
import axios from "./axiosClient"; // Ton instance axios avec baseURL et headers

/**
 * Récupère uniquement les groupes coachés par l'utilisateur connecté
 * (nécessite que le backend filtre selon request.user)
 */
export const getGroupsByCoach = async () => {
  try {
    const res = await axios.get("/groups/"); 
    // ✅ Si ton backend filtre déjà les groupes par coach dans get_queryset()
    return res.data;
  } catch (error) {
    console.error("Erreur getGroupsByCoach:", error);
    throw error;
  }
};

/**
 * Récupère tous les groupes (réservé à admin ou usage public)
 */
export const getAllGroups = async () => {
  try {
    const res = await axios.get("/groups/");
    return res.data;
  } catch (error) {
    console.error("Erreur getAllGroups:", error);
    throw error;
  }
};

/**
 * Ajoute un membre dans un groupe
 * @param {number} groupId 
 * @param {number} userId 
 */
export const addMemberToGroup = async (groupId, userId) => {
  try {
    const res = await axios.post(`/groups/${groupId}/add-member/`, { user_id: userId });
    return res.data;
  } catch (error) {
    console.error("Erreur addMemberToGroup:", error);
    throw error;
  }
};

/**
 * Retire un membre d’un groupe
 * @param {number} groupId 
 * @param {number} userId 
 */
export const removeMemberFromGroup = async (groupId, userId) => {
  try {
    const res = await axios.post(`/groups/${groupId}/remove-member/`, { user_id: userId });
    return res.data;
  } catch (error) {
    console.error("Erreur removeMemberFromGroup:", error);
    throw error;
  }
};
