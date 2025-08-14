// src/api/billingService.js
import axiosClient from "./axiosClient";

// GET /api/billing/quotas/
export async function getQuotas() {
  const { data } = await axiosClient.get("/billing/quotas/");
  return data;
}

// POST /api/billing/checkout/<product_key>/
export async function createCheckout(productKey) {
  const { data } = await axiosClient.post(`/billing/checkout/${productKey}/`);
  return data?.checkout_url;
}

// ✅ NEW: POST /api/billing/verify/
export async function verifySession(session_id) {
  const { data } = await axiosClient.post(`/billing/verify/`, { session_id });
  return data; // { status, plan, subscription_id }
}
