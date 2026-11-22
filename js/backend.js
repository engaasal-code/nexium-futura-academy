/* =====================================================================
   NEXIUM FUTURA ACADEMY — live mode (Supabase)
   Active only when SUPABASE_URL and SUPABASE_ANON_KEY are set in js/config.js.
   The UI keeps working on the in-memory object D; this file
   (1) loads D from the database for the signed-in user,
   (2) writes every change back (only the rows/fields that changed),
   (3) replaces login / booking / payment / upload actions with server calls.
   Security is enforced by the database (supabase/schema.sql), not here.
   ===================================================================== */
const LIVE = { on: IS_LIVE, sb: null, profile: null, snap: {}, syncing: false, pending: false, timer: null, ready: false, bootMsg: '' };

/* ---------- table mapping: D field ↔ database column ---------- */
const MAP = [
  { key: 'students', table: 'students', cols: { id: 'id', userId: 'user_id', name: 'name', parent: 'parent', stage: 'stage', grade: 'grade', country: 'country', active: 'active', confirmed: 'confirmed', provider: 'provider', joined: 'joined', addedBy: 'added_by', withdrawn: 'withdrawn' },
    skip: ['email', 'phone', 'pass'], ro: ['user_id', 'confirmed', 'provider'], priv: { table: 'student_private', fk: 'student_id', cols: { email: 'email', phone: 'phone' } } },
  { key: 'teachers', table: 'teachers', cols: { id: 'id', userId: 'user_id', name: 'name', nameEn: 'name_en', bio: 'bio', bioEn: 'bio_en', youtube: 'youtube', zoom: 'zoom', color: 'color', camera: 'camera', active: 'active', badge: 'badge', addedStudents: 'added_students' },
    skip: ['email', 'phone', 'pass', 'subjects', 'rateLocked'], ro: ['user_id'], special: 'teachers', priv: { table: 'teacher_private', fk: 'teacher_id', cols: { email: 'email', phone: 'phone', rates: 'rates', rateLocked: 'rate_locked' } } },
  { key: 'staff', table: 'staff', cols: { id: 'id', userId: 'user_id', name: 'name', email: 'email', role: 'role' }, skip: ['pass'], ro: ['user_id'] },
  { key: 'subjects', table: 'subjects', cols: { id: 'id', key: 'key', stage: 'stage', ar: 'ar', en: 'en', icon: 'icon', visible: 'visible', pps: 'pps', countryPps: 'country_pps' } },
  { key: 'enrollments', table: 'enrollments', cols: { id: 'id', studentId: 'student_id', subjectId: 'subject_id', sessions: 'sessions', amount: 'amount', paid: 'paid', currency: 'currency', method: 'method', status: 'status', created: 'created', from: 'from_date', to: 'to_date', receipt: 'receipt', approvedBy: 'approved_by' } },
  { key: 'sessions', table: 'sessions', cols: { id: 'id', teacherId: 'teacher_id', subjectId: 'subject_id', studentId: 'student_id', enrollmentId: 'enrollment_id', start: 'start_at', dur: 'dur', status: 'status', zoom: 'zoom', objectives: 'objectives', material: 'material', assignment: 'assignment', recording: 'recording', attendedAt: 'attended_at' } },
  { key: 'homework', table: 'homework', cols: { id: 'id', sessionId: 'session_id', studentId: 'student_id', file: 'file', note: 'note', at: 'at', grade: 'grade', max: 'max', feedback: 'feedback' } },
  { key: 'evals', table: 'evals', cols: { id: 'id', studentId: 'student_id', teacherId: 'teacher_id', subjectId: 'subject_id', interaction: 'interaction', homework: 'homework', commitment: 'commitment', note: 'note', at: 'at' } },
  { key: 'certs', table: 'certs', cols: { id: 'id', studentId: 'student_id', teacherId: 'teacher_id', type: 'type', title: 'title', reason: 'reason', at: 'at' } },
  { key: 'ratings', table: 'ratings', cols: { id: 'id', teacherId: 'teacher_id', studentId: 'student_id', stars: 'stars', comment: 'comment', at: 'at' }, noExtra: true },
  { key: 'messages', table: 'messages', cols: { id: 'id', thread: 'thread', from: 'sender', text: 'text', at: 'at', blocked: 'blocked', reason: 'reason', by: 'by', reviewed: 'reviewed', readS: 'read_s', readT: 'read_t' }, skip: ['original'], special: 'messages', ro: ['blocked', 'reason', 'by'] },
  { key: 'emails', table: 'emails', cols: { id: 'id', sessionId: 'session_id', to: 'to_email', type: 'type', subject: 'subject', body: 'body', at: 'send_at', status: 'status', read: 'read' }, noExtra: true, updateOnly: ['read'] },
  { key: 'payouts', table: 'payouts', cols: { id: 'id', teacherId: 'teacher_id', amount: 'amount', note: 'note', at: 'at' }, noExtra: true },
  { key: 'expenses', table: 'expenses', cols: { id: 'id', title: 'title', amount: 'amount', at: 'at' }, noExtra: true },
  { key: 'withdrawals', table: 'withdrawals', cols: { id: 'id', studentId: 'student_id', enrollmentId: 'enrollment_id', reason: 'reason', note: 'note', refund: 'refund', date: 'date' }, noExtra: true },
  { key: 'pages', table: 'pages', cols: { id: 'id', slug: 'slug', type: 'type', title: 'title', body: 'body', status: 'status', footer: 'footer', seo: 'seo', updated: 'updated' }, noExtra: true },
];
const SETTING_KEYS = ['perms', 'countries', 'settings', 'methods', 'social', 'footerAbout', 'withdrawReasons'];
const stable = v => JSON.stringify(v, (k, x) => (x && typeof x === 'object' && !Array.isArray(x)) ? Object.keys(x).sort().reduce((o, kk) => (o[kk] = x[kk], o), {}) : x);

