/* ================= TEACHER PORTAL ================= */
const TCAL = { y: new Date().getFullYear(), m: new Date().getMonth() };
const TS = { filter: 'upcoming' };

function teacherShell(u) {
  const pendingHW = D.homework.filter(h => h.grade == null && D.sessions.find(s => s.id === h.sessionId)?.teacherId === u.id).length;
  const unread = D.messages.filter(m => m.thread.endsWith('|' + u.id) && m.from !== u.id && !m.blocked && !m.readT).length;
  const items = [
    { grp: L('اليوم', 'Today') }, { v: 'home', i: 'home', t: L('الرئيسية', 'Dashboard') },
    { v: 'sessions', i: 'video', t: L('الحصص والحضور', 'Sessions & attendance') },
    { v: 'availability', i: 'calPlus', t: L('مواعيدي المتاحة', 'My availability') },
    { grp: L('الطلاب', 'Students') }, { v: 'students', i: 'users', t: L('طلابي', 'My students') },
    { v: 'homework', i: 'file', t: L('الواجبات', 'Homework'), b: pendingHW || '' },
    { v: 'evals', i: 'chart', t: L('التقييم والشهادات', 'Evaluation & certificates') },
    { v: 'chat', i: 'chat', t: L('رسائل أولياء الأمور', 'Parent messages'), b: unread || '' },
    { grp: L('حسابي', 'Account') }, { v: 'subjects', i: 'book', t: L('موادي وأجري', 'My subjects & pay') },
    { v: 'earnings', i: 'wallet', t: L('مستحقاتي', 'My earnings') }, { v: 'settings', i: 'gear', t: L('ملفي الشخصي', 'My profile') },
  ];
  const views = { home: T_home, sessions: T_sessions, availability: T_avail, students: T_students, homework: T_homework, evals: T_evals, chat: T_chat, subjects: T_subjects, earnings: T_earnings, settings: T_profile };
  return `${headerHTML(u)}<div class="shell">${sideHTML(items, `<b>${esc(tName(u))}</b>${L('بوابة المدرس', 'Teacher portal')} · ${stars(avgRating(u.id))}`)}<main class="main">${(views[APP.view] || T_home)(u)}</main></div>`;
}
const myStudents = tid => { const ids = new Set(D.sessions.filter(s => s.teacherId === tid && s.studentId).map(s => s.studentId)); (tchById(tid).addedStudents || []).forEach(i => ids.add(i)); return [...ids].map(stuById).filter(Boolean); };
function teacherEarn(tid) {
  const t = tchById(tid); const done = D.sessions.filter(s => s.teacherId === tid && s.status === 'done');
  const rate = sid => (t.subjects.find(x => x.id === sid) || {}).rate || 0;
  const earned = done.reduce((a, s) => a + rate(s.subjectId), 0); const paid = D.payouts.filter(p => p.teacherId === tid).reduce((a, p) => a + p.amount, 0);
  return { earned, paid, due: earned - paid, done: done.length, rate };
}

function T_home(u) {
  const mine = D.sessions.filter(s => s.teacherId === u.id);
  const today = mine.filter(s => s.status === 'booked' && ymd(s.start) === ymd(new Date())).sort((a, b) => a.start.localeCompare(b.start));
  const next = mine.filter(s => s.status === 'booked' && sEnd(s) > Date.now()).sort((a, b) => a.start.localeCompare(b.start)).slice(0, 6);
  const needAtt = mine.filter(s => s.status === 'booked' && sEnd(s) < Date.now());
  const e = teacherEarn(u.id);
  return `<div class="page-h"><div><div class="crumbs">${L('بوابة المدرس', 'Teacher portal')}</div><h1>${L('أهلاً', 'Welcome')} ${esc(tName(u))}</h1><p>${L('عندك', 'You have')} <b class="num">${today.length}</b> ${L('حصة النهارده', 'sessions today')}</p></div><button class="btn gold" onclick="go('availability')">${icon('calPlus')} ${L('إضافة مواعيد', 'Add times')}</button></div>
  <div class="grid g4"><div class="stat"><div class="ic navy">${icon('users')}</div><div><div class="v num">${myStudents(u.id).length}</div><div class="l">${L('طالب', 'Students')}</div></div></div>
    <div class="stat"><div class="ic ok">${icon('check')}</div><div><div class="v num">${e.done}</div><div class="l">${L('حصة تمت', 'Sessions done')}</div></div></div>
    <div class="stat"><div class="ic gold">${icon('star')}</div><div><div class="v num">${avgRating(u.id) ? avgRating(u.id).toFixed(1) : '—'}</div><div class="l">${L('تقييم أولياء الأمور', 'Parent rating')}</div></div></div>
    <div class="stat"><div class="ic info">${icon('wallet')}</div><div><div class="v">${money(e.due, countryBy('SA'))}</div><div class="l">${L('مستحقات متبقية', 'Due to you')}</div></div></div></div>
  ${needAtt.length ? `<div class="notice warn sec">${icon('clock')} <div>${L('في', 'There are')} <b class="num">${needAtt.length}</b> ${L('حصص خلصت ومحتاجة تسجيل حضور/غياب.', 'finished sessions that need attendance.')} <button class="btn link" onclick="TS.filter='past';go('sessions')">${L('سجّل الآن', 'Mark now')}</button></div></div>` : ''}
  <div class="card sec"><div class="card-h"><h2>${L('الحصص القادمة', 'Upcoming sessions')}</h2><button class="btn sm ghost" onclick="go('sessions')">${L('كل الحصص', 'All sessions')}</button></div>
    ${next.length ? next.map(s => sessCard(s, 'teacher')).join('') : emptyBox(L('لا توجد حصص قادمة', 'No upcoming sessions'))}</div>`;
}

