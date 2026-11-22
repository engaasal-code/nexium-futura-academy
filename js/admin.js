/* ================= ADMIN PANEL ================= */
const AD = { payFilter: 'all', stuQ: '', subjStage: 'kg', pageSel: null, pageLang: 'ar', schedT: 'all', emailType: 'all' };
const ACAL = { y: new Date().getFullYear(), m: new Date().getMonth() };

function adminShell(u) {
  const pend = D.enrollments.filter(e => e.status === 'pending').length;
  const blocked = D.messages.filter(m => m.blocked && !m.reviewed).length;
  const all = [
    { grp: L('عام', 'General') }, { v: 'overview', i: 'home', t: L('نظرة عامة', 'Overview') },
    { grp: L('المالية', 'Finance') }, { v: 'finance', i: 'pie', t: L('الداشبورد المالي', 'Financial dashboard'), p: 'fin.dash' },
    { v: 'profit', i: 'trend', t: L('صافي الربح', 'Net profit'), p: 'fin.profit' },
    { v: 'payments', i: 'wallet', t: L('المدفوعات والاشتراكات', 'Payments & subscriptions'), p: 'fin.dash', b: pend || '' },
    { v: 'payouts', i: 'coin', t: L('مستحقات المدرسين', 'Teacher payouts'), p: 'fin.payout' },
    { grp: L('الأكاديمية', 'Academy') }, { v: 'students', i: 'users', t: L('الطلاب', 'Students'), p: 'stu.view' },
    { v: 'teachers', i: 'cap', t: L('المدرسين', 'Teachers'), p: 'tch.view' },
    { v: 'schedule', i: 'cal', t: L('جداول الحصص', 'Schedules'), p: 'ses.viewall' },
    { v: 'ratings', i: 'star', t: L('تقييمات المدرسين', 'Teacher ratings'), p: 'tch.view' },
    { v: 'subjects', i: 'layers', t: L('المراحل والمواد', 'Stages & subjects'), p: 'cnt.subjects' },
    { grp: L('الإعدادات', 'Settings') }, { v: 'currency', i: 'globe', t: L('الأسعار والعملات', 'Prices & currencies'), p: 'fin.prices' },
    { v: 'methods', i: 'card', t: L('طرق الدفع', 'Payment methods'), p: 'fin.methods' },
    { v: 'pages', i: 'page', t: L('الصفحات التعريفية', 'Site pages'), p: 'cnt.pages' },
    { v: 'social', i: 'share', t: L('السوشيال والتواصل', 'Social & contact'), p: 'cnt.social' },
    { v: 'perms', i: 'shield', t: L('الصلاحيات', 'Permissions'), p: 'sys.perms' },
    { v: 'staff', i: 'user', t: L('حسابات الإدارة', 'Admin accounts'), p: 'sys.staff' },
    { grp: L('المراقبة', 'Monitoring') }, { v: 'monitor', i: 'chat', t: L('مراقبة المحادثات', 'Chat monitor'), p: 'com.monitor', b: blocked || '' },
    { v: 'emails', i: 'mail', t: L('سجل الإيميلات', 'Email log'), p: 'com.emails' },
  ];
  const items = all.filter(i => i.grp || !i.p || can(i.p));
  const cleaned = items.filter((it, i) => !(it.grp && (!items[i + 1] || items[i + 1].grp)));
  const views = { overview: AD_overview, finance: AD_finance, profit: AD_profit, payments: AD_payments, payouts: AD_payouts, students: AD_students, teachers: AD_teachers, schedule: AD_schedule, ratings: AD_ratings, subjects: AD_subjects, currency: AD_currency, methods: AD_methods, pages: AD_pages, social: AD_social, perms: AD_perms, staff: AD_staff, monitor: AD_monitor, emails: AD_emails };
  const cur = all.find(i => i.v === APP.view);
  const allowed = !cur || !cur.p || can(cur.p);
  const roleBar = `<div class="role-bar">${icon('shield')} ${L('داخل بصلاحيات:', 'Signed in with role:')} <b>${roleName(APP.adminRole)}</b> <span class="sp" style="flex:1"></span>
    ${IS_LIVE ? '' : `<span class="small muted">${L('للتجربة – اعرض المنصة كـ:', 'Demo – view as:')}</span><select class="input" style="width:auto;padding:5px 10px" onchange="APP.adminRole=this.value;render()">${ROLES.filter(r => r.id !== 'teacher').map(r => `<option value="${r.id}" ${APP.adminRole === r.id ? 'selected' : ''}>${L(r.ar, r.en)}</option>`).join('')}</select>
    <button class="btn sm ghost" title="${L('يرجّع كل البيانات التجريبية لحالتها الأصلية', 'Restore all demo data')}" onclick="confirmBox(L('إرجاع كل البيانات التجريبية لحالتها الأصلية؟','Reset all demo data?'),()=>{resetDemo();render();toast(L('تمت إعادة البيانات','Demo data reset'),'ok')})">↺ ${L('إعادة البيانات التجريبية', 'Reset demo data')}</button>`}</div>`;
  return `${headerHTML(u)}<div class="shell">${sideHTML(cleaned, `<b>${esc(u.name)}</b>${roleName(APP.adminRole)}`)}<main class="main">${roleBar}${allowed ? (views[APP.view] || AD_overview)(u) : `<div class="card">${emptyBox(L('الصفحة دي مش متاحة بالصلاحيات الحالية', 'This page is not available with the current permissions'), 'lock')}</div>`}</main></div>`;
}

/* ---------- finance engine ---------- */
function finance() {
  const E = D.enrollments.map(e => ({ ...e, aSAR: toSAR(e.amount, e.currency), pSAR: toSAR(e.paid, e.currency) }));
  const refunds = D.withdrawals.reduce((a, w) => { const e = D.enrollments.find(x => x.id === w.enrollmentId); return a + (e ? toSAR(w.refund || 0, e.currency) : 0); }, 0);
  const collected = E.reduce((a, e) => a + e.pSAR, 0);
  const outstanding = E.filter(e => ['partial', 'pending'].includes(e.status)).reduce((a, e) => a + (e.aSAR - e.pSAR), 0);
  const rate = (tid, sid) => (tchById(tid)?.subjects.find(x => x.id === sid) || {}).rate || 0;
  const perSub = {}, perT = {};
  D.sessions.filter(s => ['done', 'absent'].includes(s.status) && s.enrollmentId).forEach(s => {
    const e = E.find(x => x.id === s.enrollmentId); if (!e) return; const rev = e.aSAR / e.sessions; const cost = s.status === 'done' ? rate(s.teacherId, s.subjectId) : 0;
    const a = perSub[s.subjectId] = perSub[s.subjectId] || { rev: 0, cost: 0, n: 0 }; a.rev += rev; a.cost += cost; a.n++;
    const b = perT[s.teacherId] = perT[s.teacherId] || { rev: 0, cost: 0, n: 0 }; b.rev += rev; b.cost += cost; b.n++;
  });
  const teacherCost = Object.values(perT).reduce((a, t) => a + t.cost, 0);
  const expenses = D.expenses.reduce((a, x) => a + x.amount, 0);
  const paidOut = D.payouts.reduce((a, p) => a + p.amount, 0);
  return { E, collected, outstanding, refunds, perSub, perT, teacherCost, expenses, paidOut, net: collected - refunds - teacherCost - expenses };
}
function parentStatus() {
  const res = { paid: [], due: [], pending: [], withdrawn: [] };
  D.students.forEach(s => {
    const es = D.enrollments.filter(e => e.studentId === s.id); if (!es.length) return;
    const live = es.filter(e => e.status !== 'withdrawn');
    if (!live.length) return res.withdrawn.push(s);
    if (live.some(e => e.status === 'pending')) res.pending.push(s);
    else if (live.some(e => e.status === 'partial')) res.due.push(s); else res.paid.push(s);
  });
  return res;
}

/* ---------- overview ---------- */
function AD_overview() {
  const F = finance(); const ps = parentStatus();
  const today = D.sessions.filter(s => s.status === 'booked' && ymd(s.start) === ymd(new Date())).sort((a, b) => a.start.localeCompare(b.start));
  const week = D.sessions.filter(s => ['booked', 'done', 'absent'].includes(s.status) && Math.abs(new Date(s.start) - Date.now()) < 7 * DAY).length;
  return `<div class="page-h"><div><div class="crumbs">${L('الإدارة', 'Admin')}</div><h1>${L('نظرة عامة', 'Overview')}</h1><p>NEXIUM FUTURA ACADEMY · <span class="num">${fmtDate(new Date().toISOString())}</span></p></div></div>
  <div class="grid g4"><div class="stat"><div class="ic navy">${icon('users')}</div><div><div class="v num">${D.students.filter(s => s.active).length}</div><div class="l">${L('طالب نشط', 'Active students')}</div></div></div>
    <div class="stat"><div class="ic gold">${icon('cap')}</div><div><div class="v num">${D.teachers.filter(t => t.active).length}</div><div class="l">${L('مدرس', 'Teachers')}</div></div></div>
    <div class="stat"><div class="ic info">${icon('cal')}</div><div><div class="v num">${week}</div><div class="l">${L('حصة خلال ± 7 أيام', 'Sessions ± 7 days')}</div></div></div>
    <div class="stat"><div class="ic bad">${icon('door')}</div><div><div class="v num">${ps.withdrawn.length}</div><div class="l">${L('منسحب', 'Withdrawn')}</div></div></div></div>
  ${can('fin.dash') ? `<div class="grid g3 sec"><div class="stat"><div class="ic ok">${icon('coin')}</div><div><div class="v">${rep(F.collected)}</div><div class="l">${L('إجمالي المحصّل', 'Collected')}</div></div></div><div class="stat"><div class="ic warn">${icon('clock')}</div><div><div class="v">${rep(F.outstanding)}</div><div class="l">${L('مبالغ متبقية', 'Outstanding')}</div></div></div>${can('fin.profit') ? `<div class="stat"><div class="ic navy">${icon('trend')}</div><div><div class="v ${F.net < 0 ? 'neg' : ''}">${rep(F.net)}</div><div class="l">${L('صافي الربح', 'Net profit')}</div></div></div>` : `<div class="stat"><div class="ic gray">${icon('lock')}</div><div><div class="v">—</div><div class="l">${L('صافي الربح (مخفي)', 'Net profit (hidden)')}</div></div></div>`}</div>` : ''}
  <div class="grid g2 sec"><div class="card"><div class="card-h"><h2>${L('حصص النهارده', 'Today’s sessions')}</h2></div>${today.length ? today.map(s => `<div class="sess"><div class="date"><b class="num" style="font-size:15px">${fmtTime(s.start)}</b></div><div class="info"><h4>${esc(subjName(subjById(s.subjectId)))}</h4><div class="meta"><span>${icon('cap')} ${esc(tName(tchById(s.teacherId)))}</span><span>${icon('user')} ${esc(stuById(s.studentId)?.name)}</span></div></div></div>`).join('') : emptyBox(L('لا توجد حصص اليوم', 'No sessions today'))}</div>
    <div class="card"><div class="card-h"><h2>${L('يحتاج انتباهك', 'Needs attention')}</h2></div>
      ${[[D.enrollments.filter(e => e.status === 'pending').length, L('تحويلات بانتظار الاعتماد', 'Transfers awaiting approval'), 'payments', 'info'], [D.messages.filter(m => m.blocked && !m.reviewed).length, L('محاولات مشاركة بيانات تواصل', 'Contact-sharing attempts'), 'monitor', 'bad'], [D.students.filter(s => !s.confirmed).length, L('حسابات لم تؤكد البريد', 'Unconfirmed emails'), 'students', 'warn'], [D.sessions.filter(s => s.status === 'booked' && sEnd(s) < Date.now()).length, L('حصص بدون تسجيل حضور', 'Sessions without attendance'), 'schedule', 'warn']].map(([n, l, v, c]) => `<div class="row between" style="padding:10px 0;border-bottom:1px solid var(--line)"><span>${l}</span><span class="row"><span class="pill ${c} num">${n}</span><button class="btn sm ghost" onclick="go('${v}')">${L('عرض', 'View')}</button></span></div>`).join('')}</div></div>`;
}

