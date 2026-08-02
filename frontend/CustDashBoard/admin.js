/* ════════════════════════════════
   SmartFreeze — admin.js
   Orders dashboard — Django API
   ════════════════════════════════ */

const API = 'http://127.0.0.1:8000/api/orders/';

const STAGES = ['pending', 'confirmed', 'out_for_delivery', 'delivered'];
const STAGE_LABELS = {
  pending:          'Pending',
  confirmed:        'Confirmed',
  out_for_delivery: 'Out for Delivery',
  delivered:        'Delivered',
};

let ORDERS        = [];
let activeTab     = 'all';
let deliverTarget = null;
let contactTarget = null;

/* ════════════════════════════════
   LOAD ORDERS FROM DJANGO
   ════════════════════════════════ */
async function loadOrders() {
  try {
    const res = await fetch(API);
    ORDERS    = await res.json();
    renderStats();
    renderTable();
  } catch (err) {
    console.error('Could not load orders:', err);
    toast('Could not reach server');
  }
}

/* ════════════════════════════════
   STATS
   ════════════════════════════════ */
function renderStats() {
  const total     = ORDERS.length;
  const pending   = ORDERS.filter(o => o.status === 'pending').length;
  const delivered = ORDERS.filter(o => o.status === 'delivered').length;
  const revenue   = ORDERS.filter(o => o.status === 'delivered').reduce((s,o) => s + o.total, 0);

  document.getElementById('statsRow').innerHTML = `
    <div class="stat-card sc-blue">
      <div class="stat-label">Total Orders</div>
      <div class="stat-num">${total}</div>
      <div class="stat-sub">All time</div>
    </div>
    <div class="stat-card sc-red">
      <div class="stat-label">Pending</div>
      <div class="stat-num">${pending}</div>
      <div class="stat-sub">Awaiting confirmation</div>
    </div>
    <div class="stat-card sc-green">
      <div class="stat-label">Delivered</div>
      <div class="stat-num">${delivered}</div>
      <div class="stat-sub">Completed orders</div>
    </div>
    <div class="stat-card sc-gold">
      <div class="stat-label">Revenue</div>
      <div class="stat-num" style="font-size:32px">R${revenue.toLocaleString()}</div>
      <div class="stat-sub">From delivered orders</div>
    </div>
  `;
}

/* ════════════════════════════════
   TAB COUNTS
   ════════════════════════════════ */
function updateCounts() {
  const q   = document.getElementById('searchInput').value.toLowerCase();
  const pay = document.getElementById('payFilter').value;
  const filtered = ORDERS.filter(o => matchSearch(o,q) && matchPay(o,pay));

  document.getElementById('cnt-all').textContent              = filtered.length;
  document.getElementById('cnt-pending').textContent          = filtered.filter(o=>o.status==='pending').length;
  document.getElementById('cnt-confirmed').textContent        = filtered.filter(o=>o.status==='confirmed').length;
  document.getElementById('cnt-out_for_delivery').textContent = filtered.filter(o=>o.status==='out_for_delivery').length;
  document.getElementById('cnt-delivered').textContent        = filtered.filter(o=>o.status==='delivered').length;
}

/* ════════════════════════════════
   FILTERS
   ════════════════════════════════ */
function matchSearch(o, q) {
  if (!q) return true;
  return o.name.toLowerCase().includes(q) ||
         o.order_number.toLowerCase().includes(q) ||
         o.phone.includes(q);
}
function matchPay(o, pay) {
  if (!pay) return true;
  return o.payment === pay;
}

function setTab(tab, btn) {
  activeTab = tab;
  document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('on'));
  btn.classList.add('on');
  renderTable();
}

/* ════════════════════════════════
   STATUS BADGE
   ════════════════════════════════ */
