/* =====================================================================
   تصحيح الواجب على الملف نفسه (من غير تحميل)
   المدرس بيفتح حل الطالب (صورة أو PDF) ويرسم عليه: قلم، هايلايتر، دواير، ✓ و ✗، كتابة، ختم الدرجة
   وبعد الحفظ: الصفحات المصححة بتوصل للطالب في "تقرير الحصة ← الواجب"
   ===================================================================== */
const ANN = { h: null, pages: [], objs: [], tool: 'pen', color: '#D64545', width: 4, hist: [], redo: [], draft: null, busy: false, zoom: 1 };
const ANN_COLORS = ['#D64545', '#1F9D6B', '#2F6FDB', '#0B2463', '#D98A12'];
const ANN_TOOLS = [['hand', '✋', 'تحريك', 'Move'], ['pen', '✏️', 'قلم', 'Pen'], ['hl', '🖍️', 'هايلايتر', 'Highlighter'], ['ell', '⭕', 'دايرة', 'Circle'], ['line', '➖', 'خط', 'Line'], ['chk', '✔', 'صح', 'Tick'], ['x', '✘', 'غلط', 'Cross'], ['txt', 'T', 'كتابة', 'Text'], ['score', '🔟', 'ختم الدرجة', 'Grade stamp'], ['erase', '🧽', 'ممحاة', 'Eraser']];
const ANN_W = 1200;          // عرض الصفحة بالبيكسل وقت التصحيح
const isPdf = (name, type) => /pdf/i.test(type || '') || /\.pdf$/i.test(name || '');
const isImg = (name, type) => /^image\//i.test(type || '') || /\.(jpe?g|png|webp|gif|bmp)$/i.test(name || '');