function toRow(m, o) {
  const r = {}; const extra = {};
  Object.entries(m.cols).forEach(([f, c]) => { if (o[f] !== undefined) r[c] = o[f] === '' && /_id$|_at$|^at$|date$/.test(c) && c !== 'id' ? null : o[f]; });
  if (!m.noExtra) { Object.keys(o).forEach(f => { if (!(f in m.cols) && !(m.skip || []).includes(f)) extra[f] = o[f]; }); r.extra = extra; }
  if (m.special === 'teachers') r.subject_ids = (o.subjects || []).map(x => x.id);
  if (m.special === 'messages') { const [s, t] = String(o.thread || '').split('|'); r.student_id = s; r.teacher_id = t; }
  return r;
}
function privRow(m, o) {
  if (!m.priv) return null; const p = m.priv; const r = { [p.fk]: o.id }; let any = false;
  Object.entries(p.cols).forEach(([f, c]) => { if (o[f] !== undefined) { r[c] = o[f]; any = true; } });
  if (m.special === 'teachers' && o.subjects && o.subjects.some(x => x.rate !== undefined)) { r.rates = {}; o.subjects.forEach(x => { if (x.rate !== undefined) r.rates[x.id] = x.rate; }); any = true; }
  return any ? r : null;
}
function fromRow(m, r) {
  const o = {}; Object.entries(m.cols).forEach(([f, c]) => { if (r[c] !== undefined) o[f] = r[c] === null ? (['name', 'parent', 'bio', 'note', 'objectives', 'material', 'assignment', 'recording', 'feedback', 'zoom', 'comment'].includes(f) ? '' : null) : r[c]; });
  if (r.extra) Object.assign(o, r.extra);
  ['amount', 'paid', 'refund', 'grade', 'max'].forEach(f => { if (o[f] != null && typeof o[f] === 'string') o[f] = +o[f]; });
  if (o.from && typeof o.from === 'string') o.from = o.from.slice(0, 10); if (o.to && typeof o.to === 'string') o.to = o.to.slice(0, 10);
  return o;
}

/* ---------- load everything this user is allowed to see ---------- */
async function liveLoad() {
  const sb = LIVE.sb; const tables = [...MAP.map(m => m.table), 'student_private', 'teacher_private', 'settings', 'blocked_originals'];
  const res = await Promise.all(tables.map(t => sb.from(t).select('*').limit(t === 'emails' ? 2000 : 20000)));
  const data = {}; tables.forEach((t, i) => { data[t] = res[i].error ? [] : (res[i].data || []); if (res[i].error) console.warn(t, res[i].error.message); });
  const defaults = seed();
  const N = { v: 1 };
  MAP.forEach(m => { N[m.key] = data[m.table].map(r => fromRow(m, r)); });
  const sp = Object.fromEntries(data.student_private.map(r => [r.student_id, r]));
  N.students.forEach(s => { const p = sp[s.id]; if (p) { s.email = p.email || ''; s.phone = p.phone || ''; } });
  const tp = Object.fromEntries(data.teacher_private.map(r => [r.teacher_id, r]));
  N.teachers.forEach(t => { const raw = data.teachers.find(r => r.id === t.id) || {}; const p = tp[t.id];
    t.subjects = (raw.subject_ids || []).map(id => ({ id, rate: p ? +(p.rates?.[id] ?? 0) : undefined }));
    if (p) { t.email = p.email || ''; t.phone = p.phone || ''; t.rateLocked = !!p.rate_locked; } t.addedStudents = t.addedStudents || []; });
  const bo = Object.fromEntries(data.blocked_originals.map(r => [r.message_id, r.original]));
  N.messages.forEach(m => { if (bo[m.id]) m.original = bo[m.id]; });
  const st = Object.fromEntries(data.settings.map(r => [r.key, r.value]));
  SETTING_KEYS.forEach(k => { N[k] = st[k] !== undefined ? st[k] : defaults[k]; });
  N.perms = Object.assign(defaultPerms(), N.perms || {});
  D = N; takeSnapshot();
}
function takeSnapshot() {
  const S = {};
  MAP.forEach(m => {
    S[m.table] = new Map((D[m.key] || []).map(o => [o.id, stable(toRow(m, o))]));
    if (m.priv) S[m.priv.table] = new Map((D[m.key] || []).map(o => { const p = privRow(m, o); return p ? [o.id, stable(p)] : null; }).filter(Boolean));
  });
  S.settings = new Map(SETTING_KEYS.map(k => [k, stable(D[k])]));
  LIVE.snap = S;
}