/* ---------- sessions & attendance ---------- */
function T_sessions(u) {
  const now = Date.now(); let list = D.sessions.filter(s => s.teacherId === u.id && s.status !== 'open');
  list = TS.filter === 'upcoming' ? list.filter(s => sEnd(s) > now && s.status === 'booked').sort((a, b) => a.start.localeCompare(b.start)) : list.filter(s => sEnd(s) <= now || s.status !== 'booked').sort((a, b) => b.start.localeCompare(a.start));
  return `<div class="page-h"><div><div class="crumbs">${L('بوابة المدرس › الحصص', 'Teacher › Sessions')}</div><h1>${L('الحصص والحضور', 'Sessions & attendance')}</h1><p>${L('سجّل الحضور والغياب، حط لينك الزوم، وأضف أهداف الحصة والواجب', 'Mark attendance, set the Zoom link, add objectives and homework')}</p></div>
    ${can('ses.assign') ? `<button class="btn gold" onclick="T_assign()">${icon('plus')} ${L('إضافة طالب على ميعاد', 'Assign student to a time')}</button>` : lockedBtn(L('إضافة طالب على ميعاد', 'Assign student'))}</div>
  <div class="tabs"><button class="${TS.filter === 'upcoming' ? 'on' : ''}" onclick="TS.filter='upcoming';render()">${L('القادمة', 'Upcoming')}</button><button class="${TS.filter === 'past' ? 'on' : ''}" onclick="TS.filter='past';render()">${L('السابقة', 'Past')}</button></div>
  <div class="tbl-wrap"><table class="tbl"><thead><tr><th>${L('الموعد', 'Time')}</th><th>${L('الطالب', 'Student')}</th><th>${L('المادة', 'Subject')}</th><th>${L('لينك الزوم', 'Zoom link')}</th><th>${L('الحالة', 'Status')}</th><th>${L('إجراءات', 'Actions')}</th></tr></thead><tbody>
  ${list.map(s => { const st = stuById(s.studentId); const ended = sEnd(s) <= now; return `<tr><td class="num"><b>${fmtDateShort(s.start)}</b><div class="small muted">${fmtTime(s.start)}</div></td><td>${esc(st?.name || '—')}<div class="tiny muted">${st ? gradeName(st.grade) : ''}</div></td><td>${esc(subjName(subjById(s.subjectId)))}</td>
    <td><a class="small" href="${esc(s.zoom)}" target="_blank" rel="noopener" dir="ltr">${esc((s.zoom || '').replace('https://', '').slice(0, 24))}…</a></td><td>${statusPill(s.status)}</td>
    <td><div class="acts">${s.status === 'booked' ? (can('ses.attend') ? `<button class="btn sm ok" ${ended || new Date(s.start).getTime() < now ? '' : 'disabled title="' + L('بعد بداية الحصة', 'after start') + '"'} onclick="T_attend('${s.id}','done')">${icon('check')} ${L('حضر', 'Present')}</button><button class="btn sm bad ghost" ${new Date(s.start).getTime() < now ? '' : 'disabled'} onclick="T_attend('${s.id}','absent')">${L('غاب', 'Absent')}</button>` : lockedBtn(L('الحضور', 'Attendance'))) : ''}
      <button class="btn sm ghost" onclick="T_editSession('${s.id}')">${icon('edit')} ${L('تفاصيل الحصة', 'Details')}</button>
      ${s.status === 'booked' && can('ses.cancel') ? `<button class="btn sm bad ghost" onclick="T_cancel('${s.id}')">${L('إلغاء', 'Cancel')}</button>` : ''}</div></td></tr>`; }).join('') || `<tr><td colspan="6">${emptyBox(L('لا توجد حصص', 'No sessions'))}</td></tr>`}</tbody></table></div>`;
}
function T_attend(id, st) { const s = D.sessions.find(x => x.id === id); s.status = st; s.attendedAt = new Date().toISOString(); save(); toast(st === 'done' ? L('تم تسجيل الحضور', 'Marked present') : L('تم تسجيل الغياب', 'Marked absent'), st === 'done' ? 'ok' : ''); render(); }
function T_cancel(id) { confirmBox(L('إلغاء الحصة ورجوع الحصة لرصيد الطالب؟', 'Cancel and return the session to the student’s balance?'), () => { const s = D.sessions.find(x => x.id === id); s.status = 'cancelled'; D.emails = D.emails.filter(e => e.sessionId !== id); save(); render(); toast(L('تم الإلغاء', 'Cancelled')); }); }
function T_editSession(id) {
  const s = D.sessions.find(x => x.id === id); const z = can('ses.zoom'), hw = can('hw.assign');
  modal(L('تفاصيل الحصة', 'Session details') + ` · <span class="num small">${fmtDT(s.start)}</span>`, `
    <div class="field"><label>${L('لينك الزوم', 'Zoom link')} ${z ? '' : lockedBtn('')}</label><input class="input" id="es_zoom" dir="ltr" value="${esc(s.zoom)}" ${z ? '' : 'disabled'}></div>
    <div class="field"><label>${L('أهداف الحصة', 'Objectives')}</label><textarea class="input" id="es_obj">${esc(s.objectives)}</textarea></div>
    <div class="field"><label>${L('مادة الحصة (اسم الملف أو لينك)', 'Material (file name or link)')}</label><input class="input" id="es_mat" value="${esc(s.material)}"></div>
    <div class="field"><label>${L('الواجب', 'Assignment')} ${hw ? '' : lockedBtn('')}</label><textarea class="input" id="es_hw" ${hw ? '' : 'disabled'}>${esc(s.assignment)}</textarea></div>
    <div class="field"><label>${L('لينك تسجيل الحصة', 'Recording link')}</label><input class="input" id="es_rec" dir="ltr" value="${esc(s.recording)}"></div>`,
    `<button class="btn ghost" onclick="closeModal()">${L('إلغاء', 'Cancel')}</button><button class="btn" onclick="T_saveSession('${id}')">${L('حفظ', 'Save')}</button>`);
}
function T_saveSession(id) {
  const s = D.sessions.find(x => x.id === id);
  const fields = { objectives: val('es_obj'), material: val('es_mat'), recording: val('es_rec') }; if (can('ses.zoom')) fields.zoom = val('es_zoom'); if (can('hw.assign')) fields.assignment = val('es_hw');
  if ([fields.objectives, fields.material, fields.assignment].some(v => v && contactViolation(v))) return toast(L('غير مسموح بكتابة بيانات تواصل', 'Contact details are not allowed'), 'bad');
  Object.assign(s, fields); if (s.studentId && s.status === 'booked') queueReminder(D, s); save(); closeModal(); toast(L('تم الحفظ', 'Saved'), 'ok'); render();
}
function T_assign() {
  const u = currentUser(); const open = freeSlots(u.id); const studs = D.students.filter(s => s.active);
  modal(L('إضافة طالب على ميعاد متاح', 'Assign a student to a free time'), open.length ? `
    <div class="field"><label>${L('الميعاد', 'Time')}</label><select class="input" id="as_slot">${open.map(s => `<option value="${s.id}">${fmtDT(s.start)}</option>`).join('')}</select></div>
    <div class="field"><label>${L('الطالب', 'Student')}</label><select class="input" id="as_stu">${studs.map(s => `<option value="${s.id}">${esc(s.name)} — ${gradeName(s.grade)}</option>`).join('')}</select></div>
    <div class="field"><label>${L('المادة', 'Subject')}</label><select class="input" id="as_sub">${u.subjects.map(x => `<option value="${x.id}">${esc(subjName(subjById(x.id)))} · ${stageName(subjById(x.id).stage)}</option>`).join('')}</select></div>
    <div class="notice info">${L('الحصة بتتخصم من باقة الطالب في المادة. لو مفيش رصيد، الإدارة هتتابع الدفع.', 'The session is deducted from the student’s package. If no balance, admin follows up payment.')}</div>` : emptyBox(L('ضيف مواعيد متاحة الأول', 'Add free times first')),
    open.length ? `<button class="btn ghost" onclick="closeModal()">${L('إلغاء', 'Cancel')}</button><button class="btn gold" onclick="T_doAssign()">${L('إضافة', 'Assign')}</button>` : '');
}
function T_doAssign() {
  const s = D.sessions.find(x => x.id === val('as_slot')); const stu = val('as_stu'), sub = val('as_sub');
  if (studentConflict(stu, new Date(s.start).getTime(), s.dur)) return toast(L('الطالب عنده حصة تانية في نفس الوقت', 'Student has another session at that time'), 'bad');
  const enr = activeEnrollment(stu, sub);
  Object.assign(s, { status: 'booked', studentId: stu, subjectId: sub, enrollmentId: enr ? enr.id : null, objectives: '', material: '', assignment: '', recording: '' }); queueReminder(D, s); save(); closeModal();
  toast(enr ? L('تمت الإضافة وإرسال تذكير للطالب', 'Assigned – reminder scheduled') : L('تمت الإضافة – الطالب ملوش رصيد في المادة دي، الإدارة هتتابع', 'Assigned – student has no balance, admin will follow up'), enr ? 'ok' : ''); render();
}