async function T_annotate(hid) {
  const h = D.homework.find(x => x.id === hid); if (!h) return;
  Object.assign(ANN, { h, pages: [], objs: [], hist: [], redo: [], draft: null, tool: 'pen', zoom: 1 });
  annShell(L('جاري فتح ملف الطالب…', 'Opening the student’s file…'));
  try {
    let blob = null, name = String(h.file || '');
    if (IS_LIVE && name.includes('/')) {
      const { data, error } = await LIVE.sb.storage.from('homework').createSignedUrl(name, 300); if (error) throw error;
      const r = await fetch(data.signedUrl); if (!r.ok) throw new Error('download ' + r.status); blob = await r.blob();
    }
    if (blob && isPdf(name, blob.type)) ANN.pages = await annPdfPages(blob);
    else if (blob && isImg(name, blob.type)) ANN.pages = [await annImagePage(blob)];
    else if (!IS_LIVE) ANN.pages = [annDemoPage(h)];
    else { annClose(); return annUnsupported(h); }
    ANN.objs = ANN.pages.map(() => []);
    if (IS_LIVE && h.marksFile) { try { const { data } = await LIVE.sb.storage.from('homework').createSignedUrl(h.marksFile, 120); const j = await (await fetch(data.signedUrl)).json(); if (Array.isArray(j.objs)) ANN.objs = ANN.pages.map((_, i) => j.objs[i] || []); } catch (e) { console.warn('marks', e); } }
    else if (!IS_LIVE && h.marksData) ANN.objs = ANN.pages.map((_, i) => h.marksData[i] || []);
    annShell(); annDrawAll();
  } catch (e) { console.error(e); annClose(); toast(L('تعذّر فتح الملف: ', 'Could not open the file: ') + (e.message || e), 'bad'); }
}
function annUnsupported(h) {
  modal(L('الملف ده مينفعش يتصحح بالرسم', 'This file can’t be marked by drawing'), `<p style="margin-top:0">${L('التصحيح على الملف بيشتغل مع الصور (JPG / PNG) وملفات PDF. الملف ده نوعه مختلف (فيديو أو Word مثلاً).', 'On-page marking works with images (JPG/PNG) and PDF. This file is a different type (e.g. video or Word).')}</p><div class="row">${fileLabel(h.file, 'homework')}</div>`,
    `<button class="btn ghost" onclick="closeModal()">${L('إغلاق', 'Close')}</button><button class="btn gold" onclick="closeModal();T_grade('${h.id}')">${L('اكتب الدرجة والملاحظات', 'Enter grade & feedback')}</button>`);
}
async function annImagePage(blob) {
  const url = URL.createObjectURL(blob); const img = new Image(); img.src = url; await img.decode(); URL.revokeObjectURL(url);
  const k = Math.min(1.6, ANN_W / img.naturalWidth); const c = document.createElement('canvas'); c.width = Math.round(img.naturalWidth * k); c.height = Math.round(img.naturalHeight * k);
  const g = c.getContext('2d'); g.fillStyle = '#fff'; g.fillRect(0, 0, c.width, c.height); g.drawImage(img, 0, 0, c.width, c.height); return c;
}
let __pdfjs = null;
async function annPdfPages(blob) {
  if (!__pdfjs) { __pdfjs = await import(new URL('js/vendor/pdf-4.10.38.min.mjs', location.href).href); __pdfjs.GlobalWorkerOptions.workerSrc = new URL('js/vendor/pdf-4.10.38.worker.min.mjs', location.href).href; }
  const pdf = await __pdfjs.getDocument({ data: new Uint8Array(await blob.arrayBuffer()), isEvalSupported: false, enableXfa: false }).promise;
  const n = Math.min(pdf.numPages, 30); const out = [];
  for (let i = 1; i <= n; i++) {
    annShell(L('جاري تجهيز الصفحة ', 'Preparing page ') + i + ' / ' + n);
    const pg = await pdf.getPage(i); const v1 = pg.getViewport({ scale: 1 }); const vp = pg.getViewport({ scale: ANN_W / v1.width });
    const c = document.createElement('canvas'); c.width = Math.round(vp.width); c.height = Math.round(vp.height);
    const g = c.getContext('2d'); g.fillStyle = '#fff'; g.fillRect(0, 0, c.width, c.height);
    await pg.render({ canvasContext: g, viewport: vp }).promise; out.push(c);
  }
  if (pdf.numPages > 30) toast(L('أول 30 صفحة بس اللي هتتصحح', 'Only the first 30 pages can be marked'), '');
  return out;
}
function annDemoPage(h) { // وضع التجربة: ورقة عمل تجريبية لأن الملفات مش مرفوعة فعلاً
  const s = D.sessions.find(x => x.id === h.sessionId) || {}; const c = document.createElement('canvas'); c.width = ANN_W; c.height = 1500; const g = c.getContext('2d');
  g.fillStyle = '#fff'; g.fillRect(0, 0, c.width, c.height); g.fillStyle = '#0B2463'; g.font = 'bold 44px Arial'; g.textAlign = 'center'; g.fillText('Worksheet – ' + (stuById(h.studentId)?.name || ''), 600, 110);
  g.font = '28px Arial'; g.fillStyle = '#66708A'; g.fillText(String(s.assignment || h.file || '').slice(0, 70), 600, 160); g.textAlign = 'left';
  for (let i = 0; i < 10; i++) { const y = 260 + i * 120; g.fillStyle = '#14213D'; g.font = 'bold 30px Arial'; g.fillText((i + 1) + ')  ' + ['12 + 7 =', '45 − 18 =', '6 × 8 =', '56 ÷ 7 =', '0.5 + 0.25 =', '3/4 of 20 =', '9 × 9 =', '100 − 37 =', '7 + 8 × 2 =', '1.2 × 10 ='][i], 110, y);
    g.font = 'italic 34px "Comic Sans MS", cursive'; g.fillStyle = '#2F6FDB'; g.fillText(['19', '27', '48', '8', '0.75', '15', '81', '73', '30', '12'][i], 470, y); g.strokeStyle = '#E3E7F0'; g.beginPath(); g.moveTo(100, y + 30); g.lineTo(1100, y + 30); g.stroke(); }
  return c;
}