/* ---------- financial dashboard ---------- */
function AD_finance() {
  const F = finance(); const ps = parentStatus();
  const reasons = {}; D.withdrawals.forEach(w => reasons[w.reason] = (reasons[w.reason] || 0) + 1);
  const subRows = Object.entries(F.perSub).map(([id, v]) => ({ id, ...v, profit: v.rev - v.cost })).sort((a, b) => b.profit - a.profit);
  const curSel = `<div class="row"><span class="small muted">${L('عرض التقارير بـ', 'Report currency')}</span><select class="input" style="width:auto" onchange="D.settings.reportCur=this.value;save();render()"><option value="SAR" ${D.settings.reportCur === 'SAR' ? 'selected' : ''}>${L('ريال سعودي', 'SAR')}</option><option value="EGP" ${D.settings.reportCur === 'EGP' ? 'selected' : ''}>${L('جنيه مصري', 'EGP')}</option></select></div>`;
  return `<div class="page-h"><div><div class="crumbs">${L('المالية', 'Finance')}</div><h1>${L('الداشبورد المالي', 'Financial dashboard')}</h1><p>${L('مين دفع ومين متبقي عليه، الانسحابات وأسبابها، والمكسب والخسارة لكل مادة ومدرس', 'Who paid, who owes, withdrawals and reasons, profit/loss per subject and teacher')}</p></div>${curSel}</div>
  <div class="grid g4"><div class="stat" style="cursor:pointer" onclick="AD.payFilter='paid';go('payments')"><div class="ic ok">${icon('check')}</div><div><div class="v num">${ps.paid.length}</div><div class="l">${L('ولي أمر دفع بالكامل', 'Parents fully paid')}</div></div></div>
    <div class="stat" style="cursor:pointer" onclick="AD.payFilter='partial';go('payments')"><div class="ic warn">${icon('clock')}</div><div><div class="v num">${ps.due.length}</div><div class="l">${L('متبقي عليه مبلغ', 'Still owe')}</div></div></div>
    <div class="stat" style="cursor:pointer" onclick="AD.payFilter='pending';go('payments')"><div class="ic info">${icon('wallet')}</div><div><div class="v num">${ps.pending.length}</div><div class="l">${L('تحويل بانتظار الاعتماد', 'Transfer pending')}</div></div></div>
    <div class="stat" style="cursor:pointer" onclick="AD.payFilter='withdrawn';go('payments')"><div class="ic bad">${icon('door')}</div><div><div class="v num">${ps.withdrawn.length + D.withdrawals.filter(w => !ps.withdrawn.some(s => s.id === w.studentId)).length}</div><div class="l">${L('حالات انسحاب', 'Withdrawals')}</div></div></div></div>
  <div class="grid g3 sec"><div class="card"><div class="small muted">${L('إجمالي المحصّل', 'Collected')}</div><div class="kpi-big">${rep(F.collected)}</div></div><div class="card"><div class="small muted">${L('مبالغ لم تُحصّل بعد', 'Not yet collected')}</div><div class="kpi-big" style="color:var(--warn)">${rep(F.outstanding)}</div></div><div class="card"><div class="small muted">${L('مبالغ مستردة للمنسحبين', 'Refunds')}</div><div class="kpi-big" style="color:var(--bad)">${rep(F.refunds)}</div></div></div>
  <div class="grid g2 sec"><div class="card"><h3 style="margin-bottom:14px">${L('أسباب الانسحاب', 'Withdrawal reasons')}</h3>${D.withdrawals.length ? donut(Object.entries(reasons).map(([l, v], i) => ({ l, v, c: PAL[i % PAL.length] })), D.withdrawals.length, L('انسحاب', 'withdrawals')) : emptyBox(L('لا توجد انسحابات', 'No withdrawals'))}
      <div class="tbl-wrap" style="margin-top:14px"><table class="tbl"><thead><tr><th>${L('الطالب', 'Student')}</th><th>${L('المادة', 'Subject')}</th><th>${L('السبب', 'Reason')}</th><th>${L('التاريخ', 'Date')}</th></tr></thead><tbody>${D.withdrawals.map(w => { const e = D.enrollments.find(x => x.id === w.enrollmentId); return `<tr><td>${esc(stuById(w.studentId)?.name)}</td><td>${esc(subjName(subjById(e?.subjectId)))}</td><td>${esc(w.reason)}${w.note ? `<div class="tiny muted">${esc(w.note)}</div>` : ''}</td><td class="num small">${fmtDateShort(w.date)}</td></tr>`; }).join('')}</tbody></table></div></div>
    <div class="card"><h3 style="margin-bottom:4px">${L('الربح حسب المادة', 'Profit by subject')}</h3><div class="small muted" style="margin-bottom:14px">${L('إيراد الحصص المستهلكة − أجر المدرس', 'Revenue of consumed sessions − teacher pay')}</div>${hbars(subRows.map(r => ({ l: subjName(subjById(r.id)) + ' · ' + stageName(subjById(r.id).stage), v: Math.round(fromSAR(r.profit, D.settings.reportCur)) })), v => money(v, repC()))}</div></div>
  <div class="card sec"><h3 style="margin-bottom:12px">${L('المكسب والخسارة لكل مدرس', 'Profit & loss per teacher')}</h3>
    <div class="tbl-wrap"><table class="tbl"><thead><tr><th>${L('المدرس', 'Teacher')}</th><th>${L('حصص مستهلكة', 'Sessions')}</th><th>${L('الإيراد', 'Revenue')}</th><th>${L('أجر المدرس', 'Teacher pay')}</th><th>${L('الربح', 'Profit')}</th><th>${L('الهامش', 'Margin')}</th></tr></thead><tbody>
    ${D.teachers.map(t => { const v = F.perT[t.id] || { rev: 0, cost: 0, n: 0 }; const p = v.rev - v.cost; return `<tr><td><b>${esc(tName(t))}</b></td><td class="num">${v.n}</td><td>${rep(v.rev)}</td><td>${rep(v.cost)}</td><td><b class="${p < 0 ? 'neg' : 'pos'}">${rep(p)}</b></td><td class="num">${v.rev ? Math.round(p / v.rev * 100) + '%' : '—'}</td></tr>`; }).join('')}</tbody></table></div></div>
  <div class="card sec"><h3 style="margin-bottom:12px">${L('المكسب والخسارة لكل مادة', 'Profit & loss per subject')}</h3><div class="tbl-wrap"><table class="tbl"><thead><tr><th>${L('المادة', 'Subject')}</th><th>${L('حصص', 'Sessions')}</th><th>${L('الإيراد', 'Revenue')}</th><th>${L('التكلفة', 'Cost')}</th><th>${L('الربح', 'Profit')}</th></tr></thead><tbody>${subRows.map(r => `<tr><td>${esc(subjName(subjById(r.id)))} <span class="tiny muted">${stageName(subjById(r.id).stage)}</span></td><td class="num">${r.n}</td><td>${rep(r.rev)}</td><td>${rep(r.cost)}</td><td><b class="${r.profit < 0 ? 'neg' : 'pos'}">${rep(r.profit)}</b></td></tr>`).join('')}</tbody></table></div></div>`;
}

