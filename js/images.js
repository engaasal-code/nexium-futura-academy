/* =====================================================================
   رفع الصور بمقاسات ثابتة لكل مكان في الموقع
   ---------------------------------------------------------------------
   كل صورة ليها: المقاس النهائي (عرض × ارتفاع)، وأقل مقاس مقبول، وأقصى حجم.
   - الصورة بتتقص على نفس نسبة المكان اللي هتظهر فيه (وتقدر تحرّكها وتكبّرها قبل القص).
   - بتتصغّر للمقاس النهائي وتتحفظ WebP (أو JPG لو المتصفح مش بيدعم WebP).
   - لو الصورة أصغر من أقل مقاس → مش بتترفع (عشان متبانش مشوّشة في الموقع).
   - لو الحجم بعد الضغط أكبر من المسموح → الجودة بتقل تدريجياً لحد ما يدخل في الحد.
   عايز تغيّر مقاس؟ عدّل الأرقام في IMG_SPECS تحت.
   ===================================================================== */
const IMG_SPECS = {
  //            العرض  الارتفاع  أقل عرض  أقل ارتفاع  أقصى حجم (KB)  القص         المجلد
  hero:     { w: 1440, h: 1080, minW: 960, minH: 720, kb: 350, mode: 'cover', folder: 'home', ar: 'صورة البانر', en: 'Banner image' },
  why:      { w: 400,  h: 400,  minW: 200, minH: 200, kb: 80,  mode: 'cover', folder: 'home', ar: 'صورة "ليه تختارنا"', en: '“Why us” image' },
  join:     { w: 1200, h: 800,  minW: 720, minH: 480, kb: 250, mode: 'cover', folder: 'home', ar: 'صورة "انضم كمدرس"', en: '“Teach with us” image' },
  review:   { w: 300,  h: 300,  minW: 150, minH: 150, kb: 60,  mode: 'cover', folder: 'home', round: true, ar: 'صورة ولي الأمر', en: 'Parent photo' },
  payLogos: { w: 1200, h: 0,    minW: 400, minH: 0,   kb: 200, mode: 'fit',   folder: 'home', alpha: true, ar: 'شعارات طرق الدفع', en: 'Payment logos' },
  subject:  { w: 800,  h: 600,  minW: 480, minH: 360, kb: 150, mode: 'cover', folder: 'subjects', ar: 'صورة المادة', en: 'Subject image' },
  teacher:  { w: 600,  h: 600,  minW: 300, minH: 300, kb: 120, mode: 'cover', folder: 'teachers', round: true, ar: 'صورة المدرس', en: 'Teacher photo' },
  auth:     { w: 1200, h: 800,  minW: 900, minH: 600, kb: 250, mode: 'cover', folder: 'home', ar: 'صورة صفحة الدخول', en: 'Login page image' },
};
const gcd = (a, b) => b ? gcd(b, a % b) : a;
const imgRatio = S => { if (!S.h) return ''; const g = gcd(S.w, S.h); return `${S.w / g}:${S.h / g}`; };
function imgSpecLabel(k) {
  const S = IMG_SPECS[k]; if (!S) return '';
  return S.h ? L(`المقاس ${S.w}×${S.h} (${imgRatio(S)}) – أقل حاجة ${S.minW}×${S.minH}`, `Size ${S.w}×${S.h} (${imgRatio(S)}) – at least ${S.minW}×${S.minH}`)
    : L(`العرض ${S.w} – أقل حاجة ${S.minW} عرض – خلفية شفافة (PNG)`, `Width ${S.w} – at least ${S.minW} wide – transparent PNG`);
}
const imgSpecHint = k => IMG_SPECS[k] ? `<div class="img-spec tiny">📐 ${imgSpecLabel(k)}</div>` : '';

// للكود القديم اللي كان بيبعت {folder, maxW, square}
function legacySpec(o) { if (o.spec) return o.spec; if (o.folder === 'teachers') return 'teacher'; if (o.folder === 'subjects') return 'subject'; if (o.square) return o.maxW <= 300 ? 'review' : 'why'; if (o.maxW >= 1500) return 'hero'; if (o.maxW >= 1100) return 'payLogos'; return 'join'; }

