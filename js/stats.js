/* =====================================================================
   الزيارات + "ملخص الشهر" في لوحة الإدارة (نظرة عامة)
   - كل زيارة للموقع (جلسة تصفح) بتتعد مرة واحدة، وكل جهاز مختلف في اليوم = زائر.
     مفيش أي بيانات شخصية: رقم عشوائي محفوظ في المتصفح بس.
   - المبيعات = المبالغ المحصّلة فعلاً من الباقات المعتمدة (بعملة التقارير).
   - الطلبات = طلبات الاشتراك اللي اتعملت في الشهر.
   - هدف الشهر = رقم بتحدده الإدارة، والدايرة بتوضح وصلت لكام في المية.
   ===================================================================== */
Object.assign(IC, {
  box: '<path d="M3 7.5 12 3l9 4.5v9L12 21l-9-4.5z"/><path d="M3 7.5 12 12l9-4.5M12 12v9"/>',
  target: '<path d="M8 21h8M12 17v4M7 4h10v5a5 5 0 0 1-10 0z"/><path d="M7 6H4.5a2.5 2.5 0 0 0 2.6 4M17 6h2.5a2.5 2.5 0 0 1-2.6 4"/>',
  refresh: '<path d="M20 11a8 8 0 1 0-2.3 5.7M20 4v7h-7"/>',
});