/* ---------- net profit ---------- */
function AD_profit() {
  const F = finance(); const months = [];
  for (let i = 5; i >= 0; i--) { const d = new Date(); d.setDate(1); d.setMonth(d.getMonth() - i); months.push({ y: d.getFullYear(), m: d.getMonth(), lbl: d.toLocaleDateString(LANG === 'ar' ? 'ar-EG' : 'en-US', { month: 'short' }), rev: 0, cost: 0, exp: 0 }); }
  const mk = iso => { const d = new Date(iso); return months.find(x => x.y === d.getFullYear() && x.m === d.getMonth()); };
  F.E.forEach(e => { const m = mk(e.created); if (m) m.rev += e.pSAR; });
  D.sessions.filter(s => s.status === 'done').forEach(s => { const m = mk(s.start); if (m) m.cost += (tchById(s.teacherId)?.subjects.find(x => x.id === s.subjectId)?.rate || 0); });
  D.expenses.forEach(x => { const m = mk(x.at); if (m) m.exp += x.amount; });
  const max = Math.max(1, ...months.map(m => Math.max(m.rev, m.cost + m.exp)));
  const row = (l, v, cls = '') => `<div class="row between" style="padding:10px 0;border-bottom:1px solid var(--line)"><span>${l}</span><b class="${cls}">${rep(v)}</b></div>`;
  return `<div class="page-h"><div><div class="crumbs">${L('المالية', 'Finance')}</div><h1>${L('صافي الربح', 'Net profit')}</h1></div></div>
  <div class="grid" style="grid-template-columns:1fr 1.4fr" id="npg"><div class="card"><div class="small muted">${L('صافي الربح', 'Net profit')}</div><div class="kpi-big ${F.net < 0 ? 'neg' : 'pos'}" style="font-size:40px">${rep(F.net)}</div><hr class="sep">
    ${row(L('+ إجمالي المحصّل من أولياء الأمور', '+ Collected from parents'), F.collected, 'pos')}${row(L('− مبالغ مستردة', '− Refunds'), -F.refunds, 'neg')}${row(L('− أجور المدرسين (عن الحصص المنفّذة)', '− Teacher pay (delivered sessions)'), -F.teacherCost, 'neg')}${row(L('− مصروفات تشغيل', '− Operating expenses'), -F.expenses, 'neg')}
    <div class="notice info" style="margin-top:12px">${L('صُرف للمدرسين فعلياً', 'Actually paid to teachers')}: <b>${rep(F.paidOut)}</b> · ${L('متبقي لهم', 'still owed')}: <b>${rep(F.teacherCost - F.paidOut)}</b></div></div>
  <div class="card"><h3 style="margin-bottom:6px">${L('آخر 6 شهور', 'Last 6 months')}</h3><div class="row small" style="gap:14px;margin-bottom:6px"><span><i style="display:inline-block;width:10px;height:10px;background:var(--navy);border-radius:2px"></i> ${L('المحصّل', 'Collected')}</span><span><i style="display:inline-block;width:10px;height:10px;background:var(--gold);border-radius:2px"></i> ${L('أجور المدرسين', 'Teacher pay')}</span><span><i style="display:inline-block;width:10px;height:10px;background:var(--bad);border-radius:2px"></i> ${L('مصروفات', 'Expenses')}</span></div>
    <div class="vbars">${months.map(m => `<div class="vb" title="${m.lbl}"><div style="display:flex;gap:3px;align-items:flex-end;height:100%;width:100%;justify-content:center"><div style="width:40%;max-width:22px;background:var(--navy);border-radius:4px 4px 0 0;height:${m.rev / max * 100}%"></div><div style="width:40%;max-width:22px;display:flex;flex-direction:column;justify-content:flex-end;height:100%"><div style="background:var(--bad);height:${m.exp / max * 100}%;border-radius:4px 4px 0 0"></div><div style="background:var(--gold);height:${m.cost / max * 100}%"></div></div></div></div>`).join('')}</div>
    <div class="vlabels">${months.map(m => `<span>${m.lbl}<br><b class="${m.rev - m.cost - m.exp < 0 ? 'neg' : 'pos'} num">${Math.round(fromSAR(m.rev - m.cost - m.exp, D.settings.reportCur))}</b></span>`).join('')}</div></div></div>
  <div class="card sec"><div class="card-h"><h3>${L('مصروفات التشغيل', 'Operating expenses')}</h3>${can('fin.record') ? `<button class="btn sm gold" onclick="AD_addExpense()">${icon('plus')} ${L('إضافة مصروف', 'Add expense')}</button>` : ''}</div>
    <div class="tbl-wrap"><table class="tbl"><thead><tr><th>${L('البند', 'Item')}</th><th>${L('التاريخ', 'Date')}</th><th>${L('المبلغ', 'Amount')}</th><th></th></tr></thead><tbody>${D.expenses.map(x => `<tr><td>${esc(x.title)}</td><td class="num small">${fmtDate(x.at)}</td><td>${rep(x.amount)}</td><td>${can('fin.record') ? `<button class="btn sm bad ghost" onclick="D.expenses=D.expenses.filter(e=>e.id!=='${x.id}');save();render()">${icon('trash')}</button>` : ''}</td></tr>`).join('')}</tbody></table></div></div><style>@media(max-width:1000px){#npg{grid-template-columns:1fr!important}}</style>`;
}
function AD_addExpense() { modal(L('إضافة مصروف', 'Add expense'), `<div class="field"><label>${L('البند', 'Item')}</label><input class="input" id="ex_t"></div><div class="field"><label>${L('المبلغ (ر.س)', 'Amount (SAR)')}</label><input class="input" type="number" id="ex_a"></div>`, `<button class="btn gold" onclick="if(!val('ex_t')||!(+val('ex_a')>0))return toast(L('أكمل البيانات','Fill fields'),'bad');D.expenses.push({id:uid('x'),title:val('ex_t'),amount:+val('ex_a'),at:new Date().toISOString()});save();closeModal();render()">${L('إضافة', 'Add')}</button>`); }

/* ---------- payments ---------- */
function AD_payments() {
  const cOf = cur => D.countries.find(c => c.cur === cur) || countryBy('SA');
  let list = D.enrollments.slice().sort((a, b) => b.created.localeCompare(a.created)); if (AD.payFilter !== 'all') list = list.filter(e => e.status === AD.payFilter);
  const f = [['all', L('الكل', 'All')], ['paid', L('مدفوع', 'Paid')], ['partial', L('متبقي مبلغ', 'Partial')], ['pending', L('بانتظار الاعتماد', 'Pending')], ['withdrawn', L('منسحب', 'Withdrawn')]];
  return `<div class="page-h"><div><div class="crumbs">${L('المالية', 'Finance')}</div><h1>${L('المدفوعات والاشتراكات', 'Payments & subscriptions')}</h1><p>${L('لكل طالب: المدة اللي دفعها، هل تم الدفع، والمتبقي', 'For each student: period paid, payment status and remaining amount')}</p></div>${can('fin.record') ? `<button class="btn gold" onclick="AD_newEnroll()">${icon('plus')} ${L('اشتراك يدوي', 'Manual subscription')}</button>` : ''}</div>
  <div class="tabs">${f.map(([k, l]) => `<button class="${AD.payFilter === k ? 'on' : ''}" onclick="AD.payFilter='${k}';render()">${l} <span class="num">(${k === 'all' ? D.enrollments.length : D.enrollments.filter(e => e.status === k).length})</span></button>`).join('')}</div>
  <div class="tbl-wrap"><table class="tbl"><thead><tr><th>${L('الطالب / ولي الأمر', 'Student / parent')}</th><th>${L('المادة', 'Subject')}</th><th>${L('الحصص', 'Sessions')}</th><th>${L('مدة الاشتراك', 'Period')}</th><th>${L('المبلغ', 'Amount')}</th><th>${L('المدفوع', 'Paid')}</th><th>${L('المتبقي', 'Due')}</th><th>${L('الطريقة', 'Method')}</th><th>${L('الحالة', 'Status')}</th><th>${L('إجراءات', 'Actions')}</th></tr></thead><tbody>
  ${list.map(e => { const s = stuById(e.studentId); const C = cOf(e.currency); const us = enrollUsage(e); const m = D.methods.find(x => x.id === e.method); const due = e.amount - e.paid;
    return `<tr><td><b>${esc(s?.name)}</b><div class="tiny muted">${esc(s?.parent)} · ${countryBy(s?.country).flag}</div></td><td>${esc(subjName(subjById(e.subjectId)))}</td><td class="num">${us.used}/${e.sessions}</td><td class="num small">${e.from}<br>${e.to}</td><td>${money(e.amount, C)}</td><td>${money(e.paid, C)}</td><td>${due > 0 && e.status !== 'withdrawn' ? `<b class="neg">${money(due, C)}</b>` : '—'}</td><td class="small">${m ? L(m.ar, m.en) : '—'}${e.receipt ? `<div class="tiny">${fileLabel(e.receipt, 'receipts')}</div>` : ''}</td><td>${statusPill(e.status)}</td>
    <td><div class="acts">${e.status === 'pending' ? (can('fin.approve') ? `<button class="btn sm ok" onclick="AD_approve('${e.id}')">${icon('check')} ${L('اعتماد', 'Approve')}</button><button class="btn sm bad ghost" onclick="AD_reject('${e.id}')">${L('رفض', 'Reject')}</button>` : lockedBtn(L('اعتماد', 'Approve'))) : ''}
      ${e.status === 'partial' && can('fin.record') ? `<button class="btn sm" onclick="AD_recordPay('${e.id}')">${L('تسجيل دفعة', 'Record payment')}</button>` : ''}
      ${can('fin.record') && e.status !== 'withdrawn' ? `<button class="btn sm ghost" onclick="AD_editPeriod('${e.id}')">${icon('edit')}</button>` : ''}
      ${['paid', 'partial'].includes(e.status) && can('fin.withdraw') ? `<button class="btn sm bad ghost" onclick="AD_withdraw('${e.id}')">${L('انسحاب', 'Withdraw')}</button>` : ''}</div></td></tr>`; }).join('') || `<tr><td colspan="10">${emptyBox(L('لا توجد بيانات', 'No data'), 'wallet')}</td></tr>`}</tbody></table></div>`;
}
function AD_approve(id) { const e = D.enrollments.find(x => x.id === id); e.status = 'paid'; e.paid = e.amount; e.approvedBy = APP.adminRole; const s = stuById(e.studentId); D.emails.push({ id: uid('em'), to: s.email, type: 'payment', subject: 'تم تأكيد الدفع وتفعيل الباقة ✓', body: `تم تفعيل باقة ${e.sessions} حصة في مادة ${subjById(e.subjectId).ar}. تقدر تحجز دلوقتي.`, at: new Date().toISOString(), status: 'sent' }); save(); toast(L('تم الاعتماد وإبلاغ ولي الأمر بالإيميل', 'Approved – parent notified by email'), 'ok'); render(); }
function AD_reject(id) { confirmBox(L('رفض التحويل وحذف الطلب؟', 'Reject and remove this request?'), () => { D.enrollments = D.enrollments.filter(x => x.id !== id); save(); render(); }); }
function AD_recordPay(id) {
  const e = D.enrollments.find(x => x.id === id); const C = D.countries.find(c => c.cur === e.currency);
  modal(L('تسجيل دفعة', 'Record payment'), `<p class="muted" style="margin-top:0">${L('المتبقي:', 'Remaining:')} <b>${money(e.amount - e.paid, C)}</b></p><div class="field"><label>${L('المبلغ', 'Amount')} (${e.currency})</label><input class="input" type="number" id="rp_a" value="${e.amount - e.paid}"></div>`,
    `<button class="btn gold" onclick="const a=+val('rp_a');const e=D.enrollments.find(x=>x.id==='${id}');if(!(a>0))return;e.paid=Math.min(e.amount,e.paid+a);if(e.paid>=e.amount)e.status='paid';save();closeModal();render();toast(L('تم التسجيل','Recorded'),'ok')">${L('حفظ', 'Save')}</button>`);
}
function AD_editPeriod(id) {
  const e = D.enrollments.find(x => x.id === id);
  modal(L('مدة الاشتراك', 'Subscription period'), `<div class="form-grid"><div class="field"><label>${L('من', 'From')}</label><input type="date" class="input" id="ep_f" value="${e.from}"></div><div class="field"><label>${L('إلى', 'To')}</label><input type="date" class="input" id="ep_t" value="${e.to}"></div></div><div class="field"><label>${L('عدد الحصص', 'Sessions')}</label><input type="number" class="input" id="ep_n" value="${e.sessions}"></div>`,
    `<button class="btn" onclick="const e=D.enrollments.find(x=>x.id==='${id}');e.from=val('ep_f');e.to=val('ep_t');e.sessions=+val('ep_n')||e.sessions;save();closeModal();render()">${L('حفظ', 'Save')}</button>`);
}
function AD_withdraw(id) {
  const e = D.enrollments.find(x => x.id === id);
  modal(L('تسجيل انسحاب', 'Record withdrawal'), `<p class="muted" style="margin-top:0">${esc(stuById(e.studentId)?.name)} · ${esc(subjName(subjById(e.subjectId)))}</p>
    <div class="field"><label class="req">${L('سبب الانسحاب', 'Reason')}</label><select class="input" id="wd_r">${D.withdrawReasons.map(r => `<option>${esc(r)}</option>`).join('')}</select></div>
    <div class="field"><label>${L('تفاصيل', 'Details')}</label><textarea class="input" id="wd_n"></textarea></div><div class="field"><label>${L('مبلغ مسترد', 'Refund amount')} (${e.currency})</label><input class="input" type="number" id="wd_f" value="0"></div>`,
    `<button class="btn bad" onclick="AD_doWithdraw('${id}')">${L('تسجيل الانسحاب', 'Record withdrawal')}</button>`);
}
function AD_doWithdraw(id) {
  const e = D.enrollments.find(x => x.id === id); e.status = 'withdrawn';
  D.withdrawals.push({ id: uid('w'), studentId: e.studentId, enrollmentId: id, reason: val('wd_r'), note: val('wd_n'), refund: +val('wd_f') || 0, date: new Date().toISOString() });
  D.sessions.filter(s => s.enrollmentId === id && s.status === 'booked').forEach(s => { s.status = 'cancelled'; }); save(); closeModal(); render(); toast(L('تم تسجيل الانسحاب وإلغاء الحصص القادمة', 'Withdrawal recorded – upcoming sessions cancelled'));
}
function AD_newEnroll() {
  modal(L('اشتراك يدوي', 'Manual subscription'), `<div class="field"><label>${L('الطالب', 'Student')}</label><select class="input" id="ne_s">${D.students.map(s => `<option value="${s.id}">${esc(s.name)} – ${esc(s.parent)}</option>`).join('')}</select></div>
    <div class="field"><label>${L('المادة', 'Subject')}</label><select class="input" id="ne_sub">${STAGES.map(st => `<optgroup label="${L(st.ar, st.en)}">${D.subjects.filter(s => s.stage === st.id).map(s => `<option value="${s.id}">${esc(subjName(s))}</option>`).join('')}</optgroup>`).join('')}</select></div>
    <div class="form-grid"><div class="field"><label>${L('الباقة', 'Package')}</label><select class="input" id="ne_n">${PACKAGES.map(p => `<option value="${p.n}">${L(p.ar, p.en)}</option>`).join('')}</select></div><div class="field"><label>${L('العملة', 'Currency')}</label><select class="input" id="ne_c"><option>SAR</option><option>EGP</option>${D.countries.filter(c => !['SAR', 'EGP'].includes(c.cur)).map(c => `<option>${c.cur}</option>`).join('')}</select></div>
    <div class="field"><label>${L('المبلغ', 'Amount')}</label><input class="input" type="number" id="ne_a"></div><div class="field"><label>${L('المدفوع', 'Paid')}</label><input class="input" type="number" id="ne_p" value="0"></div>
    <div class="field"><label>${L('من', 'From')}</label><input type="date" class="input" id="ne_f" value="${ymd(new Date())}"></div><div class="field"><label>${L('إلى', 'To')}</label><input type="date" class="input" id="ne_t" value="${ymd(Date.now() + 60 * DAY)}"></div></div>
    <div class="field"><label>${L('طريقة الدفع', 'Method')}</label><select class="input" id="ne_m">${D.methods.map(m => `<option value="${m.id}">${L(m.ar, m.en)}</option>`).join('')}</select></div>`,
    `<button class="btn gold" onclick="AD_saveEnroll()">${L('حفظ', 'Save')}</button>`);
}
function AD_saveEnroll() { const a = +val('ne_a'), p = +val('ne_p'); if (!(a > 0)) return toast(L('أدخل المبلغ', 'Enter amount'), 'bad'); D.enrollments.push({ id: uid('e'), studentId: val('ne_s'), subjectId: val('ne_sub'), sessions: +val('ne_n'), amount: a, paid: Math.min(a, p), currency: val('ne_c'), method: val('ne_m'), status: p >= a ? 'paid' : 'partial', created: new Date().toISOString(), from: val('ne_f'), to: val('ne_t'), receipt: '' }); save(); closeModal(); render(); toast(L('تم الحفظ', 'Saved'), 'ok'); }