function pickImage(onDone, opts = {}) {
  const key = legacySpec(opts); const S = IMG_SPECS[key];
  const inp = document.createElement('input'); inp.type = 'file'; inp.accept = 'image/jpeg,image/png,image/webp,image/gif';
  inp.onchange = async () => {
    const f = inp.files[0]; if (!f) return;
    if (!/^image\/(jpeg|png|webp|gif)$/.test(f.type)) return toast(L('ارفع صورة JPG أو PNG أو WEBP', 'Upload a JPG, PNG or WEBP image'), 'bad');
    if (f.size > 20 * 1024 * 1024) return toast(L('الصورة أكبر من 20 ميجا', 'Image is larger than 20 MB'), 'bad');
    let img; try { img = await loadImg(f); } catch (e) { return toast(L('تعذّر قراءة الصورة', 'Could not read the image'), 'bad'); }
    const iw = img.naturalWidth, ih = img.naturalHeight;
    if (iw < S.minW || (S.minH && ih < S.minH)) {
      window.__imgDone = onDone;
      return modal(L('الصورة صغيرة ومش هتبان واضحة', 'The image is too small'), `<p style="margin-top:0">${L('مقاس الصورة اللي اخترتها', 'Your image is')} <b class="num" dir="ltr">${iw}×${ih}</b>.</p>
        <div class="notice warn">${icon('upload')} <div><b>${L(S.ar, S.en)}</b>: ${imgSpecLabel(key)}</div></div><p class="small muted">${L('ارفع صورة بمقاس أكبر عشان الموقع يفضل شكله احترافي على الكمبيوتر والموبايل.', 'Please upload a larger image so the site stays sharp on every screen.')}</p>`,
        `<button class="btn gold" onclick="closeModal();pickImage(window.__imgDone,{spec:'${key}'})">${icon('upload')} ${L('اختار صورة تانية', 'Choose another image')}</button>`);
    }
    if (S.mode === 'fit') return finishImage(key, img, { sx: 0, sy: 0, sw: iw, sh: ih }, onDone);
    cropModal(key, img, f.name, onDone);
  };
  inp.click();
}
async function loadImg(file) { const url = URL.createObjectURL(file); const img = new Image(); img.src = url; await img.decode(); img.__url = url; return img; }

/* ---------- القص: اسحب الصورة لتحريكها، والشريط للتكبير ---------- */
const CROP = {};
function cropModal(key, img, name, onDone) {
  const S = IMG_SPECS[key]; Object.assign(CROP, { key, img, onDone, z: 1, x: 0, y: 0 });
  modal(L('ضبط الصورة', 'Adjust the image') + ' · ' + L(S.ar, S.en), `<div class="small muted" style="margin:-4px 0 10px">${L('اسحب الصورة عشان تختار الجزء اللي هيظهر، وكبّرها من الشريط. الإطار ده بنفس شكل المكان في الموقع.', 'Drag to choose what shows, zoom with the slider. The frame matches the spot on the site.')}</div>
    <div class="crop-box ${S.round ? 'round' : ''}" id="crop_box" style="aspect-ratio:${S.w}/${S.h}"><img id="crop_img" src="${img.__url}" alt="" draggable="false"></div>
    <div class="row" style="margin-top:12px;gap:10px"><span>🔍</span><input type="range" id="crop_z" min="1" max="3" step="0.01" value="1" style="flex:1" oninput="CROP.z=+this.value;cropDraw()"><button class="btn sm ghost" onclick="CROP.z=1;CROP.x=CROP.y=null;document.getElementById('crop_z').value=1;cropDraw()">${L('توسيط', 'Center')}</button></div>
    <div class="row between small" style="margin-top:8px"><span class="muted">${imgSpecLabel(key)}</span><span id="crop_q"></span></div>`,
    `<button class="btn ghost" onclick="closeModal()">${L('إلغاء', 'Cancel')}</button><button class="btn gold" id="crop_ok" onclick="cropDone()">${L('استخدام الصورة', 'Use image')}</button>`, { wide: true });
  CROP.x = CROP.y = null; requestAnimationFrame(() => { cropDraw(); cropBind(); });
}
function cropGeom() {
  const box = document.getElementById('crop_box'); if (!box) return null; const bw = box.clientWidth, bh = box.clientHeight;
  const iw = CROP.img.naturalWidth, ih = CROP.img.naturalHeight; const s = Math.max(bw / iw, bh / ih) * CROP.z;
  const dw = iw * s, dh = ih * s;
  if (CROP.x == null) { CROP.x = (bw - dw) / 2; CROP.y = (bh - dh) / 2; }
  CROP.x = Math.min(0, Math.max(bw - dw, CROP.x)); CROP.y = Math.min(0, Math.max(bh - dh, CROP.y));
  return { bw, bh, s, dw, dh };
}
function cropDraw() {
  const g = cropGeom(); if (!g) return; const el = document.getElementById('crop_img');
  el.style.width = g.dw + 'px'; el.style.height = g.dh + 'px'; el.style.transform = `translate(${CROP.x}px,${CROP.y}px)`;
  const S = IMG_SPECS[CROP.key]; const srcW = g.bw / g.s; const ok = srcW >= S.minW - 0.5; const great = srcW >= S.w * 0.98;
  const q = document.getElementById('crop_q'); if (q) q.innerHTML = great ? `<span style="color:var(--ok)">● ${L('جودة ممتازة', 'Excellent quality')}</span>` : ok ? `<span style="color:var(--warn)">● ${L('جودة كويسة', 'Good quality')}</span>` : `<span style="color:var(--bad)">● ${L('مكبّرة زيادة – هتبان مشوّشة، صغّرها', 'Zoomed too much – will look blurry')}</span>`;
  const b = document.getElementById('crop_ok'); if (b) b.disabled = !ok;
}
function cropBind() {
  const box = document.getElementById('crop_box'); if (!box) return; let st = null;
  box.onpointerdown = e => { st = { x: e.clientX, y: e.clientY, ox: CROP.x, oy: CROP.y }; box.setPointerCapture(e.pointerId); box.classList.add('drag'); };
  box.onpointermove = e => { if (!st) return; const dx = e.clientX - st.x; CROP.x = st.ox + dx; CROP.y = st.oy + (e.clientY - st.y); cropDraw(); };
  box.onpointerup = box.onpointercancel = () => { st = null; box.classList.remove('drag'); };
  box.onwheel = e => { e.preventDefault(); CROP.z = Math.min(3, Math.max(1, CROP.z - e.deltaY * 0.0015)); const r = document.getElementById('crop_z'); if (r) r.value = CROP.z; cropDraw(); };
}
function cropDone() {
  const g = cropGeom(); if (!g) return;
  const rect = { sx: -CROP.x / g.s, sy: -CROP.y / g.s, sw: g.bw / g.s, sh: g.bh / g.s };
  const { key, img, onDone } = CROP; closeModal(); finishImage(key, img, rect, onDone);
}

