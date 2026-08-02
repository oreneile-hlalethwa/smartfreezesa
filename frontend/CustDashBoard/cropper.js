/* ════════════════════════════════════════
   SmartFreeze — cropper.js
   Shared image cropper modal
   Works for both inventory and marketing
   ════════════════════════════════════════ */

(function () {

  /* ── Inject CSS once ── */
  const style = document.createElement('style');
  style.textContent = `
    .sf-crop-ov {
      position: fixed; inset: 0; z-index: 3000;
      background: rgba(0,0,0,.92); backdrop-filter: blur(18px);
      display: flex; align-items: center; justify-content: center;
      opacity: 0; pointer-events: none;
      transition: opacity .3s;
    }
    .sf-crop-ov.open { opacity: 1; pointer-events: all; }

    .sf-crop-modal {
      background: #111111; border: 1px solid rgba(255,255,255,0.13);
      border-radius: 18px; width: 92%; max-width: 640px;
      padding: 28px; display: flex; flex-direction: column; gap: 20px;
      transform: translateY(24px) scale(.97);
      transition: transform .4s cubic-bezier(.34,1.4,.64,1);
      max-height: 92vh;
    }
    .sf-crop-ov.open .sf-crop-modal { transform: translateY(0) scale(1); }

    .sf-crop-header {
      display: flex; align-items: center; justify-content: space-between;
    }
    .sf-crop-title {
      font-family: 'Bebas Neue', sans-serif;
      font-size: 22px; letter-spacing: 1px; color: #f8f8f6;
    }
    .sf-crop-hint {
      font-family: 'Space Mono', monospace;
      font-size: 10px; color: #666660; letter-spacing: 1px;
    }

    .sf-crop-close {
      width: 30px; height: 30px; border-radius: 50%;
      background: #1a1a1a; border: 1px solid rgba(255,255,255,0.07);
      color: #666660; cursor: pointer;
      display: flex; align-items: center; justify-content: center;
      transition: all .2s; flex-shrink: 0;
    }
    .sf-crop-close:hover { color: #f8f8f6; border-color: rgba(255,255,255,0.2); }
    .sf-crop-close svg { width: 12px; height: 12px; }

    .sf-crop-stage {
      position: relative;
      background: #0a0a0a; border: 1px solid rgba(255,255,255,0.07);
      border-radius: 10px; overflow: hidden;
      user-select: none; touch-action: none;
      flex-shrink: 0;
    }

    .sf-crop-canvas { display: block; width: 100%; }

    /* crop overlay box */
    .sf-crop-box {
      position: absolute; border: 2px solid #f8f8f6;
      box-shadow: 0 0 0 9999px rgba(0,0,0,0.55);
      cursor: move;
    }
    /* corner handles */
    .sf-crop-handle {
      position: absolute; width: 14px; height: 14px;
      background: #f8f8f6; border-radius: 2px;
    }
    .sf-crop-handle.nw { top: -7px;  left: -7px;  cursor: nw-resize; }
    .sf-crop-handle.ne { top: -7px;  right: -7px; cursor: ne-resize; }
    .sf-crop-handle.sw { bottom: -7px; left: -7px;  cursor: sw-resize; }
    .sf-crop-handle.se { bottom: -7px; right: -7px; cursor: se-resize; }
    /* edge handles */
    .sf-crop-handle.n  { top: -7px;  left: 50%; transform: translateX(-50%); cursor: n-resize; }
    .sf-crop-handle.s  { bottom: -7px; left: 50%; transform: translateX(-50%); cursor: s-resize; }
    .sf-crop-handle.w  { left: -7px; top: 50%; transform: translateY(-50%); cursor: w-resize; }
    .sf-crop-handle.e  { right: -7px; top: 50%; transform: translateY(-50%); cursor: e-resize; }

    /* rule of thirds grid lines */
    .sf-crop-grid {
      position: absolute; inset: 0; pointer-events: none;
      display: grid; grid-template-columns: 1fr 1fr 1fr;
      grid-template-rows: 1fr 1fr 1fr;
    }
    .sf-crop-grid-cell {
      border: 1px solid rgba(255,255,255,0.12);
    }

    .sf-crop-controls {
      display: flex; align-items: center; gap: 14px; flex-wrap: wrap;
    }
    .sf-crop-zoom-label {
      font-family: 'Space Mono', monospace; font-size: 10px;
      color: #666660; letter-spacing: 1px; white-space: nowrap;
    }
    .sf-crop-zoom {
      flex: 1; -webkit-appearance: none; height: 2px;
      background: linear-gradient(to right, #f8f8f6 0%, #f8f8f6 50%, rgba(255,255,255,.1) 50%);
      border-radius: 1px; cursor: pointer; min-width: 80px;
    }
    .sf-crop-zoom::-webkit-slider-thumb {
      -webkit-appearance: none; width: 14px; height: 14px;
      border-radius: 50%; background: #f8f8f6; cursor: pointer;
      box-shadow: 0 0 0 3px rgba(255,255,255,.12);
    }
    .sf-crop-ratio-row {
      display: flex; gap: 6px; margin-left: auto;
    }
    .sf-crop-ratio-btn {
      padding: 5px 12px; border-radius: 6px;
      background: none; border: 1px solid rgba(255,255,255,0.07);
      color: #666660; font-size: 11px; font-weight: 600;
      cursor: pointer; font-family: 'Instrument Sans', sans-serif;
      transition: all .2s;
    }
    .sf-crop-ratio-btn:hover { border-color: rgba(255,255,255,0.2); color: #f8f8f6; }
    .sf-crop-ratio-btn.on   { border-color: #f8f8f6; color: #f8f8f6; background: rgba(255,255,255,.06); }

    .sf-crop-actions { display: flex; gap: 10px; }
    .sf-crop-cancel {
      flex: 1; background: none; border: 1px solid rgba(255,255,255,0.07);
      color: #999990; border-radius: 8px; padding: 12px;
      font-size: 13px; font-weight: 500; cursor: pointer;
      font-family: 'Instrument Sans', sans-serif; transition: all .2s;
    }
    .sf-crop-cancel:hover { color: #f8f8f6; border-color: rgba(255,255,255,0.2); }
    .sf-crop-confirm {
      flex: 2; background: #f8f8f6; color: #0a0a0a; border: none;
      border-radius: 8px; padding: 12px;
      font-size: 13px; font-weight: 700; cursor: pointer;
      font-family: 'Instrument Sans', sans-serif; transition: background .2s;
    }
    .sf-crop-confirm:hover { background: #e0e0dc; }
  `;
  document.head.appendChild(style);

  /* ── Build modal DOM ── */
  const ov = document.createElement('div');
  ov.className = 'sf-crop-ov';
  ov.innerHTML = `
    <div class="sf-crop-modal">
      <div class="sf-crop-header">
        <div>
          <div class="sf-crop-title">Crop Image</div>
          <div class="sf-crop-hint">DRAG TO REPOSITION · HANDLES TO RESIZE</div>
        </div>
        <button class="sf-crop-close" id="sfCropClose">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round">
            <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
          </svg>
        </button>
      </div>

      <div class="sf-crop-stage" id="sfCropStage">
        <canvas class="sf-crop-canvas" id="sfCropCanvas"></canvas>
        <div class="sf-crop-box" id="sfCropBox">
          <div class="sf-crop-grid">
            ${Array(9).fill('<div class="sf-crop-grid-cell"></div>').join('')}
          </div>
          <div class="sf-crop-handle nw" data-handle="nw"></div>
          <div class="sf-crop-handle ne" data-handle="ne"></div>
          <div class="sf-crop-handle sw" data-handle="sw"></div>
          <div class="sf-crop-handle se" data-handle="se"></div>
          <div class="sf-crop-handle n"  data-handle="n"></div>
          <div class="sf-crop-handle s"  data-handle="s"></div>
          <div class="sf-crop-handle w"  data-handle="w"></div>
          <div class="sf-crop-handle e"  data-handle="e"></div>
        </div>
      </div>

      <div class="sf-crop-controls">
        <span class="sf-crop-zoom-label">ZOOM</span>
        <input type="range" class="sf-crop-zoom" id="sfCropZoom" min="0.1" max="3" step="0.01" value="1">
        <div class="sf-crop-ratio-row" id="sfCropRatios">
          <button class="sf-crop-ratio-btn on" data-ratio="free">Free</button>
          <button class="sf-crop-ratio-btn" data-ratio="1">1:1</button>
          <button class="sf-crop-ratio-btn" data-ratio="1.333">4:3</button>
          <button class="sf-crop-ratio-btn" data-ratio="1.778">16:9</button>
        </div>
      </div>

      <div class="sf-crop-actions">
        <button class="sf-crop-cancel" id="sfCropCancel">Cancel</button>
        <button class="sf-crop-confirm" id="sfCropConfirm">Use This Crop</button>
      </div>
    </div>
  `;
  document.body.appendChild(ov);

  /* ── State ── */
  let img        = null;
  let scale      = 1;
  let imgX       = 0, imgY = 0;   // image offset on canvas
  let cropX      = 0, cropY = 0, cropW = 0, cropH = 0; // crop box in canvas px
  let ratio      = null;           // null = free
  let onConfirm  = null;           // callback(blob)
  let stageW     = 0, stageH      = 0;
  let dragging   = false, resizing = false;
  let dragHandle = '';
  let dragStartX = 0, dragStartY  = 0;
  let dragStartCrop = {};

  const canvas   = document.getElementById('sfCropCanvas');
  const ctx      = canvas.getContext('2d');
  const box      = document.getElementById('sfCropBox');
  const stage    = document.getElementById('sfCropStage');
  const zoomSlider = document.getElementById('sfCropZoom');

  /* ── Draw image on canvas ── */
  function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    if (!img) return;
    ctx.save();
    ctx.translate(imgX, imgY);
    ctx.scale(scale, scale);
    ctx.drawImage(img, 0, 0);
    ctx.restore();
  }

  /* ── Sync crop box DOM to state ── */
  function syncBox() {
    box.style.left   = cropX + 'px';
    box.style.top    = cropY + 'px';
    box.style.width  = cropW + 'px';
    box.style.height = cropH + 'px';
  }

  /* ── Clamp crop box within canvas ── */
  function clamp() {
    cropX = Math.max(0, Math.min(cropX, stageW - cropW));
    cropY = Math.max(0, Math.min(cropY, stageH - cropH));
    cropW = Math.max(40, Math.min(cropW, stageW - cropX));
    cropH = Math.max(40, Math.min(cropH, stageH - cropY));
  }

  /* ── Apply ratio constraint ── */
  function applyRatio() {
    if (!ratio) return;
    cropH = cropW / ratio;
    if (cropY + cropH > stageH) {
      cropH = stageH - cropY;
      cropW = cropH * ratio;
    }
  }

  /* ── Open cropper ── */
  function open(src, aspectRatio, callback) {
    onConfirm = callback;
    ratio     = aspectRatio || null;

    // Set active ratio button
    document.querySelectorAll('.sf-crop-ratio-btn').forEach(b => {
      const r = b.dataset.ratio;
      const active = ratio === null ? r === 'free'
        : Math.abs(parseFloat(r) - ratio) < 0.01;
      b.classList.toggle('on', active);
    });

    img = new Image();
    img.onload = () => {
      // Size stage
      const maxW = Math.min(window.innerWidth * 0.85, 584);
      const maxH = window.innerHeight * 0.5;
      const imgRatio = img.naturalWidth / img.naturalHeight;

      stageW = maxW;
      stageH = Math.min(maxW / imgRatio, maxH);

      stage.style.height = stageH + 'px';
      canvas.width  = stageW;
      canvas.height = stageH;

      // Fit image
      scale = Math.min(stageW / img.naturalWidth, stageH / img.naturalHeight);
      imgX  = (stageW - img.naturalWidth  * scale) / 2;
      imgY  = (stageH - img.naturalHeight * scale) / 2;

      zoomSlider.value = scale;
      zoomSlider.min   = scale * 0.5;
      zoomSlider.max   = scale * 4;

      // Initial crop box — 80% of stage
      cropW = stageW * 0.8;
      cropH = ratio ? cropW / ratio : stageH * 0.8;
      cropX = (stageW - cropW) / 2;
      cropY = (stageH - cropH) / 2;
      clamp();
      draw();
      syncBox();

      ov.classList.add('open');
    };
    img.src = src;
  }

  /* ── Close ── */
  function close() {
    ov.classList.remove('open');
    img = null;
    onConfirm = null;
  }

  /* ── Zoom slider ── */
  zoomSlider.addEventListener('input', () => {
    const newScale  = parseFloat(zoomSlider.value);
    const centerX   = stageW / 2;
    const centerY   = stageH / 2;
    // Keep center point stable
    imgX = centerX - (centerX - imgX) * (newScale / scale);
    imgY = centerY - (centerY - imgY) * (newScale / scale);
    scale = newScale;
    draw();
    // Update slider background
    const pct = (scale - parseFloat(zoomSlider.min)) / (parseFloat(zoomSlider.max) - parseFloat(zoomSlider.min)) * 100;
    zoomSlider.style.background = `linear-gradient(to right,#f8f8f6 0%,#f8f8f6 ${pct}%,rgba(255,255,255,.1) ${pct}%)`;
  });

  /* ── Ratio buttons ── */
  document.getElementById('sfCropRatios').addEventListener('click', e => {
    const btn = e.target.closest('.sf-crop-ratio-btn');
    if (!btn) return;
    document.querySelectorAll('.sf-crop-ratio-btn').forEach(b => b.classList.remove('on'));
    btn.classList.add('on');
    const r = btn.dataset.ratio;
    ratio = r === 'free' ? null : parseFloat(r);
    applyRatio();
    clamp();
    syncBox();
  });

  /* ── Pointer events for drag/resize ── */
  function getPos(e) {
    const rect = stage.getBoundingClientRect();
    const cl   = e.touches ? e.touches[0] : e;
    return { x: cl.clientX - rect.left, y: cl.clientY - rect.top };
  }

  box.addEventListener('pointerdown', e => {
    const handle = e.target.dataset.handle;
    if (handle) {
      resizing   = true;
      dragHandle = handle;
    } else {
      dragging = true;
    }
    dragStartX    = e.clientX;
    dragStartY    = e.clientY;
    dragStartCrop = { x: cropX, y: cropY, w: cropW, h: cropH };
    e.stopPropagation();
    box.setPointerCapture(e.pointerId);
  });

  box.addEventListener('pointermove', e => {
    if (!dragging && !resizing) return;
    const dx = e.clientX - dragStartX;
    const dy = e.clientY - dragStartY;

    if (dragging) {
      cropX = dragStartCrop.x + dx;
      cropY = dragStartCrop.y + dy;
      clamp();
      syncBox();
      return;
    }

    // Resize
    let { x, y, w, h } = dragStartCrop;
    const h_str = dragHandle;

    if (h_str.includes('e')) w = Math.max(40, dragStartCrop.w + dx);
    if (h_str.includes('s')) h = Math.max(40, dragStartCrop.h + dy);
    if (h_str.includes('w')) { w = Math.max(40, dragStartCrop.w - dx); x = dragStartCrop.x + dragStartCrop.w - w; }
    if (h_str.includes('n')) { h = Math.max(40, dragStartCrop.h - dy); y = dragStartCrop.y + dragStartCrop.h - h; }

    cropX = x; cropY = y; cropW = w; cropH = h;

    if (ratio) applyRatio();
    clamp();
    syncBox();
  });

  box.addEventListener('pointerup', () => { dragging = false; resizing = false; });

  /* ── Confirm — export cropped image as blob ── */
  document.getElementById('sfCropConfirm').addEventListener('click', () => {
    if (!img || !onConfirm) return;

    // Map crop box (canvas px) back to image natural px
    const sx = (cropX - imgX) / scale;
    const sy = (cropY - imgY) / scale;
    const sw = cropW / scale;
    const sh = cropH / scale;

    const out = document.createElement('canvas');
    out.width  = Math.round(sw);
    out.height = Math.round(sh);
    out.getContext('2d').drawImage(img, sx, sy, sw, sh, 0, 0, sw, sh);

    out.toBlob(blob => {
      if (blob) onConfirm(blob);
      close();
    }, 'image/jpeg', 0.92);
  });

  document.getElementById('sfCropCancel').addEventListener('click', close);
  document.getElementById('sfCropClose').addEventListener('click', close);
  ov.addEventListener('click', e => { if (e.target === ov) close(); });
  document.addEventListener('keydown', e => { if (e.key === 'Escape') close(); });

  /* ── Expose globally ── */
  window.SmartFreezeCropper = { open };

})();