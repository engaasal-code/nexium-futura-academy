/* ================= STUDENT / PARENT PORTAL ================= */
const SB = { stage: null, grade: null, subject: null, teacher: null, date: null, slot: null, filterDate: '' };
const SP = { stage: null, subject: null };
const SCAL = { y: new Date().getFullYear(), m: new Date().getMonth() };
const SC = { open: null };
let CHAT_SEL = null;

function studentShell(u) {
  const myS = D.sessions.filter(s => s.studentId === u.id);
  const up = myS.filter(s => s.status === 'booked').length;
  const unreadMsg = D.messages.filter(m => m.thread.startsWith(u.id + '|') && m.from !== u.id && !m.blocked && !m.readS).length;
  const kids = myKids(u); const alerts = kids.reduce((n, k) => n + kidAlerts(k).filter(a => a.k !== 'info').length, 0);
  const recN = D.sessions.filter(s => s.studentId === u.id && safeUrl(s.recording)).length;
  const items = [
    { grp: L('ولي الأمر', 'Parent') },
    { v: 'family', i: 'users', t: L('أولادي', 'My children'), b: alerts || '' },
    { grp: esc(u.name) },
    { v: 'home', i: 'home', t: L('الرئيسية', 'Home') },
    { v: 'book', i: 'calPlus', t: L('احجز حصة', 'Book a session') },
    { v: 'schedule', i: 'cal', t: L('جدولي', 'My schedule'), b: up || '' },
    { v: 'courses', i: 'book', t: L('حصصي وموادي', 'My courses & history') },
    { v: 'prices', i: 'layers', t: L('المواد والأسعار', 'Subjects & prices') },
    { v: 'recordings', i: 'video', t: L('تسجيلات حصصي', 'My recordings'), b: recN || '' },
    { v: 'report', i: 'chart', t: L('تقرير الأداء والشهادات', 'Performance & certificates') },
    { v: 'chat', i: 'chat', t: L('الرسائل مع المدرسين', 'Messages with teachers'), b: unreadMsg || '' },
    { v: 'payments', i: 'wallet', t: L('مدفوعاتي', 'My transactions') },
    { v: 'settings', i: 'gear', t: L('الإعدادات', 'Settings') },
  ];
  const views = { home: S_home, book: S_book, schedule: S_schedule, courses: S_courses, prices: S_prices, report: S_report, chat: S_chat, payments: S_payments, settings: S_settings, session: S_session, family: S_family, recordings: S_recordings };
  const body = (views[APP.view] || S_home)(u);
  const band = !u.confirmed ? `<div class="band">${icon('mail')} ${L('أكّد بريدك الإلكتروني', 'Confirm your email')} <b class="num">${esc(u.email)}</b> ${L('عشان توصلك لينكات الحصص', 'to receive session links')} <button class="btn sm" onclick="S_resendConfirm()">${L('إعادة الإرسال', 'Resend')}</button> <button class="btn sm ghost" style="background:#fff" onclick="S_confirmEmail()">${L('محاكاة: فتح رسالة التأكيد', 'Demo: open confirmation email')}</button></div>` : '';
  return `${band}${headerHTML(u)}<div class="cta-band" onclick="go('book')">${icon('calPlus')} ${L('احجز حصتك الجاية', 'Book your next session')} <b>←</b></div>
    <div class="shell">${sideHTML(items, `<b>${esc(u.name)}</b>${stageName(u.stage)} · ${gradeName(u.grade)}${kids.length > 1 ? `<div class="kid-switch">${kids.map(k => `<button class="${k.id === u.id ? 'on' : ''}" onclick="S_switchKid('${k.id}')">${esc(String(k.name).split(' ')[0])}</button>`).join('')}</div>` : ''}`)}<main class="main">${kids.length > 1 && APP.view !== 'family' ? `<div class="kid-bar">${icon('users')} ${L('بتتابع دلوقتي:', 'Now viewing:')} <b>${esc(u.name)}</b><span class="sp" style="flex:1"></span>${kids.filter(k => k.id !== u.id).map(k => `<button class="btn sm ghost" onclick="S_switchKid('${k.id}')">${L('انتقل لـ', 'Switch to')} ${esc(k.name)}</button>`).join('')}</div>` : ''}${body}</main></div>${footerHTML()}${waBtn()}`;
}
function S_resendConfirm() { const u = currentUser(); D.emails.push({ id: uid('em'), to: u.email, type: 'confirm', subject: 'أكّد بريدك الإلكتروني – NEXIUM FUTURA ACADEMY', body: 'اضغط على الرابط لتأكيد حسابك.', at: new Date().toISOString(), status: 'sent' }); save(); toast(L('تم إرسال رسالة التأكيد مرة أخرى', 'Confirmation email resent'), 'ok'); }
function S_confirmEmail() { const u = currentUser(); u.confirmed = true; save(); render(); toast(L('تم تأكيد البريد الإلكتروني ✓', 'Email confirmed ✓'), 'ok'); }

function sessCard(s, who = 'student') {
  const t = tchById(s.teacherId), sub = subjById(s.subjectId), st = stuById(s.studentId);
  const soon = s.status === 'booked' && new Date(s.start).getTime() - Date.now() < 15 * MIN && sEnd(s) > Date.now();
  return `<div class="sess"><div class="date"><b class="num">${dayNum(s.start)}</b><span>${monShort(s.start)}</span></div>
    <div class="info"><h4>${esc(subjName(sub))} ${statusPill(s.status)}</h4>
      <div class="meta"><span>${icon('clock')} ${fmtTime(s.start)} – ${fmtTime(new Date(sEnd(s)).toISOString())}</span>
      ${who === 'student' ? `<span>${icon('user')} ${esc(tName(t))}</span>` : `<span>${icon('user')} ${esc(st ? st.name : '—')}</span>`}
      ${s.status === 'booked' ? `<span class="countdown">${relTime(s.start)}</span>` : ''}</div></div>
    ${s.status === 'booked' ? `<a class="btn ${soon ? 'gold' : 'ghost'} sm" href="${esc(safeUrl(s.zoom) || '#')}" target="_blank" rel="noopener noreferrer">${icon('video')} ${L('دخول الحصة', 'Join')}</a>` : ''}
    ${who === 'student' && s.status !== 'open' ? `<button class="btn ghost sm" onclick="go('session',{id:'${s.id}'})">${L('التفاصيل', 'Details')}</button>` : ''}</div>`;
}

/* ---------- home ---------- */
function S_home(u) {
  const myS = D.sessions.filter(s => s.studentId === u.id);
  const c = st => myS.filter(s => s.status === st).length;
  const upcoming = myS.filter(s => s.status === 'booked' && sEnd(s) > Date.now()).sort((a, b) => a.start.localeCompare(b.start));
  const enr = D.enrollments.filter(e => e.studentId === u.id && e.status !== 'withdrawn');
  const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
  return `<div class="page-h"><div><div class="crumbs">${L('الرئيسية', 'Home')}</div><h1>${L('أهلاً', 'Welcome')} ${esc(u.parent.split(' ')[0])} 👋</h1><p>${L('دي متابعة', 'Here is')} ${esc(u.name)} ${L('في كل المواد', 'across all subjects')}</p></div><button class="btn gold" onclick="go('book')">${icon('calPlus')} ${L('احجز حصة', 'Book a session')}</button></div>
  <div class="grid g4">
    <div class="stat"><div class="ic ok">${icon('check')}</div><div><div class="v num">${c('done')}</div><div class="l">${L('حصص تمت', 'Done sessions')}</div></div></div>
    <div class="stat"><div class="ic navy">${icon('cal')}</div><div><div class="v num">${c('booked')}</div><div class="l">${L('حصص مجدولة', 'Scheduled')}</div></div></div>
    <div class="stat"><div class="ic bad">${icon('ban')}</div><div><div class="v num">${c('absent')}</div><div class="l">${L('غياب', 'Absent')}</div></div></div>
    <div class="stat"><div class="ic gold">${icon('x')}</div><div><div class="v num">${c('cancelled')}</div><div class="l">${L('ملغاة', 'Cancelled')}</div></div></div>
  </div>
  <div class="grid g-main sec">
    <div class="card"><div class="card-h"><div><h2>${L('الحصص القادمة', 'Upcoming sessions')}</h2><div class="small muted">${L('المواعيد بتوقيت', 'Times shown in')} ${esc(tz)}</div></div><button class="btn sm ghost" onclick="go('schedule')">${L('الجدول كامل', 'Full schedule')}</button></div>
      ${upcoming.length ? upcoming.slice(0, 5).map(s => sessCard(s)).join('') : emptyBox(L('مفيش حصص قادمة – احجز حصتك الجاية', 'No upcoming sessions – book your next one'))}
      ${upcoming.length ? `<div class="notice gold" style="margin-top:12px">${icon('mail')} ${L('هيوصلك إيميل على', 'An email will be sent to')} <b class="num">${esc(u.email)}</b> ${L('فيه لينك الحصة قبل ميعادها بـ 10 دقايق.', 'with the session link 10 minutes before it starts.')}</div>` : ''}
    </div>
    <div class="card"><div class="card-h"><h2>${L('موادي النشطة', 'Active subjects')}</h2><button class="btn sm ghost" onclick="go('prices')">${icon('plus')} ${L('مادة جديدة', 'Add subject')}</button></div>
      ${enr.length ? enr.map(e => { const us = enrollUsage(e); const sub = subjById(e.subjectId); return `<div class="metric"><div class="row"><b>${esc(sub.icon)} ${esc(subjName(sub))}</b><span class="small muted"><span class="num">${us.remaining}</span> ${L('حصة متبقية من', 'left of')} <span class="num">${e.sessions}</span> ${e.status === 'pending' ? statusPill('pending') : ''}</span></div><div class="bar gold"><i style="width:${(us.used / e.sessions) * 100}%"></i></div></div>`; }).join('') : emptyBox(L('لسه مفيش مواد', 'No subjects yet'), 'book')}
    </div>
  </div>`;
}

