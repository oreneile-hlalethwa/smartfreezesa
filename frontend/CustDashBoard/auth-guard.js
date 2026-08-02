/* ════════════════════════════════
   SmartFreeze — auth-guard.js
   Add this script tag FIRST on
   admin.html, inventory.html,
   marketing.html
   ════════════════════════════════ */

const API_AUTH = 'https://smartfreezesa.onrender.com/api/auth/';

/* ── Check token on every page load ── */
(async function guardDashboard() {
  const token = localStorage.getItem('sf_admin_token');

  if (!token) {
    window.location.href = 'login.html';
    return;
  }

  try {
    const res = await fetch(`${API_AUTH}verify/`, {
      headers: { 'Authorization': `Token ${token}` }
    });

    if (!res.ok) {
      localStorage.removeItem('sf_admin_token');
      localStorage.removeItem('sf_admin_username');
      window.location.href = 'login.html';
    }
    /* valid — show username in sidebar */
    const data = await res.json();
    const nameEl = document.getElementById('sbAdminName');
    if (nameEl) nameEl.textContent = data.username || 'SmartFreeze SA';

  } catch {
    /* server down — still allow access if token exists locally */
    console.warn('Could not verify token — server may be down');
  }
})();

/* ── Logout ── */
async function logout() {
  const token = localStorage.getItem('sf_admin_token');
  if (token) {
    try {
      await fetch(`${API_AUTH}logout/`, {
        method:  'POST',
        headers: { 'Authorization': `Token ${token}` },
      });
    } catch { /* ignore */ }
  }
  localStorage.removeItem('sf_admin_token');
  localStorage.removeItem('sf_admin_username');
  window.location.href = 'login.html';
}

/* ── Attach token to all admin API calls ── */
function authHeader() {
  const token = localStorage.getItem('sf_admin_token');
  return token ? { 'Authorization': `Token ${token}` } : {};
}