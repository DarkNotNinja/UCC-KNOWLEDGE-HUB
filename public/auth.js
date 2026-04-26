// ── auth.js ──────────────────────────────────────────
// Handles both student JWT auth and librarian session auth.
// Also manages site-wide dark/light theme.
// Include on every protected page: <script src="auth.js"></script>

document.documentElement.style.visibility = "hidden";

// ── THEME — apply immediately before paint to avoid flash ──
(function applyTheme() {
  const theme = localStorage.getItem("ucc_theme") || "dark";
  document.documentElement.setAttribute("data-theme", theme);
  if (theme === "light") {
    document.documentElement.classList.add("light-mode");
  }
})();

// ── Detect which type of page we're on ───────────────
const _isLibrarianPage = (
  window.location.pathname.includes("librarian")
);

async function requireAuth() {
  if (_isLibrarianPage) {
    return requireLibrarianAuth();
  } else {
    return requireStudentAuth();
  }
}

// ── STUDENT AUTH ─────────────────────────────────────
async function requireStudentAuth() {
  const token = localStorage.getItem("token");
  if (token) {
    document.documentElement.style.visibility = "visible";
    return true;
  }

  // ── Check for Supabase Google session ──
  const SUPABASE_URL  = "https://bqgtuxhfqfmxvryfljya.supabase.co";
  const SUPABASE_ANON = "sb_publishable_y71RZ0UCDxkcmFQQHGEf-Q_davD0hbm";
  const _sb = supabase.createClient(SUPABASE_URL, SUPABASE_ANON);

  const { data: { session } } = await _sb.auth.getSession();
  if (session) {
    // Save user info so the rest of the app can use it
    localStorage.setItem("token", session.access_token);
    document.documentElement.style.visibility = "visible";
    return true;
  }

  // No session at all — redirect to login
  window.location.href = "ucc_landing_page.html";
  return false;
}

// ── LIBRARIAN AUTH ────────────────────────────────────
function requireLibrarianAuth() {
  const session = getLibrarianSession();
  if (!session) {
    window.location.href = "ucc_login.html?mode=librarian";
    return false;
  }
  if (!["librarian","admin"].includes(session.role)) {
    window.location.href = "ucc_login.html?mode=librarian";
    return false;
  }
  document.documentElement.style.visibility = "visible";
  return true;
}

// ── TOKEN GETTERS ─────────────────────────────────────
function getToken() {
  if (_isLibrarianPage) {
    return localStorage.getItem("lib_token") || localStorage.getItem("token");
  }
  return localStorage.getItem("token");
}

function getCurrentUser() {
  if (_isLibrarianPage) {
    const session = getLibrarianSession();
    if (session) return session;
  }
  const token = localStorage.getItem("token");
  if (!token) return null;
  try {
    const payload = JSON.parse(
      atob(token.split(".")[1].replace(/-/g,"+").replace(/_/g,"/"))
    );
    return {
      userId:   String(payload.userId),
      fullname: payload.fullname || "Student",
      name:     payload.fullname || "Student",
      email:    payload.email    || "",
      role:     payload.role     || "student"
    };
  } catch { return null; }
}

// ── LIBRARIAN SESSION HELPERS ─────────────────────────
function getLibrarianSession() {
  try {
    const raw = localStorage.getItem("lib_session");
    if (!raw) return null;
    const session = JSON.parse(raw);
    if (session.loginAt) {
      const age = Date.now() - new Date(session.loginAt).getTime();
      if (age > 86400000) {
        localStorage.removeItem("lib_session");
        localStorage.removeItem("lib_token");
        return null;
      }
    }
    return session;
  } catch { return null; }
}

function isLibrarian() {
  const session = getLibrarianSession();
  return session && ["librarian","admin"].includes(session.role);
}

// ── LOGOUT ────────────────────────────────────────────
function logout() {
  if (_isLibrarianPage) {
    localStorage.removeItem("lib_session");
    localStorage.removeItem("lib_token");
    window.location.href = "ucc_landing_page.html";
  } else {
    localStorage.removeItem("token");
    window.location.href = "ucc_landing_page.html";
  }
}

// ── THEME SYSTEM ──────────────────────────────────────
function getTheme() {
  return localStorage.getItem("ucc_theme") || "dark";
}

function setTheme(theme) {
  localStorage.setItem("ucc_theme", theme);
  document.documentElement.setAttribute("data-theme", theme);
  if (theme === "light") {
    document.documentElement.classList.add("light-mode");
  } else {
    document.documentElement.classList.remove("light-mode");
  }
  // Update all toggle buttons on the page
  document.querySelectorAll(".theme-toggle-btn").forEach(btn => {
    btn.textContent   = theme === "dark" ? "☀️" : "🌙";
    btn.dataset.theme = theme;
    btn.title         = theme === "dark" ? "Switch to Light Mode" : "Switch to Dark Mode";
  });
  window.dispatchEvent(new CustomEvent("themechange", { detail: { theme } }));
}

function toggleTheme() {
  setTheme(getTheme() === "dark" ? "light" : "dark");
}

// ── INJECT LIGHT MODE CSS VARS + TOGGLE BUTTON ───────
window.addEventListener("DOMContentLoaded", () => {
  injectThemeStyles();
  injectThemeToggle();
  setTheme(getTheme()); // sync button label to saved theme
});

