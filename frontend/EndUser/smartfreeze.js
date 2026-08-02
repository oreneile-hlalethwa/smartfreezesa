/* ════════════════════════════════════════
   SmartFreeze — smartfreeze.js
   Customer page — Cart, Checkout, Reviews
   ════════════════════════════════════════ */

const API_PRODUCTS  = 'http://127.0.0.1:8000/api/products/shop/';
const API_MARKETING = 'http://127.0.0.1:8000/api/marketing/?published=true';
const API_ORDERS    = 'http://127.0.0.1:8000/api/orders/';
const API_REVIEWS   = 'http://127.0.0.1:8000/api/reviews/';

/* ════════════════════════════════════════
   CART STATE
   ════════════════════════════════════════ */
let CART = [];

function addToCart(fridge) {
  const existing = CART.find(i => i.id === fridge.id);
  if (existing) { existing.quantity = (existing.quantity || 1) + 1; }
  else { CART.push({ ...fridge, quantity: 1 }); }
  updateCartUI();
  toast(`${fridge.name} added to cart`);
  clMo();
  openCart();
}

function removeFromCart(id) {
  CART = CART.filter(i => i.id !== id);
  updateCartUI();
  renderCartItems();
}

function updateCartUI() {
  const count = CART.reduce((s, i) => s + (i.quantity || 1), 0);
  const btn   = document.getElementById('cartBtn');
  if (btn) btn.textContent = `Cart (${count})`;
}

function cartTotal() {
  return CART.reduce((s, i) => s + i.price * (i.quantity || 1), 0);
}

/* ════════════════════════════════════════
   CART DRAWER
   ════════════════════════════════════════ */
function openCart() {
  renderCartItems();
  document.getElementById('cartDrawer').classList.add('open');
  document.getElementById('cartOverlay').classList.add('open');
  document.body.style.overflow = 'hidden';
}

function closeCart() {
  document.getElementById('cartDrawer').classList.remove('open');
  document.getElementById('cartOverlay').classList.remove('open');
  document.body.style.overflow = '';
}

