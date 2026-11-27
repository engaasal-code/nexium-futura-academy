/* ================= boot ================= */
function render() {
  document.documentElement.lang = LANG; document.documentElement.dir = LANG === 'ar' ? 'rtl' : 'ltr';
  document.title = 'NEXIUM FUTURA ACADEMY' + (APP.portal === 'teacher' ? ' – ' + L('بوابة المدرس', 'Teacher') : APP.portal === 'admin' ? ' – ' + L('الإدارة', 'Admin') : '');
  refreshEmailStatus();
  const root = $('#app');
  if (IS_LIVE && !LIVE.ready) { root.innerHTML = `<div style="min-height:100vh;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:14px"><img src="${LOGO_FULL}" style="width:120px;border-radius:16px" alt=""><div class="muted">${L('جاري التحميل…', 'Loading…')}</div></div>`; return; }
  if (APP.publicPage) { root.innerHTML = renderPublicPage(APP.publicPage); return; }
  const u = currentUser();
  if (!u) { root.innerHTML = authHTML(); return; }
  if (APP.portal === 'admin' && !APP.adminRole) APP.adminRole = u.role;
  try { root.innerHTML = APP.portal === 'student' ? studentShell(u) : APP.portal === 'teacher' ? teacherShell(u) : adminShell(u); }
  catch (e) { console.error(e); root.innerHTML = `<div style="padding:40px"><h2>Error</h2><pre>${esc(e.stack)}</pre></div>`; }
}
document.addEventListener('keydown', e => { if (e.key === 'Escape') closeModal(); });
load(); loadSession();
if (IS_LIVE) { APP.sessions = {}; const h = (location.hash || '').replace('#', ''); APP.portal = ['teacher', 'admin'].includes(h) ? h : 'student'; if (h.startsWith('page-')) APP.publicPage = h.slice(5); render();
  liveBoot().then(() => trackVisit()).catch(e => { console.error(e); LIVE.ready = true; render(); toast(L('تعذّر الاتصال بالسيرفر – راجع إعدادات config.js', 'Could not reach the server – check config.js'), 'bad'); }); }
else { onHash(); trackVisit(); }
window.addEventListener('hashchange', onHash);
detectCountry().then(ok => { if (ok && (!IS_LIVE || LIVE.ready)) softRender(); });
setInterval(() => { if (!$('#ov') && !document.activeElement?.matches('input,textarea,select,[contenteditable]') && currentUser() && ['home', 'overview'].includes(APP.view)) render(); }, 60000);
