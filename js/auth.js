/* ============================================================
   ADITYA SKILL GATE IT SOLUTION — AUTH JS
   js/auth.js — Admin authentication & session management
   ============================================================ */

const AUTH_KEY = 'admin_token';
const AUTH_USER = 'admin_user';
const VALID_TOKEN = 'asg_admin_token';
const ADMIN_CREDENTIALS = {
  username: 'admin',
  password: 'Aditya@2026'
};

const Auth = {
  /* Check if admin is authenticated */
  isAuthenticated() {
    const token = sessionStorage.getItem(AUTH_KEY);
    return token === VALID_TOKEN;
  },

  /* Get current user */
  getUser() {
    return sessionStorage.getItem(AUTH_USER) || 'Admin';
  },

  /* Login */
  async login(username, password) {
    // Try API first
    try {
      const res = await API.adminLogin({ username, password });
      if (res?.success) {
        sessionStorage.setItem(AUTH_KEY, res.token || VALID_TOKEN);
        sessionStorage.setItem(AUTH_USER, username);
        return { success: true };
      }
    } catch (e) { /* fallback */ }

    // Local check (for demo / when API not configured)
    if (username === ADMIN_CREDENTIALS.username && password === ADMIN_CREDENTIALS.password) {
      sessionStorage.setItem(AUTH_KEY, VALID_TOKEN);
      sessionStorage.setItem(AUTH_USER, username);
      return { success: true };
    }

    return { success: false, message: 'Invalid username or password.' };
  },

  /* Logout */
  logout() {
    sessionStorage.removeItem(AUTH_KEY);
    sessionStorage.removeItem(AUTH_USER);
    window.location.href = 'login.html';
  },

  /* Guard — call on every admin page (except login) */
  checkAuth() {
    if (!this.isAuthenticated()) {
      window.location.href = 'login.html';
      return false;
    }
    // Update UI with user info
    document.querySelectorAll('.admin-user-name, .topbar-user-name, .sidebar-user-name').forEach(el => {
      el.textContent = this.getUser();
    });
    return true;
  }
};

/* Auto-run on admin pages */
document.addEventListener('DOMContentLoaded', () => {
  const isLoginPage = window.location.pathname.endsWith('login.html');

  if (!isLoginPage) {
    Auth.checkAuth();

    /* Logout button */
    document.getElementById('logout-btn')?.addEventListener('click', () => {
      if (confirm('Are you sure you want to logout?')) Auth.logout();
    });
  } else {
    /* On login page, redirect if already authenticated */
    if (Auth.isAuthenticated()) {
      window.location.href = 'dashboard.html';
    }
  }
});

window.Auth = Auth;