/* ---------- availability ---------- */
function T_avail(u) {
  const ev = {}; D.sessions.filter(s => s.teacherId === u.id && s.status !== 'cancelled').forEach(s => (ev[ymd(s.start)] = ev[ymd(s.start)] || []).push({ cls: s.status === 'open' ? 'open' : s.status, t: fmtTime(s.start) + (s.status === 'open' ? ' ' + L('متاح', 'free') : ' ' + (stuById(s.studentId)?.name || '')), on: s.status === 'open' ? `T_delSlot('${s.id}')` : '' }));
  const tm = new Date(); tm.setDate(tm.getDate() + 1); const AV = window.__av || { date: ymd(tm), from: '17:00', to: '20:00', dur: '60', rep: '1' };
  return `<div class="page-h"><div><div class="crumbs">${L('بوابة المدرس › مواعيدي', 'Teacher › Availability')}</div><h1>${L('مواعيدي المتاحة', 'My availability')}</h1><p>${L('ضيف الأوقات اللي تقدر تدرّس فيها. الطلاب بيشوفوا الفاضي بس، والنظام بيمنع إضافة ميعادين في نفس الوقت.', 'Add the times you can teach. Students only see free times, and the system blocks overlapping times.')}</p></div></div>
  <div class="grid" style="grid-template-columns:320px 1fr;align-items:start" id="avg">
    <div class="card">${can('ses.slots') ? `<h3 style="margin-bottom:12px">${L('إضافة ميعاد', 'Add a time')}</h3>
      <div class="field"><label>${L('التاريخ', 'Date')}</label><input type="date" class="input" id="av_date" value="${AV.date}" min="${ymd(new Date())}"></div>
      <div class="form-grid"><div class="field"><label>${L('من الساعة', 'From')}</label><input type="time" class="input" id="av_from" value="${AV.from}" step="900"></div><div class="field"><label>${L('إلى الساعة', 'To')}</label><input type="time" class="input" id="av_to" value="${AV.to}" step="900"></div></div>
      <div class="field"><label>${L('مدة الحصة', 'Session length')}</label><select class="input" id="av_dur">${[45, 60, 90, 120].map(n => `<option value="${n}" ${AV.dur == n ? 'selected' : ''}>${n} ${L('دقيقة', 'min')}</option>`).join('')}</select></div>
      <div class="field"><label>${L('تكرار أسبوعي', 'Repeat weekly')}</label><select class="input" id="av_rep">${[1, 2, 4, 8].map(n => `<option value="${n}" ${AV.rep == n ? 'selected' : ''}>${n === 1 ? L('بدون تكرار', 'No repeat') : n + ' ' + L('أسابيع', 'weeks')}</option>`).join('')}</select></div>
      <button class="btn gold block" onclick="T_addSlots()">${icon('plus')} ${L('إضافة', 'Add')}</button>
      <div id="av_msg" style="margin-top:12px"></div>` : `<div class="notice warn">${icon('lock')} ${L('الإدارة قافلة صلاحية إضافة المواعيد', 'Admin has disabled adding times')}</div>`}
      <hr class="sep"><div class="chips">${statusPill('open')} ${statusPill('booked')} ${statusPill('done')}</div><div class="tiny muted" style="margin-top:8px">${L('اضغط على ميعاد متاح في الكالندر عشان تمسحه.', 'Click a free time on the calendar to delete it.')}</div></div>
    <div class="card">${calNav('TCAL')}${monthCal(TCAL.y, TCAL.m, ev)}</div></div><style>@media(max-width:1000px){#avg{grid-template-columns:1fr!important}}</style>`;
}
function T_addSlots() {
  const u = currentUser(); const date = val('av_date'), from = val('av_from'), to = val('av_to'), dur = +val('av_dur'), rep = +val('av_rep');
  if (!date || !from || !to) return toast(L('أكمل البيانات', 'Fill all fields'), 'bad');
  window.__av = { date, from, to, dur: String(dur), rep: String(rep) };
  const [fh, fm] = from.split(':').map(Number), [th, tmn] = to.split(':').map(Number);
  if (th * 60 + tmn - (fh * 60 + fm) < dur) return toast(L('الفترة أقل من مدة الحصة', 'Range is shorter than session length'), 'bad');
  let added = 0; const clashes = [];
  for (let w = 0; w < rep; w++) {
    const base = new Date(date + 'T00:00:00'); base.setDate(base.getDate() + w * 7);
    for (let mins = fh * 60 + fm; mins + dur <= th * 60 + tmn; mins += dur) {
      const st = new Date(base); st.setHours(0, mins, 0, 0); if (st.getTime() < Date.now()) continue;
      const c = teacherConflict(u.id, st.getTime(), dur);
      if (c) { clashes.push(fmtDT(st.toISOString()) + ' ↔ ' + (c.status === 'open' ? L('ميعاد متاح موجود', 'existing free time') : L('حصة محجوزة', 'booked session'))); continue; }
      D.sessions.push({ id: uid('ss'), teacherId: u.id, subjectId: null, start: st.toISOString(), dur, studentId: null, status: 'open', zoom: u.zoom }); added++;
    }
  }
  save(); render();
  const msg = $('#av_msg'); if (msg) msg.innerHTML = `${added ? `<div class="notice ok">${icon('check')} ${L('تمت إضافة', 'Added')} <b class="num">${added}</b> ${L('ميعاد', 'times')}</div>` : ''}${clashes.length ? `<div class="notice bad" style="margin-top:8px">${icon('ban')}<div><b>${L('اترفض', 'Rejected')} <span class="num">${clashes.length}</span> ${L('ميعاد بسبب التعارض:', 'times due to clashes:')}</b><div class="tiny num">${clashes.slice(0, 5).map(esc).join('<br>')}</div></div></div>` : ''}`;
}
function T_delSlot(id) { confirmBox(L('مسح الميعاد المتاح ده؟', 'Delete this free time?'), () => { D.sessions = D.sessions.filter(s => s.id !== id); save(); render(); }, L('مسح', 'Delete')); }

