/* 이미지 편집 스튜디오 — 비율 변환 · 자르기 · 배경 제거 (100% 클라이언트) */
(function () {
  'use strict';
  const $ = (id) => document.getElementById(id);

  /* ================= 공용: 이미지 로드 ================= */
  const src = { img: null, w: 0, h: 0, name: 'image' };

  function setImage(img, name) {
    src.img = img; src.w = img.naturalWidth || img.width; src.h = img.naturalHeight || img.height;
    src.name = (name || 'image').replace(/\.[^.]+$/, '');
    $('srcInfo').textContent = `${src.name} · ${src.w}×${src.h}px`;
    renderAspect(); initCrop(); initGrid(); initShape(); resetBg();
  }

  function loadFile(file) {
    if (!file || !file.type.startsWith('image/')) { alert('이미지 파일만 가능합니다.'); return; }
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => { setImage(img, file.name); URL.revokeObjectURL(url); };
    img.onerror = () => alert('이미지를 불러오지 못했습니다.');
    img.src = url;
  }

  const dropZone = $('dropZone'), fileInput = $('fileInput');
  dropZone.addEventListener('click', () => fileInput.click());
  fileInput.addEventListener('change', (e) => { loadFile(e.target.files[0]); fileInput.value = ''; });
  ['dragenter', 'dragover'].forEach((ev) => dropZone.addEventListener(ev, (e) => { e.preventDefault(); dropZone.classList.add('dragover'); }));
  ['dragleave', 'drop'].forEach((ev) => dropZone.addEventListener(ev, (e) => { e.preventDefault(); dropZone.classList.remove('dragover'); }));
  dropZone.addEventListener('drop', (e) => loadFile(e.dataTransfer.files[0]));

  $('sampleBtn').addEventListener('click', () => {
    const c = document.createElement('canvas'); c.width = 960; c.height = 640;
    const x = c.getContext('2d');
    const g = x.createLinearGradient(0, 0, 960, 640);
    g.addColorStop(0, '#1a2a6c'); g.addColorStop(0.5, '#b21f1f'); g.addColorStop(1, '#fdbb2d');
    x.fillStyle = g; x.fillRect(0, 0, 960, 640);
    x.fillStyle = '#ffffff';
    x.beginPath(); x.arc(480, 300, 130, 0, 7); x.fill();
    x.fillStyle = '#00d4aa';
    x.beginPath(); x.arc(240, 460, 80, 0, 7); x.fill();
    x.fillStyle = '#2f81f7'; x.fillRect(640, 380, 180, 180);
    x.fillStyle = 'rgba(255,255,255,.92)'; x.font = 'bold 64px sans-serif';
    x.fillText('SAMPLE', 360, 120);
    const img = new Image();
    img.onload = () => setImage(img, 'sample');
    img.src = c.toDataURL();
  });

  function download(canvas, filename, type, quality) {
    canvas.toBlob((blob) => {
      if (!blob) { alert('저장 실패'); return; }
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = filename;
      a.click();
      setTimeout(() => URL.revokeObjectURL(a.href), 4000);
    }, type || 'image/png', quality);
  }
  const extOf = (type) => type === 'image/jpeg' ? 'jpg' : type === 'image/webp' ? 'webp' : 'png';

  /* ================= 탭 ================= */
  document.querySelectorAll('.tab').forEach((t) => t.addEventListener('click', () => {
    document.querySelectorAll('.tab').forEach((x) => x.classList.toggle('active', x === t));
    document.querySelectorAll('.tab-panel').forEach((p) => p.classList.toggle('active', p.id === 'tab-' + t.dataset.tab));
  }));
  document.querySelectorAll('.sub-tab').forEach((t) => t.addEventListener('click', () => {
    document.querySelectorAll('.sub-tab').forEach((x) => x.classList.toggle('active', x === t));
    document.querySelectorAll('.sub-panel').forEach((p) => p.classList.toggle('active', p.id === 'sub-' + t.dataset.sub));
  }));

  /* ================= 1. 비율 변환 ================= */
  const ratio = { w: 16, h: 9 };
  const aspectCanvas = $('aspectCanvas');

  document.querySelectorAll('#ratioBtns button').forEach((b) => b.addEventListener('click', () => {
    document.querySelectorAll('#ratioBtns button').forEach((x) => x.classList.remove('on'));
    b.classList.add('on');
    ratio.w = +b.dataset.w; ratio.h = +b.dataset.h;
    renderAspect();
  }));
  $('crApply').addEventListener('click', () => {
    const w = Math.max(1, +$('crW').value || 1), h = Math.max(1, +$('crH').value || 1);
    document.querySelectorAll('#ratioBtns button').forEach((x) => x.classList.remove('on'));
    ratio.w = w; ratio.h = h; renderAspect();
  });
  ['outW', 'fitMode', 'fillColor', 'outFmt', 'quality'].forEach((id) =>
    $(id).addEventListener('input', () => {
      $('qVal').textContent = $('quality').value;
      $('solidRow').style.display = $('fitMode').value === 'solid' ? 'flex' : 'none';
      $('qRow').style.visibility = $('outFmt').value === 'image/png' ? 'hidden' : 'visible';
      renderAspect();
    }));

  function renderAspect() {
    if (!src.img) return;
    const outW = Math.min(4096, Math.max(16, +$('outW').value || 1280));
    const cw = outW, ch = Math.round(outW * ratio.h / ratio.w);
    $('outHLabel').textContent = `높이: ${ch}px (${ratio.w}:${ratio.h})`;
    aspectCanvas.width = cw; aspectCanvas.height = ch;
    const ctx = aspectCanvas.getContext('2d');
    const mode = $('fitMode').value;
    const iw = src.w, ih = src.h;

    if (mode === 'cover') {
      const s = Math.max(cw / iw, ch / ih), dw = iw * s, dh = ih * s;
      ctx.drawImage(src.img, (cw - dw) / 2, (ch - dh) / 2, dw, dh);
      return;
    }
    // contain 배치
    const s = Math.min(cw / iw, ch / ih), dw = iw * s, dh = ih * s;
    const dx = (cw - dw) / 2, dy = (ch - dh) / 2;

    if (mode === 'solid') {
      ctx.fillStyle = $('fillColor').value;
      ctx.fillRect(0, 0, cw, ch);
    } else if (mode === 'blur') {
      ctx.save();
      ctx.filter = 'blur(40px) brightness(0.55)';
      const bs = Math.max(cw / iw, ch / ih);
      ctx.drawImage(src.img, (cw - iw * bs) / 2, (ch - ih * bs) / 2, iw * bs, ih * bs);
      ctx.restore();
    } else if (mode === 'mirror') {
      // 좌우
      if (dx > 0.5) {
        ctx.save(); ctx.beginPath(); ctx.rect(0, 0, dx, ch); ctx.clip();
        ctx.translate(2 * dx, 0); ctx.scale(-1, 1);
        ctx.drawImage(src.img, dx, dy, dw, dh); ctx.restore();
        const rx = cw - (dx + dw);
        ctx.save(); ctx.beginPath(); ctx.rect(dx + dw, 0, rx, ch); ctx.clip();
        ctx.translate(2 * (dx + dw), 0); ctx.scale(-1, 1);
        ctx.drawImage(src.img, dx, dy, dw, dh); ctx.restore();
      }
      // 상하
      if (dy > 0.5) {
        ctx.save(); ctx.beginPath(); ctx.rect(0, 0, cw, dy); ctx.clip();
        ctx.translate(0, 2 * dy); ctx.scale(1, -1);
        ctx.drawImage(src.img, dx, dy, dw, dh); ctx.restore();
        const by = ch - (dy + dh);
        ctx.save(); ctx.beginPath(); ctx.rect(0, dy + dh, cw, by); ctx.clip();
        ctx.translate(0, 2 * (dy + dh)); ctx.scale(1, -1);
        ctx.drawImage(src.img, dx, dy, dw, dh); ctx.restore();
      }
      // 모서리 빈틈 메우기
      ctx.fillStyle = '#000';
      if (dx > 0.5 && dy > 0.5) {
        ctx.fillRect(0, 0, dx, dy); ctx.fillRect(cw - dx, 0, dx, dy);
        ctx.fillRect(0, ch - dy, dx, dy); ctx.fillRect(cw - dx, ch - dy, dx, dy);
      }
    }
    ctx.drawImage(src.img, dx, dy, dw, dh);
  }

  $('aspectDownload').addEventListener('click', () => {
    if (!src.img) { alert('이미지를 먼저 넣어주세요.'); return; }
    const type = $('outFmt').value, q = $('quality').value / 100;
    download(aspectCanvas, `${src.name}_${ratio.w}x${ratio.h}.${extOf(type)}`, type, q);
  });

  /* ================= 2a. 자유 자르기 ================= */
  const cropCanvas = $('cropCanvas');
  let cropView = { scale: 1, dw: 0, dh: 0 }, sel = null, dragging = false;

  function initCrop() {
    if (!src.img) return;
    sel = null; dragging = false;
    const maxW = 860, scale = Math.min(1, maxW / src.w);
    cropView = { scale, dw: src.w * scale, dh: src.h * scale };
    cropCanvas.width = cropView.dw; cropCanvas.height = cropView.dh;
    drawCrop();
    $('cropCoords').textContent = '선택 영역: -';
  }

  function drawCrop() {
    const ctx = cropCanvas.getContext('2d');
    ctx.clearRect(0, 0, cropCanvas.width, cropCanvas.height);
    ctx.drawImage(src.img, 0, 0, cropView.dw, cropView.dh);
    if (sel) {
      ctx.fillStyle = 'rgba(0,0,0,0.55)';
      ctx.fillRect(0, 0, cropView.dw, sel.y);
      ctx.fillRect(0, sel.y + sel.h, cropView.dw, cropView.dh - sel.y - sel.h);
      ctx.fillRect(0, sel.y, sel.x, sel.h);
      ctx.fillRect(sel.x + sel.w, sel.y, cropView.dw - sel.x - sel.w, sel.h);
      ctx.strokeStyle = '#2f81f7'; ctx.lineWidth = 2;
      ctx.strokeRect(sel.x, sel.y, sel.w, sel.h);
    }
  }

  function evtPos(e) {
    const r = cropCanvas.getBoundingClientRect();
    return {
      x: Math.max(0, Math.min(cropView.dw, e.clientX - r.left)),
      y: Math.max(0, Math.min(cropView.dh, e.clientY - r.top)),
    };
  }
  cropCanvas.addEventListener('pointerdown', (e) => {
    if (!src.img) return;
    dragging = true;
    const p = evtPos(e);
    sel = { x: p.x, y: p.y, w: 0, h: 0, x0: p.x, y0: p.y };
    cropCanvas.setPointerCapture(e.pointerId);
  });
  cropCanvas.addEventListener('pointermove', (e) => {
    if (!dragging || !sel) return;
    const p = evtPos(e);
    sel.x = Math.min(sel.x0, p.x); sel.y = Math.min(sel.y0, p.y);
    sel.w = Math.abs(p.x - sel.x0); sel.h = Math.abs(p.y - sel.y0);
    drawCrop();
  });
  cropCanvas.addEventListener('pointerup', () => {
    dragging = false;
    if (sel && sel.w > 4 && sel.h > 4) {
      const s = cropView.scale;
      const sx = Math.round(sel.x / s), sy = Math.round(sel.y / s);
      const sw = Math.round(sel.w / s), sh = Math.round(sel.h / s);
      sel.px = { sx, sy, sw, sh };
      $('cropCoords').textContent = `선택 영역: X ${sx}px · Y ${sy}px · ${sw}×${sh}px`;
    } else { sel = null; drawCrop(); $('cropCoords').textContent = '선택 영역: -'; }
  });

  $('cropDownload').addEventListener('click', () => {
    if (!sel || !sel.px) { alert('먼저 영역을 드래그해서 선택하세요.'); return; }
    const { sx, sy, sw, sh } = sel.px;
    const c = document.createElement('canvas'); c.width = sw; c.height = sh;
    c.getContext('2d').drawImage(src.img, sx, sy, sw, sh, 0, 0, sw, sh);
    download(c, `${src.name}_crop_${sw}x${sh}.png`);
  });

  /* ================= 2b. 격자 분할 ================= */
  const gridCanvas = $('gridCanvas');
  function initGrid() {
    if (!src.img) return;
    const maxW = 860, scale = Math.min(1, maxW / src.w);
    gridCanvas.width = src.w * scale; gridCanvas.height = src.h * scale;
    gridCanvas._scale = scale;
    drawGrid();
  }
  function drawGrid() {
    if (!src.img) return;
    const ctx = gridCanvas.getContext('2d');
    const rows = Math.max(1, +$('gridRows').value || 1), cols = Math.max(1, +$('gridCols').value || 1);
    ctx.drawImage(src.img, 0, 0, gridCanvas.width, gridCanvas.height);
    ctx.strokeStyle = '#ff5c5c'; ctx.lineWidth = 2;
    for (let r = 1; r < rows; r++) {
      const y = (gridCanvas.height / rows) * r;
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(gridCanvas.width, y); ctx.stroke();
    }
    for (let c = 1; c < cols; c++) {
      const x = (gridCanvas.width / cols) * c;
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, gridCanvas.height); ctx.stroke();
    }
    ctx.fillStyle = '#ff5c5c'; ctx.font = 'bold 16px sans-serif';
    let n = 1;
    for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++)
      ctx.fillText(n++, (gridCanvas.width / cols) * c + 8, (gridCanvas.height / rows) * r + 22);
  }
  ['gridRows', 'gridCols'].forEach((id) => $(id).addEventListener('input', drawGrid));

  $('gridDownload').addEventListener('click', () => {
    if (!src.img) { alert('이미지를 먼저 넣어주세요.'); return; }
    const rows = Math.max(1, +$('gridRows').value || 1), cols = Math.max(1, +$('gridCols').value || 1);
    const fmt = $('gridFmt').value === 'jpeg' ? 'image/jpeg' : 'image/png';
    const tw = Math.floor(src.w / cols), th = Math.floor(src.h / rows);
    let i = 0;
    const tiles = [];
    for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
      const w = (c === cols - 1) ? src.w - tw * c : tw;
      const h = (r === rows - 1) ? src.h - th * r : th;
      const cv = document.createElement('canvas'); cv.width = w; cv.height = h;
      cv.getContext('2d').drawImage(src.img, tw * c, th * r, w, h, 0, 0, w, h);
      tiles.push({ cv, name: `${src.name}_tile${++i}.${fmt === 'image/jpeg' ? 'jpg' : 'png'}` });
    }
    // 브라우저 다중 다운로드 차단을 피하려고 순차 저장
    (function next() {
      if (!tiles.length) return;
      const t = tiles.shift();
      download(t.cv, t.name, fmt, 0.92);
      setTimeout(next, 400);
    })();
  });

  /* ================= 2c. 모양 자르기 ================= */
  const shapeCanvas = $('shapeCanvas');
  let shapeMode = 'circle';
  document.querySelectorAll('#shapeBtns button').forEach((b) => b.addEventListener('click', () => {
    document.querySelectorAll('#shapeBtns button').forEach((x) => x.classList.remove('on'));
    b.classList.add('on'); shapeMode = b.dataset.shape; initShape();
  }));
  $('cornerR').addEventListener('input', () => { $('cornerV').textContent = $('cornerR').value + '%'; initShape(); });

  function initShape() {
    if (!src.img) return;
    const maxW = 720, scale = Math.min(1, maxW / src.w);
    shapeCanvas.width = src.w * scale; shapeCanvas.height = src.h * scale;
    shapeCanvas._scale = scale;
    const ctx = shapeCanvas.getContext('2d');
    const w = shapeCanvas.width, h = shapeCanvas.height;
    ctx.clearRect(0, 0, w, h);
    ctx.save();
    ctx.beginPath();
    if (shapeMode === 'circle') {
      ctx.arc(w / 2, h / 2, Math.min(w, h) / 2, 0, 7);
    } else if (shapeMode === 'rounded') {
      const r = Math.min(w, h) * ($('cornerR').value / 100);
      ctx.roundRect(0, 0, w, h, r);
    } else {
      ctx.moveTo(w / 2, 0); ctx.lineTo(w, h / 2); ctx.lineTo(w / 2, h); ctx.lineTo(0, h / 2); ctx.closePath();
    }
    ctx.clip();
    ctx.drawImage(src.img, 0, 0, w, h);
    ctx.restore();
  }
  $('shapeDownload').addEventListener('click', () => {
    if (!src.img) { alert('이미지를 먼저 넣어주세요.'); return; }
    download(shapeCanvas, `${src.name}_${shapeMode}.png`);
  });

  /* ================= 3. 배경 제거 ================= */
  const bgCanvas = $('bgCanvas');
  let bgResult = null, picking = false;

  function resetBg() {
    bgResult = null;
    if (!src.img) return;
    const maxW = 860, scale = Math.min(1, maxW / src.w);
    bgCanvas.width = src.w * scale; bgCanvas.height = src.h * scale;
    bgCanvas.getContext('2d').drawImage(src.img, 0, 0, bgCanvas.width, bgCanvas.height);
  }
  $('bgMethod').addEventListener('change', () => {
    $('chromaCtl').style.display = $('bgMethod').value === 'chroma' ? 'block' : 'none';
  });
  $('tolerance').addEventListener('input', () => { $('tolVal').textContent = $('tolerance').value; });
  $('pickColorBtn').addEventListener('click', () => {
    picking = true;
    $('pickHint').style.display = 'block';
  });
  bgCanvas.addEventListener('click', (e) => {
    if (!picking || !src.img) return;
    picking = false; $('pickHint').style.display = 'none';
    const r = bgCanvas.getBoundingClientRect();
    const x = Math.floor((e.clientX - r.left) * (bgCanvas.width / r.width));
    const y = Math.floor((e.clientY - r.top) * (bgCanvas.height / r.height));
    const d = bgCanvas.getContext('2d').getImageData(x, y, 1, 1).data;
    $('keyColor').value = '#' + [d[0], d[1], d[2]].map((v) => v.toString(16).padStart(2, '0')).join('');
  });

  const dist = (r1, g1, b1, r2, g2, b2) =>
    Math.sqrt((r1 - r2) ** 2 + (g1 - g2) ** 2 + (b1 - b2) ** 2);

  function processCanvas() {
    // 처리용으로 최대 1024px로 축소
    const scale = Math.min(1, 1024 / Math.max(src.w, src.h));
    const c = document.createElement('canvas');
    c.width = Math.round(src.w * scale); c.height = Math.round(src.h * scale);
    const ctx = c.getContext('2d');
    ctx.drawImage(src.img, 0, 0, c.width, c.height);
    return { c, ctx };
  }

  function hexRgb(hex) {
    return [parseInt(hex.slice(1, 3), 16), parseInt(hex.slice(3, 5), 16), parseInt(hex.slice(5, 7), 16)];
  }

  $('bgApply').addEventListener('click', () => {
    if (!src.img) { alert('이미지를 먼저 넣어주세요.'); return; }
    const tol = +$('tolerance').value;
    const { c, ctx } = processCanvas();
    const img = ctx.getImageData(0, 0, c.width, c.height);
    const d = img.data, W = c.width, H = c.height;

    if ($('bgMethod').value === 'chroma') {
      const [kr, kg, kb] = hexRgb($('keyColor').value);
      for (let i = 0; i < d.length; i += 4) {
        if (dist(d[i], d[i + 1], d[i + 2], kr, kg, kb) < tol) d[i + 3] = 0;
      }
    } else {
      // 4개 코너에서 플러드필
      const seeds = [[0, 0], [W - 1, 0], [0, H - 1], [W - 1, H - 1]];
      const done = new Uint8Array(W * H);
      const stack = [];
      seeds.forEach(([sx, sy]) => {
        const si = sy * W + sx;
        if (!done[si]) { done[si] = 1; stack.push([sx, sy, d[si * 4], d[si * 4 + 1], d[si * 4 + 2]]); }
      });
      while (stack.length) {
        const [x, y, sr, sg, sb] = stack.pop();
        const idx = y * W + x;
        d[idx * 4 + 3] = 0;
        [[1, 0], [-1, 0], [0, 1], [0, -1]].forEach(([dx, dy]) => {
          const nx = x + dx, ny = y + dy;
          if (nx < 0 || ny < 0 || nx >= W || ny >= H) return;
          const ni = ny * W + nx;
          if (done[ni]) return;
          if (dist(d[ni * 4], d[ni * 4 + 1], d[ni * 4 + 2], sr, sg, sb) < tol) {
            done[ni] = 1; stack.push([nx, ny, sr, sg, sb]);
          }
        });
      }
    }
    ctx.putImageData(img, 0, 0);
    bgResult = c;
    // 미리보기
    bgCanvas.width = c.width; bgCanvas.height = c.height;
    bgCanvas.getContext('2d').drawImage(c, 0, 0);
  });

  $('bgDownload').addEventListener('click', () => {
    if (!bgResult) { alert('먼저 "배경 제거 실행"을 눌러주세요.'); return; }
    download(bgResult, `${src.name}_nobg.png`);
  });
})();
