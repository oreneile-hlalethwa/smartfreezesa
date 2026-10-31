/* ════════════════════════════════
   SmartFreeze — customer.js
   Order detail — reads from Django
   ════════════════════════════════ */

const API = `${BASE_URL}`;

window.addEventListener('DOMContentLoaded', async () => {
  const raw = sessionStorage.getItem('sf_order');
  if (!raw) { window.location.href = 'track.html'; return; }

  const cached = JSON.parse(raw);

  // Always re-fetch from Django to get the latest status
  try {
    const res = await fetch(`${API}${cached.order_number}/?phone=${encodeURIComponent(cached.phone)}`);
    if (res.ok) {
      const fresh = await res.json();
      sessionStorage.setItem('sf_order', JSON.stringify(fresh));
      showOrder(fresh);
    } else {
      showOrder(cached);
    }
  } catch {
    showOrder(cached);
  }
});

/* ════════════════════════════════
   SHOW ORDER
   ════════════════════════════════ */
function showOrder(o) {
  const items     = o.items || [];
  const firstName = o.name.split(' ')[0];
  const date      = new Date(o.created_at).toLocaleDateString('en-ZA', {day:'numeric',month:'long',year:'numeric'});

  document.getElementById('dTitle').textContent = `Order ${o.order_number}`;
  document.getElementById('dSub').textContent   = `Placed on ${date}`;

  const pill = document.getElementById('dStatusPill');
  const statusMap = {
    pending:          { cls:'sp-pending',   label:'Pending Confirmation' },
    confirmed:        { cls:'sp-confirmed', label:'Confirmed' },
    out_for_delivery: { cls:'sp-outfor',    label:'Out for Delivery' },
    delivered:        { cls:'sp-delivered', label:'Delivered' },
  };
  const s = statusMap[o.status] || statusMap.pending;
  pill.className = `status-pill ${s.cls}`;
  pill.innerHTML = `<span class="sp-dot"></span> ${s.label}`;

  /* timeline */
  document.getElementById('timeline').innerHTML = buildTimeline(o, date).map((step, i, arr) => `
    <div class="tl-step ${step.state}">
      <div class="tl-icon-wrap">
        <div class="tl-icon">${step.icon}</div>
        ${i < arr.length - 1 ? `<div class="tl-line"></div>` : ''}
      </div>
      <div class="tl-body">
        <div class="tl-label">${step.label}</div>
        <div class="tl-time">${step.time}</div>
        ${step.note ? `<div class="tl-note">${step.note}</div>` : ''}
      </div>
    </div>`).join('');

  /* products */
  const productHtml = items.length
    ? items.map(item => `
        <div class="product-row">
          <div class="product-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect x="5" y="2" width="14" height="20" rx="2"/><line x1="5" y1="10" x2="19" y2="10"/><line x1="9" y1="6" x2="9" y2="8"/></svg>
          </div>
          <div>
            <div class="product-name">${item.name}</div>
            <div class="product-meta">Qty: ${item.quantity}</div>
          </div>
          <div class="product-price">R ${(item.price * item.quantity).toLocaleString()}</div>
        </div>`).join('')
    : '<div style="color:var(--muted);font-size:13px">No items found</div>';

  document.getElementById('productRow').outerHTML = `<div id="productRow">${productHtml}</div>`;

  /* order info */
  document.getElementById('infoList').innerHTML = `
    <div class="info-row"><span class="info-k">Order ID</span>     <span class="info-v" style="font-family:'Space Mono',monospace;font-size:12px;color:var(--blue2)">${o.order_number}</span></div>
    <div class="info-row"><span class="info-k">Customer</span>     <span class="info-v">${o.name}</span></div>
    <div class="info-row"><span class="info-k">Phone</span>        <span class="info-v">${o.phone}</span></div>
    <div class="info-row"><span class="info-k">Email</span>        <span class="info-v">${o.email}</span></div>
    <div class="info-row"><span class="info-k">City</span>         <span class="info-v">${o.city}</span></div>
    <div class="info-row"><span class="info-k">Address</span>      <span class="info-v">${o.address}</span></div>
    <div class="info-row"><span class="info-k">Status</span>       <span class="info-v">${s.label}</span></div>
  `;

  /* payment */
  const isCod = o.payment === 'cod';
  document.getElementById('paymentBlock').innerHTML = `
    <div class="pay-icon ${isCod ? 'pay-icon-cod' : 'pay-icon-online'}">
      ${isCod
        ? `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="6" width="20" height="12" rx="2"/><path d="M12 12a2 2 0 1 0 0-4 2 2 0 0 0 0 4z"/><path d="M6 12h.01M18 12h.01"/></svg>`
        : `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="1" y="4" width="22" height="16" rx="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>`
      }
    </div>
    <div>
      <div class="pay-label">${isCod ? 'Cash on Delivery' : 'Online / Card'}</div>
      <div class="pay-desc">${isCod ? 'Pay when your fridge arrives' : 'Payment received — thank you'}</div>
    </div>
    <div class="pay-amount">R ${o.total.toLocaleString()}</div>
  `;
}

/* ════════════════════════════════
   TIMELINE BUILDER
   ════════════════════════════════ */
function buildTimeline(o, date) {
  const iconOrder = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>`;
  const iconCheck = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>`;
  const iconTruck = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="1" y="3" width="15" height="13"/><polygon points="16 8 20 8 23 11 23 16 16 16 16 8"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/></svg>`;
  const iconHome  = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>`;

  const STAGES = ['pending','confirmed','out_for_delivery','delivered'];
  const idx    = STAGES.indexOf(o.status);

  return [
    { label:'Order Placed',     icon:iconOrder, state: idx >= 0 ? 'tl-done' : '',        time: idx >= 0 ? date : 'Pending',     note:'Your order was received.' },
    { label:'Order Confirmed',  icon:iconCheck, state: idx >= 1 ? 'tl-done' : idx === 0 ? 'tl-active' : '', time: idx >= 1 ? date : idx === 0 ? 'In progress' : 'Pending', note:'SmartFreeze confirmed your order.' },
    { label:'Out for Delivery', icon:iconTruck, state: idx >= 2 ? 'tl-done' : idx === 1 ? 'tl-active' : '', time: idx >= 2 ? 'Dispatched' : idx === 1 ? 'Coming soon' : 'Pending', note:`Your fridge will be dispatched to ${o.city}.` },
    { label:'Delivered',        icon:iconHome,  state: idx >= 3 ? 'tl-done' : idx === 2 ? 'tl-active' : '', time: idx >= 3 ? date : 'Pending', note: idx >= 3 ? 'Your fridge was delivered. Enjoy!' : null },
  ];
}

function toast(msg) {
  const t = document.getElementById('tst');
  document.getElementById('tmsg').textContent = msg;
  t.classList.add('on');
  clearTimeout(t._t);
  t._t = setTimeout(() => t.classList.remove('on'), 2800);
}