function renderCartItems() {
  const body = document.getElementById('cartItems');
  const foot = document.getElementById('cartFooter');

  if (!CART.length) {
    body.innerHTML = `<div class="cart-empty">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.2" stroke-linecap="round">
        <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/>
        <line x1="3" y1="6" x2="21" y2="6"/>
        <path d="M16 10a4 4 0 0 1-8 0"/>
      </svg>
      <p>Your cart is empty</p>
    </div>`;
    foot.style.display = 'none';
    return;
  }

  body.innerHTML = CART.map(item => `
    <div class="cart-item">
      <div class="cart-item-img">
        ${item.image_url
          ? `<img src="${item.image_url}" alt="${item.name}" onerror="this.style.display='none'">`
          : `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.2"><rect x="5" y="2" width="14" height="20" rx="2"/><line x1="5" y1="10" x2="19" y2="10"/></svg>`
        }
      </div>
      <div class="cart-item-info">
        <div class="cart-item-name">${item.name}</div>
        <div class="cart-item-brand">${item.brand} · ${item.type === 'bar' ? 'Bar Fridge' : 'Top Freezer'}</div>
        <div class="cart-item-price">R${item.price.toLocaleString()}</div>
      </div>
      <button class="cart-item-remove" onclick="removeFromCart(${item.id})">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
      </button>
    </div>
  `).join('');

  foot.style.display = 'block';
  document.getElementById('cartTotal').textContent = `R${cartTotal().toLocaleString()}`;
}

/* ════════════════════════════════════════
   CHECKOUT MODAL
   ════════════════════════════════════════ */
function openCheckout() {
  if (!CART.length) { toast('Your cart is empty'); return; }
  closeCart();
  document.getElementById('checkoutItems').innerHTML = CART.map(item => `
    <div class="co-item">
      <span>${item.name}</span>
      <span>R${item.price.toLocaleString()}</span>
    </div>`).join('');
  document.getElementById('checkoutTotal').textContent = `R${cartTotal().toLocaleString()}`;
  document.getElementById('checkoutOv').classList.add('open');
  document.body.style.overflow = 'hidden';
}

function closeCheckout() {
  document.getElementById('checkoutOv').classList.remove('open');
  document.body.style.overflow = '';
}

function setPayment(type, btn) {
  document.querySelectorAll('.pay-tab').forEach(b => b.classList.remove('on'));
  btn.classList.add('on');
  document.getElementById('selectedPayment').value = type;
}

async function submitOrder() {
  const btn     = document.getElementById('placeOrderBtn');
  const name    = document.getElementById('coName').value.trim();
  const email   = document.getElementById('coEmail').value.trim();
  const phone   = document.getElementById('coPhone').value.trim();
  const address = document.getElementById('coAddress').value.trim();
  const city    = document.getElementById('coCity').value.trim();
  const payment = document.getElementById('selectedPayment').value;

  if (!name || !email || !phone || !address || !city) {
    toast('Please fill in all delivery details');
    return;
  }

  btn.textContent = 'Placing Order...';
  btn.disabled    = true;

  const payload = {
    name, email, phone, address, city, payment,
    items: CART.map(i => ({
      fridge_id: i.id,
      name:      i.name,
      price:     i.price,
      quantity:  i.quantity || 1,
    })),
  };

  try {
    const res  = await fetch(API_ORDERS, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify(payload),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(JSON.stringify(data));
    CART = [];
    updateCartUI();
    closeCheckout();
    showOrderConfirmation(data);
  } catch (err) {
    toast('Order failed — please try again');
    console.error(err);
    btn.textContent = 'Place Order';
    btn.disabled    = false;
  }
}

function showOrderConfirmation(order) {
  document.getElementById('confirmOrderNum').textContent = order.order_number;
  document.getElementById('confirmOv').classList.add('open');
  document.body.style.overflow = 'hidden';
}

function closeConfirm() {
  document.getElementById('confirmOv').classList.remove('open');
  document.body.style.overflow = '';
}

function goToTracking() {
  const num = document.getElementById('confirmOrderNum').textContent;
  sessionStorage.setItem('sf_track_prefill', num);
  window.location.href = '../EndUserDashboard/track.html';
}

/* ════════════════════════════════════════
   NAV SCROLL + ACTIVE LINK
   ════════════════════════════════════════ */
const navLinks = document.querySelectorAll('nav ul a');
const sections = ['hero','browse','how-it-works','about','contact']
  .map(id => ({ id, el: document.getElementById(id) }));

function setActiveNav() {
  const scrollBot = scrollY + window.innerHeight;
  const docH      = document.documentElement.scrollHeight;
  let current     = 'hero';
  if (scrollBot >= docH - 10) { current = 'contact'; }
  else {
    const mid = scrollY + window.innerHeight * 0.45;
    sections.forEach(s => { if (s.el && s.el.offsetTop <= mid) current = s.id; });
  }
  navLinks.forEach(a => { a.classList.toggle('on', a.getAttribute('href').replace('#','') === current); });
}

window.addEventListener('scroll', () => {
  document.getElementById('nav').classList.toggle('sc', scrollY > 40);
  setActiveNav();
}, { passive: true });
setActiveNav();

const ro = new IntersectionObserver(entries => {
  entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('vi'); ro.unobserve(e.target); } });
}, { threshold: 0.08 });
document.querySelectorAll('.rev').forEach(el => ro.observe(el));

const cardObs = new IntersectionObserver(entries => {
  entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('vi'); cardObs.unobserve(e.target); } });
}, { threshold: 0.06, rootMargin: '0px 0px -40px 0px' });

function toast(msg) {
  const t = document.getElementById('tst');
  document.getElementById('tmsg').textContent = msg;
  t.classList.add('on');
  clearTimeout(t._t);
  t._t = setTimeout(() => t.classList.remove('on'), 2600);
}

(function () {
  const items = [
    { t:'New Condition — Like New', hi:true },{ t:'A Grade — Well Maintained', hi:false },
    { t:'B Grade — Budget Friendly', hi:false },{ t:'Free Delivery Over R1,500', hi:true },
    { t:'48h Turnaround', hi:false },{ t:'Tested & Certified', hi:false },
    { t:'Student Pricing', hi:true },{ t:'Pretoria · Cape Town · Joburg · Durban', hi:false },
  ];
  const mk = () => items.map(i => `<div class="marquee-item${i.hi?' hi':''}"><div class="dot"></div>${i.t}</div>`).join('');
  const track = document.getElementById('mqTrack');
  if (track) track.innerHTML = mk() + mk();
})();

let gG = 'all', gMx = 8000, gTy = '';
let ALL_FRIDGES = [];

function setG(el, g) { document.querySelectorAll('.gt').forEach(b => b.classList.remove('on')); el.classList.add('on'); gG = g; }
function onP(el) {
  gMx = +el.value;
  const p = (gMx - 500) / 7500 * 100;
  el.style.background = `linear-gradient(to right,var(--white) 0%,var(--white) ${p}%,rgba(255,255,255,.1) ${p}%)`;
  document.getElementById('pa').textContent = `R ${gMx.toLocaleString()}`;
}
function onTy(el) { gTy = el.value; }
function clrAll() {
  gG = 'all'; gMx = 8000; gTy = '';
  document.querySelectorAll('.gt').forEach(b => b.classList.remove('on'));
  document.querySelector('[data-g="all"]').classList.add('on');
  const sl = document.getElementById('psl');
  sl.value = 8000;
  sl.style.background = 'linear-gradient(to right,var(--white) 0%,var(--white) 100%,rgba(255,255,255,.1) 100%)';
  document.getElementById('pa').textContent = 'R 8,000';
  gTy = ''; document.querySelector('.fsel').value = '';
  rGrid(ALL_FRIDGES);
}
async function applyF() {
  const params = new URLSearchParams();
  if (gG && gG !== 'all') params.set('grade', gG);
  if (gMx < 8000) params.set('max_price', gMx);
  if (gTy) params.set('type', gTy);
  try { const res = await fetch(`${API_PRODUCTS}?${params}`); rGrid(await res.json()); }
  catch { rGrid(ALL_FRIDGES.filter(f => (gG==='all'||f.grade===gG) && f.price<=gMx && (!gTy||f.type===gTy))); }
}

function placeholderSvg() {
  return `<div class="ci-placeholder"><svg viewBox="0 0 24 24" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round"><rect x="5" y="2" width="14" height="20" rx="2"/><line x1="5" y1="10" x2="19" y2="10"/><line x1="9" y1="6" x2="9" y2="8"/></svg>Coming soon</div>`;
}
function cardImg(src) {
  if (!src) return placeholderSvg();
  return `<img class="ci-photo" src="${src}" alt="Fridge photo" onerror="this.style.display='none'">`;
}
function hrtSvg() {
  return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:13px;height:13px"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>`;
}