/* ---------- students ---------- */
function T_students(u) {
  const st = myStudents(u.id);
  return `<div class="page-h"><div><div class="crumbs">${L('بوابة المدرس › طلابي', 'Teacher › Students')}</div><h1>${L('طلابي', 'My students')}</h1><p>${L('بيانات التواصل مع ولي الأمر مخفية – التواصل من خلال المنصة بس', 'Parent contact details are hidden – communicate through the platform only')}</p></div>
    ${can('stu.add') ? `<button class="btn gold" onclick="T_addStudent()">${icon('plus')} ${L('إضافة طالب', 'Add student')}</button>` : lockedBtn(L('إضافة طالب', 'Add student'))}</div>
  <div class="tbl-wrap"><table class="tbl"><thead><tr><th>${L('الطالب', 'Student')}</th><th>${L('الصف', 'Grade')}</th><th>${L('ولي الأمر', 'Parent')}</th><th>${L('حضر', 'Attended')}</th><th>${L('غاب', 'Absent')}</th><th>${L('إجراءات', 'Actions')}</th></tr></thead><tbody>
  ${st.map(s => { const ss = D.sessions.filter(x => x.teacherId === u.id && x.studentId === s.id); return `<tr><td><div class="row"><span class="av" style="width:30px;height:30px;font-size:12px">${esc(initials(s.name))}</span><b>${esc(s.name)}</b></div></td><td>${gradeName(s.grade)}</td><td>${esc(s.parent)} <span class="lock">${icon('lock')} ${L('الرقم مخفي', 'number hidden')}</span></td><td class="num">${ss.filter(x => x.status === 'done').length}</td><td class="num">${ss.filter(x => x.status === 'absent').length}</td>
    <td><div class="acts"><button class="btn sm ghost" onclick="CHAT_SEL='${s.id}|${u.id}';go('chat')">${icon('chat')}</button>${can('stu.edit') ? `<button class="btn sm ghost">${icon('edit')}</button>` : lockedBtn(L('تعديل', 'Edit'))}${can('stu.delete') ? `<button class="btn sm bad ghost">${icon('trash')}</button>` : lockedBtn(L('حذف', 'Delete'))}</div></td></tr>`; }).join('') || `<tr><td colspan="6">${emptyBox(L('لا يوجد طلاب', 'No students'), 'users')}</td></tr>`}</tbody></table></div>
  <div class="notice info sec">${icon('shield')} ${L('حسب إعدادات الإدارة: المدرس يقدر يضيف طالب، لكن مايقدرش يعدّل بياناته أو يحذفه.', 'Per admin settings: teachers can add students but cannot edit or delete them.')}</div>`;
}
function T_addStudent() {
  modal(L('إضافة طالب', 'Add student'), `<div class="form-grid"><div class="field"><label class="req">${L('اسم الطالب', 'Student name')}</label><input class="input" id="ts_name"></div><div class="field"><label class="req">${L('اسم ولي الأمر', 'Parent name')}</label><input class="input" id="ts_parent"></div>
    <div class="field"><label class="req">${L('بريد ولي الأمر', 'Parent email')}</label><input class="input" id="ts_email" dir="ltr"></div><div class="field"><label class="req">${L('موبايل ولي الأمر', 'Parent mobile')}</label><input class="input" id="ts_phone" dir="ltr"></div>
    <div class="field"><label>${L('الصف', 'Grade')}</label><select class="input" id="ts_grade">${STAGES.filter(s => s.id !== 'summer').map(s => `<optgroup label="${L(s.ar, s.en)}">${s.grades.map(g => `<option value="${s.id}:${g}">${gradeName(g)}</option>`).join('')}</optgroup>`).join('')}</select></div>
    <div class="field"><label>${L('الدولة', 'Country')}</label><select class="input" id="ts_c">${D.countries.map(c => `<option value="${c.code}">${c.flag} ${L(c.ar, c.en)}</option>`).join('')}</select></div></div>
    <div class="small muted">${L('هيوصل لولي الأمر إيميل لتفعيل الحساب واختيار كلمة المرور. الرقم مش هيظهر لك بعد الحفظ.', 'The parent receives an activation email. The number will be hidden from you after saving.')}</div>`,
    `<button class="btn ghost" onclick="closeModal()">${L('إلغاء', 'Cancel')}</button><button class="btn gold" onclick="T_saveStudent()">${L('إضافة', 'Add')}</button>`);
}
function T_saveStudent() {
  const u = currentUser(); const [st, g] = val('ts_grade').split(':');
  const s = { id: uid('s'), name: val('ts_name'), parent: val('ts_parent'), email: val('ts_email'), phone: val('ts_phone'), country: val('ts_c'), stage: st, grade: g, pass: '123456', confirmed: false, provider: 'email', active: true, joined: new Date().toISOString(), addedBy: u.id };
  if (!s.name || !s.parent || !s.email || s.phone.replace(/\D/g, '').length < 8) return toast(L('أكمل البيانات', 'Fill all fields'), 'bad');
  D.students.push(s); u.addedStudents = [...(u.addedStudents || []), s.id];
  D.emails.push({ id: uid('em'), to: s.email, type: 'confirm', subject: 'تفعيل حساب NEXIUM FUTURA ACADEMY', body: `مرحباً ${s.parent}، تم إنشاء حساب للطالب ${s.name}. فعّل الحساب واختر كلمة المرور.`, at: new Date().toISOString(), status: 'sent' });
  save(); closeModal(); toast(L('تمت إضافة الطالب', 'Student added'), 'ok'); render();
}