function statusBadge(status) {
  const cls = {
    pending:          'st-pending',
    confirmed:        'st-confirmed',
    out_for_delivery: 'st-outfor',
    delivered:        'st-delivered',
  }[status] || 'st-pending';
  return `<span class="status-badge ${cls}"><span class="s-dot"></span>${STAGE_LABELS[status]||status}</span>`;
}

/* ════════════════════════════════
   RENDER TABLE
   ════════════════════════════════ */
function renderTable() {
  updateCounts();
  const q   = document.getElementById('searchInput').value.toLowerCase();
  const pay = document.getElementById('payFilter').value;

  let rows = ORDERS.filter(o =>
    matchSearch(o,q) && matchPay(o,pay) &&
    (activeTab === 'all' || o.status === activeTab)
  );

  const body  = document.getElementById('orderBody');
  const empty = document.getElementById('emptyState');

  if (!rows.length) {
    body.innerHTML = '';
    empty.style.display = 'block';
    return;
  }
  empty.style.display = 'none';

  body.innerHTML = rows.map(o => {
    const itemNames  = o.items?.map(i => i.name).join(', ') || '—';
    const payHtml    = o.payment === 'cod'
      ? `<span class="pay-badge pay-cod"><svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="6" width="20" height="12" rx="2"/><path d="M12 12a2 2 0 1 0 0-4 2 2 0 0 0 0 4z"/></svg> Cash on Delivery</span>`
      : `<span class="pay-badge pay-online"><svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="1" y="4" width="22" height="16" rx="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg> Online Paid</span>`;

    const isDone = o.status === 'delivered';
    const date   = new Date(o.created_at).toLocaleDateString('en-ZA', {day:'numeric',month:'short',year:'numeric'});

    return `<tr>
      <td><span class="oid">${o.order_number}</span></td>
      <td>
        <div class="cust-cell"><div>
          <div class="cust-name">${o.name}</div>
          <div class="cust-phone">${o.phone}</div>
        </div></div>
      </td>
      <td><div class="prod-cell"><div class="prod-name">${itemNames}</div></div></td>
      <td>${payHtml}</td>
      <td><span class="price-cell">R ${o.total.toLocaleString()}</span></td>
      <td>${statusBadge(o.status)}</td>
      <td style="font-size:12px;color:var(--muted);white-space:nowrap">${date}</td>
      <td>
        <div class="actions-cell">
          ${!isDone ? `
          <button class="act-btn act-contact" title="Contact customer" onclick="openContact('${o.order_number}')">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2A19.79 19.79 0 0 1 11.61 19a19.5 19.5 0 0 1-6-6A19.79 19.79 0 0 1 3.09 4.18 2 2 0 0 1 5.07 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L9.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
          </button>
          <button class="act-btn act-mark" title="Advance order" onclick="openAdvance('${o.order_number}')">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
          </button>` : `
          <button class="act-btn" title="Delivered">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
          </button>`}
        </div>
      </td>
    </tr>`;
  }).join('');
}

/* ════════════════════════════════
   CONTACT MODAL
   ════════════════════════════════ */
function openContact(orderNumber) {
  const o = ORDERS.find(x => x.order_number === orderNumber);
  if (!o) return;
  contactTarget = o;
  document.getElementById('modalTitle').textContent = `Contact ${o.name}`;
  document.getElementById('modalSub').textContent   = `${o.order_number} · ${STAGE_LABELS[o.status]}`;
  document.getElementById('modalInfo').innerHTML = `
    <div class="modal-info-row"><span class="k">Phone</span><span class="v">${o.phone}</span></div>
    <div class="modal-info-row"><span class="k">Email</span><span class="v">${o.email}</span></div>
    <div class="modal-info-row"><span class="k">City</span><span class="v">${o.city}</span></div>
    <div class="modal-info-row"><span class="k">Amount</span><span class="v">R ${o.total.toLocaleString()}</span></div>
    <div class="modal-info-row"><span class="k">Payment</span><span class="v">${o.payment === 'cod' ? 'Cash on Delivery' : 'Online Paid'}</span></div>
  `;
  const items = o.items?.map(i=>i.name).join(', ') || 'your fridge';
  document.getElementById('modalMsg').value = `Hi ${o.name.split(' ')[0]}, your SmartFreeze order (${o.order_number}) for ${items} is being processed. We'll confirm your delivery shortly.`;
  document.getElementById('modalOv').classList.add('open');
}

