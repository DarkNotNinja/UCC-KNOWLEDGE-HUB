// ── auth.js ──────────────────────────────────────────
// Simple JWT auth — checks token and redirects if missing
// Include on every protected page:
// <script src="auth.js"></script>

// Hide page immediately to prevent flicker
document.documentElement.style.visibility = "hidden";

function requireAuth() {
  const token = localStorage.getItem("token");
  if (!token) {
    window.location.href = "ucc_landing_page.html";
    return false;
  }
  document.documentElement.style.visibility = "visible";
  return true;
}

function getToken() {
  return localStorage.getItem("token");
}

function getCurrentUser() {
  const token = localStorage.getItem("token");
  if (!token) return null;
  try {
    const payload = JSON.parse(atob(token.split(".")[1].replace(/-/g,"+").replace(/_/g,"/")));
    return {
      userId:  String(payload.userId),
      name:    payload.fullname || "Student",
      fullname: payload.fullname || "Student"
    };
  } catch { return null; }
}

function logout() {
  localStorage.removeItem("token");
  window.location.href = "ucc_landing_page.html";
}

// Run auth check immediately
requireAuth();