/* ---------- teacher payouts ---------- */
function AD_payouts() {
  const C = countryBy('SA');
  return `<div class="page-h"><div><div class="crumbs">${L('المالية', 'Finance')}</div><h1>${L('مستحقات المدرسين', 'Teacher payouts')}</h1><p>${L('كل مدرس أخد كام وباقي له كام – محسوبة من الأجر اللي المدرس كاتبه لكل مادة × الحصص المنفّذة', 'What each teacher has been paid and is owed – rate per subject × delivered sessions')}</p></div></div>
  <div class="tbl-wrap"><table class="tbl"><thead><tr><th>${L('المدرس', 'Teacher')}</th><th>${L('حصص منفّذة', 'Delivered')}</th><th>${L('إجمالي المستحق', 'Earned')}</th><th>${L('تم صرفه', 'Paid')}</th><th>${L('المتبقي له', 'Owed')}</th><th></th></tr></thead><tbody>
  ${D.teachers.map(t => { const e = teacherEarn(t.id); return `<tr><td><div class="row"><span class="av" style="background:${t.color};width:32px;height:32px;font-size:12px">${esc(initials(t.name))}</span><b>${esc(tName(t))}</b></div></td><td class="num">${e.done}</td><td>${money(e.earned, C)}</td><td class="pos">${money(e.paid, C)}</td><td><b class="${e.due > 0 ? 'neg' : ''}">${money(e.due, C)}</b></td>
    <td><div class="acts"><button class="btn sm gold" ${e.due > 0 ? '' : 'disabled'} onclick="AD_payout('${t.id}',${e.due})">${L('صرف دفعة', 'Pay')}</button><button class="btn sm ghost" onclick="AD_payHistory('${t.id}')">${L('السجل', 'History')}</button></div></td></tr>`; }).join('')}</tbody></table></div>`;
}
function AD_payout(tid, due) { modal(L('صرف دفعة لـ ', 'Pay ') + tName(tchById(tid)), `<div class="field"><label>${L('المبلغ (ر.س)', 'Amount (SAR)')}</label><input class="input" type="number" id="po_a" value="${due}"></div><div class="field"><label>${L('ملاحظة', 'Note')}</label><input class="input" id="po_n" placeholder="${L('مثال: دفعة شهر نوفمبر', 'e.g. November payout')}"></div>`, `<button class="btn gold" onclick="const a=+val('po_a');if(!(a>0))return;D.payouts.push({id:uid('p'),teacherId:'${tid}',amount:a,note:val('po_n'),at:new Date().toISOString()});save();closeModal();render();toast(L('تم تسجيل الصرف','Payout recorded'),'ok')">${L('تأكيد الصرف', 'Confirm')}</button>`); }
function AD_payHistory(tid) { const C = countryBy('SA'); modal(L('سجل الدفعات', 'Payout history') + ' · ' + tName(tchById(tid)), D.payouts.filter(p => p.teacherId === tid).map(p => `<div class="row between" style="padding:8px 0;border-bottom:1px solid var(--line)"><span class="num small">${fmtDate(p.at)}</span><span class="small muted">${esc(p.note)}</span><b>${money(p.amount, C)}</b></div>`).join('') || emptyBox(L('لا توجد دفعات', 'No payouts'), 'wallet')); }

/* ---------- students ---------- */
function AD_students() {
  const q = AD.stuQ.toLowerCase(); const list = D.students.filter(s => !q || (s.name + s.parent + s.email + s.phone).toLowerCase().includes(q));
  return `<div class="page-h"><div><div class="crumbs">${L('الأكاديمية', 'Academy')}</div><h1>${L('الطلاب', 'Students')}</h1></div>${can('stu.add') ? `<button class="btn gold" onclick="AD_studentForm()">${icon('plus')} ${L('إضافة طالب', 'Add student')}</button>` : lockedBtn(L('إضافة طالب', 'Add student'))}</div>
  <div class="row" style="margin-bottom:14px"><input class="input" style="max-width:320px" placeholder="${L('بحث بالاسم أو البريد أو الرقم…', 'Search name, email or number…')}" value="${esc(AD.stuQ)}" oninput="AD.stuQ=this.value;clearTimeout(window.__sq);window.__sq=setTimeout(()=>{render();const i=document.querySelector('.main input');i&&(i.focus(),i.setSelectionRange(i.value.length,i.value.length))},250)"></div>
  <div class="tbl-wrap"><table class="tbl"><thead><tr><th>${L('الطالب', 'Student')}</th><th>${L('ولي الأمر', 'Parent')}</th><th>${L('التواصل', 'Contact')}</th><th>${L('الصف', 'Grade')}</th><th>${L('التسجيل', 'Sign-up')}</th><th>${L('مفعّل', 'Active')}</th><th>${L('إجراءات', 'Actions')}</th></tr></thead><tbody>
  ${list.map(s => `<tr><td><b>${esc(s.name)}</b>${s.confirmed ? '' : ` <span class="pill warn">${L('لم يؤكد البريد', 'unconfirmed')}</span>`}</td><td>${esc(s.parent)}</td><td class="small" dir="ltr" style="text-align:start">${esc(s.email)}<br>${esc(s.phone)}</td><td>${gradeName(s.grade)}<div class="tiny muted">${countryBy(s.country).flag} ${L(countryBy(s.country).ar, countryBy(s.country).en)}</div></td><td>${bicon(s.provider === 'email' ? '' : s.provider, 14)} <span class="small">${s.provider}</span></td>
    <td><label class="sw"><input type="checkbox" ${s.active ? 'checked' : ''} ${can('stu.toggle') ? '' : 'disabled'} onchange="stuById('${s.id}').active=this.checked;save();toast(this.checked?L('تم التفعيل','Activated'):L('تم الإيقاف','Deactivated'))"><span></span></label></td>
    <td><div class="acts">${can('stu.edit') ? `<button class="btn sm ghost" onclick="AD_studentForm('${s.id}')">${icon('edit')}</button>` : lockedBtn('')}${can('stu.delete') ? `<button class="btn sm bad ghost" onclick="confirmBox(L('حذف الطالب نهائياً؟','Delete student permanently?'),()=>{D.students=D.students.filter(x=>x.id!=='${s.id}');save();render()},L('حذف','Delete'))">${icon('trash')}</button>` : lockedBtn('')}</div></td></tr>`).join('')}</tbody></table></div>`;
}
function AD_studentForm(id) {
  const s = id ? stuById(id) : { name: '', parent: '', email: '', phone: '', country: 'SA', stage: 'pri', grade: 'G1' };
  modal(id ? L('تعديل طالب', 'Edit student') : L('إضافة طالب', 'Add student'), `<div class="form-grid"><div class="field"><label class="req">${L('اسم الطالب', 'Student')}</label><input class="input" id="as_n" value="${esc(s.name)}"></div><div class="field"><label class="req">${L('ولي الأمر', 'Parent')}</label><input class="input" id="as_p" value="${esc(s.parent)}"></div>
    <div class="field"><label class="req">${L('البريد', 'Email')}</label><input class="input" id="as_e" dir="ltr" value="${esc(s.email)}"></div><div class="field"><label class="req">${L('الموبايل', 'Mobile')}</label><input class="input" id="as_ph" dir="ltr" value="${esc(s.phone)}"></div>
    <div class="field"><label>${L('الدولة', 'Country')}</label><select class="input" id="as_c">${D.countries.map(c => `<option value="${c.code}" ${c.code === s.country ? 'selected' : ''}>${c.flag} ${L(c.ar, c.en)}</option>`).join('')}</select></div>
    <div class="field"><label>${L('الصف', 'Grade')}</label><select class="input" id="as_g">${STAGES.filter(x => x.id !== 'summer').map(st => `<optgroup label="${L(st.ar, st.en)}">${st.grades.map(g => `<option value="${st.id}:${g}" ${s.grade === g ? 'selected' : ''}>${gradeName(g)}</option>`).join('')}</optgroup>`).join('')}</select></div></div>`,
    `<button class="btn gold" onclick="AD_saveStudent('${id || ''}')">${L('حفظ', 'Save')}</button>`);
}
function AD_saveStudent(id) {
  const [st, g] = val('as_g').split(':'); const f = { name: val('as_n'), parent: val('as_p'), email: val('as_e'), phone: val('as_ph'), country: val('as_c'), stage: st, grade: g };
  if (!f.name || !f.parent || !f.email || f.phone.replace(/\D/g, '').length < 8) return toast(L('أكمل البيانات', 'Fill all fields'), 'bad');
  if (id) Object.assign(stuById(id), f); else D.students.push({ id: uid('s'), ...f, pass: '123456', confirmed: false, provider: 'email', active: true, joined: new Date().toISOString() }); save(); closeModal(); render(); toast(L('تم الحفظ', 'Saved'), 'ok');
}