/* ---------- write changes back ---------- */
function liveSave() { clearTimeout(LIVE.timer); LIVE.timer = setTimeout(liveSync, 350); }
async function liveSync() {
  if (LIVE.syncing) { LIVE.pending = true; return; }
  LIVE.syncing = true; const sb = LIVE.sb; const errors = [];
  const run = async (p, what) => { const { error } = await p; if (error) { console.error(what, error); errors.push(error.message || String(error)); } };
  try {
    for (const m of MAP) {
      const prev = LIVE.snap[m.table] || new Map(); const seen = new Set();
      for (const o of (D[m.key] || [])) {
        seen.add(o.id); const row = toRow(m, o); const sig = stable(row);
        if (!prev.has(o.id)) { if (!m.updateOnly) await run(sb.from(m.table).insert(row), 'insert ' + m.table); }
        else if (prev.get(o.id) !== sig) {
          const old = JSON.parse(prev.get(o.id)); const ch = {};
          Object.keys(row).forEach(c => { if (c !== 'id' && stable(row[c]) !== stable(old[c])) ch[c] = row[c]; });
          (m.ro || []).forEach(c => delete ch[c]); if (m.updateOnly) Object.keys(ch).forEach(c => { if (!m.updateOnly.includes(c)) delete ch[c]; });
          if (Object.keys(ch).length) await run(sb.from(m.table).update(ch).eq('id', o.id), 'update ' + m.table);
        }
        if (m.priv) {
          const pr = privRow(m, o); const pp = LIVE.snap[m.priv.table] || new Map();
          if (pr) { if (!pp.has(o.id)) await run(sb.from(m.priv.table).insert(pr), 'insert ' + m.priv.table);
            else if (pp.get(o.id) !== stable(pr)) { const old = JSON.parse(pp.get(o.id)); const ch = {}; Object.keys(pr).forEach(c => { if (c !== m.priv.fk && stable(pr[c]) !== stable(old[c])) ch[c] = pr[c]; }); if (Object.keys(ch).length) await run(sb.from(m.priv.table).update(ch).eq(m.priv.fk, o.id), 'update ' + m.priv.table); } }
        }
      }
      if (!m.updateOnly) for (const id of prev.keys()) if (!seen.has(id)) await run(sb.from(m.table).delete().eq('id', id), 'delete ' + m.table);
    }
    for (const k of SETTING_KEYS) if (LIVE.snap.settings?.get(k) !== stable(D[k])) await run(sb.from('settings').update({ value: D[k] }).eq('key', k), 'settings ' + k);
  } catch (e) { errors.push(e.message || String(e)); }
  LIVE.syncing = false;
  if (errors.length) { toast(liveErr(errors[0]), 'bad'); await liveReload(); }
  else takeSnapshot();
  if (LIVE.pending) { LIVE.pending = false; liveSync(); }
}
function liveErr(msg) {
  const m = String(msg || '');
  const T = [['sessions_no_teacher_overlap', L('الميعاد ده بيتعارض مع ميعاد تاني عند المدرس', 'This time overlaps another of the teacher’s times')], ['STUDENT_OVERLAP', L('الطالب عنده حصة تانية في نفس الوقت', 'The student has another session at this time')],
    ['NO_BALANCE', L('مفيش رصيد حصص في المادة دي – اشترك في باقة الأول', 'No sessions left in this subject – buy a package first')], ['SLOT_TAKEN', L('الميعاد ده اتحجز – اختار ميعاد تاني', 'This time was just taken – pick another')],
    ['SLOT_TOO_SOON', L('الحجز لازم يكون قبل الحصة بربع ساعة على الأقل', 'Book at least 15 minutes ahead')], ['EMAIL_NOT_CONFIRMED', L('أكّد بريدك الإلكتروني الأول', 'Please confirm your email first')],
    ['ACCOUNT_SUSPENDED', L('الحساب موقوف – تواصل مع الإدارة', 'Account suspended – contact admin')], ['METHOD_DISABLED', L('طريقة الدفع دي متوقفة حالياً', 'This payment method is disabled')],
    ['PERMISSION', L('مش مسموح بالصلاحيات الحالية', 'Not allowed with current permissions')], ['row-level security', L('مش مسموح بالصلاحيات الحالية', 'Not allowed with current permissions')], ['permission denied', L('مش مسموح بالصلاحيات الحالية', 'Not allowed with current permissions')],
    ['Invalid login credentials', L('البريد أو كلمة المرور غير صحيحة', 'Wrong email or password')], ['Email not confirmed', L('لازم تأكد بريدك الإلكتروني الأول – افتح الرسالة اللي وصلتك', 'Please confirm your email first – check your inbox')],
    ['User already registered', L('البريد ده مسجّل بالفعل – سجّل دخول', 'This email is already registered – log in')], ['Password should be', L('كلمة المرور 6 أحرف على الأقل', 'Password must be at least 6 characters')],
    ['rate limit', L('محاولات كتير – استنى شوية وجرّب تاني', 'Too many attempts – wait a bit and retry')], ['Failed to fetch', L('مفيش اتصال بالإنترنت أو السيرفر', 'No connection to the server')], ['duplicate key', L('البيانات دي موجودة بالفعل', 'This already exists')]];
  const f = T.find(([k]) => m.toLowerCase().includes(k.toLowerCase())); return f ? f[1] : L('حصل خطأ: ', 'Error: ') + m;
}
async function liveReload() { try { await liveLoad(); } catch (e) { console.error(e); } softRender(); }
function softRender() {
  const a = document.activeElement; const id = a && a.id; const v = a && 'value' in a ? a.value : null; const s = a && a.selectionStart;
  if ($('#ov')) return; render();
  if (id) { const n = document.getElementById(id); if (n) { if (v != null) n.value = v; n.focus(); try { n.setSelectionRange(s, s); } catch (e) {} } }
}