function rGrid(list) {
  const g = document.getElementById('fg');
  g.innerHTML = '';
  if (!list.length) {
    g.innerHTML = `<div style="grid-column:1/-1;text-align:center;padding:80px 0;color:var(--muted);font-family:'Space Mono',monospace;font-size:12px;letter-spacing:1px">NO FRIDGES MATCH YOUR FILTERS</div>`;
    document.getElementById('rc').textContent = '0';
    return;
  }
  list.forEach((f, i) => {
    const ic = f.grade==='N'?'gn':f.grade==='A'?'ga':'gb';
    const bc = f.grade==='N'?'bn':f.grade==='A'?'ba':'bb';
    const gradeLabel = f.grade==='N'?'NEW':f.grade==='A'?'A GRADE':'B GRADE';
    const d = document.createElement('div');
    d.className = 'fc'; d.setAttribute('data-i', String(i % 3));
    d.innerHTML = `
      <div class="ci ${ic}"><div class="cg"></div>${cardImg(f.image_url)}<div class="cbdg ${bc}">${gradeLabel}</div><button class="cw" onclick="wt(this,event)">${hrtSvg()}</button></div>
      <div class="cb">
        <div class="cr1"><div><div class="cn">${f.name}</div><div class="cbr">${f.brand}</div></div><div class="cpr">R${f.price.toLocaleString()}</div></div>
        <div class="clo">${f.type==='bar'?'Bar Fridge':'Top Freezer'}</div>
        <div class="csr">
          <div class="cs1"><div class="csv">${f.liters}L</div><div class="csk">Capacity</div></div>
          <div class="cs1"><div class="csv">${f.energy||'—'}</div><div class="csk">Energy</div></div>
          <div class="cs1"><div class="csv">${f.freezer}</div><div class="csk">Freezer</div></div>
        </div>
        <button class="cct" onclick="opM(${f.id})">View Details</button>
      </div>`;
    g.appendChild(d);
    setTimeout(() => cardObs.observe(d), 20);
  });
  document.getElementById('rc').textContent = list.length;
}

async function loadShop() {
  try { const res = await fetch(API_PRODUCTS); if (!res.ok) throw new Error(); ALL_FRIDGES = await res.json(); rGrid(ALL_FRIDGES); }
  catch { rGrid([]); }
}

