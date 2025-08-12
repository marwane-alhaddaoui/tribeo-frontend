// src/api/sportService.js
import axios from "./axiosClient";

// Liste des sports (optionnellement filtrée par q)
// Attendu: [{ id, name }, ...]
export const listSports = async (q) => {
  const params = q ? { q } : undefined;
  const res = await axios.get("/sports/", { params }); // ajuste le chemin si besoin
  return res.data;
};

// Helper: trouve un sport par nom exact (insensible à la casse)
export const findSportByName = async (name) => {
  if (!name) return null;
  const data = await listSports(name);
  const target = String(name).trim().toLowerCase();
  return (data || []).find((s) => s?.name?.toLowerCase() === target) || null;
};