/* ---------- homework ---------- */
function T_homework(u) {
  const subs = D.homework.filter(h => D.sessions.find(s => s.id === h.sessionId)?.teacherId === u.id).sort((a, b) => (a.grade == null ? -1 : 1) - (b.grade == null ? -1 : 1) || b.at.localeCompare(a.at));
  return `<div class="page-h"><div><div class="crumbs">${L('بوابة المدرس › الواجبات', 'Teacher › Homework')}</div><h1>${L('الواجبات', 'Homework')}</h1><p>${L('الواجبات بتتضاف من "تفاصيل الحصة"، والحلول اللي الطلاب رفعوها بتظهر هنا للتصحيح', 'Assign homework from session details; student uploads appear here for grading')}</p></div></div>
  <div class="tbl-wrap"><table class="tbl"><thead><tr><th>${L('الطالب', 'Student')}</th><th>${L('الواجب', 'Assignment')}</th><th>${L('الملف', 'File')}</th><th>${L('اترفع', 'Submitted')}</th><th>${L('الدرجة', 'Grade')}</th><th></th></tr></thead><tbody>
  ${subs.map(h => { const s = D.sessions.find(x => x.id === h.sessionId); return `<tr><td><b>${esc(stuById(h.studentId)?.name)}</b><div class="tiny muted">${esc(subjName(subjById(s.subjectId)))}</div></td><td class="small">${esc(s.assignment)}</td><td>${icon('file')} ${esc(h.file)}${h.note ? `<div class="tiny muted">${esc(h.note)}</div>` : ''}</td><td class="num small">${fmtDT(h.at)}</td>
    <td>${h.grade != null ? `<b class="num">${h.grade}/${h.max}</b>` : statusPill('pending')}</td><td>${can('hw.grade') ? `<button class="btn sm ${h.grade == null ? 'gold' : 'ghost'}" onclick="T_grade('${h.id}')">${h.grade == null ? L('صحّح', 'Grade') : L('تعديل', 'Edit')}</button>` : lockedBtn('')} ${can('hw.delete') ? `<button class="btn sm bad ghost" onclick="D.homework=D.homework.filter(x=>x.id!=='${h.id}');save();render()">${icon('trash')}</button>` : ''}</td></tr>`; }).join('') || `<tr><td colspan="6">${emptyBox(L('لا توجد حلول مرفوعة', 'No submissions yet'), 'file')}</td></tr>`}</tbody></table></div>`;
}
function T_grade(id) {
  const h = D.homework.find(x => x.id === id);
  modal(L('تصحيح الواجب', 'Grade homework'), `<p class="muted" style="margin-top:0">${esc(stuById(h.studentId)?.name)} · ${esc(h.file)}</p><div class="form-grid"><div class="field"><label>${L('الدرجة', 'Grade')}</label><input class="input" type="number" min="0" id="g_v" value="${h.grade ?? ''}"></div><div class="field"><label>${L('من', 'Out of')}</label><input class="input" type="number" id="g_m" value="${h.max}"></div></div>
    <div class="field"><label>${L('ملاحظات للطالب', 'Feedback')}</label><textarea class="input" id="g_f">${esc(h.feedback)}</textarea></div>`,
    `<button class="btn gold" onclick="T_saveGrade('${id}')">${L('حفظ', 'Save')}</button>`);
}
function T_saveGrade(id) { const h = D.homework.find(x => x.id === id); const v = +val('g_v'), m = +val('g_m'); if (isNaN(v) || v < 0 || v > m) return toast(L('درجة غير صحيحة', 'Invalid grade'), 'bad'); if (contactViolation(val('g_f'))) return toast(L('غير مسموح ببيانات تواصل', 'Contact details not allowed'), 'bad'); Object.assign(h, { grade: v, max: m, feedback: val('g_f') }); save(); closeModal(); toast(L('تم التصحيح', 'Graded'), 'ok'); render(); }