const THEME_MAP = {
  blue:{bg:'linear-gradient(160deg,#0a0f1a 0%,#0d1f3c 50%,#091628 100%)',tag:'rgba(26,107,255,0.2)',tagColor:'#3d8bff',tagBorder:'rgba(26,107,255,0.35)'},
  green:{bg:'linear-gradient(160deg,#0a0e0d 0%,#0d2218 50%,#091a10 100%)',tag:'rgba(45,164,78,0.2)',tagColor:'#4ac26b',tagBorder:'rgba(45,164,78,0.35)'},
  gold:{bg:'linear-gradient(160deg,#0f0a00 0%,#2a1800 50%,#1a1000 100%)',tag:'rgba(212,168,67,0.2)',tagColor:'#d4a843',tagBorder:'rgba(212,168,67,0.35)'},
  purple:{bg:'linear-gradient(160deg,#0d0a14 0%,#1a0f2e 50%,#100a1e 100%)',tag:'rgba(160,100,255,0.2)',tagColor:'#c084fc',tagBorder:'rgba(160,100,255,0.35)'},
  red:{bg:'linear-gradient(160deg,#140a0a 0%,#2e0f0f 50%,#1e0909 100%)',tag:'rgba(232,68,90,0.2)',tagColor:'#e8445a',tagBorder:'rgba(232,68,90,0.35)'},
  white:{bg:'linear-gradient(160deg,#0e0e0e 0%,#181818 50%,#111111 100%)',tag:'rgba(248,248,246,0.15)',tagColor:'#f8f8f6',tagBorder:'rgba(248,248,246,0.3)'},
};

async function loadMarketing() {
  const stage = document.getElementById('mktStage');
  const pipsEl = document.getElementById('mktPips');
  if (!stage) return;
  let slides = [];
  try { const res = await fetch(API_MARKETING); slides = res.ok ? await res.json() : []; } catch { slides = []; }
  if (!slides.length) return;
  stage.innerHTML = ''; pipsEl.innerHTML = '';
  slides.forEach((s, idx) => {
    const t = THEME_MAP[s.theme] || THEME_MAP.blue;
    const bgStyle = s.image_url ? `background-image:url('${s.image_url}');background-size:cover;background-position:center` : `background:${t.bg}`;
    const titleHtml = (s.title||'').replace(/\\n/g,'<br>').replace(/\n/g,'<br>');
    const el = document.createElement('div');
    el.className = 'mkt-slide'; el.setAttribute('data-index', idx);
    el.innerHTML = `<div class="mkt-slide-img" style="${bgStyle}"><div class="mkt-slide-overlay"></div></div>
      <div class="mkt-slide-info">
        <div class="mkt-slide-tag" style="background:${t.tag};color:${t.tagColor};border-color:${t.tagBorder}">${s.tag}</div>
        <div class="mkt-slide-num">${String(idx+1).padStart(2,'0')}</div>
        <div class="mkt-slide-title">${titleHtml}</div>
        <div class="mkt-slide-body">${s.body}</div>
      </div>`;
    stage.appendChild(el);
    const pip = document.createElement('div');
    pip.className = 'mkt-pip'+(idx===0?' on':''); pip.onclick = () => goTo(idx);
    pipsEl.appendChild(pip);
  });
  initCarousel();
}

function initCarousel() {
  const slides = document.querySelectorAll('.mkt-slide');
  const pipsEl = document.getElementById('mktPips');
  const btnPrev = document.getElementById('mktPrev');
  const btnNext = document.getElementById('mktNext');
  if (!slides.length) return;
  const total = slides.length; let current = 0, animating = false;
  function getState(i) { const d=((i-current)%total+total)%total; if(d===0)return'active';if(d===1)return'next';if(d===total-1)return'prev';if(d===2)return'next2';if(d===total-2)return'prev2';return'hidden'; }
  function render() { slides.forEach((s,i)=>s.setAttribute('data-state',getState(i))); pipsEl.querySelectorAll('.mkt-pip').forEach((p,i)=>p.classList.toggle('on',i===current)); }
  function goTo(i) { if(animating)return;animating=true;current=((i%total)+total)%total;render();setTimeout(()=>{animating=false;},700); }
  window.goTo = goTo;
  btnPrev?.addEventListener('click',()=>goTo(current-1)); btnNext?.addEventListener('click',()=>goTo(current+1));
  slides.forEach(s=>{s.addEventListener('click',()=>{const st=s.getAttribute('data-state');if(st==='next'||st==='next2')goTo(current+1);if(st==='prev'||st==='prev2')goTo(current-1);});});
  document.addEventListener('keydown',e=>{if(e.key==='ArrowLeft')goTo(current-1);if(e.key==='ArrowRight')goTo(current+1);});
  let tx=0; const stage=document.getElementById('mktStage');
  stage?.addEventListener('touchstart',e=>{tx=e.touches[0].clientX;},{passive:true});
  stage?.addEventListener('touchend',e=>{const dx=e.changedTouches[0].clientX-tx;if(Math.abs(dx)>40)goTo(dx<0?current+1:current-1);});
  render();
}

