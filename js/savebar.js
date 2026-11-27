/* =====================================================================
   شريط "حفظ التغييرات" في لوحة الإدارة
   - أي تعديل في لوحة الإدارة (أسعار، ظهور مواد، واجهة الموقع، صفحات، صلاحيات…)
     مش بيتحفظ لوحده: بيظهر شريط فوق فيه زرار "حفظ التغييرات".
   - بعد الضغط: التعديلات بتتبعت للسيرفر مرة واحدة، ولما تنجح بتظهر رسالة
     "تم الحفظ ✓ وظهرت على الموقع". لو فشلت بتظهر رسالة الخطأ والتعديلات بترجع.
   - الإجراءات الفورية (اعتماد دفع، صرف مستحقات، حفظ فورم مدرس/طالب، حذف…)
     بتتحفظ على طول من غير ما تستنى الزرار (commit).
   - Ctrl+S = حفظ، ولو قفلت الصفحة وفيه تعديلات مش محفوظة المتصفح بيحذّرك.
   ===================================================================== */
const SVB = { dirty: false, saving: false, last: null, stale: false };
const persistRaw = save;                                   // التجربة: المتصفح – الحقيقية: السيرفر
const SB_on = () => APP.portal === 'admin' && !!currentUser();

save = function () {
  if (SB_on()) { if (!SVB.dirty) { SVB.dirty = true; SB_paint(); } return; }
  persistRaw();
};

async function SB_flush() {
  if (!IS_LIVE) { persistRaw(); return true; }
  clearTimeout(LIVE.timer);
  for (let i = 0; i < 100 && LIVE.syncing; i++) await new Promise(r => setTimeout(r, 100));
  return (await liveSync()) !== false;
}
// حفظ فوري (للإجراءات اللي مينفعش تستنى)
async function commit() {
  const ok = await SB_flush();
  SVB.dirty = false; if (ok) SVB.last = Date.now();
  SB_paint(); SB_afterSave(); return ok;
}
async function SB_save() {
  if (SVB.saving) return;
  if (!SVB.dirty) { toast(L('مفيش تغييرات جديدة – كل حاجة محفوظة ✓', 'No new changes – everything is saved ✓'), 'ok'); return; }
  const a = document.activeElement; if (a && a.matches && a.matches('input,textarea,select,[contenteditable]')) { a.dispatchEvent(new Event('change', { bubbles: true })); a.blur(); }
  clearTimeout(window.__heS); if (typeof AD_savePageBody === 'function' && document.getElementById('pg_body')) AD_savePageBody(false);
  SVB.saving = true; SB_paint();
  const ok = await SB_flush();
  SVB.saving = false; SVB.dirty = false;
  if (ok) { SVB.last = Date.now(); toast(L('تم حفظ التغييرات ✓ وظهرت على الموقع', 'Changes saved ✓ – live on the site'), 'ok'); }
  SB_paint(); SB_afterSave();
}
function SB_afterSave() { if (IS_LIVE && SVB.stale) { SVB.stale = false; liveReload(); } }
function SB_discard() {
  confirmBox(L('تجاهل كل التعديلات اللي لسه ما اتحفظتش والرجوع لآخر نسخة محفوظة؟', 'Discard all unsaved changes and go back to the last saved version?'), async () => {
    clearTimeout(window.__heS);
    if (IS_LIVE) { try { await liveLoad(); } catch (e) { console.error(e); } } else load();
    SVB.dirty = false; SVB.stale = false; render(); toast(L('رجعنا لآخر نسخة محفوظة', 'Back to the last saved version'));
  }, L('تجاهل التعديلات', 'Discard'));
}

const SB_time = t => new Date(t).toLocaleTimeString(LANG === 'ar' ? 'ar-EG' : 'en-US', { hour: 'numeric', minute: '2-digit' });
function SB_html() {
  if (SVB.saving) return `<div id="savebar" class="savebar on"><span class="sb-dot spin"></span><b>${L('جاري حفظ التغييرات…', 'Saving changes…')}</b></div>`;
  if (SVB.dirty) return `<div id="savebar" class="savebar on"><span class="sb-dot"></span><div class="sb-tx"><b>${L('عندك تعديلات لسه ما اتحفظتش', 'You have unsaved changes')}</b><span class="small">${L('التعديلات مش هتظهر على الموقع غير لما تضغط "حفظ التغييرات"', 'Changes go live only after you click “Save changes”')}</span></div>
    <span style="flex:1"></span><button class="btn sm ghost" onclick="SB_discard()">${L('تجاهل', 'Discard')}</button><button class="btn gold" onclick="SB_save()">${icon('check')} ${L('حفظ التغييرات', 'Save changes')}</button></div>`;
  return `<div id="savebar" class="savebar ok">${icon('check')} <span>${L('كل التغييرات محفوظة', 'All changes saved')}${SVB.last ? ` · <span class="num">${SB_time(SVB.last)}</span>` : ''}</span></div>`;
}
function SB_paint() { const el = document.getElementById('savebar'); if (el) el.outerHTML = SB_html(); }

document.addEventListener('keydown', e => { if ((e.ctrlKey || e.metaKey) && (e.key === 's' || e.key === 'S') && SB_on()) { e.preventDefault(); SB_save(); } });
window.addEventListener('beforeunload', e => { if (SVB.dirty && SB_on()) { e.preventDefault(); e.returnValue = ''; } });

// الخروج وفيه تعديلات مش محفوظة → نسأل الأول
const SB_logout = logout;
logout = function () {
  if (SVB.dirty && SB_on()) return confirmBox(L('عندك تعديلات لسه ما اتحفظتش. تخرج من غير حفظ؟', 'You have unsaved changes. Log out without saving?'), () => { SVB.dirty = false; SB_logout(); }, L('خروج من غير حفظ', 'Log out anyway'));
  return SB_logout();
};