/* ---------- تصغير + ضغط + رفع ---------- */
async function encodeCanvas(c, S) {
  const tryType = async (type, q) => new Promise(res => c.toBlob(res, type, q));
  let q = 0.86, blob = await tryType('image/webp', q);
  const webp = blob && blob.type === 'image/webp';
  const type = webp ? 'image/webp' : (S.alpha ? 'image/png' : 'image/jpeg');
  if (!webp) blob = await tryType(type, q);
  while (blob && blob.size > S.kb * 1024 && q > 0.5 && type !== 'image/png') { q -= 0.08; blob = await tryType(type, q); }
  return blob;
}
async function finishImage(key, img, r, onDone) {
  const S = IMG_SPECS[key];
  try {
    toast(L('جاري تجهيز الصورة…', 'Preparing image…'));
    let W, H;
    if (S.mode === 'fit') { W = Math.min(S.w, Math.round(r.sw)); H = Math.round(r.sh * W / r.sw); }
    else { W = Math.min(S.w, Math.round(r.sw)); H = Math.round(W * S.h / S.w); }
    const c = document.createElement('canvas'); c.width = W; c.height = H; const g = c.getContext('2d');
    g.imageSmoothingEnabled = true; g.imageSmoothingQuality = 'high';
    if (!S.alpha) { g.fillStyle = '#fff'; g.fillRect(0, 0, W, H); }
    // تصغير على مراحل للصور الكبيرة جداً (أنعم من خطوة واحدة)
    let src = img, sx = r.sx, sy = r.sy, sw = r.sw, sh = r.sh;
    while (sw > W * 2.2) { const t = document.createElement('canvas'); t.width = Math.round(sw / 2); t.height = Math.round(sh / 2); const tg = t.getContext('2d'); tg.imageSmoothingQuality = 'high'; tg.drawImage(src, sx, sy, sw, sh, 0, 0, t.width, t.height); src = t; sx = sy = 0; sw = t.width; sh = t.height; }
    g.drawImage(src, sx, sy, sw, sh, 0, 0, W, H);
    if (img.__url) URL.revokeObjectURL(img.__url);
    const blob = await encodeCanvas(c, S); if (!blob) throw new Error('encode');
    if (!IS_LIVE) { const fr = new FileReader(); fr.onload = () => { onDone(fr.result); toast(L('تمت إضافة الصورة', 'Image added') + ` (${W}×${H})`, 'ok'); }; fr.readAsDataURL(blob); return; }
    const ext = blob.type === 'image/webp' ? 'webp' : blob.type === 'image/png' ? 'png' : 'jpg';
    const path = `${S.folder}/${key}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}.${ext}`;
    const { error } = await LIVE.sb.storage.from('site').upload(path, blob, { contentType: blob.type, upsert: false, cacheControl: '31536000' });
    if (error) return toast(liveErr(error.message), 'bad');
    onDone(LIVE.sb.storage.from('site').getPublicUrl(path).data.publicUrl);
    toast(L('تم رفع الصورة', 'Image uploaded') + ` · ${W}×${H} · ${Math.round(blob.size / 1024)}KB`, 'ok');
  } catch (e) { console.error(e); toast(L('تعذّر تجهيز الصورة', 'Could not process the image'), 'bad'); }
}