/* ---------- teachers ---------- */
function AD_teachers() {
  return `<div class="page-h"><div><div class="crumbs">${L('الأكاديمية', 'Academy')}</div><h1>${L('المدرسين', 'Teachers')}</h1><p>${L('إضافة المدرس من صلاحية مدير المدرسة. لينك اليوتيوب التعريفي بتحطه الإدارة لكل مدرس.', 'Adding teachers is a principal permission. The intro YouTube link is set by admin.')}</p></div>${can('tch.add') ? `<button class="btn gold" onclick="AD_teacherForm()">${icon('plus')} ${L('إضافة مدرس', 'Add teacher')}</button>` : lockedBtn(L('إضافة مدرس', 'Add teacher'))}</div>
  <div class="tbl-wrap"><table class="tbl"><thead><tr><th>${L('المدرس', 'Teacher')}</th><th>${L('المواد', 'Subjects')}</th><th>${L('التقييم', 'Rating')}</th><th>${L('حصص', 'Sessions')}</th><th>${L('فيديو يوتيوب', 'YouTube')}</th><th>${L('مفعّل', 'Active')}</th><th>${L('إجراءات', 'Actions')}</th></tr></thead><tbody>
  ${D.teachers.map(t => `<tr><td><div class="row"><span class="av" style="background:${t.color};width:34px;height:34px;font-size:13px">${esc(initials(t.name))}</span><div><b>${esc(tName(t))}</b><div class="tiny muted" dir="ltr">${esc(t.email)}</div></div></div></td><td><div class="chips">${t.subjects.slice(0, 3).map(x => `<span class="pill navy">${esc(subjName(subjById(x.id)))}</span>`).join('')}${t.subjects.length > 3 ? `<span class="pill gray">+${t.subjects.length - 3}</span>` : ''}</div></td>
    <td>${stars(avgRating(t.id))} <span class="small num">${avgRating(t.id).toFixed(1)}</span></td><td class="num">${D.sessions.filter(s => s.teacherId === t.id && s.status === 'done').length}</td><td>${t.youtube ? `<a class="yt" href="${esc(t.youtube)}" target="_blank" rel="noopener">${bicon('youtube', 16)} ${L('عرض', 'View')}</a>` : '<span class="muted">—</span>'}</td>
    <td><label class="sw"><input type="checkbox" ${t.active ? 'checked' : ''} ${can('tch.delete') ? '' : 'disabled'} onchange="tchById('${t.id}').active=this.checked;save()"><span></span></label></td>
    <td><div class="acts">${can('tch.edit') || can('tch.rates') ? `<button class="btn sm ghost" onclick="AD_teacherForm('${t.id}')">${icon('edit')} ${L('تعديل', 'Edit')}</button>` : lockedBtn('')}</div></td></tr>`).join('')}</tbody></table></div>`;
}
function AD_teacherForm(id) {
  const t = id ? tchById(id) : { name: '', nameEn: '', email: '', phone: '', youtube: '', zoom: '', bio: '', subjects: [] };
  const ed = !id || can('tch.edit'), rt = !id || can('tch.rates');
  modal(id ? L('تعديل مدرس', 'Edit teacher') : L('إضافة مدرس', 'Add teacher'), `<div class="form-grid"><div class="field"><label class="req">${L('الاسم بالعربي', 'Name (AR)')}</label><input class="input" id="at_n" value="${esc(t.name)}" ${ed ? '' : 'disabled'}></div><div class="field"><label>${L('الاسم بالإنجليزي', 'Name (EN)')}</label><input class="input" id="at_ne" value="${esc(t.nameEn || '')}" ${ed ? '' : 'disabled'}></div>
    <div class="field"><label class="req">${L('البريد (للدخول)', 'Email (login)')}</label><input class="input" id="at_e" dir="ltr" value="${esc(t.email)}" ${ed ? '' : 'disabled'}></div><div class="field"><label>${L('الموبايل (للإدارة فقط)', 'Mobile (admin only)')}</label><input class="input" id="at_p" dir="ltr" value="${esc(t.phone)}" ${ed ? '' : 'disabled'}></div></div>
    <div class="field"><label>${bicon('youtube', 14)} ${L('لينك فيديو التعريف على يوتيوب', 'Intro video YouTube link')}</label><input class="input" id="at_y" dir="ltr" value="${esc(t.youtube)}" placeholder="https://youtu.be/..." ${ed ? '' : 'disabled'}></div>
    <div class="field"><label>${L('لينك الزوم', 'Zoom link')}</label><input class="input" id="at_z" dir="ltr" value="${esc(t.zoom)}" ${ed ? '' : 'disabled'}></div>
    ${id ? `<h4 style="margin:6px 0 8px">${L('أجر المدرس لكل مادة (ر.س / حصة)', 'Teacher pay per subject (SAR / session)')} ${rt ? '' : lockedBtn('')}</h4><div class="tbl-wrap"><table class="tbl"><tbody>${t.subjects.map((x, i) => `<tr><td>${esc(subjName(subjById(x.id)))} · <span class="small muted">${stageName(subjById(x.id).stage)}</span></td><td style="width:130px"><input class="input at_r" data-i="${i}" type="number" value="${x.rate}" ${rt ? '' : 'disabled'}></td></tr>`).join('')}</tbody></table></div>
    <label class="row small" style="margin-top:10px"><input type="checkbox" id="at_lock" ${t.rateLocked ? 'checked' : ''} ${rt ? '' : 'disabled'}> ${L('قفل تعديل الأجر من حساب المدرس', 'Lock rate editing from the teacher account')}</label>` : `<div class="notice info">${L('المدرس هيختار مواده ويكتب أجره من بوابته بعد أول دخول. كلمة المرور المؤقتة: 123456', 'The teacher picks subjects and rates from their portal after first login. Temp password: 123456')}</div>`}`,
    `<button class="btn gold" onclick="AD_saveTeacher('${id || ''}')">${L('حفظ', 'Save')}</button>`, { wide: true });
}
function AD_saveTeacher(id) {
  const f = { name: val('at_n'), nameEn: val('at_ne'), email: val('at_e'), phone: val('at_p'), youtube: val('at_y'), zoom: val('at_z') };
  if (!f.name || !f.email) return toast(L('الاسم والبريد مطلوبين', 'Name and email required'), 'bad');
  if (id) { const t = tchById(id); if (can('tch.edit')) Object.assign(t, f); if (can('tch.rates')) { document.querySelectorAll('.at_r').forEach(inp => t.subjects[+inp.dataset.i].rate = +inp.value); t.rateLocked = $('#at_lock')?.checked; } }
  else D.teachers.push({ id: uid('t'), ...f, bio: '', bioEn: '', color: PAL[D.teachers.length % PAL.length], subjects: [], active: true, camera: true });
  save(); closeModal(); render(); toast(L('تم الحفظ', 'Saved'), 'ok');
}

/* ---------- schedule ---------- */
function AD_schedule() {
  const ev = {}; D.sessions.filter(s => s.status !== 'cancelled' && (AD.schedT === 'all' || s.teacherId === AD.schedT) && (s.status !== 'open' || AD.schedT !== 'all')).forEach(s => (ev[ymd(s.start)] = ev[ymd(s.start)] || []).push({ cls: s.status, t: fmtTime(s.start) + ' ' + (s.status === 'open' ? L('متاح', 'free') : (tName(tchById(s.teacherId)).split(' ').slice(0, 2).join(' '))), title: `${tName(tchById(s.teacherId))} · ${stuById(s.studentId)?.name || ''} · ${subjName(subjById(s.subjectId))}` }));
  const late = D.sessions.filter(s => s.status === 'booked' && sEnd(s) < Date.now());
  return `<div class="page-h"><div><div class="crumbs">${L('الأكاديمية', 'Academy')}</div><h1>${L('جداول الحصص', 'Schedules')}</h1></div><select class="input" style="width:auto" onchange="AD.schedT=this.value;render()"><option value="all">${L('كل المدرسين (الحصص المحجوزة)', 'All teachers (booked)')}</option>${D.teachers.map(t => `<option value="${t.id}" ${AD.schedT === t.id ? 'selected' : ''}>${esc(tName(t))}</option>`).join('')}</select></div>
  ${late.length ? `<div class="notice warn" style="margin-bottom:14px">${icon('clock')} <b class="num">${late.length}</b> ${L('حصة انتهت والمدرس لم يسجّل الحضور:', 'ended sessions without attendance:')} ${late.slice(0, 4).map(s => esc(tName(tchById(s.teacherId)))).join('، ')}</div>` : ''}
  <div class="card">${calNav('ACAL')}${monthCal(ACAL.y, ACAL.m, ev)}</div>`;
}
function AD_ratings() {
  return `<div class="page-h"><div><div class="crumbs">${L('الأكاديمية', 'Academy')}</div><h1>${L('تقييمات المدرسين من أولياء الأمور', 'Teacher ratings from parents')}</h1></div></div>
  <div class="grid g3">${D.teachers.map(t => { const rs = D.ratings.filter(r => r.teacherId === t.id); const a = avgRating(t.id); return `<div class="card"><div class="row" style="margin-bottom:10px"><span class="av" style="background:${t.color}">${esc(initials(t.name))}</span><div><b>${esc(tName(t))}</b><div>${stars(a)} <b class="num">${a.toFixed(1)}</b> <span class="small muted">(${rs.length})</span></div></div></div>
    ${[5, 4, 3, 2, 1].map(n => { const c = rs.filter(r => r.stars === n).length; return `<div class="row" style="gap:8px;font-size:12px"><span class="num" style="width:14px">${n}</span><div class="bar gold" style="flex:1;height:7px"><i style="width:${rs.length ? c / rs.length * 100 : 0}%"></i></div><span class="num" style="width:16px">${c}</span></div>`; }).join('')}
    ${rs.filter(r => r.comment).slice(0, 2).map(r => `<div class="small" style="margin-top:8px;padding:8px;background:var(--bg);border-radius:8px">"${esc(r.comment)}" <span class="muted">— ${esc(stuById(r.studentId)?.parent || '')}</span></div>`).join('')}</div>`; }).join('')}</div>`;
}

