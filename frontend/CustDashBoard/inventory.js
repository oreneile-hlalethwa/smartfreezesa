/* ════════════════════════════════
   SmartFreeze — inventory.js
   Wired to Django REST API
   Supports 2 photos per fridge
   ════════════════════════════════ */

const API = `${BASE_URL}/api/products`;

let FRIDGES = [];

/* ════════════════════════════════
   INIT
   ════════════════════════════════ */
async function init() {
  try {
    const res = await fetch(`${API}/`);
    FRIDGES   = await res.json();
    renderGrid();
  } catch (err) {
    toast('Could not reach server — check Django is running');
    console.error(err);
  }
}

/* ════════════════════════════════
   RENDER GRID
   ════════════════════════════════ */
function renderGrid() {
  const grid = document.getElementById('invGrid');
  grid.innerHTML = '';
  FRIDGES.forEach(f => grid.appendChild(buildCard(f)));
}

function imgSlot(fid, slot, url) {
  const label = slot === 1 ? 'Photo 1' : 'Photo 2';
  return `
    <div id="imgArea-${fid}-${slot}"
      style="aspect-ratio:4/3;position:relative;background:var(--black3);border-radius:8px;
             overflow:hidden;display:flex;align-items:center;justify-content:center;
             cursor:pointer;border:1px solid var(--border);"
      onclick="triggerUpload(${fid}, ${slot})">
      ${url
        ? `<img src="${url}" alt="${label}" style="width:100%;height:100%;object-fit:cover;display:block;">
           <div class="inv-img-overlay">
             <svg viewBox="0 0 24 24" fill="none" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
               <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
               <polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/>
             </svg>
             <span>Change</span>
           </div>`
        : `<div class="inv-no-img">
             <svg viewBox="0 0 24 24" fill="none" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round">
               <rect x="3" y="3" width="18" height="18" rx="2"/>
               <circle cx="8.5" cy="8.5" r="1.5"/>
               <polyline points="21 15 16 10 5 21"/>
             </svg>
             <span style="font-size:10px;margin-top:4px;font-family:'Space Mono',monospace;letter-spacing:1px;text-transform:uppercase">${label}</span>
           </div>`
      }
      <input type="file" class="inv-file-input" id="fileInput-${fid}-${slot}"
             accept="image/*" onchange="handleUpload(this, ${fid}, ${slot})">
    </div>`;
}

function buildCard(f) {
  const wrap = document.createElement('div');
  wrap.className = 'inv-card';
  wrap.id        = `card-${f.id}`;

  wrap.innerHTML = `
    <button class="inv-remove" onclick="askRemove(${f.id})" title="Remove listing">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round">
        <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
      </svg>
    </button>

    <!-- Two photo slots side by side -->
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;padding:12px 12px 0;">
      ${imgSlot(f.id, 1, f.image_url)}
      ${imgSlot(f.id, 2, f.image2_url)}
    </div>

    <div class="inv-body">
      <div class="inv-row">
        <div class="inv-field">
          <label class="inv-label">Name</label>
          <input class="inv-input" id="f-name-${f.id}" value="${escHtml(f.name)}" placeholder="Fridge name">
        </div>
        <div class="inv-field">
          <label class="inv-label">Brand</label>
          <input class="inv-input" id="f-brand-${f.id}" value="${escHtml(f.brand)}" placeholder="Brand">
        </div>
      </div>

      <div class="inv-row">
        <div class="inv-field">
          <label class="inv-label">Price (R)</label>
          <input class="inv-input" id="f-price-${f.id}" type="number" value="${f.price}" min="0">
        </div>
        <div class="inv-field">
          <label class="inv-label">Capacity (L)</label>
          <input class="inv-input" id="f-liters-${f.id}" type="number" value="${f.liters}" min="0">
        </div>
      </div>

      <div class="inv-row">
        <div class="inv-field">
          <label class="inv-label">Grade</label>
          <select class="inv-select" id="f-grade-${f.id}">
            <option value="N" ${f.grade==='N'?'selected':''}>New Condition</option>
            <option value="A" ${f.grade==='A'?'selected':''}>A Grade</option>
            <option value="B" ${f.grade==='B'?'selected':''}>B Grade</option>
          </select>
        </div>
        <div class="inv-field">
          <label class="inv-label">Type</label>
          <select class="inv-select" id="f-type-${f.id}">
            <option value="topfreezer" ${f.type==='topfreezer'?'selected':''}>Top Freezer</option>
            <option value="bar"        ${f.type==='bar'       ?'selected':''}>Bar Fridge</option>
          </select>
        </div>
      </div>

      <div class="inv-row-3">
        <div class="inv-field">
          <label class="inv-label">Energy</label>
          <input class="inv-input" id="f-energy-${f.id}" value="${escHtml(f.energy)}" placeholder="A++">
        </div>
        <div class="inv-field">
          <label class="inv-label">Freezer</label>
          <select class="inv-select" id="f-freezer-${f.id}">
            <option value="Yes" ${f.freezer==='Yes'?'selected':''}>Yes</option>
            <option value="No"  ${f.freezer==='No' ?'selected':''}>No</option>
          </select>
        </div>
        <div class="inv-field">
          <label class="inv-label">Noise</label>
          <input class="inv-input" id="f-noise-${f.id}" value="${escHtml(f.noise)}" placeholder="38 dB">
        </div>
      </div>

      <div class="inv-field">
        <label class="inv-label">Condition</label>
        <select class="inv-select" id="f-condition-${f.id}">
          <option value="Like New"  ${f.condition==='Like New' ?'selected':''}>Like New</option>
          <option value="Excellent" ${f.condition==='Excellent'?'selected':''}>Excellent</option>
          <option value="Very Good" ${f.condition==='Very Good'?'selected':''}>Very Good</option>
          <option value="Good"      ${f.condition==='Good'     ?'selected':''}>Good</option>
          <option value="Fair"      ${f.condition==='Fair'     ?'selected':''}>Fair</option>
        </select>
      </div>

      <div class="inv-field">
        <label class="inv-label">Description</label>
        <textarea class="inv-textarea" id="f-desc-${f.id}" placeholder="Describe this fridge...">${escHtml(f.desc)}</textarea>
      </div>

      <button class="inv-save" id="saveBtn-${f.id}" onclick="saveCard(${f.id})">Save Changes</button>
    </div>
  `;
  return wrap;
}

