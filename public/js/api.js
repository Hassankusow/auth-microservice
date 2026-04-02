/**
 * Lightweight API client for the Auth Microservice demo frontend.
 * Handles JSON requests, error extraction, and shared alert helpers.
 */

const api = {
  async post(endpoint, body) {
    const res = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Request failed");
    return data;
  },

  async get(endpoint, token = null) {
    const headers = { "Content-Type": "application/json" };
    if (token) headers["Authorization"] = `Bearer ${token}`;
    const res = await fetch(endpoint, { headers });
    const data = await res.json();
    // Return data regardless of status so dashboard can display error responses too
    return data;
  },
};

// ─── Shared alert helpers (used across all pages) ─────────────────────────────

function showAlert(id, message) {
  const el = document.getElementById(id);
  if (el) {
    el.textContent = message;
    el.classList.add("show");
  }
}

function hideAlerts() {
  document.querySelectorAll(".alert").forEach(el => el.classList.remove("show"));
}