/* ---------- الواجهة ---------- */
function annShell(loading) {
  let el = document.getElementById('ann'); if (!el) { el = document.createElement('div'); el.id = 'ann'; el.className = 'ann'; document.body.appendChild(el); document.body.style.overflow = 'hidden'; }
  const h = ANN.h; const st = stuById(h.studentId); const s = D.sessions.find(x => x.id === h.sessionId) || {};
  if (loading) { el.innerHTML = `<div class="ann-load"><div class="spin"></div><div>${esc(loading)}</div><button class="btn ghost sm" onclick="annClose()">${L('إلغاء', 'Cancel')}</button></div>`; return; }
  el.innerHTML = `<div class="ann-top"><div class="ann-title"><b>${esc(st?.name || '')}</b><span class="small muted">${esc(subjName(subjById(s.subjectId)))} · ${esc(s.assignment || '')}</span></div>
      <div class="ann-tools">${ANN_TOOLS.map(([k, ic, ar, en]) => `<button class="ann-t ${ANN.tool === k ? 'on' : ''}" data-tool="${k}" title="${L(ar, en)}" onclick="annTool('${k}')"><span>${ic}</span><small>${L(ar, en)}</small></button>`).join('')}</div>
      <div class="ann-opts"><div class="ann-colors">${ANN_COLORS.map(c => `<button class="${ANN.color === c ? 'on' : ''}" style="background:${c}" onclick="ANN.color='${c}';annShellTop()"></button>`).join('')}</div>
        <select class="input" style="width:auto;padding:5px 8px" onchange="ANN.width=+this.value">${[[2, L('رفيع', 'Thin')], [4, L('متوسط', 'Medium')], [8, L('عريض', 'Thick')]].map(([w, l]) => `<option value="${w}" ${ANN.width === w ? 'selected' : ''}>${l}</option>`).join('')}</select>
        <button class="btn sm ghost" onclick="annUndo()" title="${L('تراجع', 'Undo')}">↶</button><button class="btn sm ghost" onclick="annRedo()" title="${L('إعادة', 'Redo')}">↷</button>
        <button class="btn sm ghost" onclick="annZoom(-1)">−</button><span class="small num">${Math.round(ANN.zoom * 100)}%</span><button class="btn sm ghost" onclick="annZoom(1)">+</button></div></div>
    <div class="ann-main"><div class="ann-pages" id="ann_pages">${ANN.pages.map((p, i) => `<div class="ann-page" style="max-width:${Math.round(900 * ANN.zoom)}px"><canvas class="ann-c tool-${ANN.tool}" data-i="${i}" width="${p.width}" height="${p.height}"></canvas>${ANN.pages.length > 1 ? `<span class="ann-pn num">${i + 1} / ${ANN.pages.length}</span>` : ''}</div>`).join('')}</div>
      <aside class="ann-side"><h3>${L('الدرجة والملاحظات', 'Grade & feedback')}</h3>
        <div class="row" style="gap:8px;align-items:flex-end"><div class="field" style="flex:1;margin:0"><label>${L('الدرجة', 'Grade')}</label><input class="input num" type="number" min="0" step="0.5" id="ann_g" value="${h.grade ?? ''}"></div><span style="padding-bottom:10px">/</span><div class="field" style="flex:1;margin:0"><label>${L('من', 'Out of')}</label><input class="input num" type="number" min="1" id="ann_m" value="${h.max || 10}"></div></div>
        <div class="field" style="margin-top:12px"><label>${L('ملاحظات للطالب', 'Feedback')}</label><textarea class="input" id="ann_f" style="min-height:110px">${esc(h.feedback || '')}</textarea></div>
        <div class="chips" style="margin-bottom:12px">${[L('ممتاز 👏', 'Excellent 👏'), L('أحسنت', 'Well done'), L('راجع الأخطاء المعلّمة بالأحمر', 'Review the red marks'), L('انتبه للخط', 'Mind your handwriting')].map(q => `<button class="pill navy" style="border:none;cursor:pointer" onclick="const f=document.getElementById('ann_f');f.value=(f.value?f.value+' ':'')+this.textContent">${q}</button>`).join('')}</div>
        <button class="btn sm ghost block" onclick="annClearPage()">${icon('trash')} ${L('مسح رسم الصفحة الظاهرة', 'Clear marks on visible page')}</button>
        <div class="ann-help tiny muted">${L('✔ و ✘ والدرجة: اضغط مكان ما عايز الختم. الكتابة: اضغط واكتب ثم Enter. الممحاة: اضغط على أي رسمة. على التابلت استخدم ✋ للتحريك.', 'Tick, cross and grade: tap where you want the stamp. Text: tap, type, Enter. Eraser: tap any mark. On tablets use ✋ to scroll.')}</div>
        <div class="ann-actions"><button class="btn ghost" onclick="annClose()">${L('إلغاء', 'Cancel')}</button><button class="btn gold" id="ann_save" onclick="annSave()">${icon('check')} ${L('حفظ وإرسال للطالب', 'Save & send to student')}</button></div></aside></div>`;
  el.querySelectorAll('canvas.ann-c').forEach(c => annBind(c));
}
function annShellTop() { const g = $('#ann_g')?.value, m = $('#ann_m')?.value, f = $('#ann_f')?.value; const sc = $('#ann_pages')?.scrollTop; annShell(); if (g != null) { $('#ann_g').value = g; $('#ann_m').value = m; $('#ann_f').value = f; } if (sc) $('#ann_pages').scrollTop = sc; annDrawAll(); }
function annTool(t) { ANN.tool = t; document.querySelectorAll('.ann-t').forEach(b => b.classList.toggle('on', b.dataset.tool === t)); document.querySelectorAll('canvas.ann-c').forEach(c => c.className = 'ann-c tool-' + t); }
function annZoom(d) { ANN.zoom = Math.max(0.5, Math.min(2, +(ANN.zoom + d * 0.25).toFixed(2))); annShellTop(); }
function annClose() { const el = document.getElementById('ann'); if (el) el.remove(); document.body.style.overflow = ''; $('#ann_txt')?.remove(); }
document.addEventListener('keydown', e => { if (!document.getElementById('ann') || e.target.matches('input,textarea')) return; if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') { e.preventDefault(); e.shiftKey ? annRedo() : annUndo(); } });

/* ---------- الرسم ---------- */
const annSize = i => ANN.pages[i].width / 1200; // مقياس الأختام حسب عرض الصفحة
function annPt(c, e) { const r = c.getBoundingClientRect(); return [(e.clientX - r.left) * c.width / r.width, (e.clientY - r.top) * c.height / r.height]; }
function annBind(c) {
  const i = +c.dataset.i;
  c.addEventListener('pointerdown', e => {
    if (ANN.tool === 'hand') return; e.preventDefault(); c.setPointerCapture(e.pointerId); const [x, y] = annPt(c, e); const s = annSize(i);
    const T = ANN.tool;
    if (T === 'pen' || T === 'hl') ANN.draft = { i, o: { t: T, c: T === 'hl' ? '#FFD43B' : ANN.color, w: (T === 'hl' ? 22 : ANN.width) * s, p: [x, y] } };
    else if (T === 'ell' || T === 'line') ANN.draft = { i, o: { t: T, c: ANN.color, w: ANN.width * s, x1: x, y1: y, x2: x, y2: y } };
    else if (T === 'chk' || T === 'x') annAdd(i, { t: T, c: T === 'chk' ? (ANN.color === '#D64545' ? '#1F9D6B' : ANN.color) : '#D64545', x, y, s: 44 * s });
    else if (T === 'score') { const g = $('#ann_g').value, m = $('#ann_m').value; if (g === '') return toast(L('اكتب الدرجة الأول في الخانة على الجنب', 'Enter the grade first'), 'bad'); annAdd(i, { t: 'score', c: '#D64545', x, y, s: 70 * s, v: g + '/' + m }); }
    else if (T === 'txt') annTextInput(c, i, x, y, e);
    else if (T === 'erase') annErase(i, x, y);
  });
  c.addEventListener('pointermove', e => {
    if (!ANN.draft || ANN.draft.i !== i) return; const [x, y] = annPt(c, e); const o = ANN.draft.o;
    if (o.p) { const n = o.p.length; if (Math.hypot(x - o.p[n - 2], y - o.p[n - 1]) > 1.5) o.p.push(Math.round(x * 10) / 10, Math.round(y * 10) / 10); } else { o.x2 = x; o.y2 = y; }
    annDraw(i);
  });
  const end = () => { if (!ANN.draft || ANN.draft.i !== i) return; const { o } = ANN.draft; ANN.draft = null; if ((o.p && o.p.length >= 4) || (!o.p && Math.hypot(o.x2 - o.x1, o.y2 - o.y1) > 6)) annAdd(i, o); else annDraw(i); };
  c.addEventListener('pointerup', end); c.addEventListener('pointercancel', end);
}
function annAdd(i, o) { ANN.objs[i].push(o); ANN.hist.push({ a: 'add', i, o }); ANN.redo = []; annDraw(i); }
function annUndo() { const h = ANN.hist.pop(); if (!h) return; if (h.a === 'add') ANN.objs[h.i].splice(ANN.objs[h.i].lastIndexOf(h.o), 1); else if (h.a === 'del') ANN.objs[h.i].splice(h.k, 0, h.o); else if (h.a === 'clear') ANN.objs[h.i] = h.prev; ANN.redo.push(h); annDraw(h.i); }
function annRedo() { const h = ANN.redo.pop(); if (!h) return; if (h.a === 'add') ANN.objs[h.i].push(h.o); else if (h.a === 'del') ANN.objs[h.i].splice(h.k, 1); else if (h.a === 'clear') ANN.objs[h.i] = []; ANN.hist.push(h); annDraw(h.i); }
function annVisiblePage() { const cs = [...document.querySelectorAll('canvas.ann-c')]; const mid = window.innerHeight / 2; let best = 0, d = 1e9; cs.forEach((c, i) => { const r = c.getBoundingClientRect(); const dd = Math.abs((r.top + r.bottom) / 2 - mid); if (dd < d) { d = dd; best = i; } }); return best; }
function annClearPage() { const i = annVisiblePage(); if (!ANN.objs[i].length) return; ANN.hist.push({ a: 'clear', i, prev: ANN.objs[i] }); ANN.objs[i] = []; annDraw(i); }
function annBox(o) {
  if (o.p) { let x1 = 1e9, y1 = 1e9, x2 = -1e9, y2 = -1e9; for (let k = 0; k < o.p.length; k += 2) { x1 = Math.min(x1, o.p[k]); x2 = Math.max(x2, o.p[k]); y1 = Math.min(y1, o.p[k + 1]); y2 = Math.max(y2, o.p[k + 1]); } return [x1 - o.w, y1 - o.w, x2 + o.w, y2 + o.w]; }
  if (o.x1 != null) return [Math.min(o.x1, o.x2) - 8, Math.min(o.y1, o.y2) - 8, Math.max(o.x1, o.x2) + 8, Math.max(o.y1, o.y2) + 8];
  if (o.t === 'txt') return [o.x - 4, o.y - o.s, o.x + o.s * 0.6 * String(o.v).length + 4, o.y + o.s * 0.4];
  return [o.x - o.s, o.y - o.s, o.x + o.s, o.y + o.s];
}
function annErase(i, x, y) { const a = ANN.objs[i]; for (let k = a.length - 1; k >= 0; k--) { const b = annBox(a[k]); if (x >= b[0] && x <= b[2] && y >= b[1] && y <= b[3]) { const o = a.splice(k, 1)[0]; ANN.hist.push({ a: 'del', i, o, k }); ANN.redo = []; annDraw(i); return; } } }
function annTextInput(c, i, x, y, e) {
  $('#ann_txt')?.remove(); const inp = document.createElement('input'); inp.id = 'ann_txt'; inp.className = 'ann-txt'; inp.placeholder = L('اكتب واضغط Enter', 'Type, then Enter'); inp.maxLength = 120;
  inp.style.left = e.clientX + 'px'; inp.style.top = e.clientY + 'px'; inp.style.color = ANN.color; document.body.appendChild(inp); setTimeout(() => inp.focus(), 0);
  let fin = false;
  const done = ok => { if (fin) return; fin = true; const v = inp.value.trim(); inp.remove(); if (ok && v) annAdd(i, { t: 'txt', c: ANN.color, x, y, s: 34 * annSize(i) * (ANN.width >= 8 ? 1.35 : ANN.width <= 2 ? 0.8 : 1), v }); };
  inp.addEventListener('keydown', ev => { if (ev.key === 'Enter') done(true); if (ev.key === 'Escape') done(false); ev.stopPropagation(); });
  inp.addEventListener('blur', () => done(true));
}
function annDrawObj(g, o) {
  g.save(); g.lineCap = 'round'; g.lineJoin = 'round'; g.strokeStyle = o.c; g.fillStyle = o.c;
  if (o.t === 'pen' || o.t === 'hl') { if (o.t === 'hl') { g.globalAlpha = 0.38; g.globalCompositeOperation = 'multiply'; } g.lineWidth = o.w; const p = o.p; g.beginPath(); g.moveTo(p[0], p[1]);
    if (p.length <= 4) g.lineTo((p[2] ?? p[0]) + 0.1, p[3] ?? p[1]); else { for (let k = 2; k < p.length - 2; k += 2) g.quadraticCurveTo(p[k], p[k + 1], (p[k] + p[k + 2]) / 2, (p[k + 1] + p[k + 3]) / 2); g.lineTo(p[p.length - 2], p[p.length - 1]); } g.stroke(); }
  else if (o.t === 'ell') { g.lineWidth = o.w; g.beginPath(); g.ellipse((o.x1 + o.x2) / 2, (o.y1 + o.y2) / 2, Math.abs(o.x2 - o.x1) / 2 || 1, Math.abs(o.y2 - o.y1) / 2 || 1, 0, 0, Math.PI * 2); g.stroke(); }
  else if (o.t === 'line') { g.lineWidth = o.w; g.beginPath(); g.moveTo(o.x1, o.y1); g.lineTo(o.x2, o.y2); g.stroke(); }
  else if (o.t === 'chk') { g.lineWidth = o.s * 0.18; g.beginPath(); g.moveTo(o.x - o.s * 0.55, o.y); g.lineTo(o.x - o.s * 0.15, o.y + o.s * 0.42); g.lineTo(o.x + o.s * 0.6, o.y - o.s * 0.5); g.stroke(); }
  else if (o.t === 'x') { g.lineWidth = o.s * 0.16; g.beginPath(); g.moveTo(o.x - o.s * 0.45, o.y - o.s * 0.45); g.lineTo(o.x + o.s * 0.45, o.y + o.s * 0.45); g.moveTo(o.x + o.s * 0.45, o.y - o.s * 0.45); g.lineTo(o.x - o.s * 0.45, o.y + o.s * 0.45); g.stroke(); }
  else if (o.t === 'txt') { g.font = `600 ${o.s}px 'IBM Plex Sans Arabic', Arial, sans-serif`; g.textBaseline = 'alphabetic'; g.direction = /[؀-ۿ]/.test(o.v) ? 'rtl' : 'ltr'; g.textAlign = g.direction === 'rtl' ? 'right' : 'left'; g.fillText(o.v, o.x, o.y); }
  else if (o.t === 'score') { g.lineWidth = o.s * 0.07; g.beginPath(); g.arc(o.x, o.y, o.s * 0.95, 0, Math.PI * 2); g.stroke(); g.beginPath(); g.arc(o.x, o.y, o.s * 0.82, 0, Math.PI * 2); g.lineWidth = o.s * 0.025; g.stroke();
    g.font = `800 ${o.s * (String(o.v).length > 5 ? 0.5 : 0.62)}px Montserrat, Arial, sans-serif`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.direction = 'ltr'; g.fillText(o.v, o.x, o.y + o.s * 0.04); }
  g.restore();
}
function annRender(g, i) { g.drawImage(ANN.pages[i], 0, 0); ANN.objs[i].forEach(o => annDrawObj(g, o)); if (ANN.draft && ANN.draft.i === i) annDrawObj(g, ANN.draft.o); }
function annDraw(i) { const c = document.querySelector(`canvas.ann-c[data-i="${i}"]`); if (c) annRender(c.getContext('2d'), i); }
function annDrawAll() { ANN.pages.forEach((_, i) => annDraw(i)); }

/* ---------- الحفظ ---------- */
async function annSave() {
  if (ANN.busy) return; const h = ANN.h;
  const g = $('#ann_g').value, m = +$('#ann_m').value || 10, f = $('#ann_f').value.trim();
  const gv = g === '' ? null : +g; if (gv != null && (isNaN(gv) || gv < 0 || gv > m)) return toast(L('الدرجة لازم تكون بين 0 و', 'Grade must be between 0 and ') + m, 'bad');
  if (contactViolation(f)) return toast(L('غير مسموح ببيانات تواصل في الملاحظات', 'Contact details are not allowed'), 'bad');
  const btn = $('#ann_save'); ANN.busy = true; btn.disabled = true;
  try {
    const flat = ANN.pages.map((p, i) => { const c = document.createElement('canvas'); c.width = p.width; c.height = p.height; annRender(c.getContext('2d'), i); return c; });
    if (IS_LIVE) {
      const paths = [];
      for (let i = 0; i < flat.length; i++) {
        btn.textContent = L('جاري رفع الصفحة ', 'Uploading page ') + (i + 1) + '/' + flat.length;
        const blob = await new Promise(r => flat[i].toBlob(r, 'image/jpeg', 0.85));
        const p = await liveUploadBlob('homework', blob, `marked_${h.id}_p${i + 1}.jpg`); if (!p) throw new Error('upload');
        paths.push(p);
      }
      const marks = new Blob([JSON.stringify({ v: 1, objs: ANN.objs })], { type: 'application/json' });
      const mp = await liveUploadBlob('homework', marks, `marks_${h.id}.json`); if (!mp) throw new Error('upload');
      Object.assign(h, { marked: paths, marksFile: mp, markedAt: new Date().toISOString() });
    } else {
      h.markedData = flat.map(c => { const k = Math.min(1, 900 / c.width); const s = document.createElement('canvas'); s.width = c.width * k; s.height = c.height * k; s.getContext('2d').drawImage(c, 0, 0, s.width, s.height); return s.toDataURL('image/jpeg', 0.7); });
      h.marksData = ANN.objs; h.markedAt = new Date().toISOString();
    }
    Object.assign(h, { grade: gv, max: m, feedback: f }); save(); annClose(); render();
    toast(L('تم حفظ التصحيح ووصل للطالب ✓', 'Marking saved and sent to the student ✓'), 'ok');
  } catch (e) { console.error(e); toast(L('تعذّر الحفظ – جرّب تاني', 'Could not save – try again'), 'bad'); btn.disabled = false; btn.textContent = L('حفظ وإرسال للطالب', 'Save & send to student'); }
  ANN.busy = false;
}

/* ---------- عرض الورقة المصححة (للطالب ولولي الأمر وللمدرس) ---------- */
const hwMarked = h => !!((h.marked && h.marked.length) || (h.markedData && h.markedData.length));
async function S_viewMarked(hid) {
  const h = D.homework.find(x => x.id === hid); if (!h) return;
  modal(L('ورقة الواجب بعد التصحيح', 'Corrected homework'), `<div id="mk_pages" class="mk-pages"><div class="muted">${L('جاري التحميل…', 'Loading…')}</div></div>`, `${h.grade != null ? `<span class="pill ok num" style="font-size:14px">${L('الدرجة', 'Grade')}: ${h.grade}/${h.max}</span>` : ''}<button class="btn" onclick="closeModal()">${L('إغلاق', 'Close')}</button>`, { wide: true });
  let urls = [];
  if (IS_LIVE) { const { data, error } = await LIVE.sb.storage.from('homework').createSignedUrls(h.marked, 600); if (error) return toast(liveErr(error.message), 'bad'); urls = data.map(d => d.signedUrl).filter(Boolean); }
  else urls = h.markedData || [];
  const box = $('#mk_pages'); if (!box) return;
  box.innerHTML = (h.feedback ? `<div class="notice info" style="margin-bottom:12px">${icon('chat')} <div>${esc(h.feedback)}</div></div>` : '') + urls.map((u, i) => `<img src="${esc(safeImg(u))}" alt="${L('صفحة', 'Page')} ${i + 1}" loading="lazy">`).join('');
}