function closeModal() { document.getElementById('modalOv').classList.remove('open'); }

function sendMsg() {
  if (!contactTarget) return;
  const msg = encodeURIComponent(document.getElementById('modalMsg').value);
  const num = contactTarget.phone.replace(/^0/, '27').replace(/\s/g,'');
  window.open(`https://wa.me/${num}?text=${msg}`, '_blank');
  closeModal();
  toast(`Message sent to ${contactTarget.name}`);
}

/* ════════════════════════════════
   ADVANCE MODAL
   ════════════════════════════════ */
function openAdvance(orderNumber) {
  const o = ORDERS.find(x => x.order_number === orderNumber);
  if (!o) return;
  deliverTarget = o;

  const nextStatus = STAGES[STAGES.indexOf(o.status) + 1];
  const nextLabel  = STAGE_LABELS[nextStatus];

  document.getElementById('deliverSub').textContent = `${o.order_number} · ${o.name}`;
  document.getElementById('deliverInfo').innerHTML = `
    <div class="modal-info-row"><span class="k">Customer</span><span class="v">${o.name}</span></div>
    <div class="modal-info-row"><span class="k">Current Stage</span><span class="v">${STAGE_LABELS[o.status]}</span></div>
    <div class="modal-info-row"><span class="k">Next Stage</span><span class="v" style="color:var(--green2)">${nextLabel}</span></div>
    ${o.status==='out_for_delivery'&&o.payment==='cod'
      ? `<div class="modal-info-row"><span class="k">Payment</span><span class="v" style="color:var(--orange)">Cash on Delivery — collect on arrival</span></div>` : ''}
  `;
  document.querySelector('#deliverOv .btn-green').textContent = `Move to ${nextLabel}`;
  document.getElementById('deliverOv').classList.add('open');
}

function closeDeliverModal() { document.getElementById('deliverOv').classList.remove('open'); }

async function confirmDeliver() {
  if (!deliverTarget) return;
  const nextStatus = STAGES[STAGES.indexOf(deliverTarget.status) + 1];
  const nextLabel  = STAGE_LABELS[nextStatus];

  try {
    const res = await fetch(`${API}${deliverTarget.order_number}/`, {
      method:  'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ status: nextStatus }),
    });
    if (!res.ok) throw new Error('Failed');

    const idx = ORDERS.findIndex(o => o.order_number === deliverTarget.order_number);
    if (idx !== -1) ORDERS[idx].status = nextStatus;

    closeDeliverModal();
    renderStats();
    renderTable();
    toast(`${deliverTarget.name}'s order moved to ${nextLabel}`);
    deliverTarget = null;
  } catch {
    toast('Could not update order — check server');
  }
}

/* ════════════════════════════════
   TOAST
   ════════════════════════════════ */
function toast(msg) {
  const t = document.getElementById('tst');
  document.getElementById('tmsg').textContent = msg;
  t.classList.add('on');
  clearTimeout(t._t);
  t._t = setTimeout(() => t.classList.remove('on'), 2800);
}

document.getElementById('modalOv').addEventListener('click', e => { if(e.target===document.getElementById('modalOv')) closeModal(); });
document.getElementById('deliverOv').addEventListener('click', e => { if(e.target===document.getElementById('deliverOv')) closeDeliverModal(); });
document.addEventListener('keydown', e => { if(e.key==='Escape'){ closeModal(); closeDeliverModal(); } });

/* ── INIT ── */
loadOrders();