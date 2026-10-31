/* ════════════════════════════════
   SmartFreeze — marketing.js
   Wired to Django REST API
   ════════════════════════════════ */

const API = `${BASE_URL}/api/marketing`;

const THEMES = {
  blue:   { bg:'linear-gradient(160deg,#0a0f1a 0%,#0d1f3c 50%,#091628 100%)', tag:'rgba(26,107,255,0.25)',  tagColor:'#3d8bff', tagBorder:'rgba(26,107,255,0.4)'  },
  green:  { bg:'linear-gradient(160deg,#0a0e0d 0%,#0d2218 50%,#091a10 100%)', tag:'rgba(45,164,78,0.25)',   tagColor:'#4ac26b', tagBorder:'rgba(45,164,78,0.4)'   },
  gold:   { bg:'linear-gradient(160deg,#0f0a00 0%,#2a1800 50%,#1a1000 100%)', tag:'rgba(212,168,67,0.25)',  tagColor:'#d4a843', tagBorder:'rgba(212,168,67,0.4)'  },
  purple: { bg:'linear-gradient(160deg,#0d0a14 0%,#1a0f2e 50%,#100a1e 100%)', tag:'rgba(160,100,255,0.25)', tagColor:'#c084fc', tagBorder:'rgba(160,100,255,0.4)' },
  red:    { bg:'linear-gradient(160deg,#140a0a 0%,#2e0f0f 50%,#1e0909 100%)', tag:'rgba(232,68,90,0.25)',   tagColor:'#e8445a', tagBorder:'rgba(232,68,90,0.4)'   },
  white:  { bg:'linear-gradient(160deg,#0e0e0e 0%,#181818 50%,#111111 100%)', tag:'rgba(248,248,246,0.15)', tagColor:'#f8f8f6', tagBorder:'rgba(248,248,246,0.3)' },
};

let SLIDES    = [];
let delTarget = null;

/* ════════════════════════════════
   INIT
   ════════════════════════════════ */