/* ---------- evaluations ---------- */
function T_evals(u) {
  const pairs = []; D.sessions.filter(s => s.teacherId === u.id && s.studentId && s.subjectId).forEach(s => { if (!pairs.some(p => p.st === s.studentId && p.sub === s.subjectId)) pairs.push({ st: s.studentId, sub: s.subjectId }); });
  return `<div class="page-h"><div><div class="crumbs">${L('بوابة المدرس › التقييم', 'Teacher › Evaluation')}</div><h1>${L('التقييم والشهادات', 'Evaluation & certificates')}</h1><p>${L('التقييم بيظهر لولي الأمر في تقرير الأداء: الحضور (تلقائي) – التفاعل – الواجب – الالتزام', 'Shown to parents: attendance (automatic), engagement, homework, commitment')}</p></div></div>
  <div class="tbl-wrap"><table class="tbl"><thead><tr><th>${L('الطالب', 'Student')}</th><th>${L('المادة', 'Subject')}</th><th>${L('الحضور', 'Attendance')}</th><th>${L('التفاعل', 'Engagement')}</th><th>${L('الواجب', 'Homework')}</th><th>${L('الالتزام', 'Commitment')}</th><th>${L('الإجمالي', 'Overall')}</th><th></th></tr></thead><tbody>
  ${pairs.map(p => { const r = studentEval(p.st, p.sub); const cell = v => v == null ? '<span class="muted">—</span>' : `<b class="num">${v}%</b>`; return `<tr><td><b>${esc(stuById(p.st)?.name)}</b></td><td>${esc(subjName(subjById(p.sub)))}</td><td>${cell(r.att)}</td><td>${cell(r.ev?.interaction)}</td><td>${cell(r.ev?.homework ?? r.hwAvg)}</td><td>${cell(r.ev?.commitment)}</td><td><span class="pill ${r.overall >= 75 ? 'ok' : r.overall >= 60 ? 'warn' : 'gray'}">${r.overall == null ? '—' : r.overall + '%'}</span></td>
    <td><div class="acts">${can('ev.enter') && (!r.ev || r.ev.teacherId !== u.id || can('ev.edit')) ? `<button class="btn sm" onclick="T_evalForm('${p.st}','${p.sub}')">${r.ev && r.ev.teacherId === u.id ? L('تعديل', 'Edit') : L('تقييم', 'Evaluate')}</button>` : lockedBtn(r.ev ? L('التعديل مقفول', 'Edit locked') : '')}${can('ev.cert') ? `<button class="btn sm gold" onclick="T_cert('${p.st}')">${icon('award')}</button>` : ''}</div></td></tr>`; }).join('') || `<tr><td colspan="8">${emptyBox(L('لا يوجد طلاب', 'No students'), 'users')}</td></tr>`}</tbody></table></div>
  <div class="notice gold sec">${icon('lock')} ${L('حسب الصلاحيات: المدرس بيدخل التقييم مرة واحدة، والتعديل بعد الحفظ محتاج صلاحية من الإدارة (للحفاظ على مصداقية التقرير).', 'Per permissions: teachers enter an evaluation once; changing it after saving needs admin permission.')}</div>`;
}
function T_evalForm(st, sub) {
  const u = currentUser(); const ex = D.evals.find(e => e.studentId === st && e.subjectId === sub && e.teacherId === u.id) || { interaction: 80, homework: 80, commitment: 80, note: '' };
  const sl = (id, l, v) => `<div class="field"><label>${l}: <b class="num" id="${id}_v">${v}%</b></label><input type="range" min="0" max="100" step="5" id="${id}" value="${v}" oninput="document.getElementById('${id}_v').textContent=this.value+'%'" style="width:100%;accent-color:var(--navy)"></div>`;
  modal(L('تقييم ', 'Evaluate ') + esc(stuById(st).name), `<div class="small muted" style="margin-bottom:12px">${esc(subjName(subjById(sub)))} · ${L('نسبة الحضور بتتحسب تلقائياً:', 'Attendance is automatic:')} <b class="num">${studentEval(st, sub).att ?? '—'}%</b></div>
    ${sl('ev_i', L('التفاعل', 'Engagement'), ex.interaction)}${sl('ev_h', L('الواجب', 'Homework'), ex.homework)}${sl('ev_c', L('الالتزام', 'Commitment'), ex.commitment)}
    <div class="field"><label>${L('ملاحظة لولي الأمر', 'Note to parent')}</label><textarea class="input" id="ev_n">${esc(ex.note)}</textarea></div>`,
    `<button class="btn gold" onclick="T_saveEval('${st}','${sub}')">${L('حفظ التقييم', 'Save')}</button>`);
}
function T_saveEval(st, sub) {
  const u = currentUser(); const note = val('ev_n'); if (contactViolation(note)) return toast(L('غير مسموح ببيانات تواصل', 'Contact details not allowed'), 'bad');
  const f = { interaction: +val('ev_i'), homework: +val('ev_h'), commitment: +val('ev_c'), note, at: new Date().toISOString() };
  const ex = D.evals.find(e => e.studentId === st && e.subjectId === sub && e.teacherId === u.id);
  if (ex) Object.assign(ex, f); else D.evals.push({ id: uid('v'), studentId: st, teacherId: u.id, subjectId: sub, ...f }); save(); closeModal(); toast(L('تم الحفظ وظهر لولي الأمر', 'Saved – visible to the parent'), 'ok'); render();
}
function T_cert(st) {
  modal(L('إصدار شهادة', 'Issue certificate'), `<div class="field"><label>${L('النوع', 'Type')}</label><select class="input" id="ce_t"><option value="شهادة شكر وتقدير">${L('شهادة شكر وتقدير', 'Certificate of appreciation')}</option><option value="شهادة تفوق">${L('شهادة تفوق', 'Certificate of excellence')}</option><option value="شهادة إتمام مستوى">${L('شهادة إتمام مستوى', 'Level completion')}</option></select></div>
    <div class="field"><label>${L('السبب', 'Reason')}</label><input class="input" id="ce_r" placeholder="${L('مثال: للالتزام والتميز في شهر نوفمبر', 'e.g. for commitment and excellence in November')}"></div>`,
    `<button class="btn gold" onclick="if(!val('ce_r'))return toast(L('اكتب السبب','Enter a reason'),'bad');D.certs.push({id:uid('c'),studentId:'${st}',teacherId:currentUser().id,type:'thanks',title:val('ce_t'),reason:val('ce_r'),at:new Date().toISOString()});save();closeModal();toast(L('تم إصدار الشهادة','Certificate issued'),'ok')">${icon('award')} ${L('إصدار', 'Issue')}</button>`);
}