/* ---------- عدّاد الزيارات ---------- */
function visitorId() {
  let v = ''; try { v = localStorage.getItem('nexium_vid') || ''; } catch (e) {}
  if (!/^[A-Za-z0-9_-]{8,40}$/.test(v)) {
    const a = new Uint8Array(12); (window.crypto || {}).getRandomValues ? crypto.getRandomValues(a) : a.forEach((_, i) => a[i] = Math.random() * 256);
    v = [...a].map(b => 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789_-'[b % 64]).join('');
    try { localStorage.setItem('nexium_vid', v); } catch (e) {}
  }
  return v;
}
const riyadhDay = (t = Date.now()) => new Date(t + 3 * 36e5).toISOString().slice(0, 10);
function trackVisit() {
  try {
    if (APP.portal !== 'student') return;                       // بوابة المدرس والإدارة مش بتتحسب
    try { if (localStorage.getItem('nexium_staff') === '1') return; } catch (e) {}
    try { if (sessionStorage.getItem('nexium_visit')) return; sessionStorage.setItem('nexium_visit', '1'); } catch (e) {}
    const vid = visitorId();
    if (IS_LIVE) { if (LIVE.sb) LIVE.sb.rpc('track_visit', { p_vid: vid }).then(() => {}, () => {}); return; }
    // النسخة التجريبية: بتتسجل في المتصفح
    D.visits = Array.isArray(D.visits) ? D.visits : demoVisits(); const day = riyadhDay(); let r = D.visits.find(x => x.day === day);
    if (!r) { r = { day, visits: 0, visitors: 0, _ids: [] }; D.visits.push(r); }
    r.visits++; r._ids = r._ids || []; if (!r._ids.includes(vid)) { r._ids.push(vid); r.visitors++; }
    persistRaw();
  } catch (e) { console.warn(e); }
}
// بيانات تجريبية للزيارات (النسخة التجريبية بس)
function demoVisits() {
  const out = []; for (let i = 75; i >= 1; i--) { const t = Date.now() - i * DAY; const wd = new Date(t).getDay(); const base = 520 + Math.round(240 * Math.sin(i / 6)) + (wd === 5 ? -180 : 0) + Math.round(Math.random() * 160);
    out.push({ day: riyadhDay(t), visits: base, visitors: Math.round(base * 0.68) }); }
  return out;
}

/* ---------- حساب ملخص شهر ---------- */
const MS = { off: 0, at: Date.now() };
function monthStats(off) {
  const now = new Date(); const ref = new Date(now.getFullYear(), now.getMonth() - off, 1); const y = ref.getFullYear(), m = ref.getMonth();
  const inM = v => { if (!v) return false; const s = String(v); const d = /^\d{4}-\d{2}-\d{2}$/.test(s) ? new Date(s + 'T12:00:00') : new Date(s); return d.getFullYear() === y && d.getMonth() === m; };
  const days = new Date(y, m + 1, 0).getDate(); const daily = Array(days).fill(0);
  let visits = 0, visitors = 0;
  (D.visits || []).forEach(v => { const [yy, mm, dd] = String(v.day).slice(0, 10).split('-').map(Number); if (yy === y && mm - 1 === m) { visits += +v.visits || 0; visitors += +v.visitors || 0; daily[dd - 1] += +v.visits || 0; } });
  let sales = 0; D.enrollments.forEach(e => { const p = toSAR(+e.paid || 0, e.currency); if (p > 0 && inM(e.from || e.created)) sales += p; });
  const orders = D.enrollments.filter(e => inM(e.created)).length;
  const label = ref.toLocaleDateString(LANG === 'ar' ? 'ar-EG' : 'en-US', { month: 'long', year: 'numeric' });
  return { y, m, visits, visitors, sales, orders, daily, label, days };
}
const nfmt = n => (+n || 0).toLocaleString('en-US');
function chgPill(cur, prev) {
  if (!prev) return cur ? `<span class="chg up" title="${L('مقارنة بالشهر اللي قبله', 'vs previous month')}">${L('جديد', 'new')}</span>` : '';
  const p = Math.round((cur - prev) / prev * 100); if (!p) return `<span class="chg">0%</span>`;
  return `<span class="chg ${p > 0 ? 'up' : 'down'}" title="${L('مقارنة بالشهر اللي قبله', 'vs previous month')}">${p > 0 ? '▲' : '▼'} ${Math.abs(p)}%</span>`;
}
function goalRing(pct) {
  const r = 22, c = 2 * Math.PI * r, v = Math.max(0, Math.min(1, pct || 0));
  return `<svg viewBox="0 0 56 56" width="56" height="56" class="ms-ring"><circle cx="28" cy="28" r="${r}" fill="none" stroke="var(--line)" stroke-width="5"/><circle cx="28" cy="28" r="${r}" fill="none" stroke="var(--gold)" stroke-width="5" stroke-linecap="round" stroke-dasharray="${(c * v).toFixed(1)} ${c.toFixed(1)}" transform="rotate(-90 28 28)"/><g transform="translate(16 16)" stroke="var(--ok)" fill="none" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">${IC.target}</g></svg>`;
}

/* ---------- الكارت نفسه ---------- */
function AD_monthSummary() {
  if (!IS_LIVE && !Array.isArray(D.visits)) D.visits = demoVisits();
  const fin = can('fin.dash'); const S = monthStats(MS.off), P = monthStats(MS.off + 1);
  const noVisits = IS_LIVE && !Array.isArray(D.visits);
  const goal = +(D.settings.monthGoal || 0); const pct = goal ? S.sales / goal : 0;
  const tile = (ic, cls, v, l, extra = '', onclick = '') => `<div class="ms-tile" ${onclick ? `onclick="${onclick}" style="cursor:pointer"` : ''}><div class="ms-ic ic ${cls}">${icon(ic)}</div><div><div class="ms-v">${v}</div><div class="ms-l">${l} ${extra}</div></div></div>`;
  const maxD = Math.max(1, ...S.daily); const today = MS.off === 0 ? new Date().getDate() : S.days;
  const allSales = D.enrollments.reduce((a, e) => a + toSAR(+e.paid || 0, e.currency), 0);
  const allVisits = (D.visits || []).reduce((a, v) => a + (+v.visits || 0), 0);
  const todayV = (D.visits || []).find(v => String(v.day).slice(0, 10) === riyadhDay());
  return `<div class="card ms-card"><div class="ms-head"><div><h2>${L('ملخص الشهر', 'Month summary')}</h2><div class="tiny muted">${L('آخر تحديث:', 'Updated:')} ${Date.now() - MS.at < 60000 ? L('الآن', 'just now') : relTime(new Date(MS.at).toISOString())} <button class="btn link tiny" onclick="AD_msRefresh()" title="${L('تحديث', 'Refresh')}">${icon('refresh')}</button></div></div>
      <div class="ms-nav"><button class="btn sm ghost" onclick="MS.off++;render()" title="${L('الشهر اللي قبله', 'Previous month')}">${LANG === 'ar' ? '›' : '‹'}</button><b>${S.label}</b><button class="btn sm ghost" ${MS.off ? '' : 'disabled'} onclick="MS.off=Math.max(0,MS.off-1);render()" title="${L('الشهر اللي بعده', 'Next month')}">${LANG === 'ar' ? '‹' : '›'}</button></div></div>
    <div class="ms-grid">
      ${tile('users', 'navy', noVisits ? '—' : `<span class="num">${nfmt(S.visits)}</span>`, L('الزيارات', 'Visits'), noVisits ? '' : chgPill(S.visits, P.visits) + `<div class="tiny muted"><span class="num">${nfmt(S.visitors)}</span> ${L('زائر', 'visitors')}</div>`)}
      ${fin ? tile('coin', 'ok', rep(S.sales), L('المبيعات', 'Sales'), chgPill(S.sales, P.sales) + `<div class="tiny muted">${L('المحصّل فعلاً', 'actually collected')}</div>`, "go('finance')") : tile('lock', 'gray', '—', L('المبيعات (مخفية)', 'Sales (hidden)'))}
      ${fin ? tile('box', 'info', `<span class="num">${nfmt(S.orders)}</span>`, L('الطلبات', 'Orders'), chgPill(S.orders, P.orders) + `<div class="tiny muted">${L('طلبات اشتراك', 'subscription requests')}</div>`, "go('payments')") : ''}
      ${fin ? `<div class="ms-tile" ${can('fin.prices') || can('fin.dash') ? `onclick="AD_setGoal()" style="cursor:pointer" title="${L('تعديل هدف الشهر', 'Edit monthly goal')}"` : ''}>${goalRing(pct)}<div><div class="ms-v">${goal ? `<span class="num">${Math.round(pct * 100)}%</span>` : '—'}</div><div class="ms-l">${L('هدف الشهر', 'Monthly goal')} ›<div class="tiny muted">${goal ? rep(goal) : L('اضغط عشان تحدد الهدف', 'Click to set a goal')}</div></div></div></div>` : ''}
    </div>
    ${noVisits ? `<div class="notice warn small" style="margin-top:12px">${icon('shield')} ${L('عدّاد الزيارات محتاج تحديث قاعدة البيانات: شغّل ملف NEXIUM_DB_UPDATE_v4.sql في Supabase مرة واحدة.', 'Visit counting needs the database update: run NEXIUM_DB_UPDATE_v4.sql once in Supabase.')}</div>` : `<div class="ms-bars" title="${L('الزيارات اليومية', 'Daily visits')}">${S.daily.map((v, i) => `<i style="height:${Math.max(3, Math.round(v / maxD * 100))}%" class="${i + 1 > today ? 'fut' : ''}" title="${i + 1} · ${nfmt(v)} ${L('زيارة', 'visits')}"></i>`).join('')}</div><div class="ms-bars-l tiny muted"><span>1</span><span>${L('الزيارات اليومية', 'Daily visits')}</span><span>${S.days}</span></div>`}
    <div class="ms-foot">${fin ? `<span>${L('إجمالي المبيعات (من البداية):', 'All-time sales:')} <b>${rep(allSales)}</b></span>` : ''}${noVisits ? '' : `<span>${L('إجمالي الزيارات:', 'All-time visits:')} <b class="num">${nfmt(allVisits)}</b></span><span>${L('النهارده:', 'Today:')} <b class="num">${nfmt(todayV ? todayV.visits : 0)}</b></span>`}
      ${fin ? `<button class="btn link small" onclick="go('finance')">${L('المزيد من التقارير', 'More reports')} ›</button>` : ''}</div></div>`;
}
async function AD_msRefresh() {
  if (IS_LIVE) { if (SVB.dirty) return toast(L('احفظ تعديلاتك الأول', 'Save your changes first'), 'bad'); try { await liveLoad(); } catch (e) { console.error(e); } }
  MS.at = Date.now(); render(); toast(L('تم التحديث', 'Updated'), 'ok');
}
function AD_setGoal() {
  if (!(can('fin.prices') || can('fin.dash'))) return;
  const C = repC(); const cur = Math.round(fromSAR(+(D.settings.monthGoal || 0), C.cur)) || '';
  modal(L('هدف المبيعات الشهري', 'Monthly sales goal'), `<p class="small muted" style="margin-top:0">${L('حط رقم المبيعات اللي عايز توصله كل شهر، والدايرة في "ملخص الشهر" هتوضح وصلت لكام في المية.', 'Set the sales you aim for each month; the ring shows how close you are.')}</p>
    <div class="row"><input class="input num" id="mg_v" type="number" min="0" step="100" style="max-width:200px" value="${cur}"><b>${LANG === 'ar' ? C.sym.ar : C.sym.en}</b></div>`,
    `${cur ? `<button class="btn ghost" onclick="D.settings.monthGoal=0;closeModal();commit().then(render)">${L('إلغاء الهدف', 'Remove goal')}</button>` : ''}<button class="btn gold" onclick="const v=+val('mg_v');if(!(v>0))return toast(L('اكتب رقم أكبر من صفر','Enter a number above zero'),'bad');D.settings.monthGoal=Math.round(toSAR(v,repC().cur));closeModal();commit().then(()=>{render();toast(L('تم حفظ الهدف','Goal saved'),'ok')})">${L('حفظ', 'Save')}</button>`);
}