async function init() {
  try {
    const res = await fetch(`${API}/`);
    SLIDES    = await res.json();
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
  const grid = document.getElementById('slidesGrid');
  grid.innerHTML = '';
  SLIDES.forEach((s, i) => grid.appendChild(buildCard(s, i + 1)));
}

function buildCard(s, num) {
  const t       = THEMES[s.theme] || THEMES.blue;
  const bgStyle = s.image_url
    ? `background-image:url('${s.image_url}');background-size:cover;background-position:center`
    : `background:${t.bg}`;
  const titleHtml = (s.title || '').replace(/\\n/g,'<br>').replace(/\n/g,'<br>');

  const wrap = document.createElement('div');
  wrap.className = 'slide-card';
  wrap.id        = `slide-card-${s.id}`;

  wrap.innerHTML = `
    <div class="slide-num-badge">${String(num).padStart(2,'0')}</div>
    <button class="slide-remove" onclick="askRemove(${s.id})" title="Remove slide">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
    </button>

    <div class="slide-preview">
      <div class="slide-preview-bg" id="prevBg-${s.id}" style="${bgStyle}"></div>
      <div class="slide-preview-overlay"></div>
      <div class="slide-preview-info">
        <div class="spv-tag" id="prevTag-${s.id}" style="background:${t.tag};color:${t.tagColor};border-color:${t.tagBorder}">${esc(s.tag)}</div>
        <div class="spv-title" id="prevTitle-${s.id}">${titleHtml}</div>
        <div class="spv-body"  id="prevBody-${s.id}">${esc(s.body)}</div>
      </div>
    </div>

    <div class="slide-body">
      <div class="sl-field">
        <label class="sl-label">Tag Label</label>
        <input class="sl-input" id="s-tag-${s.id}" value="${esc(s.tag)}" placeholder="e.g. FAST DELIVERY" oninput="livePreview(${s.id})">
      </div>

      <div class="sl-field">
        <label class="sl-label">Title (use \\n for line break)</label>
        <input class="sl-input" id="s-title-${s.id}" value="${esc(s.title)}" placeholder="e.g. Fast\\nDelivery" oninput="livePreview(${s.id})">
      </div>

      <div class="sl-field">
        <label class="sl-label">Body Text</label>
        <textarea class="sl-textarea" id="s-body-${s.id}" placeholder="Describe this slide…" oninput="livePreview(${s.id})">${esc(s.body)}</textarea>
      </div>

      <div class="sl-field">
        <label class="sl-label">Colour Theme</label>
        <div class="theme-row" id="themeRow-${s.id}">
          ${Object.keys(THEMES).map(k => `
            <div class="theme-dot td-${k} ${s.theme===k?'selected':''}"
              title="${k}" onclick="setTheme(${s.id},'${k}',this)"></div>
          `).join('')}
        </div>
      </div>

      <div class="sl-field">
        <label class="sl-label">Background Photo</label>
        <div class="sl-upload-row">
          <div class="sl-img-preview" id="imgPreview-${s.id}">
            ${s.image_url ? `<img src="${s.image_url}" alt="bg">` : `<span>No image</span>`}
          </div>
          <button class="sl-upload-btn" onclick="triggerUpload(${s.id})">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="13" height="13"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
            ${s.image_url ? 'Change Photo' : 'Upload Photo'}
          </button>
          <input type="file" class="slide-file-input" id="fileInput-${s.id}" accept="image/*" onchange="handleUpload(this,${s.id})">
        </div>
      </div>

      <button class="slide-save" id="saveBtn-${s.id}" onclick="saveCard(${s.id})">Save Changes</button>
    </div>
  `;
  return wrap;
}

/* ════════════════════════════════
   LIVE PREVIEW
   ════════════════════════════════ */
function livePreview(id) {
  const tag   = document.getElementById(`s-tag-${id}`)?.value   || '';
  const title = document.getElementById(`s-title-${id}`)?.value || '';
  const body  = document.getElementById(`s-body-${id}`)?.value  || '';

  const prevTag   = document.getElementById(`prevTag-${id}`);
  const prevTitle = document.getElementById(`prevTitle-${id}`);
  const prevBody  = document.getElementById(`prevBody-${id}`);

  if (prevTag)   prevTag.textContent  = tag;
  if (prevTitle) prevTitle.innerHTML  = title.replace(/\\n/g,'<br>').replace(/\n/g,'<br>');
  if (prevBody)  prevBody.textContent = body;

  markUnsaved(id);
}

/* ════════════════════════════════
   THEME
   ════════════════════════════════ */
function setTheme(id, theme, dotEl) {
  const s = SLIDES.find(x => x.id === id);
  if (!s) return;
  s.theme = theme;

  document.querySelectorAll(`#themeRow-${id} .theme-dot`).forEach(d => d.classList.remove('selected'));
  dotEl.classList.add('selected');

  if (!s.image_url) {
    document.getElementById(`prevBg-${id}`).style.background = THEMES[theme]?.bg || '';
  }

  const t       = THEMES[theme];
  const prevTag = document.getElementById(`prevTag-${id}`);
  if (prevTag && t) {
    prevTag.style.background  = t.tag;
    prevTag.style.color       = t.tagColor;
    prevTag.style.borderColor = t.tagBorder;
  }
  markUnsaved(id);
}

/* ════════════════════════════════
   IMAGE UPLOAD
   ════════════════════════════════ */
function triggerUpload(id) {
  document.getElementById(`fileInput-${id}`).click();
}

function handleUpload(input, id) {
  const file = input.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = e => {
    // Open cropper — 16:9 ratio for marketing slide backgrounds
    SmartFreezeCropper.open(e.target.result, 16 / 9, async (blob) => {
      await uploadSlideImage(blob, id);
    });
  };
  reader.readAsDataURL(file);
  input.value = '';
}

async function uploadSlideImage(blob, id) {
  const formData = new FormData();
  formData.append('image', blob, 'slide.jpg');

  try {
    const res  = await fetch(`${API}/${id}/upload-image/`, { method: 'POST', body: formData });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Upload failed');

    const s = SLIDES.find(x => x.id === id);
    if (s) s.image_url = data.image_url;

    const bg = document.getElementById(`prevBg-${id}`);
    if (bg) bg.style.cssText = `background-image:url('${data.image_url}');background-size:cover;background-position:center`;

    const thumb = document.getElementById(`imgPreview-${id}`);
    if (thumb) thumb.innerHTML = `<img src="${data.image_url}" alt="bg">`;

    const btn = document.querySelector(`#slide-card-${id} .sl-upload-btn`);
    if (btn) { btn.innerHTML = btn.innerHTML.replace(/Upload Photo|Change Photo/, 'Change Photo'); }

    markUnsaved(id);
    toast('Photo uploaded — save to keep changes');
  } catch (err) {
    toast('Upload failed: ' + err.message);
    console.error(err);
  }
}

/* ════════════════════════════════
   SAVE CARD — PATCH to Django
   ════════════════════════════════ */
async function saveCard(id) {
  const s = SLIDES.find(x => x.id === id);
  if (!s) return;

  const payload = {
    tag:   document.getElementById(`s-tag-${id}`).value.trim(),
    title: document.getElementById(`s-title-${id}`).value.trim(),
    body:  document.getElementById(`s-body-${id}`).value.trim(),
    theme: s.theme,
  };

  try {
    const res  = await fetch(`${API}/${id}/`, {
      method:  'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify(payload),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(JSON.stringify(data));

    Object.assign(s, payload);
    markSaved(id);
    setUnsavedState();
    toast(`Slide saved — publish to update shop`);
  } catch (err) {
    toast('Save failed — check server');
    console.error(err);
  }
}

function markSaved(id) {
  const btn = document.getElementById(`saveBtn-${id}`);
  if (!btn) return;
  btn.textContent = 'Saved ✓';
  btn.classList.add('saved');
  setTimeout(() => { btn.textContent = 'Save Changes'; btn.classList.remove('saved'); }, 2200);
}
function markUnsaved(id) {
  const btn = document.getElementById(`saveBtn-${id}`);
  if (btn) btn.classList.remove('saved');
}

/* ════════════════════════════════
   ADD SLIDE — POST to Django
   ════════════════════════════════ */
async function addSlide() {
  const payload = { tag:'NEW SLIDE', title:'Your Title', body:'Add your description here.', theme:'blue', order: SLIDES.length };

  try {
    const res  = await fetch(`${API}/`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify(payload),
    });
    const newS = await res.json();
    if (!res.ok) throw new Error(JSON.stringify(newS));

    SLIDES.push(newS);
    const grid = document.getElementById('slidesGrid');
    grid.appendChild(buildCard(newS, SLIDES.length));
    setUnsavedState();
    toast('New slide added — fill in details and save');
    document.getElementById(`slide-card-${newS.id}`)?.scrollIntoView({ behavior:'smooth', block:'center' });
  } catch (err) {
    toast('Could not create slide — check server');
    console.error(err);
  }
}

/* ════════════════════════════════
   REMOVE SLIDE
   ════════════════════════════════ */
function askRemove(id) {
  delTarget = id;
  const s   = SLIDES.find(x => x.id === id);
  document.getElementById('delSub').textContent = `"${s ? s.tag : 'This slide'}" will be permanently deleted.`;
  document.getElementById('delOv').classList.add('open');
}
function closeDelModal() {
  document.getElementById('delOv').classList.remove('open');
  delTarget = null;
}

async function confirmRemove() {
  if (delTarget === null) return;

  try {
    const res = await fetch(`${API}/${delTarget}/`, { method: 'DELETE' });
    if (!res.ok && res.status !== 204) throw new Error('Delete failed');

    SLIDES = SLIDES.filter(x => x.id !== delTarget);
    const card = document.getElementById(`slide-card-${delTarget}`);
    if (card) {
      card.style.opacity = '0'; card.style.transform = 'scale(.95)'; card.style.transition = 'all .25s';
      setTimeout(() => { card.remove(); renumberBadges(); }, 260);
    }
    closeDelModal();
    setUnsavedState();
    toast('Slide removed — publish to update shop');
  } catch (err) {
    toast('Delete failed — check server');
    console.error(err);
  }
}

function renumberBadges() {
  SLIDES.forEach((s, i) => {
    const badge = document.querySelector(`#slide-card-${s.id} .slide-num-badge`);
    if (badge) badge.textContent = String(i + 1).padStart(2, '0');
  });
}

/* ════════════════════════════════
   PUBLISH
   ════════════════════════════════ */
async function publishAll() {
  try {
    const res  = await fetch(`${API}/publish/`, { method: 'POST', headers: {'Content-Type':'application/json'}, body: '{}' });
    const data = await res.json();
    if (!res.ok) throw new Error('Publish failed');
    setPublishedState();
    toast(`Published — ${data.published} slides live on shop`);
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
function esc(str) {
  return String(str || '').replace(/&/g,'&amp;').replace(/"/g,'&quot;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}
function toast(msg) {
  const t = document.getElementById('tst');
  document.getElementById('tmsg').textContent = msg;
  t.classList.add('on');
  clearTimeout(t._t);
  t._t = setTimeout(() => t.classList.remove('on'), 2800);
}

document.getElementById('delOv').addEventListener('click', e => { if (e.target === document.getElementById('delOv')) closeDelModal(); });
document.addEventListener('keydown', e => { if (e.key === 'Escape') closeDelModal(); });

init();