function wt(btn, e) {
  e.stopPropagation(); btn.classList.toggle('lk');
  toast(btn.classList.contains('lk')?'Saved to wishlist':'Removed from wishlist');
}

let CURRENT_FRIDGE = null;

function opM(id) {
  const f = ALL_FRIDGES.find(x => x.id === id);
  if (!f) return;
  CURRENT_FRIDGE = f;

  document.getElementById('mbn').textContent   = f.brand;
  document.getElementById('msk').textContent   = `SF-${String(id).padStart(3,'0')}`;
  document.getElementById('mtl').textContent   = f.name;
  document.getElementById('mpr').textContent   = f.price.toLocaleString();
  document.getElementById('mdesc').textContent = f.desc;

  const images = [f.image_url, f.image2_url].filter(Boolean);
  const firstImg = images[0] || '';
  const mm = document.getElementById('mmain');
  mm.className = 'mm '+(f.grade==='N'?'mm-n':f.grade==='A'?'mm-a':'mm-b');
  mm.querySelectorAll('.mm-photo,.ci-placeholder').forEach(el=>el.remove());
  if (firstImg) { const img=document.createElement('img');img.className='mm-photo';img.src=firstImg;img.alt=f.name;img.onerror=function(){this.style.display='none';};mm.appendChild(img); }

  const mth = document.getElementById('mth');
  mth.innerHTML = images.length > 1
    ? images.map((src,i)=>`<div class="mt${i===0?' on':''}" onclick="sth(this,'${src}')"><img class="mt-photo" src="${src}" onerror="this.style.display='none'"></div>`).join('')
    : '';

  document.getElementById('msts').innerHTML = '';
  document.getElementById('mrc').textContent = 'Loading...';

  const grades = [{k:'N',l:'New'},{k:'A',l:'A Grade'},{k:'B',l:'B Grade'}];
  document.getElementById('mgr').innerHTML = grades.map(({k,l})=>`<button class="mgb${k===f.grade?' s'+k.toLowerCase():''}">${l}</button>`).join('');

  const specsData = {Capacity:`${f.liters}L`,Energy:f.energy||'—',Condition:f.condition||'—',Warranty:f.warranty||'—',Freezer:f.freezer||'—',Noise:f.noise||'—'};
  document.getElementById('msp').innerHTML = Object.entries(specsData).map(([k,v])=>`<div class="msi"><div class="msk2">${k}</div><div class="msv">${v}</div></div>`).join('');

  document.getElementById('madd').onclick = () => addToCart(f);

  loadReviews(f.id);

  document.getElementById('mfav').classList.remove('on');
  swT(document.querySelector('.mtb'), 'td');
  document.getElementById('ov').classList.add('op');
  document.body.style.overflow = 'hidden';
}

/* ════════════════════════════════════════
   REVIEWS
   ════════════════════════════════════════ */
async function loadReviews(fridgeId) {
  try { const res = await fetch(`${API_REVIEWS}?fridge=${fridgeId}`); renderReviews(await res.json(), fridgeId); }
  catch { renderReviews([], fridgeId); }
}