/* ---------- boot ---------- */
function portalForRole(r) { return r === 'student' ? 'student' : r === 'teacher' ? 'teacher' : 'admin'; }
async function liveBoot() {
  LIVE.sb = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY, { auth: { flowType: 'pkce', detectSessionInUrl: true, persistSession: true, autoRefreshToken: true } });
  const url = new URL(location.href);
  if (url.searchParams.get('error_description')) LIVE.bootMsg = decodeURIComponent(url.searchParams.get('error_description'));
  const { data: { session } } = await LIVE.sb.auth.getSession();
  if (url.searchParams.has('code') || url.searchParams.has('error')) { history.replaceState(null, '', location.pathname + location.hash); if (!session && !LIVE.bootMsg) LIVE.bootMsg = L('تم تأكيد بريدك ✓ سجّل دخول دلوقتي', 'Email confirmed ✓ please log in'); }
  LIVE.sb.auth.onAuthStateChange((ev, s) => {
    if (ev === 'PASSWORD_RECOVERY') setTimeout(liveNewPasswordModal, 300);
    if (ev === 'SIGNED_OUT') { LIVE.profile = null; APP.sessions = {}; render(); }
  });
  await loadPublic();
  if (session) await afterSignIn(); else { LIVE.ready = true; render(); }
  if (LIVE.bootMsg) setTimeout(() => toast(LIVE.bootMsg, 'ok'), 400);
}
async function loadPublic() {
  const sb = LIVE.sb; const [st, pg, sj] = await Promise.all([sb.from('settings').select('*'), sb.from('pages').select('*'), sb.from('subjects').select('*')]);
  const defaults = seed(); const map = Object.fromEntries((st.data || []).map(r => [r.key, r.value]));
  D = { v: 1, subjects: (sj.data || []).map(r => fromRow(MAP.find(m => m.key === 'subjects'), r)), teachers: [], students: [], staff: [], sessions: [], enrollments: [], homework: [], evals: [], certs: [], ratings: [], messages: [], emails: [], payouts: [], expenses: [], withdrawals: [],
    pages: (pg.data || []).map(r => fromRow(MAP.find(m => m.key === 'pages'), r)) };
  SETTING_KEYS.forEach(k => { D[k] = map[k] !== undefined ? map[k] : defaults[k]; });
}
async function afterSignIn() {
  const sb = LIVE.sb; const { data: { user } } = await sb.auth.getUser(); if (!user) { LIVE.ready = true; return render(); }
  let prof = null; for (let i = 0; i < 4 && !prof; i++) { const r = await sb.from('profiles').select('*').eq('id', user.id).maybeSingle(); prof = r.data; if (!prof) await new Promise(r => setTimeout(r, 600)); }
  if (!prof) { toast(L('الحساب لسه بيتجهز – جرّب تاني بعد لحظات', 'Account is being prepared – retry in a moment'), 'bad'); LIVE.ready = true; return render(); }
  LIVE.profile = prof; LIVE.user = user;
  await liveLoad();
  APP.sessions = { [portalForRole(prof.role)]: prof.ref_id };
  if (prof.role !== 'student' && prof.role !== 'teacher') APP.adminRole = prof.role;
  LIVE.ready = true;
  const want = portalForRole(prof.role);
  if (APP.portal !== want && !APP.publicPage) { APP.portal = want; location.hash = want === 'student' ? '' : want; }
  APP.view = want === 'admin' ? 'overview' : 'home';
  render(); liveRealtime();
  const me = currentUser();
  if (prof.role === 'student' && me && (!me.phone || !me.name)) setTimeout(liveCompleteProfile, 300);
  if (prof.role === 'teacher' && me && me.active === false) { toast(L('حساب المدرس موقوف – تواصل مع الإدارة', 'Teacher account suspended – contact admin'), 'bad'); }
}
function liveRealtime() {
  if (LIVE.channel) LIVE.sb.removeChannel(LIVE.channel);
  let t = null; const bump = () => { clearTimeout(t); t = setTimeout(() => { if (!LIVE.syncing) liveReload(); }, 700); };
  LIVE.channel = LIVE.sb.channel('nexium-live')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'messages' }, bump)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'sessions' }, bump)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'enrollments' }, bump).subscribe();
}