/* ════════════════════════════════
   IMAGE UPLOAD — with cropper
   slot: 1 or 2
   ════════════════════════════════ */
function triggerUpload(id, slot) {
  document.getElementById(`fileInput-${id}-${slot}`).click();
}

function handleUpload(input, id, slot) {
  const file = input.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = e => {
    SmartFreezeCropper.open(e.target.result, null, async (blob) => {
      await uploadImage(blob, id, slot);
    });
  };
  reader.readAsDataURL(file);
  input.value = '';
}

async function uploadImage(blob, id, slot) {
  const formData = new FormData();
  formData.append('image', blob, `photo${slot}.jpg`);
  const endpoint = slot === 1
    ? `${API}/${id}/upload-image/`
    : `${API}/${id}/upload-image2/`;

  try {
    const res  = await fetch(endpoint, { method: 'POST', body: formData });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Upload failed');

    // Update the correct slot preview
    const area = document.getElementById(`imgArea-${id}-${slot}`);
    if (area) {
      area.innerHTML = `
        <img src="${data.image_url}" alt="photo ${slot}" style="width:100%;height:100%;object-fit:cover;display:block;">
        <div class="inv-img-overlay">
          <svg viewBox="0 0 24 24" fill="none" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
            <polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/>
          </svg>
          <span>Change</span>
        </div>
        <input type="file" class="inv-file-input" id="fileInput-${id}-${slot}"
               accept="image/*" onchange="handleUpload(this, ${id}, ${slot})">
      `;
      area.onclick = () => triggerUpload(id, slot);
    }

    // Sync local state
    const fridge = FRIDGES.find(f => f.id === id);
    if (fridge) {
      if (slot === 1) fridge.image_url  = data.image_url;
      else            fridge.image2_url = data.image_url;
    }

    setUnsavedState();
    toast(`Photo ${slot} uploaded — publish to go live`);
  } catch (err) {
    toast('Upload failed: ' + err.message);
    console.error(err);
  }
}

/* ════════════════════════════════
   SAVE CARD
   ════════════════════════════════ */
