// src/api/userService.js
import axios from "./axiosClient";

// Attend un endpoint backend: GET /users/search/?q=...
// Réponse: [{ id, username, email, first_name, last_name }]
export const searchUsers = async (q) => {
  const res = await axios.get("/users/search/", { params: { q } });
  return res.data;
};