/* ---------- subjects ---------- */
function AD_subjects() {
  const subs = D.subjects.filter(s => s.stage === AD.subjStage); const C = countryBy('SA'), E = countryBy('EG');
  return `<div class="page-h"><div><div class="crumbs">${L('الأكاديمية', 'Academy')}</div><h1>${L('المراحل والمواد', 'Stages & subjects')}</h1><p>${L('تحكم في ظهور أي مادة للطلاب (تشغيل / إيقاف) وسعر الحصة لكل مادة', 'Control subject visibility (on/off) and the price per session')}</p></div>${AD.subjStage === 'summer' && can('cnt.summer') ? `<button class="btn gold" onclick="AD_addCourse()">${icon('plus')} ${L('كورس صيفي جديد', 'New summer course')}</button>` : ''}</div>
  <div class="tabs">${STAGES.map(s => `<button class="${AD.subjStage === s.id ? 'on' : ''}" onclick="AD.subjStage='${s.id}';render()">${s.e} ${L(s.ar, s.en)}</button>`).join('')}</div>
  <div class="tbl-wrap"><table class="tbl"><thead><tr><th>${L('المادة', 'Subject')}</th><th>${L('ظاهرة للطلاب', 'Visible')}</th><th>${L('سعر الحصة (ر.س)', 'Per session (SAR)')}</th><th>${L('سعر الحصة (ج.م)', 'Per session (EGP)')}</th><th>${L('أسعار خاصة بدول', 'Country prices')}</th><th>${L('مدرسين', 'Teachers')}</th></tr></thead><tbody>
  ${subs.map(s => `<tr><td><b>${s.icon} ${esc(subjName(s))}</b></td><td><label class="sw"><input type="checkbox" ${s.visible ? 'checked' : ''} ${can('cnt.subjects') ? '' : 'disabled'} onchange="subjById('${s.id}').visible=this.checked;save();toast(this.checked?L('المادة ظاهرة للطلاب','Subject visible'):L('المادة مخفية','Subject hidden'))"><span></span></label></td>
    <td><input class="input" type="number" style="width:100px" value="${s.pps.SAR}" ${can('fin.prices') ? '' : 'disabled'} onchange="subjById('${s.id}').pps.SAR=+this.value;save()"></td><td><input class="input" type="number" style="width:100px" value="${s.pps.EGP}" ${can('fin.prices') ? '' : 'disabled'} onchange="subjById('${s.id}').pps.EGP=+this.value;save()"></td>
    <td>${Object.keys(s.countryPps || {}).filter(k => s.countryPps[k] !== '' && s.countryPps[k] != null).map(k => `<span class="pill gold">${countryBy(k).flag} ${s.countryPps[k]} ${countryBy(k).cur}</span>`).join(' ')} ${can('fin.prices') ? `<button class="btn sm ghost" onclick="AD_countryPrices('${s.id}')">${icon('globe')} ${L('تحديد', 'Set')}</button>` : ''}</td>
    <td class="num">${D.teachers.filter(t => t.subjects.some(x => x.id === s.id)).length}</td></tr>`).join('')}</tbody></table></div>`;
}
function AD_countryPrices(sid) {
  const s = subjById(sid);
  modal(L('سعر الحصة لكل دولة', 'Per-session price by country') + ' · ' + esc(subjName(s)), `<p class="small muted" style="margin-top:0">${L('سيبها فاضية عشان السعر يتحول تلقائياً من الريال بسعر الصرف. لو كتبت رقم، الدولة دي هتشوف السعر ده بالظبط.', 'Leave empty to auto-convert from SAR by exchange rate. Enter a value to show exactly that price in that country.')}</p>
    <div class="tbl-wrap"><table class="tbl"><thead><tr><th>${L('الدولة', 'Country')}</th><th>${L('السعر التلقائي', 'Automatic')}</th><th>${L('سعر مخصص', 'Custom price')}</th></tr></thead><tbody>${D.countries.map(c => { const auto = c.cur === 'EGP' ? s.pps.EGP : s.pps.SAR * c.rate; return `<tr><td>${c.flag} ${L(c.ar, c.en)}</td><td>${money(auto, c)}</td><td><div class="row" style="gap:6px"><input class="input cp" data-c="${c.code}" type="number" step="0.001" style="width:110px" value="${s.countryPps?.[c.code] ?? ''}"><span class="small muted">${c.cur}</span></div></td></tr>`; }).join('')}</tbody></table></div>`,
    `<button class="btn gold" onclick="const s=subjById('${sid}');s.countryPps={};document.querySelectorAll('.cp').forEach(i=>{if(i.value!=='')s.countryPps[i.dataset.c]=+i.value});save();closeModal();render();toast(L('تم الحفظ','Saved'),'ok')">${L('حفظ', 'Save')}</button>`, { wide: true });
}
function AD_addCourse() {
  modal(L('كورس صيفي جديد', 'New summer course'), `<div class="form-grid"><div class="field"><label>${L('الاسم بالعربي', 'Name (AR)')}</label><input class="input" id="nc_a"></div><div class="field"><label>${L('الاسم بالإنجليزي', 'Name (EN)')}</label><input class="input" id="nc_e"></div><div class="field"><label>${L('أيقونة', 'Icon')}</label><input class="input" id="nc_i" value="⭐"></div><div class="field"><label>${L('سعر الحصة ر.س', 'SAR / session')}</label><input class="input" type="number" id="nc_s" value="60"></div><div class="field"><label>${L('سعر الحصة ج.م', 'EGP / session')}</label><input class="input" type="number" id="nc_g" value="350"></div></div>`,
    `<button class="btn gold" onclick="if(!val('nc_a'))return;D.subjects.push({id:'summer_'+uid('c'),key:'custom',stage:'summer',ar:val('nc_a'),en:val('nc_e')||val('nc_a'),icon:val('nc_i')||'⭐',visible:true,pps:{SAR:+val('nc_s'),EGP:+val('nc_g')},countryPps:{}});save();closeModal();render()">${L('إضافة', 'Add')}</button>`);
}

/* ---------- currency ---------- */
function AD_currency() {
  return `<div class="page-h"><div><div class="crumbs">${L('الإعدادات', 'Settings')}</div><h1>${L('الأسعار والعملات', 'Prices & currencies')}</h1><p>${L('اختار طريقة عرض العملة للعملاء، وحدّث أسعار الصرف', 'Choose how currency is shown to customers and update exchange rates')}</p></div></div>
  <div class="card"><h3 style="margin-bottom:12px">${L('عملة العرض للعملاء', 'Customer display currency')}</h3>
    <div class="grid g3">${[['auto', L('تلقائي حسب دولة العميل (IP)', 'Automatic by visitor country (IP)'), L('إماراتي يشوف درهم، كويتي يشوف دينار، عماني يشوف ريال عماني…', 'UAE sees AED, Kuwait sees KWD, Oman sees OMR…')], ['SAR', L('ريال سعودي دايماً', 'Always SAR'), L('كل العملاء يشوفوا بالريال', 'Everyone sees SAR')], ['EGP', L('جنيه مصري دايماً', 'Always EGP'), L('كل العملاء يشوفوا بالجنيه', 'Everyone sees EGP')]].map(([k, l, d]) => `<label class="card" style="cursor:pointer;margin:0;${D.settings.displayCur === k ? 'border-color:var(--gold);box-shadow:0 0 0 2px rgba(212,161,42,.3)' : ''}"><div class="row"><input type="radio" name="dc" ${D.settings.displayCur === k ? 'checked' : ''} onchange="D.settings.displayCur='${k}';save();render()"><b>${l}</b></div><div class="small muted" style="margin-top:4px">${d}</div></label>`).join('')}</div>
    <div class="notice info" style="margin-top:14px">${icon('globe')} <div>${L('في النسخة الحقيقية الدولة بتتحدد من الـ IP. للتجربة هنا اختار دولة الزائر:', 'In production the country is detected from IP. For this demo, choose the visitor country:')} <select class="input" style="width:auto;display:inline-block;padding:4px 8px" onchange="VISITOR_COUNTRY=this.value;D.students.forEach(()=>0);toast(L('دولة الزائر: ','Visitor country: ')+this.options[this.selectedIndex].text)">${D.countries.map(c => `<option value="${c.code}" ${VISITOR_COUNTRY === c.code ? 'selected' : ''}>${c.flag} ${L(c.ar, c.en)}</option>`).join('')}</select><div class="tiny">${L('حساب الطالب المسجّل بيستخدم الدولة المسجّلة في ملفه.', 'Logged-in students use the country in their profile.')}</div></div></div></div>
  <div class="card"><h3 style="margin-bottom:4px">${L('الدول وأسعار الصرف', 'Countries & exchange rates')}</h3><div class="small muted" style="margin-bottom:12px">${L('سعر الصرف = قيمة 1 ريال سعودي بعملة الدولة. مصر بتستخدم سعر الجنيه المحدد لكل مادة مباشرة.', 'Rate = value of 1 SAR in that currency. Egypt uses the EGP price set per subject directly.')}</div>
    <div class="tbl-wrap"><table class="tbl"><thead><tr><th>${L('الدولة', 'Country')}</th><th>${L('العملة', 'Currency')}</th><th>${L('1 ر.س =', '1 SAR =')}</th><th>${L('مثال: حصة ثانوي 80 ر.س', 'Example: 80 SAR session')}</th></tr></thead><tbody>
    ${D.countries.map((c, i) => `<tr><td>${c.flag} ${L(c.ar, c.en)}</td><td><b>${c.cur}</b></td><td><input class="input" type="number" step="0.0001" style="width:120px" value="${c.rate}" ${c.cur === 'SAR' ? 'disabled' : ''} onchange="D.countries[${i}].rate=+this.value;save();render()"></td><td>${money(c.cur === 'EGP' ? 450 : 80 * c.rate, c)}</td></tr>`).join('')}</tbody></table></div>
    <div class="small muted" style="margin-top:10px">${L('لسعر مختلف لدولة معيّنة في مادة معيّنة: المراحل والمواد ← أسعار خاصة بدول.', 'For a custom price per country per subject: Stages & subjects → Country prices.')}</div></div>`;
}
function AD_methods() {
  return `<div class="page-h"><div><div class="crumbs">${L('الإعدادات', 'Settings')}</div><h1>${L('طرق الدفع', 'Payment methods')}</h1><p>${L('اختار طرق الدفع اللي تظهر للعملاء وبياناتها', 'Choose which payment methods customers see, and their details')}</p></div></div>
  ${D.methods.map((m, i) => `<div class="card"><div class="row between"><div class="row"><div class="stat" style="padding:0;border:none;box-shadow:none"><div class="ic ${m.on ? 'ok' : 'gold'}">${icon(m.id === 'bank' ? 'card' : 'wallet')}</div></div><div><h3>${L(m.ar, m.en)}</h3><div class="small muted">${m.on ? L('ظاهرة للعملاء', 'Visible to customers') : L('مخفية', 'Hidden')}</div></div></div><label class="sw"><input type="checkbox" ${m.on ? 'checked' : ''} onchange="D.methods[${i}].on=this.checked;save();render()"><span></span></label></div>
    <div class="field" style="margin-top:12px;margin-bottom:0"><label>${L('بيانات الدفع اللي هتظهر للعميل', 'Payment details shown to customers')}</label><textarea class="input" onchange="D.methods[${i}].details=this.value;save();toast(L('تم الحفظ','Saved'),'ok')">${esc(m.details)}</textarea></div></div>`).join('')}`;
}