/* ---------- replace demo actions with server actions ---------- */
if (LIVE.on) {
  save = liveSave;
  load = () => { D = seed(); D.students = []; D.teachers = []; D.staff = []; D.sessions = []; D.enrollments = []; };
  resetDemo = () => toast(L('غير متاح في النسخة الحقيقية', 'Not available in live mode'), 'bad');
  refreshEmailStatus = () => {};

  logout = async function () { await LIVE.sb.auth.signOut(); LIVE.profile = null; APP.sessions = {}; APP.view = 'home'; await loadPublic(); render(); };

  A_login = async function () {
    const email = val('l_email'), password = val('l_pass'); if (!email || !password) { AUTH.err = L('اكتب البريد وكلمة المرور', 'Enter email and password'); return render(); }
    AUTH.err = ''; const { error } = await LIVE.sb.auth.signInWithPassword({ email, password });
    if (error) { AUTH.err = liveErr(error.message); if (/not confirmed/i.test(error.message)) AUTH.err += ` <button class="btn link" onclick="liveResend('${esc(email)}')">${L('إعادة إرسال رسالة التأكيد', 'Resend confirmation')}</button>`; return render(); }
    await afterSignIn();
  };
  A_register = async function () {
    const f = { parent: val('r_parent'), name: val('r_name'), email: val('r_email'), phone: val('r_phone'), country: val('r_country'), stage: val('r_stage'), grade: val('r_grade'), pass: val('r_pass') };
    if (!f.parent || !f.name || !f.email || !f.phone || !f.pass) AUTH.err = L('كل الحقول المعلّمة بـ * مطلوبة', 'All * fields are required');
    else if (f.phone.replace(/\D/g, '').length < 8) AUTH.err = L('رقم الموبايل غير صحيح', 'Invalid mobile number');
    else if (f.pass.length < 6) AUTH.err = L('كلمة المرور 6 أحرف على الأقل', 'Password must be 6+ characters');
    if (AUTH.err) return render();
    const { data, error } = await LIVE.sb.auth.signUp({ email: f.email, password: f.pass, options: { emailRedirectTo: location.origin + location.pathname, data: { parent: f.parent, name: f.name, phone: f.phone, country: f.country, stage: f.stage, grade: f.grade } } });
    if (error) { AUTH.err = liveErr(error.message); return render(); }
    if (data.session) return afterSignIn();
    AUTH.mode = 'login'; AUTH.err = '';
    render();
    modal(L('افتح بريدك الإلكتروني 📩', 'Check your email 📩'), `<p>${L('بعتنا رسالة تأكيد على', 'We sent a confirmation link to')} <b class="num">${esc(f.email)}</b>.</p><p class="muted">${L('اضغط على الرابط اللي في الرسالة، وبعدين ارجع سجّل دخول. لو مش لاقيها شوف الـ Spam.', 'Click the link in the email, then come back and log in. Check Spam if you can’t find it.')}</p>`, `<button class="btn" onclick="closeModal()">${L('تمام', 'OK')}</button>`);
  };
  A_social = async function (p) {
    if (p === 'yahoo') return toast(L('الدخول بياهو هيتضاف قريباً – استخدم البريد وكلمة المرور', 'Yahoo sign-in coming soon – use email & password'), 'bad');
    const { error } = await LIVE.sb.auth.signInWithOAuth({ provider: p, options: { redirectTo: location.origin + location.pathname } });
    if (error) toast(liveErr(error.message), 'bad');
  };
  A_demoLogin = () => {};

  S_resendConfirm = function () { liveResend(currentUser()?.email); };
  S_confirmEmail = function () { toast(L('افتح رسالة التأكيد في بريدك واضغط على الرابط', 'Open the confirmation email and click the link'), ''); };

  S_confirmBooking = async function () {
    if (!SB.slot) return;
    const { data, error } = await LIVE.sb.rpc('book_slot', { p_slot: SB.slot, p_subject: SB.subject });
    if (error) return toast(liveErr(error.message), 'bad');
    await liveLoad(); closeModal(); const s = D.sessions.find(x => x.id === SB.slot) || fromRow(MAP.find(m => m.key === 'sessions'), data);
    modal(L('تم الحجز ✓', 'Booked ✓'), `<div style="text-align:center"><div style="font-size:48px">🎉</div><h3>${esc(subjName(subjById(s.subjectId)))} · ${esc(tName(tchById(s.teacherId)))}</h3><p class="num" style="font-size:16px;font-weight:700;color:var(--navy)">${fmtDT(s.start)}</p>
      <div class="notice gold" style="text-align:start">${icon('mail')} ${L('هيوصلك إيميل على', 'An email will be sent to')} <b class="num">${esc(currentUser().email)}</b> ${L('فيه لينك الزوم قبل الحصة بـ 10 دقايق.', 'with the Zoom link 10 minutes before the session.')}</div></div>`,
      `<button class="btn" onclick="closeModal();go('schedule')">${L('عرض جدولي', 'View my schedule')}</button>`);
  };
  S_pay = async function () {
    const c = window.__ck; if (!c.fileObj) return toast(L('ارفع صورة الإيصال الأول', 'Please upload the receipt'), 'bad');
    toast(L('جاري رفع الإيصال…', 'Uploading receipt…'));
    const path = await liveUpload('receipts', c.fileObj); if (!path) return;
    const { error } = await LIVE.sb.rpc('request_package', { p_subject: c.sid, p_sessions: c.n, p_method: c.method, p_receipt: path });
    if (error) return toast(liveErr(error.message), 'bad');
    closeModal(); await liveLoad(); toast(L('تم إرسال طلب الدفع – هنبلغك بالإيميل أول ما يتأكد', 'Payment submitted – we’ll email you once approved'), 'ok'); go('payments');
  };
  S_submitHW = async function (sid) {
    const u = currentUser(); if (!window.__hwfObj) return toast(L('اختار ملف الحل', 'Choose a file'), 'bad');
    const note = val('hw_note'); if (contactViolation(note)) return toast(L('غير مسموح بكتابة بيانات تواصل', 'Contact details not allowed'), 'bad');
    toast(L('جاري الرفع…', 'Uploading…')); const path = await liveUpload('homework', window.__hwfObj); if (!path) return;
    D.homework.push({ id: uid('h'), sessionId: sid, studentId: u.id, file: path, note, at: new Date().toISOString(), grade: null, max: 10, feedback: '' });
    window.__hwf = window.__hwfObj = null; save(); toast(L('تم رفع الحل ✓', 'Answer uploaded ✓'), 'ok'); render();
  };
  sendChat = async function (me) {
    const txt = val('chat_in'); if (!txt || !CHAT_SEL) return; const [s, t] = CHAT_SEL.split('|');
    const v = contactViolation(txt); if (v) toast(L('غير مسموح بمشاركة ', 'Sharing is not allowed: ') + v, 'bad');
    const inp = $('#chat_in'); if (inp) inp.value = '';
    const { error } = await LIVE.sb.from('messages').insert({ id: uid('m'), thread: CHAT_SEL, student_id: s, teacher_id: t, sender: me, text: txt, extra: {} });
    if (error) return toast(liveErr(error.message), 'bad');
    await liveLoad(); render(); setTimeout(() => { const m = $('#msgs'); if (m) m.scrollTop = m.scrollHeight; $('#chat_in')?.focus(); }, 0);
  };
  T_doAssign = async function () {
    const { error } = await LIVE.sb.rpc('assign_slot', { p_slot: val('as_slot'), p_student: val('as_stu'), p_subject: val('as_sub') });
    if (error) return toast(liveErr(error.message), 'bad');
    closeModal(); await liveLoad(); toast(L('تمت الإضافة وجدولة إيميل التذكير', 'Assigned – reminder email scheduled'), 'ok'); render();
  };
}

