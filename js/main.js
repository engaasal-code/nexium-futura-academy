/* ================= boot ================= */
function render() {
  document.documentElement.lang = LANG; document.documentElement.dir = LANG === 'ar' ? 'rtl' : 'ltr';
  document.title = 'NEXIUM FUTURA ACADEMY' + (APP.portal === 'teacher' ? ' – ' + L('بوابة المدرس', 'Teacher') : APP.portal === 'admin' ? ' – ' + L('الإدارة', 'Admin') : '');
  refreshEmailStatus();
  const root = $('#app');
  if (APP.publicPage) { root.innerHTML = renderPublicPage(APP.publicPage); return; }
  const u = currentUser();
  if (!u) { root.innerHTML = authHTML(); return; }
  if (APP.portal === 'admin' && !APP.adminRole) APP.adminRole = u.role;
  try { root.innerHTML = APP.portal === 'student' ? studentShell(u) : APP.portal === 'teacher' ? teacherShell(u) : adminShell(u); }
  catch (e) { console.error(e); root.innerHTML = `<div style="padding:40px"><h2>Error</h2><pre>${esc(e.stack)}</pre></div>`; }
}
document.addEventListener('keydown', e => { if (e.key === 'Escape') closeModal(); });
load(); loadSession(); onHash();
window.addEventListener('hashchange', onHash);
setInterval(() => { if (!$('#ov') && !document.activeElement?.matches('input,textarea,select,[contenteditable]') && currentUser() && ['home', 'overview'].includes(APP.view)) render(); }, 60000);