/* ---------- chat ---------- */
function T_chat(u) {
  if (!can('com.chat')) return `<div class="card">${emptyBox(L('الإدارة قافلة المحادثات', 'Chat is disabled by admin'), 'lock')}</div>`;
  const threads = myStudents(u.id).map(s => ({ key: s.id + '|' + u.id, name: s.parent + ' (' + s.name + ')', sub: gradeName(s.grade) }));
  setTimeout(() => { const m = $('#msgs'); if (m) m.scrollTop = m.scrollHeight; }, 0);
  return `<div class="page-h"><div><div class="crumbs">${L('بوابة المدرس › الرسائل', 'Teacher › Messages')}</div><h1>${L('رسائل أولياء الأمور', 'Parent messages')}</h1></div></div>${chatView(u.id, threads, { side: 't' })}`;
}

/* ---------- subjects & pay ---------- */
function T_subjects(u) {
  return `<div class="page-h"><div><div class="crumbs">${L('بوابة المدرس › موادي', 'Teacher › Subjects')}</div><h1>${L('موادي وأجري', 'My subjects & pay')}</h1><p>${L('اختار المواد اللي بتدرّسها، واكتب الأجر اللي بتاخده على الحصة في كل مادة (بالريال)', 'Choose the subjects you teach and your pay per session for each (SAR)')}</p></div><button class="btn gold" onclick="T_addSubject()">${icon('plus')} ${L('إضافة مادة', 'Add subject')}</button></div>
  <div class="tbl-wrap"><table class="tbl"><thead><tr><th>${L('المادة', 'Subject')}</th><th>${L('المرحلة', 'Stage')}</th><th>${L('أجري / حصة', 'My pay / session')}</th><th>${L('حصص تمت', 'Done')}</th><th></th></tr></thead><tbody>
  ${u.subjects.map((x, i) => { const s = subjById(x.id); return `<tr><td><b>${s.icon} ${esc(subjName(s))}</b>${s.visible ? '' : ` <span class="pill gray">${L('مخفية', 'hidden')}</span>`}</td><td>${stageName(s.stage)}</td><td><div class="row" style="gap:6px"><input class="input" type="number" style="width:100px" value="${x.rate}" ${u.rateLocked && !can('tch.rates') ? 'disabled' : ''} onchange="currentUser().subjects[${i}].rate=+this.value;save();toast(L('تم الحفظ','Saved'),'ok')"><span class="small muted">${L('ر.س', 'SAR')}</span></div></td>
    <td class="num">${D.sessions.filter(z => z.teacherId === u.id && z.subjectId === x.id && z.status === 'done').length}</td><td><button class="btn sm bad ghost" onclick="currentUser().subjects.splice(${i},1);save();render()">${icon('trash')}</button></td></tr>`; }).join('')}</tbody></table></div>
  <div class="notice info sec">${icon('wallet')} ${L('الأجر ده هو اللي بتتحسب بيه مستحقاتك، والإدارة بتشوف كل مدرس أخد كام وباقي له كام.', 'This rate is used to calculate your earnings; admin sees what each teacher was paid and is owed.')}</div>`;
}
function T_addSubject() {
  const u = currentUser();
  modal(L('إضافة مادة', 'Add subject'), `<div class="field"><label>${L('المادة', 'Subject')}</label><select class="input" id="tsub">${STAGES.map(st => `<optgroup label="${L(st.ar, st.en)}">${D.subjects.filter(s => s.stage === st.id && !u.subjects.some(x => x.id === s.id)).map(s => `<option value="${s.id}">${esc(subjName(s))}</option>`).join('')}</optgroup>`).join('')}</select></div>
    <div class="field"><label>${L('أجرك على الحصة (ر.س)', 'Your pay per session (SAR)')}</label><input class="input" type="number" id="trate" value="25"></div>`,
    `<button class="btn gold" onclick="currentUser().subjects.push({id:val('tsub'),rate:+val('trate')});save();closeModal();render()">${L('إضافة', 'Add')}</button>`);
}
function T_earnings(u) {
  const e = teacherEarn(u.id); const C = countryBy('SA');
  const bySub = u.subjects.map(x => { const n = D.sessions.filter(s => s.teacherId === u.id && s.subjectId === x.id && s.status === 'done').length; return { s: subjById(x.id), n, rate: x.rate, tot: n * x.rate }; }).filter(r => r.n);
  return `<div class="page-h"><div><div class="crumbs">${L('بوابة المدرس › مستحقاتي', 'Teacher › Earnings')}</div><h1>${L('مستحقاتي', 'My earnings')}</h1></div></div>
  <div class="grid g3"><div class="stat"><div class="ic navy">${icon('coin')}</div><div><div class="v">${money(e.earned, C)}</div><div class="l">${L('إجمالي المستحق', 'Total earned')}</div></div></div><div class="stat"><div class="ic ok">${icon('check')}</div><div><div class="v">${money(e.paid, C)}</div><div class="l">${L('تم صرفه', 'Paid out')}</div></div></div><div class="stat"><div class="ic gold">${icon('wallet')}</div><div><div class="v">${money(e.due, C)}</div><div class="l">${L('المتبقي لي', 'Remaining')}</div></div></div></div>
  <div class="grid g2 sec"><div class="card"><h3 style="margin-bottom:12px">${L('حسب المادة', 'By subject')}</h3><div class="tbl-wrap"><table class="tbl"><thead><tr><th>${L('المادة', 'Subject')}</th><th>${L('حصص', 'Sessions')}</th><th>${L('الأجر', 'Rate')}</th><th>${L('الإجمالي', 'Total')}</th></tr></thead><tbody>${bySub.map(r => `<tr><td>${esc(subjName(r.s))}</td><td class="num">${r.n}</td><td>${money(r.rate, C)}</td><td><b>${money(r.tot, C)}</b></td></tr>`).join('')}</tbody></table></div></div>
  <div class="card"><h3 style="margin-bottom:12px">${L('الدفعات المصروفة', 'Payouts')}</h3>${D.payouts.filter(p => p.teacherId === u.id).map(p => `<div class="row between" style="padding:8px 0;border-bottom:1px solid var(--line)"><span class="num small">${fmtDate(p.at)}</span><span class="small muted">${esc(p.note)}</span><b>${money(p.amount, C)}</b></div>`).join('') || emptyBox(L('لا توجد دفعات', 'No payouts'), 'wallet')}</div></div>`;
}
function T_profile(u) {
  return `<div class="page-h"><div><div class="crumbs">${L('بوابة المدرس › ملفي', 'Teacher › Profile')}</div><h1>${L('ملفي الشخصي', 'My profile')}</h1></div></div>
  <div class="card" style="max-width:760px"><div class="form-grid"><div class="field"><label>${L('الاسم بالعربي', 'Name (Arabic)')}</label><input class="input" id="tp_n" value="${esc(u.name)}"></div><div class="field"><label>${L('الاسم بالإنجليزي', 'Name (English)')}</label><input class="input" id="tp_ne" value="${esc(u.nameEn || '')}"></div></div>
    <div class="field"><label>${L('نبذة عني (عربي)', 'Bio (Arabic)')}</label><textarea class="input" id="tp_b">${esc(u.bio)}</textarea></div><div class="field"><label>${L('نبذة عني (إنجليزي)', 'Bio (English)')}</label><textarea class="input" id="tp_be">${esc(u.bioEn || '')}</textarea></div>
    <div class="form-grid"><div class="field"><label>${L('لينك الزوم الافتراضي', 'Default Zoom link')}</label><input class="input" id="tp_z" dir="ltr" value="${esc(u.zoom)}"></div><div class="field"><label>${L('الكاميرا متاحة', 'Camera available')}</label><select class="input" id="tp_c"><option value="1" ${u.camera ? 'selected' : ''}>${L('نعم', 'Yes')}</option><option value="0" ${!u.camera ? 'selected' : ''}>${L('لا', 'No')}</option></select></div></div>
    <div class="field"><label>${L('فيديو التعريف (يوتيوب)', 'Intro video (YouTube)')} <span class="lock">${icon('lock')} ${L('بتحدده الإدارة', 'set by admin')}</span></label><input class="input" dir="ltr" value="${esc(u.youtube)}" disabled></div>
    <button class="btn" onclick="T_saveProfile()">${L('حفظ', 'Save')}</button></div>`;
}
function T_saveProfile() { const u = currentUser(); const b = val('tp_b') + ' ' + val('tp_be'); if (contactViolation(b)) return toast(L('غير مسموح بكتابة بيانات تواصل في النبذة', 'Contact details are not allowed in the bio'), 'bad'); Object.assign(u, { name: val('tp_n'), nameEn: val('tp_ne'), bio: val('tp_b'), bioEn: val('tp_be'), zoom: val('tp_z'), camera: val('tp_c') === '1' }); save(); toast(L('تم الحفظ', 'Saved'), 'ok'); render(); }