/* ---------- site pages CMS ---------- */
function AD_pages() {
  if (!AD.pageSel || !D.pages.find(p => p.id === AD.pageSel)) AD.pageSel = D.pages[0]?.id;
  const p = D.pages.find(x => x.id === AD.pageSel); const lg = AD.pageLang;
  const types = [['general', L('عامة', 'General')], ['refund', L('سياسة الاسترداد والإلغاء', 'Refund policy')], ['privacy', L('سياسة الاستخدام والخصوصية', 'Privacy policy')], ['html', 'HTML Code']];
  const tb = (cmd, lbl, arg = '') => `<button type="button" class="btn sm ghost" style="padding:5px 9px" onmousedown="event.preventDefault();document.execCommand('${cmd}',false,${arg ? `'${arg}'` : 'null'})">${lbl}</button>`;
  return `<div class="page-h"><div><div class="crumbs">${L('الإعدادات', 'Settings')}</div><h1>${L('الصفحات التعريفية', 'Site pages')}</h1><p>${L('الصفحات المنشورة اللي عليها علامة "عرض في الذيل" بتظهر تلقائياً تحت في آخر الموقع', 'Published pages marked “show in footer” appear automatically at the bottom of the site')}</p></div><button class="btn gold" onclick="AD_newPage()">${icon('plus')} ${L('صفحة جديدة', 'New page')}</button></div>
  <div class="grid" style="grid-template-columns:280px 1fr;align-items:start" id="cmsg">
    <div class="card" style="padding:8px">${D.pages.map(x => `<div onclick="AD.pageSel='${x.id}';render()" style="padding:12px;border-radius:10px;cursor:pointer;${x.id === AD.pageSel ? 'background:var(--navy-soft);border-inline-start:3px solid var(--navy)' : ''}"><div class="row between"><b>${esc(x.title[LANG] || x.title.ar)}</b>${statusPill(x.status)}</div><div class="tiny muted">${types.find(t => t[0] === x.type)?.[1]} ${x.footer ? '· ' + L('في الذيل', 'in footer') : ''}</div></div>`).join('')}</div>
    ${p ? `<div class="card"><div class="row between" style="margin-bottom:14px"><div class="row"><button class="btn sm ghost" onclick="openPage('${p.slug}')">${icon('eye')} ${L('زيارة الصفحة', 'Visit page')}</button><select class="input" style="width:auto" onchange="AD_pageSet('status',this.value)"><option value="published" ${p.status === 'published' ? 'selected' : ''}>● ${L('منشور', 'Published')}</option><option value="draft" ${p.status === 'draft' ? 'selected' : ''}>● ${L('مسودة', 'Draft')}</option></select></div>
      <div class="row"><span class="small muted">${L('لغة التحرير', 'Editing language')}</span><div class="tabs" style="margin:0;padding:3px"><button class="${lg === 'ar' ? 'on' : ''}" onclick="AD_savePageBody();AD.pageLang='ar';render()">AR</button><button class="${lg === 'en' ? 'on' : ''}" onclick="AD_savePageBody();AD.pageLang='en';render()">EN</button></div></div></div>
      <div class="field"><label class="req">${L('عنوان الصفحة', 'Page title')} (${lg.toUpperCase()})</label><input class="input" value="${esc(p.title[lg] || '')}" dir="${lg === 'ar' ? 'rtl' : 'ltr'}" onchange="D.pages.find(x=>x.id==='${p.id}').title['${lg}']=this.value;save();render()"></div>
      <div class="form-grid"><div class="field"><label>${L('رابط الصفحة', 'Slug')}</label><input class="input" dir="ltr" value="${esc(p.slug)}" onchange="AD_pageSet('slug',this.value.toLowerCase().replace(/[^a-z0-9-]/g,'-'))"></div><div class="field"><label>${L('وصف SEO', 'SEO description')}</label><input class="input" value="${esc(p.seo?.desc || '')}" onchange="AD_pageSet('seo',{desc:this.value})"></div></div>
      <div class="field"><label>${L('نوع الصفحة', 'Page type')}</label><div class="chips">${types.map(([k, l]) => `<button class="btn sm ${p.type === k ? '' : 'ghost'}" onclick="AD_savePageBody();AD_pageSet('type','${k}')">${l}</button>`).join('')}</div></div>
      <div class="field"><label class="req">${L('محتوى الصفحة', 'Page content')} (${lg.toUpperCase()})</label>
        ${p.type === 'html' ? `<textarea class="input" id="pg_body" dir="ltr" style="min-height:280px;font-family:monospace;font-size:12.5px">${esc(p.body[lg] || '')}</textarea>` : `<div style="border:1px solid var(--line);border-radius:10px;overflow:hidden"><div class="row" style="gap:4px;padding:6px;border-bottom:1px solid var(--line);background:#FAFBFE">${tb('bold', '<b>B</b>')}${tb('italic', '<i>I</i>')}${tb('underline', '<u>U</u>')}${tb('formatBlock', 'H2', 'H2')}${tb('formatBlock', 'H3', 'H3')}${tb('formatBlock', '¶', 'P')}${tb('insertUnorderedList', '• ' + L('قائمة', 'List'))}${tb('insertOrderedList', '1. ' + L('مرقمة', 'Numbered'))}<button type="button" class="btn sm ghost" style="padding:5px 9px" onmousedown="event.preventDefault();const u=window.__lnk||'https://';document.execCommand('createLink',false,u)">${icon('link')}</button>${tb('removeFormat', 'Tx')}</div>
          <div id="pg_body" contenteditable="true" dir="${lg === 'ar' ? 'rtl' : 'ltr'}" class="page-body" style="min-height:280px;padding:16px;outline:none">${p.body[lg] || ''}</div></div>`}</div>
      <label class="row" style="align-items:flex-start;margin:6px 0 14px"><input type="checkbox" ${p.footer ? 'checked' : ''} onchange="AD_pageSet('footer',this.checked)" style="margin-top:4px;accent-color:var(--navy);width:18px;height:18px"><div><b>${L('عرض رابط الصفحة في ذيل الموقع', 'Show page link in site footer')}</b><div class="tiny muted">${L('عند التفعيل سيظهر رابط الصفحة في ذيل الموقع (لو الصفحة منشورة).', 'When enabled the link appears in the site footer (if the page is published).')}</div></div></label>
      <div class="row between"><button class="btn bad ghost sm" onclick="confirmBox(L('حذف الصفحة؟','Delete page?'),()=>{D.pages=D.pages.filter(x=>x.id!=='${p.id}');AD.pageSel=null;save();render()},L('حذف','Delete'))">${icon('trash')} ${L('حذف', 'Delete')}</button><button class="btn" onclick="AD_savePageBody(true)">${L('حفظ المحتوى', 'Save content')}</button></div></div>` : ''}
  </div><style>@media(max-width:1000px){#cmsg{grid-template-columns:1fr!important}}.page-body h2{margin:14px 0 6px}.page-body h3{margin:12px 0 6px}</style>
  <div class="card sec"><h3 style="margin-bottom:8px">${L('معاينة الذيل', 'Footer preview')}</h3><div style="margin:0 -18px -18px;overflow:hidden;border-radius:0 0 14px 14px">${footerHTML()}</div></div>`;
}
function AD_pageSet(k, v) { const p = D.pages.find(x => x.id === AD.pageSel); p[k] = v; p.updated = new Date().toISOString(); save(); render(); }
function AD_savePageBody(notify) { const p = D.pages.find(x => x.id === AD.pageSel); const el = $('#pg_body'); if (!p || !el) return; p.body[AD.pageLang] = el.tagName === 'TEXTAREA' ? el.value : el.innerHTML; p.updated = new Date().toISOString(); save(); if (notify) toast(L('تم حفظ المحتوى', 'Content saved'), 'ok'); }
function AD_newPage() { const p = { id: uid('pg'), slug: 'page-' + Math.random().toString(36).slice(2, 6), type: 'general', title: { ar: 'صفحة جديدة', en: 'New page' }, body: { ar: '<p>اكتب المحتوى هنا…</p>', en: '<p>Write content here…</p>' }, status: 'draft', footer: true, seo: { desc: '' }, updated: new Date().toISOString() }; D.pages.push(p); AD.pageSel = p.id; save(); render(); }

/* ---------- social ---------- */
function AD_social() {
  const f = [['facebook', 'Facebook'], ['instagram', 'Instagram'], ['x', 'X (Twitter)'], ['tiktok', 'TikTok'], ['youtube', 'YouTube'], ['linkedin', 'LinkedIn']];
  return `<div class="page-h"><div><div class="crumbs">${L('الإعدادات', 'Settings')}</div><h1>${L('السوشيال وبيانات التواصل', 'Social & contact')}</h1><p>${L('الروابط دي بتظهر في ذيل الموقع. سيب الخانة فاضية لإخفاء الأيقونة.', 'These links appear in the site footer. Leave empty to hide an icon.')}</p></div></div>
  <div class="grid g2" style="align-items:start"><div class="card"><h3 style="margin-bottom:12px">${L('حسابات السوشيال', 'Social accounts')}</h3>${f.map(([k, l]) => `<div class="field"><label>${bicon(k, 14)} ${l}</label><input class="input" dir="ltr" value="${esc(D.social[k] || '')}" placeholder="https://" onchange="D.social['${k}']=this.value.trim();save();render()"></div>`).join('')}</div>
  <div><div class="card"><h3 style="margin-bottom:12px">${L('بيانات التواصل', 'Contact details')}</h3><div class="field"><label>${bicon('whatsapp', 14)} ${L('رقم الواتساب', 'WhatsApp number')}</label><input class="input" dir="ltr" value="${esc(D.social.whatsapp)}" onchange="D.social.whatsapp=this.value.trim();save();render()"></div><div class="field"><label>${L('رقم الهاتف', 'Phone')}</label><input class="input" dir="ltr" value="${esc(D.social.phone)}" onchange="D.social.phone=this.value.trim();save();render()"></div><div class="field"><label>${L('البريد الإلكتروني', 'Email')}</label><input class="input" dir="ltr" value="${esc(D.social.email)}" onchange="D.social.email=this.value.trim();save();render()"></div></div>
  <div class="card"><h3 style="margin-bottom:12px">${L('نبذة الذيل', 'Footer about text')}</h3><div class="field"><label>AR</label><textarea class="input" onchange="D.footerAbout.ar=this.value;save()">${esc(D.footerAbout.ar)}</textarea></div><div class="field"><label>EN</label><textarea class="input" dir="ltr" onchange="D.footerAbout.en=this.value;save()">${esc(D.footerAbout.en)}</textarea></div></div></div></div>`;
}

