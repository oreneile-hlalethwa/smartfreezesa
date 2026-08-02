/* ════════════════════════════════
   SmartFreeze — login.js
   Wired to Django auth API
   ════════════════════════════════ */

const API_AUTH = 'https://smartfreezesa.onrender.com/api/auth/';

/* redirect if already logged in */
(async function () {
  const token = localStorage.getItem('sf_admin_token');
  if (!token) return;
  try {
    const res = await fetch(`${API_AUTH}verify/`, {
      headers: { 'Authorization': `Token ${token}` }
    });
    if (res.ok) window.location.href = 'admin.html';
  } catch { /* server down — stay on login */ }
})();

/* ════════════════════════════════
   SIGN IN
   ════════════════════════════════ */
async function doLogin() {
  const email    = document.getElementById('inputEmail').value.trim();
  const password = document.getElementById('inputPassword').value;
  const errEl    = document.getElementById('loginError');
  const btn      = document.getElementById('loginBtn');
  const btnText  = document.getElementById('loginBtnText');
  const spinner  = document.getElementById('loginSpinner');

  errEl.textContent = '';

  if (!email || !password) {
    errEl.textContent = 'Please fill in all fields.';
    shake(document.getElementById('loginForm'));
    return;
  }

  btn.disabled          = true;
  btnText.style.display = 'none';
  spinner.style.display = 'block';

  try {
    const res  = await fetch(`${API_AUTH}login/`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ email, password }),
    });
    const data = await res.json();

    if (!res.ok) {
      errEl.textContent = data.error || 'Invalid credentials. Please try again.';
      shake(document.getElementById('loginForm'));
      document.getElementById('inputPassword').value = '';
      document.getElementById('inputPassword').focus();
      return;
    }

    /* store token */
    localStorage.setItem('sf_admin_token',    data.token);
    localStorage.setItem('sf_admin_username', data.username);

    toast('Welcome back — redirecting…');
    setTimeout(() => { window.location.href = 'admin.html'; }, 900);

  } catch {
    errEl.textContent = 'Could not reach server. Make sure Django is running.';
  } finally {
    btn.disabled          = false;
    btnText.style.display = 'inline';
    spinner.style.display = 'none';
  }
}

/* ════════════════════════════════
   PASSWORD VISIBILITY
   ════════════════════════════════ */
function togglePw() {
  const input  = document.getElementById('inputPassword');
  const open   = document.getElementById('eyeOpen');
  const closed = document.getElementById('eyeClosed');
  const isText = input.type === 'text';
  input.type           = isText ? 'password' : 'text';
  open.style.display   = isText ? 'block'    : 'none';
  closed.style.display = isText ? 'none'     : 'block';
}

/* ════════════════════════════════
   FORGOT PASSWORD
   ════════════════════════════════ */
function showForgot() {
  document.getElementById('loginForm').style.display  = 'none';
  document.getElementById('forgotForm').style.display = 'flex';
  document.getElementById('forgotError').textContent  = '';
  document.getElementById('forgotEmail').value        = '';
  document.getElementById('forgotEmail').focus();
}

function showLogin() {
  document.getElementById('forgotForm').style.display = 'none';
  document.getElementById('loginForm').style.display  = 'flex';
}

function sendReset() {
  const email = document.getElementById('forgotEmail').value.trim();
  const errEl = document.getElementById('forgotError');
  errEl.textContent = '';
  if (!email) { errEl.textContent = 'Please enter your email address.'; return; }
  /* wired to email later */
  toast('Reset link sent — check your inbox');
  setTimeout(() => showLogin(), 1800);
}

/* ════════════════════════════════
   UTILS
   ════════════════════════════════ */
function shake(el) {
  el.style.animation = 'none';
  el.offsetHeight;
  el.style.animation = 'shake .4s ease';
}

function toast(msg) {
  const t = document.getElementById('tst');
  document.getElementById('tmsg').textContent = msg;
  t.classList.add('on');
  clearTimeout(t._t);
  t._t = setTimeout(() => t.classList.remove('on'), 2800);
}

const shakeStyle = document.createElement('style');
shakeStyle.textContent = `@keyframes shake {
  0%,100%{transform:translateX(0)}
  20%{transform:translateX(-8px)}
  40%{transform:translateX(8px)}
  60%{transform:translateX(-5px)}
  80%{transform:translateX(5px)}
}`;
document.head.appendChild(shakeStyle);