async function saveCard(id) {
  const payload = {
    name:      document.getElementById(`f-name-${id}`)?.value.trim(),
    brand:     document.getElementById(`f-brand-${id}`)?.value.trim(),
    price:     parseInt(document.getElementById(`f-price-${id}`)?.value) || 0,
    liters:    parseInt(document.getElementById(`f-liters-${id}`)?.value) || 0,
    grade:     document.getElementById(`f-grade-${id}`)?.value,
    type:      document.getElementById(`f-type-${id}`)?.value,
    energy:    document.getElementById(`f-energy-${id}`)?.value.trim(),
    freezer:   document.getElementById(`f-freezer-${id}`)?.value,
    noise:     document.getElementById(`f-noise-${id}`)?.value.trim(),
    condition: document.getElementById(`f-condition-${id}`)?.value,
    desc:      document.getElementById(`f-desc-${id}`)?.value.trim(),
  };

  try {
    const res  = await fetch(`${API}/${id}/`, {
      method:  'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify(payload),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(JSON.stringify(data));

    const idx = FRIDGES.findIndex(f => f.id === id);
    if (idx !== -1) FRIDGES[idx] = { ...FRIDGES[idx], ...data };

    markSaved(id);
    setUnsavedState();
    toast(`${payload.name} saved — publish to update shop`);
  } catch (err) {
    toast('Save failed — check server');
    console.error(err);
  }
}

function markSaved(id) {
  const btn = document.getElementById(`saveBtn-${id}`);
  if (!btn) return;
  btn.textContent = 'Saved \u2713';
  btn.classList.add('saved');
  setTimeout(() => { btn.textContent = 'Save Changes'; btn.classList.remove('saved'); }, 2200);
}

/* ════════════════════════════════
   ADD FRIDGE
   ════════════════════════════════ */
async function addFridge() {
  const payload = {
    name: 'New Fridge', brand: 'Unknown', grade: 'B', type: 'topfreezer',
    price: 0, liters: 0, energy: 'B', condition: 'Good',
    freezer: 'No', noise: '40 dB', warranty: '3 months', desc: 'Add description here.',
  };

  try {
    const res  = await fetch(`${API}/`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify(payload),
    });
    const newF = await res.json();
    if (!res.ok) throw new Error(JSON.stringify(newF));

    FRIDGES.push(newF);
    const grid = document.getElementById('invGrid');
    grid.appendChild(buildCard(newF));
    setUnsavedState();
    toast('New fridge added — fill in details and save');
    document.getElementById(`card-${newF.id}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  } catch (err) {
    toast('Could not create fridge — check server');
    console.error(err);
  }
}

/* ════════════════════════════════
   REMOVE FRIDGE
   ════════════════════════════════ */
let deleteTarget = null;

function askRemove(id) {
  deleteTarget = id;
  const f = FRIDGES.find(x => x.id === id);
  document.getElementById('delSub').textContent =
    `"${f ? f.name : 'This fridge'}" will be permanently deleted from the database.`;
  document.getElementById('delOv').classList.add('open');
}

function closeDelModal() {
  document.getElementById('delOv').classList.remove('open');
  deleteTarget = null;
}

async function confirmRemove() {
  if (deleteTarget === null) return;
  const f = FRIDGES.find(x => x.id === deleteTarget);

  try {
    const res = await fetch(`${API}/${deleteTarget}/`, { method: 'DELETE' });
    if (!res.ok && res.status !== 204) throw new Error('Delete failed');

    FRIDGES = FRIDGES.filter(x => x.id !== deleteTarget);
    const card = document.getElementById(`card-${deleteTarget}`);
    if (card) {
      card.style.opacity = '0'; card.style.transform = 'scale(.95)';
      card.style.transition = 'all .25s';
      setTimeout(() => card.remove(), 260);
    }
    closeDelModal();
    setUnsavedState();
    toast(`${f ? f.name : 'Fridge'} deleted`);
  } catch (err) {
    toast('Delete failed — check server');
    console.error(err);
  }
}

/* ════════════════════════════════
   PUBLISH
   ════════════════════════════════ */
async function publishAll() {
  try {
    const res  = await fetch(`${API}/publish/`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{}'
    });
    const data = await res.json();
    if (!res.ok) throw new Error('Publish failed');
    setPublishedState();
    toast(`Published — ${data.published} fridges live on shop`);
  } catch (err) {
    toast('Publish failed — check server');
    console.error(err);
  }
}

/* ════════════════════════════════
   STATUS
   ════════════════════════════════ */
function setUnsavedState() {
  const el = document.getElementById('publishStatus');
  el.className = 'publish-badge';
  el.innerHTML = '<span class="publish-dot"></span> Unpublished Changes';
}
function setPublishedState() {
  const el = document.getElementById('publishStatus');
  el.className = 'published-badge';
  el.innerHTML = '<span style="width:6px;height:6px;border-radius:50%;background:var(--green2);display:inline-block"></span> Published';
}

/* ════════════════════════════════
   UTILS
   ════════════════════════════════ */
function escHtml(str) {
  return String(str || '').replace(/&/g,'&amp;').replace(/"/g,'&quot;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}
function toast(msg) {
  const t = document.getElementById('tst');
  document.getElementById('tmsg').textContent = msg;
  t.classList.add('on');
  clearTimeout(t._t);
  t._t = setTimeout(() => t.classList.remove('on'), 2800);
}

document.getElementById('delOv').addEventListener('click', e => {
  if (e.target === document.getElementById('delOv')) closeDelModal();
});
document.addEventListener('keydown', e => { if (e.key === 'Escape') closeDelModal(); });

init();