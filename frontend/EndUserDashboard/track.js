/* ════════════════════════════════
   SmartFreeze — track.js
   Order lookup — Django API
   ════════════════════════════════ */

const API = 'http://127.0.0.1:8000/api/orders/';

/* Pre-fill order number if coming from checkout confirmation */
window.addEventListener('DOMContentLoaded', () => {
  const prefill = sessionStorage.getItem('sf_track_prefill');
  if (prefill) {
    document.getElementById('inputId').value = prefill;
    sessionStorage.removeItem('sf_track_prefill');
  }
});

async function lookup() {
  const rawId    = document.getElementById('inputId').value.trim().toUpperCase();
  const rawPhone = document.getElementById('inputPhone').value.trim().replace(/\s/g, '');
  const errEl    = document.getElementById('lookupError');
  errEl.textContent = '';

  if (!rawId || !rawPhone) {
    errEl.textContent = 'Please enter both your Order ID and phone number.';
    return;
  }

  const btn = document.querySelector('.lookup-btn');
  btn.textContent = 'Searching...';
  btn.disabled    = true;

  try {
    const res  = await fetch(`${API}${rawId}/?phone=${encodeURIComponent(rawPhone)}`);
    const data = await res.json();

    if (!res.ok) {
      errEl.textContent = data.error || 'No order found. Please check your details.';
      shake(document.querySelector('.lookup-fields'));
      return;
    }

    sessionStorage.setItem('sf_order', JSON.stringify(data));
    window.location.href = 'customer.html';

  } catch {
    errEl.textContent = 'Could not reach server. Please try again.';
  } finally {
    btn.textContent = 'Track Order';
    btn.disabled    = false;
  }
}

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