function renderReviews(reviews, fridgeId) {
  if (reviews.length) {
    const avg = reviews.reduce((s,r)=>s+r.rating,0)/reviews.length;
    document.getElementById('msts').innerHTML = Array.from({length:5},(_,i)=>
      `<svg class="rvst" viewBox="0 0 24 24" fill="${i<Math.floor(avg)?'var(--gold)':'rgba(255,255,255,.15)'}"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>`).join('');
    document.getElementById('mrc').textContent = `${reviews.length} review${reviews.length!==1?'s':''}`;
  } else {
    document.getElementById('msts').innerHTML = Array.from({length:5},()=>
      `<svg class="rvst" viewBox="0 0 24 24" fill="rgba(255,255,255,.15)"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>`).join('');
    document.getElementById('mrc').textContent = 'No reviews yet';
  }

  const tr = document.getElementById('tr');
  const reviewHtml = reviews.length
    ? reviews.map(r=>`
        <div class="rvi">
          <div class="rvr">
            <div class="rva">${r.name[0].toUpperCase()}</div>
            <div class="rvn">${r.name}</div>
            <div class="rvd">${new Date(r.created_at).toLocaleDateString('en-ZA',{day:'numeric',month:'short',year:'numeric'})}</div>
          </div>
          <div class="rvs">${Array.from({length:5},(_,i)=>`<svg class="rvst" viewBox="0 0 24 24" fill="${i<r.rating?'var(--gold)':'rgba(255,255,255,.15)'}"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>`).join('')}</div>
          <div class="rvt">${r.comment}</div>
        </div>`).join('')
    : `<div style="padding:16px 0;color:var(--muted);font-size:13px">No reviews yet — be the first!</div>`;

  tr.innerHTML = reviewHtml + `
    <div class="rv-form">
      <div class="rv-form-title">Leave a Review</div>
      <div class="rv-star-row" id="rvStars">
        ${[1,2,3,4,5].map(n=>`<button class="rv-star" data-val="${n}" onclick="setReviewStar(${n})">
          <svg viewBox="0 0 24 24" fill="rgba(255,255,255,.2)" stroke="none"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
        </button>`).join('')}
      </div>
      <input class="rv-input" id="rvName" placeholder="Your name" maxlength="80">
      <textarea class="rv-textarea" id="rvComment" placeholder="Share your experience..." rows="3"></textarea>
      <button class="rv-submit" onclick="submitReview(${fridgeId})">Submit Review</button>
    </div>`;
}

let selectedStar = 0;

function setReviewStar(val) {
  selectedStar = val;
  document.querySelectorAll('.rv-star').forEach((btn,i) => {
    btn.querySelector('svg').setAttribute('fill', i < val ? 'var(--gold)' : 'rgba(255,255,255,.2)');
  });
}

async function submitReview(fridgeId) {
  const name    = document.getElementById('rvName').value.trim();
  const comment = document.getElementById('rvComment').value.trim();
  if (!selectedStar) { toast('Please select a star rating'); return; }
  if (!name)         { toast('Please enter your name'); return; }
  if (!comment)      { toast('Please write a comment'); return; }
  try {
    const res = await fetch(API_REVIEWS, {
      method:'POST', headers:{'Content-Type':'application/json'},
      body: JSON.stringify({fridge:fridgeId, name, rating:selectedStar, comment}),
    });
    if (!res.ok) throw new Error();
    selectedStar = 0;
    toast('Review submitted — thank you!');
    loadReviews(fridgeId);
  } catch { toast('Could not submit review — try again'); }
}

function sgr(btn,g){document.querySelectorAll('.mgb').forEach(b=>b.className='mgb');btn.classList.add('s'+g.toLowerCase());}
function sth(el,src){
  document.querySelectorAll('.mt').forEach(t=>t.classList.remove('on'));el.classList.add('on');
  if(!src)return;const mm=document.getElementById('mmain');let mp=mm.querySelector('.mm-photo');
  if(!mp){mp=document.createElement('img');mp.className='mm-photo';mp.alt='Fridge photo';mp.onerror=function(){this.style.display='none';};mm.appendChild(mp);}
  mp.style.display='block';mp.src=src;
}
function tgFav(btn){btn.classList.toggle('on');toast(btn.classList.contains('on')?'Saved to wishlist':'Removed from wishlist');}
function clMo(){document.getElementById('ov').classList.remove('op');document.body.style.overflow='';}
function ocl(e){if(e.target===document.getElementById('ov'))clMo();}
document.addEventListener('keydown',e=>{if(e.key==='Escape'){clMo();closeCart();closeCheckout();closeConfirm();}});
function swT(btn,tab){
  document.querySelectorAll('.mtb').forEach(b=>b.classList.remove('on'));
  if(btn)btn.classList.add('on');
  ['td','tr'].forEach(t=>{const el=document.getElementById(t);if(el)el.style.display=t===tab?'block':'none';});
}

document.getElementById('cartOverlay')?.addEventListener('click',closeCart);
document.getElementById('checkoutOv')?.addEventListener('click',e=>{if(e.target===document.getElementById('checkoutOv'))closeCheckout();});
document.getElementById('confirmOv')?.addEventListener('click',e=>{if(e.target===document.getElementById('confirmOv'))closeConfirm();});

loadShop();
loadMarketing();