function injectThemeStyles() {
  if (document.getElementById("ucc-theme-styles")) return;
  const style = document.createElement("style");
  style.id = "ucc-theme-styles";
  style.textContent = `

    /* ── Light mode CSS variable overrides ── */
    html.light-mode {
      --bg:         hsl(220, 30%, 96%);
      --fg:         hsl(220, 40%, 12%)
      --primary:    hsl(43, 65%, 40%);
      --primary-fg: hsl(0, 0%, 100%);
      --card:       hsl(0, 0%, 100%);
      --muted:      hsl(220, 12%, 44%);
      --border:     hsl(220, 20%, 84%);
      --secondary:  hsl(220, 25%, 92%);
      --green:      hsl(152, 50%, 34%);
      --red:        hsl(0, 65%, 46%);
      --blue:       hsl(210, 70%, 42%);
      --orange:     hsl(30, 80%, 40%);
      --glow-gold:  0 0 24px hsla(43,65%,40%,0.15);
    }

    /* Smooth transition on theme swap */
    html { transition: background-color .2s ease, color .2s ease; }
    body, .site-header, .card, .stat-card, .book-card, .hold-card,
    .hold-item, .hold-row, .pdf-card, .rl-item, .rl-card, .saved-item,
    .modal-box, .modal, .login-card, .inv-card, .hc-info, .action-card {
      transition: background-color .2s ease, border-color .2s ease,
                  color .2s ease, box-shadow .2s ease !important;
    }

    /* ── Light mode header ── */
    html.light-mode .site-header {
      background: hsla(0,0%,100%,0.85) !important;
      box-shadow: 0 1px 0 var(--border);
    }

    /* ── Light mode backdrop overlays ── */
    html.light-mode .bg-overlay {
      background: linear-gradient(to right,
        hsla(220,30%,94%,0.90) 0%,
        hsla(220,30%,94%,0.75) 50%,
        hsla(220,30%,94%,0.90) 100%) !important;
    }
    html.light-mode .modal-overlay {
      background: hsla(220,30%,70%,0.5) !important;
    }

    /* ── Light mode login card ── */
    html.light-mode .login-card {
      background: hsla(0,0%,100%,0.95) !important;
      box-shadow: 0 24px 64px rgba(0,0,0,0.12) !important;
    }

    /* ── Light mode table rows ── */
    html.light-mode tbody tr:hover td {
      background: var(--secondary) !important;
    }

    /* ── Light mode skeleton shimmer ── */
    html.light-mode .skeleton,
    html.light-mode .skeleton-row {
      background: hsl(220,20%,88%) !important;
      border-color: hsl(220,20%,82%) !important;
    }

    /* ── Light mode search/input backgrounds ── */
    html.light-mode .search-bar,
    html.light-mode .search-input-wrap,
    html.light-mode .form-group input,
    html.light-mode .form-group select,
    html.light-mode .form-group textarea,
    html.light-mode .note-input,
    html.light-mode .filter-sel,
    html.light-mode .sort-sel,
    html.light-mode .status-sel {
      background: hsl(0,0%,100%) !important;
      border-color: var(--border) !important;
      color: var(--fg) !important;
    }

    /* ── Light mode nav links ── */
    html.light-mode .main-nav a {
      color: var(--muted);
    }
    html.light-mode .main-nav a:hover,
    html.light-mode .main-nav a.active {
      background: var(--secondary);
      color: var(--fg);
    }

    /* ── Theme toggle button ── */
    .theme-toggle-btn {
      display: inline-flex;
      align-items: center;
      gap: 5px;
      padding: 7px 13px;
      border-radius: 8px;
      font-family: var(--font-display, 'Space Grotesk', sans-serif);
      font-size: 0.78rem;
      font-weight: 600;
      cursor: pointer;
      border: 1px solid var(--border);
      background: var(--secondary);
      color: var(--muted);
      white-space: nowrap;
      flex-shrink: 0;
      line-height: 1;
      transition: border-color .2s, color .2s, background .2s !important;
    }
    .theme-toggle-btn:hover {
      border-color: var(--primary);
      color: var(--primary);
    }
  `;
  document.head.appendChild(style);
}

function injectThemeToggle() {
  // Insert into nav — works for both student and librarian layouts
  const nav = document.querySelector(".main-nav") || document.querySelector(".header-right");
  if (!nav) return;
  if (nav.querySelector(".theme-toggle-btn")) return;

  const btn = document.createElement("button");
  btn.className     = "theme-toggle-btn";
  btn.dataset.theme = getTheme();
  btn.title         = getTheme() === "dark" ? "Switch to Light Mode" : "Switch to Dark Mode";
  btn.textContent   = getTheme() === "dark" ? "☀️ Light Mode" : "🌙 Dark Mode";
  btn.onclick       = toggleTheme;

  // Place it just before the logout button
  const logoutBtn = nav.querySelector(".nav-logout") || nav.querySelector("#logoutBtn");
  if (logoutBtn) {
    nav.insertBefore(btn, logoutBtn);
  } else {
    nav.appendChild(btn);
  }
}

// ── RUN AUTH CHECK ────────────────────────────────────
requireAuth().catch(() => {
  window.location.href = "ucc_landing_page.html";
});