/* ---------- helpers used in live mode ---------- */
async function liveResend(email) {
  if (!email) return; const { error } = await LIVE.sb.auth.resend({ type: 'signup', email, options: { emailRedirectTo: location.origin + location.pathname } });
  toast(error ? liveErr(error.message) : L('تم إرسال رسالة التأكيد مرة أخرى', 'Confirmation email resent'), error ? 'bad' : 'ok');
}
async function liveUpload(bucket, file) {
  if (file.size > 20 * 1024 * 1024) { toast(L('الملف أكبر من 20 ميجا', 'File is larger than 20 MB'), 'bad'); return null; }
  const safe = file.name.replace(/[^\w.\-]+/g, '_').slice(-80); const path = `${LIVE.user.id}/${Date.now()}_${safe}`;
  const { error } = await LIVE.sb.storage.from(bucket).upload(path, file, { upsert: false });
  if (error) { toast(liveErr(error.message), 'bad'); return null; } return path;
}
async function liveOpenFile(bucket, path) {
  const { data, error } = await LIVE.sb.storage.from(bucket).createSignedUrl(path, 600);
  if (error) return toast(liveErr(error.message), 'bad');
  modal(L('الملف جاهز', 'File ready'), `<p class="muted" style="margin-top:0">${esc(path.split('/').pop())}</p><a class="btn gold" href="${esc(data.signedUrl)}" target="_blank" rel="noopener">${icon('eye')} ${L('فتح الملف', 'Open file')}</a><div class="tiny muted" style="margin-top:8px">${L('الرابط صالح لمدة 10 دقايق', 'Link valid for 10 minutes')}</div>`);
}
function fileLabel(path, bucket) {
  if (!path) return '—'; const name = String(path).split('/').pop().replace(/^\d+_/, '');
  return LIVE.on && String(path).includes('/') ? `<button class="btn link" onclick="liveOpenFile('${bucket}','${esc(path)}')">📎 ${esc(name)}</button>` : `📎 ${esc(name)}`;
}
function liveForgot() {
  modal(L('نسيت كلمة المرور', 'Forgot password'), `<div class="field"><label>${L('البريد الإلكتروني', 'Email')}</label><input class="input" id="fp_e" dir="ltr" value="${esc(val('l_email'))}"></div>`,
    `<button class="btn gold" onclick="liveSendReset()">${L('إرسال رابط تغيير كلمة المرور', 'Send reset link')}</button>`);
}
async function liveSendReset() {
  const email = val('fp_e'); if (!email) return; const { error } = await LIVE.sb.auth.resetPasswordForEmail(email, { redirectTo: location.origin + location.pathname + (APP.portal === 'student' ? '' : '#' + APP.portal) });
  closeModal(); toast(error ? liveErr(error.message) : L('لو البريد مسجّل هيوصلك رابط تغيير كلمة المرور', 'If registered, you’ll receive a reset link'), error ? 'bad' : 'ok');
}
function liveNewPasswordModal() {
  modal(L('اختار كلمة مرور جديدة', 'Choose a new password'), `<div class="field"><label>${L('كلمة المرور الجديدة', 'New password')}</label><input class="input" type="password" id="np_p" dir="ltr"></div>`,
    `<button class="btn gold" onclick="liveSetPassword()">${L('حفظ', 'Save')}</button>`);
}
async function liveSetPassword() {
  const p = val('np_p'); if (p.length < 6) return toast(L('6 أحرف على الأقل', '6+ characters'), 'bad');
  const { error } = await LIVE.sb.auth.updateUser({ password: p }); if (error) return toast(liveErr(error.message), 'bad');
  closeModal(); toast(L('تم تغيير كلمة المرور ✓', 'Password changed ✓'), 'ok'); await afterSignIn();
}
function liveActivate() {
  const who = APP.portal === 'teacher' ? L('المدرس', 'teacher') : L('الإدارة', 'admin');
  modal(L('تفعيل الحساب لأول مرة', 'First-time activation'), `<p class="muted" style="margin-top:0">${L('استخدم نفس البريد اللي الإدارة سجّلته لك كـ', 'Use the same email the admin registered for you as')} ${who}.</p>
    <div class="field"><label>${L('البريد الإلكتروني', 'Email')}</label><input class="input" id="ac_e" dir="ltr"></div><div class="field"><label>${L('اختار كلمة مرور', 'Choose a password')}</label><input class="input" type="password" id="ac_p" dir="ltr"></div>`,
    `<button class="btn gold" onclick="liveDoActivate()">${L('تفعيل', 'Activate')}</button>`);
}
async function liveDoActivate() {
  const email = val('ac_e'), password = val('ac_p'); if (!email || password.length < 6) return toast(L('اكتب البريد وكلمة مرور 6 أحرف على الأقل', 'Enter email and a 6+ character password'), 'bad');
  const { data: role } = await LIVE.sb.rpc('check_invite', { p_email: email });
  const okRole = APP.portal === 'teacher' ? role === 'teacher' : ['supervisor', 'principal', 'ceo'].includes(role);
  if (!okRole) return toast(L('البريد ده مش مسجّل عندنا – تواصل مع الإدارة', 'This email is not registered – contact the admin'), 'bad');
  const { data, error } = await LIVE.sb.auth.signUp({ email, password, options: { emailRedirectTo: location.origin + location.pathname + '#' + APP.portal } });
  if (error) return toast(liveErr(error.message), 'bad');
  closeModal(); if (data.session) return afterSignIn();
  modal(L('افتح بريدك الإلكتروني 📩', 'Check your email 📩'), `<p>${L('بعتنا رسالة تأكيد على', 'We sent a confirmation link to')} <b class="num">${esc(email)}</b>. ${L('اضغط على الرابط وبعدين سجّل دخول.', 'Click it, then log in.')}</p>`);
}
function liveCompleteProfile() {
  const u = currentUser(); if (!u) return;
  modal(L('أكمل بياناتك', 'Complete your profile'), `<p class="muted" style="margin-top:0">${L('محتاجين البيانات دي مرة واحدة بس. رقم الموبايل إجباري.', 'We need this once. A mobile number is required.')}</p>
    <div class="form-grid"><div class="field"><label class="req">${L('اسم ولي الأمر', 'Parent name')}</label><input class="input" id="cp_p" value="${esc(u.parent)}"></div><div class="field"><label class="req">${L('اسم الطالب', 'Student name')}</label><input class="input" id="cp_n" value="${esc(u.name)}"></div>
    <div class="field"><label class="req">${L('رقم الموبايل', 'Mobile')}</label><input class="input" id="cp_ph" dir="ltr" value="${esc(u.phone || '')}"></div><div class="field"><label>${L('الدولة', 'Country')}</label><select class="input" id="cp_c">${D.countries.map(c => `<option value="${c.code}" ${c.code === (u.country || VISITOR_COUNTRY) ? 'selected' : ''}>${c.flag} ${L(c.ar, c.en)}</option>`).join('')}</select></div>
    <div class="field" style="grid-column:1/-1"><label>${L('الصف', 'Grade')}</label><select class="input" id="cp_g">${STAGES.filter(s => s.id !== 'summer').map(s => `<optgroup label="${L(s.ar, s.en)}">${s.grades.map(g => `<option value="${s.id}:${g}" ${u.grade === g ? 'selected' : ''}>${gradeName(g)}</option>`).join('')}</optgroup>`).join('')}</select></div></div>`,
    `<button class="btn gold" onclick="liveSaveProfile()">${L('حفظ', 'Save')}</button>`);
}
function liveSaveProfile() {
  const u = currentUser(); const ph = val('cp_ph'); if (!val('cp_p') || !val('cp_n') || ph.replace(/\D/g, '').length < 8) return toast(L('أكمل البيانات ورقم موبايل صحيح', 'Fill all fields with a valid mobile'), 'bad');
  const [st, g] = val('cp_g').split(':'); Object.assign(u, { parent: val('cp_p'), name: val('cp_n'), phone: ph, country: val('cp_c'), stage: st, grade: g }); save(); closeModal(); render(); toast(L('تم الحفظ', 'Saved'), 'ok');
}

/* ---------- visitor country from IP (both modes; silently falls back to the time zone) ---------- */
async function detectCountry() {
  const tries = ['https://api.country.is/', 'https://ipapi.co/json/'];
  for (const u of tries) {
    try { const ctl = new AbortController(); const t = setTimeout(() => ctl.abort(), 2500); const r = await fetch(u, { signal: ctl.signal }); clearTimeout(t);
      if (!r.ok) continue; const j = await r.json(); const code = (j.country || j.country_code || '').toUpperCase();
      if (code) { VISITOR_COUNTRY = (D?.countries || COUNTRIES_SEED).some(c => c.code === code) ? code : 'US'; return true; } } catch (e) {}
  }
  return false;
}