/* ---------- permissions ---------- */
function AD_perms() {
  return `<div class="page-h"><div><div class="crumbs">${L('الإعدادات', 'Settings')}</div><h1>${L('الصلاحيات', 'Permissions')}</h1><p>${L('كل صلاحية تشغيل / إيقاف لكل مستوى. التغيير بيتطبق فوراً على كل المستخدمين في المستوى ده.', 'Each permission is on/off per role and applies immediately to everyone in that role.')}</p></div><button class="btn ghost" onclick="confirmBox(L('إرجاع الصلاحيات المقترحة؟','Restore suggested permissions?'),()=>{D.perms=defaultPerms();save();render();toast(L('تم','Done'),'ok')})">${L('إرجاع الإعدادات المقترحة', 'Restore suggested')}</button></div>
  <div class="notice gold" style="margin-bottom:14px">${icon('shield')}<div><b>${L('الإعدادات المقترحة:', 'Suggested setup:')}</b> ${L('المدرس يضيف طلاب ويسجّل حضور ويصحح ويقيّم، لكن مايعدّلش ولا يحذف طالب ولا يغيّر تقييم بعد حفظه ولا يشوف أي بيانات مالية. المشرف بيراقب المحادثات ويعدّل التقييمات. مدير المدرسة بيضيف المدرسين ويعتمد المدفوعات. الرئيس التنفيذي بس اللي يشوف صافي الربح ويعدّل الأسعار والصلاحيات.', 'Teachers add students, take attendance, grade and evaluate, but cannot edit/delete students, change saved evaluations or see finances. Supervisors monitor chats and edit evaluations. Principals add teachers and approve payments. Only the CEO sees net profit and edits prices and permissions.')}</div></div>
  <div class="tbl-wrap"><table class="tbl perm-tbl"><thead><tr><th>${L('الصلاحية', 'Permission')}</th>${ROLES.map(r => `<th class="c">${L(r.ar, r.en)}</th>`).join('')}</tr></thead><tbody>
  ${PERM_GROUPS.map(g => `<tr class="perm-grp"><td colspan="${ROLES.length + 1}">${L(g.ar, g.en)}</td></tr>` + g.items.map(([k, ar, en]) => `<tr><td>${L(ar, en)}</td>${ROLES.map(r => { const locked = r.id === 'ceo' && k === 'sys.perms'; return `<td class="c"><label class="sw"><input type="checkbox" ${D.perms[r.id][k] ? 'checked' : ''} ${locked ? 'disabled' : ''} onchange="D.perms['${r.id}']['${k}']=this.checked;save()"><span></span></label></td>`; }).join('')}</tr>`).join('')).join('')}</tbody></table></div>`;
}
function AD_staff() {
  return `<div class="page-h"><div><div class="crumbs">${L('الإعدادات', 'Settings')}</div><h1>${L('حسابات الإدارة', 'Admin accounts')}</h1></div><button class="btn gold" onclick="AD_staffForm()">${icon('plus')} ${L('إضافة حساب', 'Add account')}</button></div>
  <div class="tbl-wrap"><table class="tbl"><thead><tr><th>${L('الاسم', 'Name')}</th><th>${L('البريد', 'Email')}</th><th>${L('المستوى', 'Role')}</th><th>${L('الحالة', 'Status')}</th><th></th></tr></thead><tbody>
  ${D.staff.map(s => `<tr><td><b>${esc(s.name)}</b></td><td dir="ltr" style="text-align:start">${esc(s.email)}</td><td><select class="input" style="width:auto" ${s.role === 'ceo' && D.staff.filter(x => x.role === 'ceo').length === 1 ? 'disabled' : ''} onchange="D.staff.find(x=>x.id==='${s.id}').role=this.value;save()">${ROLES.filter(r => r.id !== 'teacher').map(r => `<option value="${r.id}" ${s.role === r.id ? 'selected' : ''}>${L(r.ar, r.en)}</option>`).join('')}</select></td><td><span class="pill ok">${L('نشط', 'Active')}</span></td><td>${s.role !== 'ceo' ? `<button class="btn sm bad ghost" onclick="D.staff=D.staff.filter(x=>x.id!=='${s.id}');save();render()">${icon('trash')}</button>` : ''}</td></tr>`).join('')}
  <tr><td colspan="5" class="small muted">${L('المدرسين ليهم بوابة منفصلة وبيتضافوا من صفحة المدرسين.', 'Teachers have a separate portal and are added from the Teachers page.')}</td></tr></tbody></table></div>`;
}
function AD_staffForm() { modal(L('حساب إدارة جديد', 'New admin account'), `<div class="field"><label>${L('الاسم', 'Name')}</label><input class="input" id="sf_n"></div><div class="field"><label>${L('البريد', 'Email')}</label><input class="input" dir="ltr" id="sf_e"></div><div class="field"><label>${L('المستوى', 'Role')}</label><select class="input" id="sf_r">${ROLES.filter(r => r.id !== 'teacher').map(r => `<option value="${r.id}">${L(r.ar, r.en)}</option>`).join('')}</select></div>`, `<button class="btn gold" onclick="if(!val('sf_n')||!val('sf_e'))return;D.staff.push({id:uid('a'),name:val('sf_n'),email:val('sf_e'),role:val('sf_r')});save();closeModal();render()">${L('إضافة', 'Add')}</button>`); }

/* ---------- monitoring ---------- */
function AD_monitor() {
  const blocked = D.messages.filter(m => m.blocked).sort((a, b) => b.at.localeCompare(a.at));
  const threads = [...new Set(D.messages.map(m => m.thread))];
  const who = id => stuById(id) ? stuById(id).parent + ' (' + L('ولي أمر', 'parent') + ')' : tName(tchById(id)) + ' (' + L('مدرس', 'teacher') + ')';
  return `<div class="page-h"><div><div class="crumbs">${L('المراقبة', 'Monitoring')}</div><h1>${L('مراقبة المحادثات', 'Chat monitor')}</h1><p>${L('أي محاولة لمشاركة رقم تليفون أو إيميل أو حساب تواصل بتتحجب وبتظهر هنا', 'Any attempt to share a phone, email or social handle is blocked and listed here')}</p></div></div>
  <div class="card"><h3 style="margin-bottom:12px">${icon('ban')} ${L('محاولات محجوبة', 'Blocked attempts')} <span class="pill bad num">${blocked.length}</span></h3>
    <div class="tbl-wrap"><table class="tbl"><thead><tr><th>${L('المرسل', 'Sender')}</th><th>${L('المحادثة', 'Thread')}</th><th>${L('الرسالة الأصلية', 'Original message')}</th><th>${L('التوقيت', 'Time')}</th><th></th></tr></thead><tbody>
    ${blocked.map(m => { const [s, t] = m.thread.split('|'); return `<tr><td><b>${esc(who(m.by || m.from))}</b></td><td class="small">${esc(stuById(s)?.name)} ↔ ${esc(tName(tchById(t)))}</td><td class="small" style="color:var(--bad)">${esc(m.original || '')}</td><td class="num small">${fmtDT(m.at)}</td><td>${m.reviewed ? `<span class="pill gray">${L('تمت المراجعة', 'Reviewed')}</span>` : `<button class="btn sm ghost" onclick="D.messages.find(x=>x.id==='${m.id}').reviewed=true;save();render()">${L('تمت المراجعة', 'Mark reviewed')}</button>`}</td></tr>`; }).join('') || `<tr><td colspan="5">${emptyBox(L('لا توجد محاولات', 'No attempts'), 'shield')}</td></tr>`}</tbody></table></div></div>
  <div class="card"><h3 style="margin-bottom:12px">${L('كل المحادثات', 'All conversations')}</h3>${threads.map(th => { const [s, t] = th.split('|'); const ms = D.messages.filter(m => m.thread === th && !m.blocked); return `<details style="border:1px solid var(--line);border-radius:10px;padding:10px 14px;margin-bottom:8px"><summary style="cursor:pointer"><b>${esc(stuById(s)?.parent)} (${esc(stuById(s)?.name)})</b> ↔ <b>${esc(tName(tchById(t)))}</b> <span class="small muted num">· ${ms.length} ${L('رسالة', 'msgs')}</span></summary><div style="margin-top:10px;display:flex;flex-direction:column;gap:6px">${ms.map(m => `<div class="msg ${m.from === t ? 'me' : ''}" style="max-width:85%">${esc(m.text)}<time class="num">${fmtDT(m.at)}</time></div>`).join('')}</div></details>`; }).join('')}</div>`;
}
function AD_emails() {
  refreshEmailStatus();
  const types = [['all', L('الكل', 'All')], ['reminder', L('تذكير قبل الحصة', 'Session reminders')], ['confirm', L('تأكيد البريد', 'Email confirmation')], ['payment', L('المدفوعات', 'Payments')]];
  const list = D.emails.filter(e => AD.emailType === 'all' || e.type === AD.emailType).sort((a, b) => b.at.localeCompare(a.at)).slice(0, 80);
  return `<div class="page-h"><div><div class="crumbs">${L('المراقبة', 'Monitoring')}</div><h1>${L('سجل الإيميلات', 'Email log')}</h1><p>${L('إيميل التذكير بيتبعت تلقائياً قبل كل حصة بـ', 'Reminder emails go out automatically')} <b class="num">${D.settings.reminderMin}</b> ${L('دقايق فيه لينك الحصة – إثبات إن الطالب استلم اللينك', 'minutes before each session with the link – proof the student received it')}</p></div></div>
  <div class="tabs">${types.map(([k, l]) => `<button class="${AD.emailType === k ? 'on' : ''}" onclick="AD.emailType='${k}';render()">${l}</button>`).join('')}</div>
  <div class="tbl-wrap"><table class="tbl"><thead><tr><th>${L('إلى', 'To')}</th><th>${L('الموضوع', 'Subject')}</th><th>${L('موعد الإرسال', 'Send time')}</th><th>${L('الحالة', 'Status')}</th><th></th></tr></thead><tbody>
  ${list.map(e => `<tr><td dir="ltr" class="small" style="text-align:start">${esc(e.to)}</td><td>${esc(e.subject)}</td><td class="num small">${fmtDT(e.at)}</td><td>${statusPill(e.status)}</td><td><button class="btn sm ghost" onclick="AD_viewEmail('${e.id}')">${icon('eye')}</button></td></tr>`).join('')}</tbody></table></div>`;
}
function AD_viewEmail(id) { const e = D.emails.find(x => x.id === id); modal(L('معاينة الإيميل', 'Email preview'), `<div class="mail"><div class="mh"><div class="small">From: NEXIUM FUTURA ACADEMY &lt;no-reply@nexium.academy&gt;</div><div class="small" dir="ltr">To: ${esc(e.to)}</div><b>${esc(e.subject)}</b></div><div class="mb" style="white-space:pre-line">${esc(e.body)}</div></div><div class="small muted num" style="margin-top:8px">${statusPill(e.status)} ${fmtDT(e.at)}</div>`); }
