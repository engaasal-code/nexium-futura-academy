/* =====================================================================
   حماية الواجهة (طبقة إضافية فوق حماية قاعدة البيانات)
   - safeUrl: أي لينك جاي من البيانات لازم يبدأ بـ https:// أو http:// (يمنع javascript:)
   - cleanHTML: محتوى الصفحات التعريفية بيتعرض بعد تنظيفه من أي سكريبت أو أحداث
   - منع فتح المنصة داخل موقع تاني (Clickjacking)
   ===================================================================== */
(function () { try { if (window.top !== window.self) window.top.location = window.self.location; } catch (e) { document.documentElement.style.display = 'none'; } })();

function safeUrl(u, { allowMail = false, allowData = false } = {}) {
  const s = String(u ?? '').trim(); if (!s) return '';
  if (/^https?:\/\/[^\s"'<>`]+$/i.test(s)) return s;
  if (allowMail && /^mailto:[^\s"'<>`]+$/i.test(s)) return s;
  if (allowData && /^data:image\/(png|jpe?g|webp|gif);base64,[A-Za-z0-9+/=]+$/.test(s)) return s;
  if (allowData && /^blob:https?:\/\//.test(s)) return s;
  if (/^[a-z0-9][a-z0-9.-]*\.[a-z]{2,}(\/[^\s"'<>`]*)?$/i.test(s)) return 'https://' + s;
  return '';
}
// رابط صورة آمن (https أو صورة مرفوعة في وضع التجربة)
const safeImg = u => /^assets\/[\w.\-\/]+\.(png|jpe?g|webp|gif|svg)$/i.test(String(u || '')) && !String(u).includes('..') ? u : safeUrl(u, { allowData: true });
// للون اللي بيتحط في style
const safeColor = c => /^#[0-9A-Fa-f]{3,8}$/.test(String(c || '')) ? c : 'var(--navy)';

const CLEAN_TAGS = new Set(['P', 'BR', 'B', 'STRONG', 'I', 'EM', 'U', 'S', 'H1', 'H2', 'H3', 'H4', 'UL', 'OL', 'LI', 'A', 'SPAN', 'DIV', 'BLOCKQUOTE', 'HR', 'IMG', 'TABLE', 'THEAD', 'TBODY', 'TR', 'TH', 'TD', 'SMALL', 'SUB', 'SUP', 'IFRAME', 'FIGURE', 'FIGCAPTION', 'CODE', 'PRE']);
const CLEAN_DROP = new Set(['SCRIPT', 'STYLE', 'OBJECT', 'EMBED', 'LINK', 'META', 'BASE', 'FORM', 'INPUT', 'BUTTON', 'TEXTAREA', 'SELECT', 'SVG', 'MATH', 'TEMPLATE', 'NOSCRIPT', 'FRAME', 'FRAMESET']);
function cleanHTML(html) {
  const tpl = document.createElement('template'); tpl.innerHTML = String(html || '');
  const walk = node => {
    [...node.childNodes].forEach(n => {
      if (n.nodeType === 8) { n.remove(); return; }
      if (n.nodeType !== 1) return;
      const tag = n.tagName.toUpperCase();
      if (CLEAN_DROP.has(tag)) { n.remove(); return; }
      if (!CLEAN_TAGS.has(tag)) { walk(n); n.replaceWith(...n.childNodes); return; }
      [...n.attributes].forEach(a => {
        const k = a.name.toLowerCase(); let keep = false;
        if (['class', 'title', 'alt', 'dir', 'colspan', 'rowspan', 'width', 'height'].includes(k)) keep = true;
        if (k === 'href' && tag === 'A') { const v = safeUrl(a.value, { allowMail: true }) || (/^#[\w-]*$/.test(a.value) ? a.value : ''); if (v) { n.setAttribute('href', v); keep = true; } }
        if (k === 'target' && tag === 'A') keep = true;
        if (k === 'src' && tag === 'IMG') { const v = safeImg(a.value); if (v) { n.setAttribute('src', v); keep = true; } }
        if (k === 'src' && tag === 'IFRAME') { if (/^https:\/\/(www\.youtube(-nocookie)?\.com\/embed\/|player\.vimeo\.com\/video\/)[\w\-?=&%.]+$/.test(a.value)) keep = true; }
        if (k === 'allowfullscreen' && tag === 'IFRAME') keep = true;
        if (!keep) n.removeAttribute(a.name);
      });
      if (tag === 'A') { n.setAttribute('rel', 'noopener noreferrer'); if (n.getAttribute('target') && n.getAttribute('target') !== '_blank') n.removeAttribute('target'); }
      if (tag === 'IFRAME') { if (!n.getAttribute('src')) { n.remove(); return; } n.setAttribute('sandbox', 'allow-scripts allow-same-origin allow-presentation'); n.setAttribute('loading', 'lazy'); }
      if (tag === 'IMG') n.setAttribute('loading', 'lazy');
      walk(n);
    });
  };
  walk(tpl.content);
  return tpl.innerHTML;
}

// كلمة مرور قوية: 8 أحرف على الأقل وفيها حروف وأرقام
function pwProblem(p) {
  if (String(p || '').length < 8) return L('كلمة المرور 8 أحرف على الأقل', 'Password must be at least 8 characters');
  if (!/[A-Za-z؀-ۿ]/.test(p) || !/\d/.test(p)) return L('كلمة المرور لازم يكون فيها حروف وأرقام', 'Use both letters and numbers');
  if (/^(12345678|password|qwerty|11111111|00000000)/i.test(p)) return L('كلمة المرور سهلة جداً', 'This password is too common');
  return '';
}