/* ---------- booking ---------- */
function S_book(u) {
  if (!SB.stage) { SB.stage = u.stage; SB.grade = u.grade; }
  const subs = D.subjects.filter(s => s.stage === SB.stage && s.visible);
  const sub = subjById(SB.subject);
  let teachers = sub ? D.teachers.filter(t => t.active && t.subjects.some(x => x.id === sub.id)) : [];
  if (SB.filterDate) teachers = teachers.filter(t => freeSlots(t.id, u.id).some(s => ymd(s.start) === SB.filterDate));
  const st = STAGES.find(s => s.id === SB.stage);
  return `<div class="page-h"><div><div class="crumbs">${L('الرئيسية › احجز حصة', 'Home › Book a session')}</div><h1>${L('احجز حصة', 'Book a session')}</h1><p>${L('اختار المرحلة ثم المادة ثم المدرس، وبعدين ميعاد من المواعيد المتاحة عنده', 'Pick stage, subject and teacher, then one of the teacher’s free times')}</p></div></div>
  <div class="stages">${STAGES.map(s => `<div class="stage ${SB.stage === s.id ? 'on' : ''}" onclick="SB.stage='${s.id}';SB.grade='${s.grades[0] || ''}';SB.subject=null;render()"><span class="e">${s.e}</span>${L(s.ar, s.en)}<small>${s.grades.length ? s.grades[0] + ' – ' + s.grades[s.grades.length - 1] : L('كل الأعمار', 'All ages')}</small></div>`).join('')}</div>
  ${st.grades.length ? `<div class="row" style="margin-bottom:14px"><span class="small muted">${L('الصف:', 'Grade:')}</span>${st.grades.map(g => `<button class="btn sm ${SB.grade === g ? '' : 'ghost'}" onclick="SB.grade='${g}';render()">${gradeName(g)}</button>`).join('')}</div>` : ''}
  <h3 style="margin-bottom:10px">${L('المواد', 'Subjects')}</h3>
  <div class="subj-grid">${subs.map((s, i) => `<div class="subj ${SB.subject === s.id ? 'on' : ''} ${safeImg(s.image) ? 'has-img' : ''}" style="${subjBg(s, i, ['#0B2463', '#122F7A', '#1F3F8F', '#A67812', '#C99A26', '#06173F'])}" onclick="SB.subject='${s.id}';SB.filterDate='';render();setTimeout(()=>document.getElementById('tlist')?.scrollIntoView({behavior:'smooth'}),50)"><span class="si">${esc(s.icon)}</span><div><b>${esc(subjName(s))}</b><small>${D.teachers.filter(t => t.active && t.subjects.some(x => x.id === s.id)).length} ${L('مدرس', 'teachers')}</small></div></div>`).join('')}</div>
  <div id="tlist" class="sec">${sub ? `
    <div class="grid" style="grid-template-columns:260px 1fr;align-items:start" id="bookgrid">
      <div class="card" style="position:sticky;top:84px"><h3 style="margin-bottom:10px">${L('بحث بالتاريخ', 'Search by date')}</h3>
        <div class="field"><label>${L('التاريخ', 'Date')}</label><input type="date" class="input" value="${SB.filterDate}" min="${ymd(new Date())}" onchange="SB.filterDate=this.value;render()"></div>
        <button class="btn link" onclick="SB.filterDate='';render()">${L('مسح البحث', 'Clear search')}</button>
        <hr class="sep"><div class="small muted">${L('بيظهر بس المدرسين اللي عندهم مواعيد فاضية. المواعيد المحجوزة بتختفي تلقائياً.', 'Only teachers with free times appear. Booked times are hidden automatically.')}</div></div>
      <div><h2 style="margin-bottom:12px">${L('مدرسين', 'Teachers for')} ${esc(subjName(sub))}</h2>
      ${teachers.length ? teachers.map(t => teacherCard(t, sub, u)).join('') : `<div class="card">${emptyBox(L('مفيش مدرسين متاحين للمادة دي في التاريخ ده', 'No teachers available for this subject on this date'), 'users')}</div>`}</div>
    </div><style>@media(max-width:860px){#bookgrid{grid-template-columns:1fr!important}#bookgrid>.card{position:static!important}}</style>` : `<div class="card">${emptyBox(L('اختار مادة عشان تشوف المدرسين', 'Pick a subject to see teachers'), 'book')}</div>`}</div>`;
}
function teacherCard(t, sub, u) {
  const R = ratingOf(t.id), rating = R.v, nR = R.n;
  const studentsN = new Set(D.sessions.filter(s => s.teacherId === t.id && s.studentId).map(s => s.studentId)).size;
  const doneN = D.sessions.filter(s => s.teacherId === t.id && s.status === 'done').length;
  const free = freeSlots(t.id, u.id);
  return `<div class="tcard">${avatarHTML(t, 'xl')}
    <div class="body"><div class="row between"><div><h3>${esc(tName(t))} ${t.badge === 'top' ? `<span class="pill gold">${L('الأعلى تقييماً', 'Top rated')}</span>` : t.badge === 'rising' ? `<span class="pill info">${L('موهبة صاعدة', 'Rising talent')}</span>` : ''}</h3>
      <div class="row small" style="gap:14px;margin-top:3px">${stars(rating)} <span class="num">${rating ? rating.toFixed(1) : '—'}</span> <span class="muted">(${nR} ${L('تقييم', 'reviews')})</span><span><b class="num">${studentsN}</b> ${L('طالب', 'students')}</span><span><b class="num">${doneN}</b> ${L('حصة', 'sessions')}</span></div></div>
      ${safeUrl(t.youtube) ? `<a class="yt" href="${esc(safeUrl(t.youtube))}" target="_blank" rel="noopener noreferrer">${bicon('youtube', 18)} ${L('فيديو تعريفي', 'Intro video')}</a>` : ''}</div>
      <p style="margin:8px 0" class="muted">${esc(LANG === 'ar' ? t.bio : t.bioEn)}</p>
      <div class="small" style="margin-bottom:6px"><b>${L('بيدرّس:', 'Teaches:')}</b></div>
      <div class="chips">${t.subjects.slice(0, 6).map(x => { const s = subjById(x.id); return s ? `<span class="pill ${x.id === sub.id ? 'gold' : 'navy'}">${esc(subjName(s))} · ${stageName(s.stage)}</span>` : ''; }).join('')}</div>
      <div class="row between" style="margin-top:12px"><span class="small muted">${L('الكاميرا متاحة:', 'Camera available:')} <b>${t.camera ? L('نعم', 'Yes') : L('لا', 'No')}</b> · <b class="num">${free.length}</b> ${L('ميعاد متاح', 'free times')}</span>
      <div class="row"><button class="btn ghost sm" onclick="S_teacherProfile('${t.id}')">${L('الملف الشخصي', 'Profile')}</button><button class="btn sm gold" ${free.length ? '' : 'disabled'} onclick="S_openBooking('${t.id}','${sub.id}')">${icon('calPlus')} ${L('احجز', 'Book')}</button></div></div>
    </div></div>`;
}
function S_teacherProfile(tid) {
  const t = tchById(tid); const rs = D.ratings.filter(r => r.teacherId === tid); const R = ratingOf(tid);
  modal(esc(tName(t)), `<div class="row" style="gap:16px;align-items:flex-start">${avatarHTML(t, 'xl')}<div style="flex:1"><p style="margin-top:0">${esc(LANG === 'ar' ? t.bio : (t.bioEn || t.bio))}</p>
    ${safeUrl(t.youtube) ? `<a class="btn ghost sm" href="${esc(safeUrl(t.youtube))}" target="_blank" rel="noopener noreferrer">${bicon('youtube', 16)} ${L('شاهد الفيديو التعريفي على يوتيوب', 'Watch intro video on YouTube')}</a>` : ''}</div></div>
    <hr class="sep"><h4 style="margin-bottom:8px">${L('آراء أولياء الأمور', 'Parent reviews')} ${stars(R.v)} <span class="small num">${R.v ? R.v.toFixed(1) : '—'}</span> <span class="small muted">(${R.n})</span></h4>
    ${rs.length ? rs.map(r => `<div style="padding:8px 0;border-bottom:1px solid var(--line)">${stars(r.stars)} <span class="small muted">${esc(stuById(r.studentId)?.parent || '')}</span>${r.comment ? `<div class="small">${esc(r.comment)}</div>` : ''}</div>`).join('') : `<div class="muted small">${L('لا توجد تقييمات بعد', 'No reviews yet')}</div>`}`);
}
function S_openBooking(tid, sid) {
  const u = currentUser();
  if (!u.confirmed) return modal(L('أكّد بريدك الأول', 'Confirm your email first'), `<p>${L('لازم تأكيد البريد الإلكتروني قبل الحجز عشان يوصلك لينك الحصة.', 'Please confirm your email before booking so you receive the session link.')}</p>`, `<button class="btn" onclick="closeModal();S_confirmEmail()">${L('محاكاة: تأكيد البريد', 'Demo: confirm email')}</button>`);
  const enr = activeEnrollment(u.id, sid);
  if (!enr) {
    const pend = D.enrollments.find(e => e.studentId === u.id && e.subjectId === sid && e.status === 'pending');
    const exp = D.enrollments.find(e => e.studentId === u.id && e.subjectId === sid && ['paid', 'partial'].includes(e.status) && pkgState(e).st === 'expired');
    if (exp && !pend) return modal(L('صلاحية الباقة انتهت', 'Package expired'), `<p>${L('باقة المادة دي انتهت صلاحيتها يوم', 'This subject’s package expired on')} <b class="num">${exp.to}</b> ${L('وكان باقي فيها', 'with')} <b class="num">${pkgState(exp).remaining}</b> ${L('حصة. جدّد الباقة أو كلّم الإدارة.', 'sessions left. Renew or contact the admin.')}</p>`, `<button class="btn ghost" onclick="closeModal()">${L('إلغاء', 'Cancel')}</button><button class="btn gold" onclick="closeModal();S_renew('${exp.id}')">${L('جدّد الباقة', 'Renew')}</button>`);
    return modal(L('محتاج باقة للمادة دي', 'You need a package'), pend ? `<div class="notice info">${L('عندك باقة بانتظار تأكيد الدفع من الإدارة. أول ما تتأكد تقدر تحجز.', 'You have a package waiting for payment approval. You can book once it’s approved.')}</div>` : `<p>${L('مفيش رصيد حصص في المادة دي. اختار باقة أو احجز حصة تجريبية.', 'No session balance for this subject. Choose a package or a trial session.')}</p>`,
      pend ? '' : `<button class="btn ghost" onclick="closeModal()">${L('إلغاء', 'Cancel')}</button><button class="btn gold" onclick="closeModal();SP.stage='${subjById(sid).stage}';SP.subject='${sid}';go('prices')">${L('اختار باقة', 'Choose a package')}</button>`);
  }
  SB.teacher = tid; SB.subject = sid; SB.slot = null;
  const free = freeSlots(tid, u.id); const first = free[0];
  SB.date = SB.filterDate || (first ? ymd(first.start) : null);
  SB.calY = first ? new Date(first.start).getFullYear() : new Date().getFullYear(); SB.calM = first ? new Date(first.start).getMonth() : new Date().getMonth();
  S_renderBooking();
}
function S_renderBooking() {
  const u = currentUser(); const t = tchById(SB.teacher); const sub = subjById(SB.subject);
  const free = freeSlots(SB.teacher, u.id); const byDay = {}; free.forEach(s => (byDay[ymd(s.start)] = byDay[ymd(s.start)] || []).push(s));
  const y = SB.calY, m = SB.calM; const first = new Date(y, m, 1); const days = new Date(y, m + 1, 0).getDate();
  const names = LANG === 'ar' ? ['ح', 'ن', 'ث', 'ر', 'خ', 'ج', 'س'] : ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
  let g = names.map(n => `<div class="dn">${n}</div>`).join('') + '<div></div>'.repeat(first.getDay());
  for (let d = 1; d <= days; d++) { const k = ymd(new Date(y, m, d)); const av = byDay[k]; g += `<div class="d ${av ? 'av' : ''} ${SB.date === k ? 'sel' : ''} ${k === ymd(new Date()) ? 'today' : ''}" ${av ? `onclick="SB.date='${k}';SB.slot=null;S_renderBooking()"` : ''}><span class="num">${d}</span>${av ? `<i class="num">${av.length}</i>` : ''}</div>`; }
  const slots = (byDay[SB.date] || []);
  const enr = activeEnrollment(u.id, SB.subject); const us = enr ? enrollUsage(enr) : null;
  modal(`${L('حجز حصة', 'Book')} · ${esc(subjName(sub))}`, `<div class="row" style="margin-bottom:14px">${avatarHTML(t)}<div><b>${esc(tName(t))}</b><div class="small muted">${L('رصيدك:', 'Balance:')} <span class="num">${us ? us.remaining : 0}</span> ${L('حصة', 'sessions')}</div></div></div>
    <div class="grid g2" style="gap:20px"><div class="cal"><div class="cal-h"><button class="btn sm ghost" onclick="SB.calM--;if(SB.calM<0){SB.calM=11;SB.calY--};S_renderBooking()">‹</button><b>${first.toLocaleDateString(LANG === 'ar' ? 'ar-EG' : 'en-US', { month: 'long', year: 'numeric' })}</b><button class="btn sm ghost" onclick="SB.calM++;if(SB.calM>11){SB.calM=0;SB.calY++};S_renderBooking()">›</button></div><div class="cal-g">${g}</div>
      <div class="tiny muted" style="margin-top:8px">${L('الأيام الرمادي يا إما المدرس مشغول فيها أو مفيهاش مواعيد. الرقم الذهبي = عدد المواعيد الفاضية.', 'Grey days are busy or have no free times. Gold number = free times.')}</div></div>
    <div><h4 style="margin-bottom:10px">${SB.date ? fmtDate(SB.date + 'T12:00:00') : L('اختار يوم', 'Pick a day')}</h4>
      ${slots.length ? `<div class="slots">${slots.map(s => `<button class="slot ${SB.slot === s.id ? 'sel' : ''}" onclick="SB.slot='${s.id}';S_renderBooking()"><span class="num">${fmtTime(s.start)}</span></button>`).join('')}</div>` : `<div class="muted small">${L('لا توجد مواعيد متاحة في هذا اليوم', 'No free times on this day')}</div>`}
      <div class="notice info" style="margin-top:16px">${icon('shield')} ${L('النظام بيعرض المواعيد الفاضية عند المدرس بس، ومش بيعرض أي ميعاد بيتعارض مع حصة تانية عندك.', 'Only the teacher’s free times appear, and none that clash with your other sessions.')}</div></div></div>`,
    `<button class="btn ghost" onclick="closeModal()">${L('إلغاء', 'Cancel')}</button><button class="btn gold" ${SB.slot ? '' : 'disabled'} onclick="S_confirmBooking()">${L('تأكيد الحجز', 'Confirm booking')}</button>`, { wide: true });
}
function S_confirmBooking() {
  const u = currentUser(); const s = D.sessions.find(x => x.id === SB.slot);
  if (!s || s.status !== 'open') return toast(L('الميعاد ده اتحجز لسه – اختار ميعاد تاني', 'This time was just taken – pick another'), 'bad');
  if (studentConflict(u.id, new Date(s.start).getTime(), s.dur)) return toast(L('عندك حصة تانية في نفس الوقت', 'You have another session at this time'), 'bad');
  const enr = activeEnrollment(u.id, SB.subject); if (!enr) return toast(L('مفيش رصيد', 'No balance'), 'bad');
  Object.assign(s, { status: 'booked', studentId: u.id, subjectId: SB.subject, enrollmentId: enr.id, objectives: '', material: '', assignment: '', recording: '' });
  queueReminder(D, s); save(); closeModal();
  modal(L('تم الحجز ✓', 'Booked ✓'), `<div style="text-align:center"><div style="font-size:48px">🎉</div><h3>${esc(subjName(subjById(s.subjectId)))} · ${esc(tName(tchById(s.teacherId)))}</h3><p class="num" style="font-size:16px;font-weight:700;color:var(--navy)">${fmtDT(s.start)}</p>
    <div class="notice gold" style="text-align:start">${icon('mail')} ${L('هيوصلك إيميل على', 'An email will be sent to')} <b class="num">${esc(u.email)}</b> ${L('فيه لينك الزوم قبل الحصة بـ 10 دقايق.', 'with the Zoom link 10 minutes before the session.')}</div></div>`,
    `<button class="btn" onclick="closeModal();go('schedule')">${L('عرض جدولي', 'View my schedule')}</button>`);
}

/* ---------- prices ---------- */
function S_prices(u) {
  if (!SP.stage) SP.stage = u.stage;
  const C = displayCountry(u);
  const subs = D.subjects.filter(s => s.stage === SP.stage && s.visible);
  const sub = subjById(SP.subject && subjById(SP.subject)?.stage === SP.stage ? SP.subject : null);
  return `<div class="page-h"><div><div class="crumbs">${L('الرئيسية › المواد والأسعار', 'Home › Subjects & prices')}</div><h1>${L('المواد والأسعار', 'Subjects & prices')}</h1><p>${L('المواد حسب المرحلة الدراسية، بالإضافة لكورسات الصيف', 'Subjects by school stage, plus summer courses')}</p></div>
    ${pricesOn('students') ? `<span class="pill navy">${icon('globe')} ${L('الأسعار معروضة بـ', 'Prices in')} ${C.flag} ${C.cur}</span>` : ''}</div>
  <div class="stages">${STAGES.map(s => `<div class="stage ${SP.stage === s.id ? 'on' : ''}" onclick="SP.stage='${s.id}';SP.subject=null;render()"><span class="e">${s.e}</span>${L(s.ar, s.en)}<small>${D.subjects.filter(x => x.stage === s.id && x.visible).length} ${L('مادة', 'subjects')}</small></div>`).join('')}</div>
  ${SP.stage === 'summer' ? `<div class="notice gold" style="margin-bottom:14px">${icon('sun')} ${L('كورسات الصيف متاحة لكل الأعمار – استغل الإجازة في مهارة جديدة أو تقوية مادة.', 'Summer courses are open to all ages – learn a new skill or strengthen a subject.')}</div>` : ''}
  <div class="subj-grid">${subs.map((s, i) => { const p = pkgPrice(s, PACKAGES[1], C); return `<div class="subj ${sub && sub.id === s.id ? 'on' : ''} ${safeImg(s.image) ? 'has-img' : ''}" style="${subjBg(s, i, ['#0B2463', '#A67812', '#122F7A', '#1F9D6B', '#06173F', '#C2410C'])}" onclick="SP.subject='${s.id}';render();setTimeout(()=>document.getElementById('pk')?.scrollIntoView({behavior:'smooth'}),50)"><span class="si">${esc(s.icon)}</span><div><b>${esc(subjName(s))}</b><small>${pricesOn('students') ? `${L('من', 'from')} ${money(p.per, C)} / ${L('حصة', 'session')}` : stageName(s.stage)}</small></div></div>`; }).join('')}</div>
  <div id="pk" class="sec">${sub ? `<div class="card"><div class="card-h"><div><h2>${esc(sub.icon)} ${esc(subjName(sub))} — ${stageName(sub.stage)}</h2><div class="small muted">${L('مدة الحصة', 'Session length')} <span class="num">${D.settings.sessionMin}</span> ${L('دقيقة · صلاحية الباقة', 'min · package valid')} <span class="num">${PKG_DAYS()}</span> ${L('يوم من تأكيد الدفع', 'days from payment approval')}</div></div></div>
    <div class="pkgs">${PACKAGES.map(pk => { const p = pkgPrice(sub, pk, C); const show = pricesOn('students'); return `<div class="pkg ${pk.best ? 'best' : ''}">${pk.best ? `<span class="tag">${L('الأكثر طلباً', 'Most popular')}</span>` : ''}<b>${L(pk.ar, pk.en)}</b>${show ? `<div class="pr">${money(p.total, C)}</div><div class="per">${money(p.per, C)} / ${L('حصة', 'session')}</div>` : `<div class="per" style="margin:10px 0 4px"><span class="num">${pk.n}</span> ${L('حصة', 'sessions')} · ${L('السعر عند التواصل', 'Price on request')}</div>`}
      ${show ? `<button class="btn ${pk.best ? 'gold' : ''} block sm" style="margin-top:12px" onclick="S_checkout('${sub.id}',${pk.n})">${pk.n === 1 ? L('ابدأ تجربة', 'Start trial') : L('اشترك', 'Subscribe')}</button>` : `<a class="btn ${pk.best ? 'gold' : ''} block sm" style="margin-top:12px" target="_blank" rel="noopener" href="https://wa.me/${waNum()}?text=${encodeURIComponent(L('عايز أعرف سعر ', 'Price please: ') + L(pk.ar, pk.en) + ' – ' + subjName(sub) + ' (' + stageName(sub.stage) + ')')}">${bicon('whatsapp', 15)} ${L('اسأل عن السعر', 'Ask for the price')}</a>`}</div>`; }).join('')}</div>
    <ul class="small muted" style="margin:16px 0 0;padding-inline-start:18px"><li>${L('حصص مباشرة أونلاين على زووم مع المدرس', 'Live online Zoom sessions with the teacher')}</li><li>${L('واجبات وتصحيح على المنصة', 'Homework with grading on the platform')}</li><li>${L('تقرير أداء لولي الأمر وشهادة في آخر المستوى', 'Parent report and a level certificate')}</li></ul></div>` : `<div class="card">${emptyBox(L('اختار مادة عشان تشوف الباقات والأسعار', 'Pick a subject to see packages and prices'), 'layers')}</div>`}</div>`;
}
function S_checkout(sid, n) {
  const u = currentUser(); const sub = subjById(sid); const pk = PACKAGES.find(p => p.n === n); const C = displayCountry(u); const p = pkgPrice(sub, pk, C);
  const methods = D.methods.filter(m => m.on);
  window.__ck = { sid, n, amount: p.total, cur: C.cur, method: methods[0]?.id, file: '' };
  modal(L('إتمام الاشتراك', 'Checkout'), `<div class="kv" style="margin-bottom:14px"><dt>${L('المادة', 'Subject')}</dt><dd>${esc(subjName(sub))} · ${stageName(sub.stage)}</dd><dt>${L('الباقة', 'Package')}</dt><dd>${L(pk.ar, pk.en)}</dd><dt>${L('الإجمالي', 'Total')}</dt><dd style="color:var(--navy);font-size:18px">${money(p.total, C)}</dd></div>
    <h4 style="margin-bottom:8px">${L('طريقة الدفع', 'Payment method')}</h4>
    <div class="grid" style="gap:8px">${methods.map((m, i) => `<label class="row" style="border:1px solid var(--line);border-radius:10px;padding:10px;cursor:pointer;align-items:flex-start"><input type="radio" name="pm" ${i === 0 ? 'checked' : ''} onchange="window.__ck.method='${m.id}'"><div><b>${L(m.ar, m.en)}</b><div class="small muted">${esc(m.details)}</div></div></label>`).join('') || `<div class="notice warn">${L('لا توجد طرق دفع مفعّلة حالياً', 'No payment methods enabled')}</div>`}</div>
    <label class="upload" style="margin-top:14px">${icon('upload')}<div id="rcpt">${L('ارفع صورة إيصال التحويل', 'Upload the transfer receipt')}</div><input type="file" accept="image/*,.pdf" onchange="window.__ck.fileObj=this.files[0]||null;window.__ck.file=this.files[0]?.name||'';document.getElementById('rcpt').textContent=window.__ck.file"></label>
    <div class="small muted" style="margin-top:10px">${L('الباقة بتتفعّل بعد ما الإدارة تراجع التحويل وتأكده.', 'The package activates after admin reviews and approves the transfer.')}</div>`,
    `<button class="btn ghost" onclick="closeModal()">${L('إلغاء', 'Cancel')}</button><button class="btn gold" ${methods.length ? '' : 'disabled'} onclick="S_pay()">${L('إرسال طلب الدفع', 'Submit payment')}</button>`);
}
function S_pay() {
  const u = currentUser(); const c = window.__ck;
  if (!c.file) return toast(L('ارفع صورة الإيصال الأول', 'Please upload the receipt'), 'bad');
  const today = new Date();
  D.enrollments.push({ id: uid('e'), studentId: u.id, subjectId: c.sid, sessions: c.n, amount: c.amount, currency: c.cur, method: c.method, paid: 0, status: 'pending', created: today.toISOString(), from: ymd(today), to: ymd(new Date(today.getTime() + PKG_DAYS() * DAY)), receipt: c.file });
  save(); closeModal(); toast(L('تم إرسال طلب الدفع – هنبلغك أول ما يتأكد', 'Payment submitted – we’ll notify you when approved'), 'ok'); go('payments');
}

/* ---------- schedule ---------- */
function S_schedule(u) {
  const ev = {}; D.sessions.filter(s => s.studentId === u.id).forEach(s => { (ev[ymd(s.start)] = ev[ymd(s.start)] || []).push({ cls: s.status, t: fmtTime(s.start) + ' ' + subjName(subjById(s.subjectId)), on: `go('session',{id:'${s.id}'})` }); });
  return `<div class="page-h"><div><div class="crumbs">${L('الرئيسية › جدولي', 'Home › My schedule')}</div><h1>${L('جدولي', 'My schedule')}</h1></div><div class="chips">${['booked', 'done', 'absent', 'cancelled'].map(s => statusPill(s)).join('')}</div></div>
    <div class="card">${calNav('SCAL', L('المواعيد بتوقيت ', 'Times in ') + Intl.DateTimeFormat().resolvedOptions().timeZone)}${monthCal(SCAL.y, SCAL.m, ev)}</div>`;
}

/* ---------- courses / history ---------- */
function S_courses(u) {
  const enr = D.enrollments.filter(e => e.studentId === u.id).sort((a, b) => b.created.localeCompare(a.created));
  return `<div class="page-h"><div><div class="crumbs">${L('الرئيسية › حصصي', 'Home › My courses')}</div><h1>${L('حصصي وموادي', 'My courses & history')}</h1><p>${L('المواد اللي أخدها الطالب، الحضور والغياب مع كل مدرس، وعدد الحصص المتبقية', 'Subjects taken, attendance with each teacher, and sessions remaining')}</p></div></div>
  <div class="tbl-wrap"><table class="tbl"><thead><tr><th>#</th><th>${L('المادة', 'Subject')}</th><th>${L('المدرس', 'Teacher')}</th><th>${L('تمت', 'Done')}</th><th>${L('غياب', 'Absent')}</th><th>${L('متبقي', 'Left')}</th><th>${L('تنتهي', 'Ends')}</th><th>${L('الحالة', 'Status')}</th><th></th></tr></thead><tbody>
  ${enr.map(e => { const us = enrollUsage(e); const sub = subjById(e.subjectId); const tids = [...new Set(D.sessions.filter(s => s.enrollmentId === e.id).map(s => s.teacherId))]; const open = SC.open === e.id;
    return `<tr><td class="num">#${e.id.slice(1, 6).toUpperCase()}</td><td><b>${esc(sub.icon)} ${esc(subjName(sub))}</b><div class="tiny muted">${stageName(sub.stage)} · ${L('باقة', 'Pkg')} <span class="num">${e.sessions}</span></div></td><td>${tids.map(t => esc(tName(tchById(t)))).join('، ') || '—'}</td><td class="num">${us.done}</td><td class="num">${us.absent}</td><td><b class="num">${us.remaining}</b></td><td>${pkgEnd(e)}</td><td>${statusPill(e.status)}</td>
      <td><button class="btn sm ghost" onclick="SC.open=SC.open==='${e.id}'?null:'${e.id}';render()">${open ? '▲' : '▼'}</button></td></tr>
      ${open ? `<tr><td colspan="9" style="background:#FAFBFE">${S_enrollDetail(e, us, tids)}</td></tr>` : ''}`; }).join('') || `<tr><td colspan="8">${emptyBox(L('لا توجد مواد بعد', 'No courses yet'), 'book')}</td></tr>`}
  </tbody></table></div>`;
}
const pkgEnd = e => { if (!e.to || ['pending', 'withdrawn'].includes(e.status)) return '<span class="muted">—</span>'; const p = pkgState(e); return `<span class="num small">${e.to}</span><div class="tiny ${p.st === 'expired' ? 'neg' : p.days <= 7 ? '' : 'muted'}" ${p.st !== 'expired' && p.days <= 7 ? 'style="color:var(--warn)"' : ''}>${p.st === 'expired' ? L('انتهت', 'Expired') : p.st === 'finished' ? L('خلصت الحصص', 'Used up') : `${L('باقي', '')} <span class="num">${p.days}</span> ${L('يوم', 'days left')}`}</div>`; };
function S_enrollDetail(e, us, tids) {
  const ss = D.sessions.filter(s => s.enrollmentId === e.id).sort((a, b) => b.start.localeCompare(a.start));
  const myR = D.ratings.filter(r => r.studentId === e.studentId);
  return `<div class="grid g4" style="margin:6px 0 14px">${[['done', 'ok', 'check', L('تمت', 'Done')], ['booked', 'navy', 'cal', L('مجدولة', 'Scheduled')], ['absent', 'bad', 'ban', L('غياب', 'Absent')], ['cancelled', 'gold', 'x', L('ملغاة', 'Cancelled')]].map(([k, c, i, l]) => `<div class="stat"><div class="ic ${c}">${icon(i)}</div><div><div class="v num">${us[k]}</div><div class="l">${l}</div></div></div>`).join('')}</div>
    <div class="row" style="margin-bottom:10px;justify-content:flex-end">${tids.map(t => `<button class="btn sm ghost" onclick="CHAT_SEL='${e.studentId}|${t}';go('chat')">${icon('send')} ${L('رسالة لـ', 'Message')} ${esc(tName(tchById(t)))}</button>
      <button class="btn sm ${myR.some(r => r.teacherId === t) ? 'ghost' : 'gold'}" onclick="S_rate('${t}')">${icon('star')} ${myR.some(r => r.teacherId === t) ? L('عدّل التقييم', 'Edit rating') : L('قيّم المدرس', 'Rate teacher')}</button>`).join('')}</div>
    <div class="tbl-wrap"><table class="tbl"><thead><tr><th>#</th><th>${L('التاريخ والوقت', 'Date & time')}</th><th>${L('المدرس', 'Teacher')}</th><th>${L('الحالة', 'Status')}</th><th></th></tr></thead><tbody>
    ${ss.map(s => `<tr><td class="num">#${s.id.slice(2, 7).toUpperCase()}</td><td class="num">${fmtDT(s.start)}</td><td>${esc(tName(tchById(s.teacherId)))}</td><td>${statusPill(s.status)}</td><td><button class="btn sm ghost" onclick="go('session',{id:'${s.id}'})">${icon('file')} ${L('تقرير الحصة', 'Report')}</button></td></tr>`).join('')}</tbody></table></div>`;
}
function S_rate(tid) {
  const u = currentUser(); const ex = D.ratings.find(r => r.teacherId === tid && r.studentId === u.id); window.__rate = ex ? ex.stars : 0;
  const draw = () => `<div class="star-in">${[1, 2, 3, 4, 5].map(i => `<button class="${i <= window.__rate ? 'on' : ''}" onclick="window.__rate=${i};this.parentNode.outerHTML=window.__drawStars()">★</button>`).join('')}</div>`; window.__drawStars = draw;
  modal(L('تقييم ', 'Rate ') + esc(tName(tchById(tid))), `<p class="muted" style="margin-top:0">${L('تقييمك بيساعد الإدارة تحافظ على جودة التعليم', 'Your rating helps us keep quality high')}</p>${draw()}<div class="field" style="margin-top:14px"><label>${L('تعليق (اختياري)', 'Comment (optional)')}</label><textarea class="input" id="rt_c">${esc(ex?.comment || '')}</textarea></div>`,
    `<button class="btn gold" onclick="S_saveRate('${tid}')">${L('حفظ التقييم', 'Save rating')}</button>`);
}
function S_saveRate(tid) {
  const u = currentUser(); if (!window.__rate) return toast(L('اختار عدد النجوم', 'Pick stars'), 'bad');
  const c = val('rt_c'); if (contactViolation(c)) return toast(L('غير مسموح بكتابة بيانات تواصل', 'Contact details not allowed'), 'bad');
  const ex = D.ratings.find(r => r.teacherId === tid && r.studentId === u.id);
  if (ex) Object.assign(ex, { stars: window.__rate, comment: c, at: new Date().toISOString() }); else D.ratings.push({ id: uid('r'), teacherId: tid, studentId: u.id, stars: window.__rate, comment: c, at: new Date().toISOString() });
  save(); closeModal(); toast(L('شكراً على تقييمك', 'Thanks for your rating'), 'ok'); render();
}

/* ---------- session report ---------- */
function S_session(u) {
  const s = D.sessions.find(x => x.id === APP.params.id && x.studentId === u.id); if (!s) return emptyBox('—');
  const list = D.sessions.filter(x => x.studentId === u.id && x.status !== 'open').sort((a, b) => a.start.localeCompare(b.start)); const i = list.indexOf(s);
  const tab = APP.params.tab || 'obj'; const hw = D.homework.find(h => h.sessionId === s.id && h.studentId === u.id);
  const tabs = [['obj', L('أهداف الحصة', 'Objectives')], ['mat', L('مادة الحصة', 'Material')], ['hw', L('الواجب', 'Assignment')], ['rec', L('تسجيل الحصة', 'Recording')]];
  let body = '';
  if (tab === 'obj') body = s.objectives ? `<p>${esc(s.objectives)}</p>` : `<div class="muted">${L('لم يضف المدرس أهدافاً بعد', 'No objectives yet')}</div>`;
  if (tab === 'mat') body = s.material ? `<div class="row">${icon('file')} <b>${esc(s.material)}</b></div>` : `<div class="muted">${L('لا توجد مادة مرفقة', 'No material attached')}</div>`;
  if (tab === 'rec') body = safeUrl(s.recording) ? `<a class="btn ghost" href="${esc(safeUrl(s.recording))}" target="_blank" rel="noopener noreferrer">${icon('video')} ${L('مشاهدة التسجيل', 'Watch recording')}</a>` : `<div class="muted">${L('التسجيل غير متاح بعد', 'Recording not available yet')}</div>`;
  if (tab === 'hw') body = s.assignment ? `<div style="background:var(--bg);border-radius:10px;padding:12px"><b>${L('الواجب:', 'Assignment:')}</b> ${esc(s.assignment)}</div>
    ${hw ? `<div class="notice ${hw.grade != null ? 'ok' : 'info'}" style="margin-top:12px">${icon('check')} <div>${L('تم رفع الحل:', 'Submitted:')} <b>${fileLabel(hw.file, 'homework')}</b> · <span class="num">${fmtDT(hw.at)}</span>${hw.grade != null ? `<div><b>${L('الدرجة:', 'Grade:')} <span class="num">${hw.grade}/${hw.max}</span></b> — ${esc(hw.feedback)}</div>` : `<div>${L('بانتظار التصحيح من المدرس', 'Waiting for teacher to grade')}</div>`}${hwMarked(hw) ? `<button class="btn gold sm" style="margin-top:8px" onclick="S_viewMarked('${hw.id}')">📝 ${L('شوف ورقتك بعد التصحيح', 'See your corrected paper')}</button>` : ''}</div></div>` : `
    <label class="upload" style="margin-top:12px">${icon('upload')}<div id="hwf">${L('ارفع الحل (صورة / PDF / فيديو)', 'Upload answer (image / PDF / video)')}</div><input type="file" onchange="window.__hwfObj=this.files[0]||null;window.__hwf=this.files[0]?.name;document.getElementById('hwf').textContent=window.__hwf"></label>
    <div class="field" style="margin-top:10px"><label>${L('ملاحظة للمدرس', 'Note to teacher')}</label><input class="input" id="hw_note"></div><button class="btn gold" onclick="S_submitHW('${s.id}')">${icon('upload')} ${L('رفع الحل', 'Upload answer')}</button>`}` : `<div class="muted">${L('لا يوجد واجب لهذه الحصة', 'No assignment for this session')}</div>`;
  return `<div class="crumbs">${L('الرئيسية › تقرير الحصة', 'Home › Session report')}</div>
    <div class="card" style="max-width:820px"><div class="row between" style="margin-bottom:14px"><button class="btn ghost sm" ${i > 0 ? `onclick="go('session',{id:'${list[i - 1]?.id}'})"` : 'disabled'}>‹ ${L('السابق', 'Prev')}</button>
      <div style="text-align:center"><h2>${L('تقرير الحصة', 'Session report')} <span class="num">#${s.id.slice(2, 7).toUpperCase()}</span></h2><div class="small muted num">${fmtDT(s.start)} · ${esc(subjName(subjById(s.subjectId)))} · ${esc(tName(tchById(s.teacherId)))}</div><div style="margin-top:4px">${statusPill(s.status)}</div></div>
      <button class="btn gold sm" ${i < list.length - 1 ? `onclick="go('session',{id:'${list[i + 1]?.id}'})"` : 'disabled'}>${L('التالي', 'Next')} ›</button></div>
      <div class="sess-tabs">${tabs.map(([k, l]) => `<button class="${tab === k ? 'on' : ''}" onclick="go('session',{id:'${s.id}',tab:'${k}'})">${l}</button>`).join('')}</div>${body}</div>`;
}
function S_submitHW(sid) {
  const u = currentUser(); if (!window.__hwf) return toast(L('اختار ملف الحل', 'Choose a file'), 'bad');
  const note = val('hw_note'); if (contactViolation(note)) return toast(L('غير مسموح بكتابة بيانات تواصل', 'Contact details not allowed'), 'bad');
  D.homework.push({ id: uid('h'), sessionId: sid, studentId: u.id, file: window.__hwf, note, at: new Date().toISOString(), grade: null, max: 10, feedback: '' }); window.__hwf = null; save(); toast(L('تم رفع الحل ✓', 'Answer uploaded ✓'), 'ok'); render();
}

/* ---------- report ---------- */
function studentEval(stuId, subjectId) {
  const ss = D.sessions.filter(s => s.studentId === stuId && s.subjectId === subjectId && ['done', 'absent'].includes(s.status));
  const att = ss.length ? Math.round(ss.filter(s => s.status === 'done').length / ss.length * 100) : null;
  const ev = D.evals.filter(e => e.studentId === stuId && e.subjectId === subjectId).sort((a, b) => b.at.localeCompare(a.at))[0];
  const hws = D.homework.filter(h => h.studentId === stuId && h.grade != null && D.sessions.find(s => s.id === h.sessionId)?.subjectId === subjectId);
  const hwAvg = hws.length ? Math.round(hws.reduce((a, h) => a + h.grade / h.max, 0) / hws.length * 100) : null;
  const parts = [att, ev?.interaction, ev?.homework ?? hwAvg, ev?.commitment].filter(v => v != null);
  return { att, ev, hwAvg, overall: parts.length ? Math.round(parts.reduce((a, b) => a + b, 0) / parts.length) : null, n: ss.length };
}
const grade = v => v == null ? '—' : v >= 90 ? L('ممتاز', 'Excellent') : v >= 75 ? L('جيد جداً', 'Very good') : v >= 60 ? L('جيد', 'Good') : L('يحتاج متابعة', 'Needs support');
function S_report(u) {
  const subjects = [...new Set(D.sessions.filter(s => s.studentId === u.id && s.subjectId).map(s => s.subjectId))];
  const certs = D.certs.filter(c => c.studentId === u.id);
  return `<div class="page-h"><div><div class="crumbs">${L('ولي الأمر › تقرير الأداء', 'Parent › Performance')}</div><h1>${L('تقرير أداء', 'Performance report:')} ${esc(u.name)}</h1><p>${L('نسبة الحضور، التفاعل، الواجب والالتزام في كل مادة – بيعبّيها المدرس وبتظهر هنا لولي الأمر', 'Attendance, engagement, homework and commitment per subject – filled in by teachers')}</p></div></div>
  ${subjects.map(sid => { const sub = subjById(sid); const r = studentEval(u.id, sid); const t = r.ev ? tchById(r.ev.teacherId) : null;
    const m = (l, v, cls = '') => `<div class="metric"><div class="row"><span>${l}</span><b class="num">${v == null ? '—' : v + '%'}</b></div><div class="bar ${cls}"><i style="width:${v || 0}%"></i></div></div>`;
    return `<div class="card"><div class="card-h"><div><h2>${esc(sub.icon)} ${esc(subjName(sub))}</h2><div class="small muted">${t ? L('المدرس: ', 'Teacher: ') + esc(tName(t)) + ' · ' : ''}<span class="num">${r.n}</span> ${L('حصة', 'sessions')}</div></div>
      <div style="text-align:center"><div class="kpi-big num">${r.overall == null ? '—' : r.overall + '%'}</div><span class="pill ${r.overall >= 75 ? 'ok' : r.overall >= 60 ? 'warn' : 'bad'}">${grade(r.overall)}</span></div></div>
      <div class="grid g2" style="gap:6px 28px">${m(L('نسبة الحضور', 'Attendance'), r.att, 'ok')}${m(L('التفاعل', 'Engagement'), r.ev?.interaction)}${m(L('الواجب', 'Homework'), r.ev?.homework ?? r.hwAvg, 'gold')}${m(L('الالتزام', 'Commitment'), r.ev?.commitment)}</div>
      ${r.ev?.note ? `<div class="notice info">${icon('chat')} <div><b>${L('ملاحظة المدرس:', 'Teacher note:')}</b> ${esc(r.ev.note)}</div></div>` : ''}</div>`; }).join('') || `<div class="card">${emptyBox(L('التقرير هيظهر بعد أول حصة', 'Report appears after the first session'), 'chart')}</div>`}
  <h2 class="sec" style="margin-bottom:12px">${icon('award')} ${L('الشهادات', 'Certificates')}</h2>
  <div class="grid g3">${certs.map(c => `<div class="cert"><div class="seal">🏅</div><div class="tiny muted" style="letter-spacing:2px">NEXIUM FUTURA ACADEMY</div><h3 style="margin:6px 0">${esc(c.title)}</h3><div class="small">${L('تُمنح للطالب', 'Awarded to')}</div><b style="font-size:17px;color:var(--navy)">${esc(u.name)}</b><p class="small" style="margin:6px 0">${esc(c.reason)}</p><div class="tiny muted">${esc(tName(tchById(c.teacherId)))} · <span class="num">${fmtDateShort(c.at)}</span></div></div>`).join('') || `<div class="card">${emptyBox(L('لا توجد شهادات بعد', 'No certificates yet'), 'award')}</div>`}</div>`;
}

/* ---------- chat (shared) ---------- */
function chatView(me, threads, opts = {}) {
  if (!CHAT_SEL || !threads.some(t => t.key === CHAT_SEL)) CHAT_SEL = threads[0]?.key || null;
  const msgs = D.messages.filter(m => m.thread === CHAT_SEL).sort((a, b) => a.at.localeCompare(b.at));
  msgs.forEach(m => { if (m.from !== me) { if (opts.side === 's') m.readS = true; else m.readT = true; } });
  const cur = threads.find(t => t.key === CHAT_SEL);
  return `<div class="chat"><div class="th">${threads.map(t => { const last = D.messages.filter(m => m.thread === t.key && !m.blocked).sort((a, b) => b.at.localeCompare(a.at))[0];
      return `<div class="t ${t.key === CHAT_SEL ? 'on' : ''}" onclick="CHAT_SEL='${t.key}';render()"><span class="av" style="background:${safeColor(t.color)}">${esc(initials(t.name))}</span><div class="x"><div><b>${esc(t.name)}</b></div><div class="small muted">${esc(last ? last.text : t.sub || '')}</div></div></div>`; }).join('') || `<div class="empty small">${L('لا توجد محادثات', 'No conversations')}</div>`}</div>
    <div class="cv">${cur ? `<div class="top"><span class="av" style="background:${safeColor(cur.color)}">${esc(initials(cur.name))}</span><div><b>${esc(cur.name)}</b><div class="small muted">${esc(cur.sub || '')}</div></div></div>
      <div class="chat-note">${icon('shield')} ${L('للحفاظ على الخصوصية، غير مسموح بتبادل أرقام الهواتف أو الإيميلات أو حسابات التواصل. أي رسالة فيها بيانات تواصل بتتحجب تلقائياً وبتوصل للإدارة.', 'For privacy, sharing phone numbers, emails or social accounts is not allowed. Such messages are blocked automatically and reported to admin.')}</div>
      <div class="msgs" id="msgs">${msgs.map(m => m.blocked ? (m.by === me ? `<div class="msg blocked">${icon('ban')} ${L('تم حجب رسالتك لأنها تحتوي على بيانات تواصل', 'Your message was blocked because it contains contact details')}</div>` : '') : `<div class="msg ${m.from === me ? 'me' : ''}">${esc(m.text)}<time class="num">${fmtDT(m.at)}</time></div>`).join('') || `<div class="empty small">${L('ابدأ المحادثة', 'Start the conversation')}</div>`}</div>
      <div class="comp"><input class="input" id="chat_in" placeholder="${L('اكتب رسالتك…', 'Type a message…')}" onkeydown="if(event.key==='Enter')sendChat('${me}')"><button class="btn" onclick="sendChat('${me}')">${icon('send')}</button></div>` : emptyBox(L('اختار محادثة', 'Pick a conversation'), 'chat')}</div></div>`;
}
function sendChat(me) {
  const txt = val('chat_in'); if (!txt || !CHAT_SEL) return;
  const v = contactViolation(txt);
  if (v) { D.messages.push({ id: uid('m'), thread: CHAT_SEL, from: me, by: me, text: '[محجوب]', original: txt, reason: v, at: new Date().toISOString(), blocked: true }); save(); toast(L('غير مسموح بمشاركة ', 'Sharing is not allowed: ') + v, 'bad'); render(); return; }
  D.messages.push({ id: uid('m'), thread: CHAT_SEL, from: me, text: txt, at: new Date().toISOString() }); save(); render();
  setTimeout(() => { const m = $('#msgs'); if (m) m.scrollTop = m.scrollHeight; $('#chat_in')?.focus(); }, 0);
}
function S_chat(u) {
  const tids = [...new Set(D.sessions.filter(s => s.studentId === u.id && s.status !== 'open').map(s => s.teacherId))];
  const threads = tids.map(t => { const T = tchById(t); return { key: u.id + '|' + t, name: tName(T), color: T.color, sub: T.subjects.map(x => subjName(subjById(x.id))).slice(0, 2).join('، ') }; });
  setTimeout(() => { const m = $('#msgs'); if (m) m.scrollTop = m.scrollHeight; }, 0);
  return `<div class="page-h"><div><div class="crumbs">${L('ولي الأمر › الرسائل', 'Parent › Messages')}</div><h1>${L('الرسائل مع المدرسين', 'Messages with teachers')}</h1><p>${L('تقدر تراسل أي مدرس حضر معاه الطالب', 'Message any teacher your child has had sessions with')}</p></div></div>${chatView(u.id, threads, { side: 's' })}`;
}

/* ---------- payments ---------- */
function S_payments(u) {
  const enr = D.enrollments.filter(e => e.studentId === u.id).sort((a, b) => b.created.localeCompare(a.created));
  const cOf = cur => D.countries.find(c => c.cur === cur) || countryBy('SA');
  return `<div class="page-h"><div><div class="crumbs">${L('ولي الأمر › مدفوعاتي', 'Parent › Transactions')}</div><h1>${L('مدفوعاتي', 'My transactions')}</h1><p>${L('كل المدفوعات حسب المادة', 'All payments by subject')}</p></div></div>
  <div class="tbl-wrap"><table class="tbl"><thead><tr><th>${L('التاريخ', 'Date')}</th><th>${L('المادة', 'Subject')}</th><th>${L('الباقة', 'Package')}</th><th>${L('الفترة', 'Period')}</th><th>${L('المبلغ', 'Amount')}</th><th>${L('المدفوع', 'Paid')}</th><th>${L('المتبقي', 'Due')}</th><th>${L('الطريقة', 'Method')}</th><th>${L('الحالة', 'Status')}</th></tr></thead><tbody>
  ${enr.map(e => { const C = cOf(e.currency); const m = D.methods.find(x => x.id === e.method); return `<tr><td class="num">${fmtDateShort(e.created)}</td><td>${esc(subjName(subjById(e.subjectId)))}</td><td class="num">${e.sessions}</td><td class="num small">${e.from} → ${e.to}</td><td>${money(e.amount, C)}</td><td>${money(e.paid, C)}</td><td>${e.amount - e.paid > 0 && e.status !== 'withdrawn' ? `<b class="neg">${money(e.amount - e.paid, C)}</b>` : '—'}</td><td>${m ? L(m.ar, m.en) : '—'}</td><td>${statusPill(e.status)}</td></tr>`; }).join('') || `<tr><td colspan="9">${emptyBox(L('لا توجد مدفوعات', 'No transactions'), 'wallet')}</td></tr>`}</tbody></table></div>`;
}

/* ---------- settings ---------- */
function S_settings(u) {
  u.prefs = u.prefs || { pay: true, pkg: true, ses: true };
  return `<div class="page-h"><div><div class="crumbs">${L('الرئيسية › الإعدادات', 'Home › Settings')}</div><h1>${L('إعدادات الحساب', 'Profile settings')}</h1></div></div>
  <div class="grid g2" style="align-items:start">
  <div class="card"><h3 style="margin-bottom:14px">${L('البيانات العامة', 'General')}</h3>
    <div class="row" style="margin-bottom:14px"><span class="av lg">${esc(initials(u.parent))}</span><div><b>${esc(u.parent)}</b><div class="small muted">${L('ولي أمر', 'Parent of')} ${esc(u.name)}</div></div></div>
    <div class="form-grid"><div class="field"><label>${L('اسم ولي الأمر', 'Parent name')}</label><input class="input" id="st_parent" value="${esc(u.parent)}"></div><div class="field"><label>${L('اسم الطالب', 'Student name')}</label><input class="input" id="st_name" value="${esc(u.name)}"></div>
    <div class="field"><label>${L('البريد', 'Email')} ${u.confirmed ? statusPill('paid').replace(L('مدفوع', 'Paid'), L('مؤكَّد', 'Verified')) : ''}</label><input class="input" value="${esc(u.email)}" dir="ltr" disabled></div><div class="field"><label class="req">${L('رقم الموبايل', 'Mobile')}</label><input class="input" id="st_phone" value="${esc(u.phone || '')}" dir="ltr"></div>
    <div class="field"><label>${L('الدولة', 'Country')}${D.enrollments.some(e => e.studentId === u.id) && IS_LIVE ? ` <span class="lock">${icon('lock')} ${L('بتتغير من الإدارة بعد أول باقة', 'changed by admin after the first package')}</span>` : ''}</label><select class="input" id="st_country" ${D.enrollments.some(e => e.studentId === u.id) && IS_LIVE ? 'disabled' : ''}>${D.countries.map(c => `<option value="${c.code}" ${c.code === u.country ? 'selected' : ''}>${c.flag} ${L(c.ar, c.en)}</option>`).join('')}</select></div>
    <div class="field"><label>${L('الصف', 'Grade')}</label><select class="input" id="st_grade">${STAGES.filter(s => s.id !== 'summer').map(s => `<optgroup label="${L(s.ar, s.en)}">${s.grades.map(g => `<option value="${s.id}:${g}" ${u.grade === g ? 'selected' : ''}>${gradeName(g)}</option>`).join('')}</optgroup>`).join('')}</select></div></div>
    <button class="btn" onclick="S_saveProfile()">${L('حفظ', 'Save')}</button></div>
  <div><div class="card"><h3 style="margin-bottom:10px">${L('تفضيلات الإيميل', 'Email preferences')}</h3>
    ${[['pay', L('إيميلات المدفوعات', 'Payment emails')], ['pkg', L('عروض الباقات', 'Package offers')], ['ses', L('تذكير الحصص (قبل 10 دقايق)', 'Session reminders (10 min before)')]].map(([k, l]) => `<div class="row between" style="padding:7px 0"><span>${l}</span><label class="sw"><input type="checkbox" ${u.prefs[k] ? 'checked' : ''} ${k === 'ses' ? 'disabled' : ''} onchange="currentUser().prefs.${k}=this.checked;save()"><span></span></label></div>`).join('')}
    <div class="tiny muted">${L('تذكير الحصص إجباري عشان يوصل لينك الحصة دايماً.', 'Session reminders are mandatory so the link always arrives.')}</div></div>
  <div class="card"><h3 style="margin-bottom:10px">${L('الأمان', 'Security')}</h3><button class="btn ghost" onclick="changePassword()">${icon('lock')} ${L('تغيير كلمة المرور', 'Change password')}</button></div>
  <div class="card"><h3 style="margin-bottom:10px">${L('الحسابات المرتبطة', 'Linked accounts')}</h3><div class="row">${['google', 'facebook', 'yahoo'].map(p => `<span class="pill ${u.provider === p ? 'ok' : 'gray'}">${bicon(p, 14)} ${p} ${u.provider === p ? '✓' : ''}</span>`).join('')}</div></div></div></div>`;
}
function S_saveProfile() {
  const u = currentUser(); const ph = val('st_phone'); if (ph.replace(/\D/g, '').length < 8) return toast(L('رقم الموبايل إجباري', 'Mobile number is required'), 'bad');
  const [st, g] = val('st_grade').split(':'); Object.assign(u, { parent: val('st_parent'), name: val('st_name'), phone: ph, country: val('st_country'), stage: st, grade: g });
  myKids(u).forEach(k => { if (k !== u) Object.assign(k, { parent: u.parent, phone: ph }); }); SB.stage = null; SP.stage = null; save(); toast(L('تم الحفظ', 'Saved'), 'ok'); render();
}
function S_inbox() {
  const u = currentUser(); const ems = D.emails.filter(e => e.to === u.email).sort((a, b) => b.at.localeCompare(a.at));
  ems.forEach(e => { if (e.status === 'sent') e.read = true; }); save();
  modal(L('صندوق الإيميل', 'Email inbox') + ` · <span class="num small">${esc(u.email)}</span>`, `<div class="notice info" style="margin-bottom:12px">${L('في النسخة الحقيقية دي إيميلات بتتبعت فعلاً على بريدك. هنا بنعرضها عشان تشوف شكلها.', 'In production these are real emails sent to your inbox. Shown here as a preview.')}</div>
    ${ems.slice(0, 15).map(e => `<div class="mail" style="margin-bottom:10px"><div class="mh row between"><b>${esc(e.subject)}</b>${statusPill(e.status)}</div><div class="mb"><div class="tiny muted num" style="margin-bottom:6px">${e.status === 'scheduled' ? L('هيتبعت: ', 'Will send: ') : ''}${fmtDT(e.at)}</div><div style="white-space:pre-line">${esc(e.body)}</div></div></div>`).join('') || emptyBox(L('لا توجد رسائل', 'No emails'), 'mail')}`, '', { wide: true });
  render();
}

// خلفية كارت المادة: صورة المادة لو موجودة، وإلا لون
function subjBg(s, i, pal) { const img = safeImg(s.image); return img ? `background:linear-gradient(180deg,rgba(6,23,63,.05) 30%,rgba(6,23,63,.85)),url('${esc(img).replace(/'/g, '%27')}') center/cover` : `background:${pal[i % pal.length]}`; }

/* =====================================================================
   ولي الأمر: أكتر من طفل في نفس الحساب
   ===================================================================== */
function myKids(u) {
  u = u || currentUser(); if (!u) return [];
  const list = IS_LIVE && LIVE.user ? D.students.filter(s => s.userId === LIVE.user.id) : D.students.filter(s => s.email && u.email && s.email.toLowerCase() === u.email.toLowerCase());
  return (list.length ? list : [u]).slice().sort((a, b) => String(a.joined || '').localeCompare(String(b.joined || '')));
}
function S_switchKid(id) {
  if (!myKids().some(k => k.id === id)) return; APP.sessions.student = id; try { localStorage.setItem('nexium_kid', id); } catch (e) {}
  if (!IS_LIVE) saveSession(); SB.stage = null; SP.stage = null; SB.subject = null; CHAT_SEL = null; go(APP.view === 'family' ? 'home' : APP.view === 'session' ? 'home' : APP.view);
}
// المستوى التعليمي = متوسط التقييم الإجمالي في كل المواد
function kidLevel(k) {
  const subs = [...new Set(D.sessions.filter(s => s.studentId === k.id && s.subjectId).map(s => s.subjectId))];
  const vals = subs.map(sid => studentEval(k.id, sid).overall).filter(v => v != null);
  return vals.length ? Math.round(vals.reduce((a, b) => a + b, 0) / vals.length) : null;
}
function kidAlerts(k) {
  const out = []; const nm = esc(String(k.name).split(' ')[0]);
  D.enrollments.filter(e => e.studentId === k.id && ['paid', 'partial'].includes(e.status)).forEach(e => { const p = pkgState(e); const sub = esc(subjName(subjById(e.subjectId)));
    if (p.st === 'expired') out.push({ k: 'bad', t: L(`باقة ${sub} لـ ${nm} انتهت صلاحيتها وكان باقي فيها ${p.remaining} حصة`, `${nm}’s ${sub} package expired with ${p.remaining} sessions left`), e: e.id });
    else if (p.st === 'expiring') out.push({ k: 'warn', t: p.remaining <= 2 ? L(`باقة ${sub} لـ ${nm} قربت تخلص: باقي ${p.remaining} حصة`, `${nm}’s ${sub} package is almost used: ${p.remaining} left`) : L(`باقة ${sub} لـ ${nm} هتنتهي بعد ${p.days} يوم`, `${nm}’s ${sub} package ends in ${p.days} days`), e: e.id });
    else if (p.st === 'finished' && !D.enrollments.some(x => x.studentId === k.id && x.subjectId === e.subjectId && x !== e && ['pending', 'paid', 'partial'].includes(x.status) && pkgState(x).st !== 'finished')) out.push({ k: 'warn', t: L(`حصص ${sub} لـ ${nm} خلصت – جدّد عشان يكمّل`, `${nm} used all ${sub} sessions – renew to continue`), e: e.id }); });
  const abs = D.sessions.filter(s => s.studentId === k.id && s.status === 'absent' && Date.now() - new Date(s.start).getTime() < 30 * DAY).length;
  if (abs >= 2) out.push({ k: 'warn', t: L(`${nm} غاب ${abs} حصص في آخر 30 يوم`, `${nm} missed ${abs} sessions in the last 30 days`) });
  const lv = kidLevel(k); if (lv != null && lv < 60) out.push({ k: 'bad', t: L(`مستوى ${nm} محتاج متابعة (${lv}%)`, `${nm}’s level needs attention (${lv}%)`) });
  if (D.enrollments.some(e => e.studentId === k.id && e.status === 'pending')) out.push({ k: 'info', t: L(`في دفعة لـ ${nm} بانتظار تأكيد الإدارة`, `A payment for ${nm} is awaiting approval`) });
  return out;
}
function S_family(u) {
  const kids = myKids(u); const C = cOfCur;
  const all = kids.flatMap(k => kidAlerts(k).map(a => ({ ...a, kid: k })));
  const card = k => {
    const ss = D.sessions.filter(s => s.studentId === k.id); const done = ss.filter(s => s.status === 'done').length, abs = ss.filter(s => s.status === 'absent').length;
    const att = done + abs ? Math.round(done / (done + abs) * 100) : null; const lv = kidLevel(k);
    const mStart = new Date(); mStart.setDate(1); mStart.setHours(0, 0, 0, 0); const inM = s => new Date(s.start) >= mStart && new Date(s.start) <= new Date();
    const next = ss.filter(s => s.status === 'booked' && sEnd(s) > Date.now()).sort((a, b) => a.start.localeCompare(b.start))[0];
    const pk = D.enrollments.filter(e => e.studentId === k.id && e.status !== 'withdrawn').sort((a, b) => String(b.created).localeCompare(String(a.created)));
    return `<div class="card kid-card ${k.id === u.id ? 'cur' : ''}"><div class="row between" style="margin-bottom:12px"><div class="row"><span class="av lg" style="background:${['#0B2463', '#A67812', '#1F9D6B', '#7B3FA0', '#C2410C'][kids.indexOf(k) % 5]}">${esc(initials(k.name))}</span><div><h3>${esc(k.name)}</h3><div class="small muted">${stageName(k.stage)} · ${gradeName(k.grade)}</div></div></div>
      <button class="btn sm ${k.id === u.id ? '' : 'ghost'}" onclick="S_switchKid('${k.id}')">${L('افتح حساب', 'Open')} ${esc(String(k.name).split(' ')[0])}</button></div>
      <div class="grid g3 kid-stats"><div><span class="small muted">${L('المستوى التعليمي', 'Level')}</span><b class="num">${lv == null ? '—' : lv + '%'}</b><span class="pill ${lv >= 75 ? 'ok' : lv >= 60 ? 'warn' : lv == null ? 'gray' : 'bad'}">${grade(lv)}</span></div>
        <div><span class="small muted">${L('حضر / غاب', 'Attended / absent')}</span><b class="num">${done} / ${abs}</b><span class="tiny muted">${L('الشهر ده:', 'This month:')} <span class="num">${ss.filter(s => s.status === 'done' && inM(s)).length} / ${ss.filter(s => s.status === 'absent' && inM(s)).length}</span></span></div>
        <div><span class="small muted">${L('نسبة الحضور', 'Attendance')}</span><b class="num">${att == null ? '—' : att + '%'}</b><div class="bar ok"><i style="width:${att || 0}%"></i></div></div></div>
      ${next ? `<div class="small" style="margin:12px 0 4px">${icon('cal')} ${L('الحصة الجاية:', 'Next session:')} <b>${esc(subjName(subjById(next.subjectId)))}</b> · <span class="num">${fmtDT(next.start)}</span></div>` : `<div class="small muted" style="margin:12px 0 4px">${L('مفيش حصص محجوزة', 'No booked sessions')}</div>`}
      <h4 style="margin:14px 0 8px">${L('الباقات', 'Packages')}</h4>
      ${pk.length ? pk.map(e => { const p = pkgState(e); const sub = subjById(e.subjectId); const pill = { active: ['ok', L('سارية', 'Active')], expiring: ['warn', L('قربت تخلص', 'Ending soon')], expired: ['bad', L('انتهت الصلاحية', 'Expired')], finished: ['gray', L('خلصت الحصص', 'Used up')], pending: ['info', L('بانتظار تأكيد الدفع', 'Awaiting approval')] }[p.st] || ['gray', ''];
        return `<div class="pkg-row"><div class="row between"><b>${esc(sub?.icon || '')} ${esc(subjName(sub))}</b><span class="pill ${pill[0]}">${pill[1]}</span></div>
          <div class="bar gold" style="margin:6px 0"><i style="width:${e.sessions ? Math.min(100, p.used / e.sessions * 100) : 0}%"></i></div>
          <div class="row between small"><span>${L('باقي', 'Left')} <b class="num">${p.remaining}</b> ${L('من', 'of')} <span class="num">${e.sessions}</span> ${L('حصة', 'sessions')}</span>${e.to && p.st !== 'pending' ? `<span class="${p.st === 'expired' ? 'neg' : ''}">${p.st === 'expired' ? L('انتهت يوم', 'Ended') : L('تنتهي', 'Ends')} <span class="num">${e.to}</span>${p.days >= 0 ? ` · ${L('باقي', '')} <b class="num">${p.days}</b> ${L('يوم', 'days left')}` : ''}</span>` : ''}</div>
          ${['expiring', 'expired', 'finished'].includes(p.st) ? `<button class="btn sm gold" style="margin-top:8px" onclick="S_renew('${e.id}')">${icon('plus')} ${L('جدّد الباقة', 'Renew package')}</button>` : ''}</div>`; }).join('') : `<div class="small muted">${L('لسه مفيش باقات', 'No packages yet')} · <button class="btn link" onclick="S_switchKid('${k.id}');go('prices')">${L('اختار باقة', 'Choose a package')}</button></div>`}</div>`;
  };
  return `<div class="page-h"><div><div class="crumbs">${L('ولي الأمر', 'Parent')}</div><h1>${L('أولادي', 'My children')}</h1><p>${L('متابعة كل طفل لوحده: المستوى، الحضور والغياب، والباقات والأيام المتبقية', 'Follow each child: level, attendance and packages with days left')}</p></div>
    <button class="btn gold" onclick="S_addChild()">${icon('plus')} ${L('إضافة طفل', 'Add a child')}</button></div>
    ${all.length ? `<div class="card" style="margin-bottom:16px"><h3 style="margin-bottom:10px">${icon('bell')} ${L('تنبيهات', 'Alerts')}</h3>${all.map(a => `<div class="notice ${a.k}" style="margin-bottom:6px">${a.k === 'bad' ? icon('ban') : a.k === 'warn' ? icon('clock') : icon('wallet')} <div style="flex:1">${a.t}</div>${a.e ? `<button class="btn sm ${a.k === 'info' ? 'ghost' : 'gold'}" onclick="S_renew('${a.e}')">${L('جدّد', 'Renew')}</button>` : `<button class="btn sm ghost" onclick="S_switchKid('${a.kid.id}');go('report')">${L('التقرير', 'Report')}</button>`}</div>`).join('')}</div>` : ''}
    <div class="grid g2 kids">${kids.map(card).join('')}</div>`;
}
const cOfCur = cur => D.countries.find(c => c.cur === cur) || countryBy('SA');
function S_renew(eid) {
  const e = D.enrollments.find(x => x.id === eid); if (!e) return; const sub = subjById(e.subjectId);
  if (currentUser()?.id !== e.studentId) S_switchKid(e.studentId);
  SP.stage = sub.stage; SP.subject = sub.id;
  if (pricesOn('students') && PACKAGES.some(p => p.n === e.sessions)) { go('prices'); setTimeout(() => S_checkout(sub.id, e.sessions), 50); } else go('prices');
}
function S_addChild() {
  modal(L('إضافة طفل لحسابك', 'Add a child to your account'), `<p class="small muted" style="margin-top:0">${L('هيتضاف تحت نفس حسابك ونفس بيانات التواصل، وتقدر تحجزله وتتابعه لوحده.', 'Added under the same account and contact details; book and follow them separately.')}</p>
    <div class="field"><label class="req">${L('اسم الطالب', 'Student name')}</label><input class="input" id="ac_n" maxlength="80"></div>
    <div class="field"><label class="req">${L('الصف', 'Grade')}</label><select class="input" id="ac_g">${STAGES.filter(s => s.id !== 'summer').map(s => `<optgroup label="${L(s.ar, s.en)}">${s.grades.map(g => `<option value="${s.id}:${g}">${gradeName(g)}</option>`).join('')}</optgroup>`).join('')}</select></div>`,
    `<button class="btn ghost" onclick="closeModal()">${L('إلغاء', 'Cancel')}</button><button class="btn gold" onclick="S_saveChild()">${L('إضافة', 'Add')}</button>`);
  setTimeout(() => $('#ac_n')?.focus(), 50);
}
async function S_saveChild() {
  const name = val('ac_n'); const [st, g] = val('ac_g').split(':'); if (name.length < 2) return toast(L('اكتب اسم الطالب', 'Enter the student’s name'), 'bad');
  const u = currentUser(); let id;
  if (IS_LIVE) { const { data, error } = await LIVE.sb.rpc('add_child', { p_name: name, p_stage: st, p_grade: g }); if (error) return toast(liveErr(error.message), 'bad'); id = data; await liveLoad(); }
  else { id = uid('s'); D.students.push({ id, name, parent: u.parent, email: u.email, phone: u.phone, country: u.country, stage: st, grade: g, pass: u.pass, confirmed: u.confirmed, provider: u.provider, active: true, joined: new Date().toISOString(), withdrawn: false }); save(); }
  closeModal(); toast(L('تمت إضافة ', 'Added ') + name + ' ✓', 'ok'); APP.view = 'family'; render();
}

/* ---------- تسجيلات الحصص ---------- */
function S_recordings(u) {
  const rec = D.sessions.filter(s => s.studentId === u.id && safeUrl(s.recording)).sort((a, b) => b.start.localeCompare(a.start));
  const subs = [...new Set(rec.map(s => s.subjectId))]; const f = APP.params.sub && subs.includes(APP.params.sub) ? APP.params.sub : 'all';
  const list = rec.filter(s => f === 'all' || s.subjectId === f);
  const missing = D.sessions.filter(s => s.studentId === u.id && s.status === 'done' && !safeUrl(s.recording)).length;
  return `<div class="page-h"><div><div class="crumbs">${L('الطالب › التسجيلات', 'Student › Recordings')}</div><h1>${L('تسجيلات حصصي', 'My recordings')}</h1><p>${L('ارجع لأي حصة فاتت وذاكرها تاني', 'Go back to any past session and review it')}</p></div></div>
    ${subs.length > 1 ? `<div class="tabs"><button class="${f === 'all' ? 'on' : ''}" onclick="go('recordings')">${L('الكل', 'All')} <span class="num">(${rec.length})</span></button>${subs.map(id => `<button class="${f === id ? 'on' : ''}" onclick="go('recordings',{sub:'${id}'})">${esc(subjName(subjById(id)))} <span class="num">(${rec.filter(s => s.subjectId === id).length})</span></button>`).join('')}</div>` : ''}
    ${list.length ? `<div class="rec-grid">${list.map(s => `<div class="rec"><a class="rec-play" href="${esc(safeUrl(s.recording))}" target="_blank" rel="noopener noreferrer" aria-label="${L('تشغيل', 'Play')}">${icon('video')}</a><div class="rec-tx"><b>${esc(subjName(subjById(s.subjectId)))}</b><div class="small muted"><span class="num">${fmtDT(s.start)}</span> · ${esc(tName(tchById(s.teacherId)))}</div>${s.objectives ? `<div class="small" style="margin-top:4px">${esc(s.objectives)}</div>` : ''}
      <div class="row" style="gap:6px;margin-top:8px"><a class="btn sm gold" href="${esc(safeUrl(s.recording))}" target="_blank" rel="noopener noreferrer">${icon('video')} ${L('مشاهدة التسجيل', 'Watch')}</a><button class="btn sm ghost" onclick="go('session',{id:'${s.id}'})">${icon('file')} ${L('تقرير الحصة', 'Report')}</button></div></div></div>`).join('')}</div>`
      : `<div class="card">${emptyBox(L('لسه مفيش تسجيلات – المدرس بيضيف لينك التسجيل بعد الحصة', 'No recordings yet – the teacher adds the link after each session'), 'video')}</div>`}
    ${missing ? `<div class="small muted sec">${icon('clock')} <span class="num">${missing}</span> ${L('حصة خلصت ولسه التسجيل بتاعها متضافش', 'finished sessions have no recording yet')}</div>` : ''}`;
}
