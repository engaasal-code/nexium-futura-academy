/* =====================================================================
   واجهة الموقع (الصفحة الرئيسية للزوار) + محرّر الواجهة في لوحة الإدارة
   كل النصوص والصور والأقسام بتتعدل من: لوحة الإدارة ← واجهة الموقع
   البيانات محفوظة في settings.home (ولو فيه حاجة ناقصة بتتكمّل من homeDefaults)
   ===================================================================== */
const T2 = (ar, en) => ({ ar, en });
const tx = o => (o && typeof o === 'object') ? (o[LANG] || o.ar || o.en || '') : (o || '');
const HOME_SECTIONS = [
  ['hero', 'البانر الرئيسي', 'Hero banner'], ['stats', 'أرقام سريعة', 'Quick stats'], ['why', 'ليه تختارنا؟', 'Why us'],
  ['subjects', 'المراحل والمواد', 'Stages & subjects'], ['steps', 'خطوات البداية', 'How it works'], ['teachers', 'مدرسينا', 'Our teachers'],
  ['join', 'انضم كمدرس', 'Join as a teacher'], ['reviews', 'آراء أولياء الأمور', 'Parent reviews'], ['faq', 'الأسئلة الشائعة', 'FAQ'], ['cta', 'دعوة للتسجيل (آخر الصفحة)', 'Final call to action'],
];
function homeDefaults() {
  return {
    order: HOME_SECTIONS.map(s => s[0]), off: [],
    hero: {
      slides: [{ img: 'assets/hero.svg' }],
      title: T2('مدرسك الخاص، <em>أونلاين</em> ومن بيتك', 'Your private teacher, <em>online</em> from home'),
      text: T2('حصص مباشرة مع أفضل المدرسين من KG حتى الثانوية، ومتابعة كاملة لولي الأمر.', 'Live sessions with top teachers from KG to secondary, with full parent follow-up.'),
      feats: [
        { ic: '📅', t: T2('اختار مواعيدك بنفسك', 'Pick your own schedule') }, { ic: '🎯', t: T2('ركّز على اللي محتاجه', 'Focus on what you need') },
        { ic: '👩‍🏫', t: T2('مدرس خاص 1 لـ 1', 'Private 1-to-1 teacher') }, { ic: '🏠', t: T2('اتعلّم من بيتك', 'Learn from home') }],
      note: T2('ابدأ بـ <b>حصة تجريبية</b> بنص السعر', 'Start with a <b>trial session</b> at half price'),
      btn: T2('ابدأ دلوقتي', 'Start now'), btn2: T2('شوف المواد والأسعار', 'Subjects & prices'),
    },
    stats: { items: [{ v: '+1000', t: T2('طالب', 'Students') }, { v: '+50', t: T2('مدرس متخصص', 'Specialist teachers') }, { v: '4', t: T2('مراحل دراسية', 'School stages') }, { v: '7', t: T2('دول عربية', 'Arab countries') }] },
    why: {
      title: T2('ليه <em>NEXIUM</em>؟', 'Why <em>NEXIUM</em>?'), sub: T2('تعليم أونلاين بجودة الفصل وراحة البيت', 'Classroom quality with the comfort of home'),
      items: [
        { ic: '🎥', img: '', t: T2('حصص مباشرة 1 لـ 1', 'Live 1-to-1 sessions'), d: T2('الطالب بيتكلم ويشارك أكتر مع مدرسه الخاص.', 'Students speak and participate more with a private teacher.') },
        { ic: '📊', img: '', t: T2('تقارير لولي الأمر', 'Parent reports'), d: T2('الحضور والتفاعل والواجبات والتقييم في مكان واحد.', 'Attendance, engagement, homework and grades in one place.') },
        { ic: '📝', img: '', t: T2('واجبات وتصحيح على المنصة', 'Homework & grading'), d: T2('المدرس بيصحح الواجب على الورقة نفسها وبيرجعه للطالب.', 'Teachers mark homework on the page itself and send it back.') },
        { ic: '⏰', img: '', t: T2('مواعيد مرنة', 'Flexible times'), d: T2('احجز من المواعيد الفاضية عند المدرس في أي وقت يناسبك.', 'Book any free time that suits you.') }],
    },
    subjects: { title: T2('المراحل والمواد', 'Stages & subjects'), sub: T2('كل المواد من رياض الأطفال لحد الثانوية + كورسات الصيف', 'Every subject from KG to secondary + summer courses') },
    steps: {
      title: T2('هنمشي معاك <em>خطوة بخطوة</em>', 'We guide you <em>step by step</em>'), sub: T2('من التسجيل لحد أول حصة في دقايق', 'From sign-up to your first session in minutes'),
      items: [
        { ic: '📝', t: T2('سجّل حسابك', 'Create your account'), d: T2('بيانات ولي الأمر والطالب في دقيقة.', 'Parent and student details in a minute.') },
        { ic: '📚', t: T2('اختار المادة', 'Choose a subject'), d: T2('حسب المرحلة والصف الدراسي.', 'By stage and grade.') },
        { ic: '👩‍🏫', t: T2('اختار المدرس', 'Pick a teacher'), d: T2('شوف الفيديو التعريفي والتقييمات.', 'Watch the intro video and reviews.') },
        { ic: '💳', t: T2('اشترك في باقة', 'Buy a package'), d: T2('تحويل بنكي أو فودافون كاش أو إنستاباي.', 'Bank transfer, Vodafone Cash or InstaPay.') },
        { ic: '📅', t: T2('احجز ميعادك', 'Book your time'), d: T2('من المواعيد الفاضية بس – بدون تعارض.', 'Only free times – no clashes.') },
        { ic: '🚀', t: T2('ابدأ التعلّم', 'Start learning'), d: T2('لينك الحصة بيوصلك قبلها بـ 10 دقايق.', 'The link arrives 10 minutes before.') }],
    },
    teachers: { title: T2('مدرسينا', 'Our teachers'), sub: T2('مدرسين متخصصين ومختارين بعناية', 'Hand-picked specialist teachers'), max: 8 },
    join: { title: T2('انضم لفريق مدرسين NEXIUM', 'Join the NEXIUM teaching team'), text: T2('لو عندك شغف بالتدريس وعايز تأثر في حياة طلاب كتير، انضم لينا.', 'If you love teaching and want to change students’ lives, join us.'), btn: T2('ابدأ التدريس معانا', 'Start teaching'), img: '' },
    reviews: {
      title: T2('آراء أولياء الأمور', 'What parents say'), sub: T2('فخورين بثقة أولياء الأمور', 'Proud of our parents’ trust'),
      items: [
        { name: 'أم يوسف', role: T2('ولي أمر – الصف الرابع', 'Parent – Grade 4'), text: T2('ابني مستواه في الإنجليزي اتحسّن جداً، والتقارير بتوصلني أول بأول.', 'My son’s English improved a lot and I get reports regularly.'), stars: 5, img: '' },
        { name: 'خالد العتيبي', role: T2('ولي أمر – ثانوي', 'Parent – Secondary'), text: T2('المدرس ممتاز والمواعيد مرنة جداً مع جدول المدرسة.', 'Excellent teacher and very flexible times.'), stars: 5, img: '' },
        { name: 'منى إبراهيم', role: T2('ولية أمر – إعدادي', 'Parent – Preparatory'), text: T2('أكتر حاجة عجبتني تصحيح الواجب على الورقة نفسها.', 'I love that homework is marked on the page itself.'), stars: 5, img: '' }],
    },
    faq: {
      title: T2('الأسئلة الشائعة', 'Frequently asked questions'),
      items: [
        { q: T2('الحصص بتكون إزاي؟', 'How do sessions work?'), a: T2('حصص مباشرة أونلاين على زووم مع المدرس، ولينك الحصة بيوصلك على الإيميل قبلها بـ 10 دقايق.', 'Live online Zoom sessions; the link is emailed 10 minutes before.') },
        { q: T2('أقدر أجرّب الأول؟', 'Can I try first?'), a: T2('أيوه، في حصة تجريبية بنص السعر في أي مادة.', 'Yes, a trial session at half price in any subject.') },
        { q: T2('طرق الدفع إيه؟', 'How can I pay?'), a: T2('تحويل بنكي أو فودافون كاش أو إنستاباي، والباقة بتتفعّل بعد تأكيد الدفع.', 'Bank transfer, Vodafone Cash or InstaPay; the package activates after approval.') },
        { q: T2('أقدر أغيّر ميعاد الحصة؟', 'Can I reschedule?'), a: T2('أيوه، قبل الحصة بـ 12 ساعة على الأقل.', 'Yes, at least 12 hours before.') }],
    },
    payLogos: 'assets/payments.png',
    cta: { title: T2('جاهز تبدأ؟', 'Ready to start?'), text: T2('سجّل دلوقتي واحجز أول حصة تجريبية.', 'Sign up now and book your first trial session.'), btn: T2('إنشاء حساب مجاني', 'Create a free account') },
  };
}
function homeMerge(saved) {
  const d = homeDefaults(); const s = saved && typeof saved === 'object' ? saved : {};
  const out = { ...d, ...s };
  Object.keys(d).forEach(k => { if (d[k] && typeof d[k] === 'object' && !Array.isArray(d[k])) out[k] = { ...d[k], ...(s[k] || {}) }; });
  const known = d.order; out.order = [...(Array.isArray(s.order) ? s.order.filter(x => known.includes(x)) : []), ...known.filter(x => !(s.order || []).includes(x))];
  out.off = Array.isArray(s.off) ? s.off.filter(x => known.includes(x)) : [];
  return out;
}
const HOME = () => (D.home = (D.home && D.home.__m) ? D.home : Object.defineProperty(homeMerge(D.home), '__m', { value: true, enumerable: false }));
// نص فيه تنسيق بسيط مسموح (<em> <b> <br>) – أي حاجة تانية بتتشال
const rich = s => esc(s).replace(/&lt;(\/?)(em|b|br)\s*\/?&gt;/g, '<$1$2>');

/* ---------- بيانات المدرسين للعرض العام ---------- */
function combinedRating(avg, n, base, bc) {
  const b = base != null && base !== '' ? +base : null; const w = b ? Math.max(0, +bc || 0) : 0;
  const tot = (n || 0) + w; if (!tot) return { v: b || 0, n: 0 };
  return { v: ((avg || 0) * (n || 0) + (b || 0) * w) / tot, n: tot };
}
function publicTeachers() {
  if (D.pubTeachers && (!currentUser() || !D.teachers.length)) return D.pubTeachers.map(t => ({ ...t, subjects: t.subject_ids || [], nameEn: t.name_en, bioEn: t.bio_en, r: combinedRating(+t.rating || 0, t.rating_count || 0, t.base_rating, t.base_count) }));
  return D.teachers.filter(t => t.active).map(t => { const rs = D.ratings.filter(r => r.teacherId === t.id); const avg = rs.length ? rs.reduce((a, r) => a + r.stars, 0) / rs.length : 0;
    return { ...t, subjects: t.subjects.map(x => x.id), r: combinedRating(avg, rs.length, t.baseRating, t.baseCount) }; });
}

/* ---------- الواجهة ---------- */
const LP = { stage: 'pri', menu: false };
function LP_go(id) { LP.menu = false; const el = document.getElementById('lp-' + id); if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' }); else render(); }
function LP_auth(mode) { AUTH.mode = mode; AUTH.err = ''; APP.showAuth = true; render(); window.scrollTo(0, 0); }
function avatarHTML(t, cls = '') { const p = safeImg(t.photo); return p ? `<img class="av-img ${cls}" src="${esc(p)}" alt="${esc(tName(t))}" loading="lazy">` : `<span class="av ${cls}" style="background:${safeColor(t.color)}">${esc(initials(t.name))}</span>`; }

function landingHTML() {
  const H = HOME(); const on = id => !H.off.includes(id);
  const nav = [['subjects', L('المواد', 'Subjects')], ['teachers', L('المدرسين', 'Teachers')], ['steps', L('إزاي تبدأ', 'How it works')], ['faq', L('الأسئلة', 'FAQ')]].filter(([k]) => on(k));
  const phone = D.social.phone, wa = D.social.whatsapp;
  const hdr = `<header class="lp-hdr"><div class="lp-in">
    ${brandHTML()}
    <div class="lp-contact hide-m">${phone ? `<div>${icon('phone')} ${L('الخط الساخن', 'Hotline')} <span class="num">${esc(phone)}</span></div>` : ''}${wa ? `<div>${bicon('whatsapp', 14)} ${L('واتساب', 'WhatsApp')} <span class="num">${esc(wa)}</span></div>` : ''}</div>
    <nav class="lp-nav ${LP.menu ? 'open' : ''}">${nav.map(([k, l]) => `<a onclick="LP_go('${k}')">${l}</a>`).join('')}${D.pages.filter(p => p.status === 'published' && p.slug === 'about').map(p => `<a onclick="openPage('about')">${esc(tx(p.title))}</a>`).join('')}<a class="lp-nav-login" onclick="LP_auth('login')">${L('تسجيل الدخول', 'Log in')}</a></nav>
    <div class="lp-tools"><button class="iconbtn lang" onclick="setLang('${LANG === 'ar' ? 'en' : 'ar'}')">${LANG === 'ar' ? 'EN' : 'ع'}</button>
      <button class="btn ghost sm lp-login" onclick="LP_auth('login')">${L('دخول', 'Log in')} ${icon('door')}</button><button class="btn gold sm" onclick="LP_auth('register')">${L('إنشاء حساب', 'Sign up')}</button>
      <button class="iconbtn lp-burger" onclick="LP.menu=!LP.menu;render()">${icon('menu')}</button></div></div></header>`;
  const S = {
    hero: () => { const h = H.hero; const slides = (h.slides || []).map(s => safeImg(s.img)).filter(Boolean); setTimeout(LP_heroInit, 30);
      return `<section class="lp-hero" id="lp-hero"><div class="lp-in lp-hero-in"><div class="lp-hero-tx">
        <h1>${rich(tx(h.title))}</h1>${tx(h.text) ? `<p class="lp-lead">${rich(tx(h.text))}</p>` : ''}
        <div class="lp-feats">${(h.feats || []).map(f => `<div><span class="lp-fi">${esc(f.ic || '✔')}</span><span>${esc(tx(f.t))}</span></div>`).join('')}</div>
        ${tx(h.note) ? `<p class="lp-note">${rich(tx(h.note))}</p>` : ''}
        <div class="row"><button class="btn gold lp-big" onclick="LP_auth('register')">${esc(tx(h.btn))}</button>${tx(h.btn2) ? `<button class="btn ghost lp-big" onclick="LP_go('subjects')">${esc(tx(h.btn2))}</button>` : ''}</div></div>
        <div class="lp-hero-art"><div class="lp-shape"></div><div class="lp-frame">${slides.map((u, i) => `<img src="${esc(u)}" class="${i === 0 ? 'on' : ''}" alt="" ${i ? 'loading="lazy"' : ''}>`).join('') || `<img class="on" src="assets/hero.svg" alt="">`}</div>
          ${slides.length > 1 ? `<div class="lp-dots">${slides.map((_, i) => `<button class="${i === 0 ? 'on' : ''}" onclick="LP_slide(${i})" aria-label="${i + 1}"></button>`).join('')}</div>` : ''}<div class="lp-dot-gold"></div></div></div></section>`; },
    stats: () => `<section class="lp-stats"><div class="lp-in lp-stats-in">${(H.stats.items || []).map(s => `<div><b class="num">${esc(s.v)}</b><span>${esc(tx(s.t))}</span></div>`).join('')}</div></section>`,
    why: () => `<section class="lp-sec" id="lp-why"><div class="lp-in">${secHead(H.why)}<div class="lp-why">${(H.why.items || []).map(w => `<div class="lp-card">${safeImg(w.img) ? `<img class="lp-why-img" src="${esc(safeImg(w.img))}" alt="" loading="lazy">` : `<div class="lp-why-ic">${esc(w.ic || '★')}</div>`}<h3>${esc(tx(w.t))}</h3><p>${esc(tx(w.d))}</p></div>`).join('')}</div></div></section>`,
    subjects: () => { const C = displayCountry(null); const subs = D.subjects.filter(s => s.stage === LP.stage && s.visible); const pts = publicTeachers();
      return `<section class="lp-sec lp-alt" id="lp-subjects"><div class="lp-in">${secHead(H.subjects)}
        <div class="lp-stages">${STAGES.map(s => `<button class="${LP.stage === s.id ? 'on' : ''}" onclick="LP.stage='${s.id}';render();setTimeout(()=>LP_go('subjects'),0)"><span>${s.e}</span>${L(s.ar, s.en)}</button>`).join('')}</div>
        <div class="lp-subjs">${subs.map((s, i) => { const p = pkgPrice(s, PACKAGES[1], C); const img = safeImg(s.image); const n = pts.filter(t => t.subjects.includes(s.id)).length;
          return `<div class="lp-subj ${img ? 'has-img' : ''}" onclick="LP_auth('register')" style="${img ? '' : `background:${['#0B2463', '#122F7A', '#1F3F8F', '#A67812', '#C99A26', '#06173F'][i % 6]}`}">${img ? `<img src="${esc(img)}" alt="" loading="lazy">` : ''}<div class="lp-subj-tx">${img ? '' : `<span class="si">${esc(s.icon)}</span>`}<b>${esc(subjName(s))}</b><small>${pricesOn('home') ? `${L('من', 'from')} ${money(p.per, C)} / ${L('حصة', 'session')}` : ''}${n ? `${pricesOn('home') ? ' · ' : ''}${n} ${L('مدرس', 'teachers')}` : ''}</small></div></div>`; }).join('') || `<div class="muted">${L('لا توجد مواد ظاهرة في المرحلة دي', 'No visible subjects in this stage')}</div>`}</div></div></section>`; },
    steps: () => `<section class="lp-sec" id="lp-steps"><div class="lp-in">${secHead(H.steps)}<div class="lp-steps">${(H.steps.items || []).map((s, i) => `<div class="lp-step"><div class="lp-step-n num">${i + 1}</div><div class="lp-step-ic">${esc(s.ic || '•')}</div><h3>${esc(tx(s.t))}</h3><p>${esc(tx(s.d))}</p></div>`).join('')}</div></div></section>`,
    teachers: () => { const ts = publicTeachers().sort((a, b) => (b.r.v * Math.min(b.r.n, 20)) - (a.r.v * Math.min(a.r.n, 20))).slice(0, +H.teachers.max || 8); if (!ts.length) return '';
      return `<section class="lp-sec lp-alt" id="lp-teachers"><div class="lp-in">${secHead(H.teachers)}<div class="lp-teachers">${ts.map(t => `<div class="lp-tch">${avatarHTML(t, 'lp-tch-av')}<h3>${esc(tName(t))}</h3>
        <div class="small">${stars(t.r.v)} <b class="num">${t.r.v ? t.r.v.toFixed(1) : '—'}</b> <span class="muted">(${t.r.n})</span></div>
        <div class="chips" style="justify-content:center;margin:8px 0">${t.subjects.slice(0, 3).map(id => { const s = subjById(id); return s ? `<span class="pill navy">${esc(subjName(s))}</span>` : ''; }).join('')}</div>
        <p class="small muted lp-clamp">${esc(LANG === 'ar' ? t.bio : (t.bioEn || t.bio))}</p>${safeUrl(t.youtube) ? `<a class="yt" href="${esc(safeUrl(t.youtube))}" target="_blank" rel="noopener noreferrer">${bicon('youtube', 16)} ${L('فيديو تعريفي', 'Intro video')}</a>` : ''}</div>`).join('')}</div></div></section>`; },
    join: () => { const j = H.join; const img = safeImg(j.img); const teach = D.pages.find(p => p.slug === 'teach' && p.status === 'published');
      return `<section class="lp-join" id="lp-join"><div class="lp-in lp-join-in">${img ? `<img src="${esc(img)}" alt="" loading="lazy">` : `<div class="lp-join-art">👩‍🏫</div>`}<div><h2>${rich(tx(j.title))}</h2><p>${esc(tx(j.text))}</p>
        ${teach ? `<button class="btn gold lp-big" onclick="openPage('teach')">${esc(tx(j.btn))}</button>` : `<a class="btn gold lp-big" href="https://wa.me/${waNum()}" target="_blank" rel="noopener">${bicon('whatsapp', 18)} ${esc(tx(j.btn))}</a>`}</div></div></section>`; },
    reviews: () => (H.reviews.items || []).length ? `<section class="lp-sec" id="lp-reviews"><div class="lp-in">${secHead(H.reviews)}<div class="lp-rev-wrap"><button class="iconbtn lp-arr" onclick="LP_scroll(-1)">‹</button><div class="lp-revs" id="lp-revs">${H.reviews.items.map(r => `<div class="lp-rev"><div class="lp-q">“</div><p>${esc(tx(r.text))}</p><div class="row" style="gap:10px;margin-top:auto">${safeImg(r.img) ? `<img class="av-img" src="${esc(safeImg(r.img))}" alt="" loading="lazy">` : `<span class="av">${esc(initials(r.name))}</span>`}<div><b>${esc(r.name)}</b><div class="tiny muted">${esc(tx(r.role))}</div></div><span class="sp" style="flex:1"></span>${stars(+r.stars || 5)}</div></div>`).join('')}</div><button class="iconbtn lp-arr" onclick="LP_scroll(1)">›</button></div></div></section>` : '',
    faq: () => (H.faq.items || []).length ? `<section class="lp-sec lp-alt" id="lp-faq"><div class="lp-in lp-narrow">${secHead(H.faq)}${H.faq.items.map((f, i) => `<details class="lp-faq" ${i === 0 ? 'open' : ''}><summary>${esc(tx(f.q))}</summary><p>${esc(tx(f.a))}</p></details>`).join('')}</div></section>` : '',
    cta: () => `<section class="lp-cta"><div class="lp-in"><h2>${rich(tx(H.cta.title))}</h2><p>${esc(tx(H.cta.text))}</p><button class="btn gold lp-big" onclick="LP_auth('register')">${esc(tx(H.cta.btn))}</button></div></section>`,
  };
  return `<div class="lp">${hdr}${H.order.filter(on).map(k => S[k] ? S[k]() : '').join('')}</div>${footerHTML()}${waBtn()}`;
}
function secHead(o) { return `<div class="lp-head"><h2>${rich(tx(o.title))}</h2>${tx(o.sub) ? `<p>${esc(tx(o.sub))}</p>` : ''}</div>`; }
function LP_slide(i) { const imgs = document.querySelectorAll('.lp-frame img'), dots = document.querySelectorAll('.lp-dots button'); if (!imgs.length) return; LP.slide = (i + imgs.length) % imgs.length; imgs.forEach((x, k) => x.classList.toggle('on', k === LP.slide)); dots.forEach((x, k) => x.classList.toggle('on', k === LP.slide)); }
function LP_heroInit() { clearInterval(window.__heroT); LP.slide = 0; if (document.querySelectorAll('.lp-frame img').length > 1) window.__heroT = setInterval(() => { if (!document.querySelector('.lp-frame')) return clearInterval(window.__heroT); LP_slide(LP.slide + 1); }, 5000); }
function LP_scroll(d) { const el = document.getElementById('lp-revs'); if (el) el.scrollBy({ left: d * (LANG === 'ar' ? -1 : 1) * el.clientWidth * 0.8, behavior: 'smooth' }); }

/* ---------- رفع الصور (الواجهة / المواد / المدرسين) ---------- */
function pickImage(onDone, { folder = 'home', maxW = 1600, square = false } = {}) {
  const inp = document.createElement('input'); inp.type = 'file'; inp.accept = 'image/jpeg,image/png,image/webp,image/gif';
  inp.onchange = async () => {
    const f = inp.files[0]; if (!f) return;
    if (!/^image\/(jpeg|png|webp|gif)$/.test(f.type)) return toast(L('ارفع صورة JPG أو PNG أو WEBP', 'Upload a JPG, PNG or WEBP image'), 'bad');
    if (f.size > 15 * 1024 * 1024) return toast(L('الصورة أكبر من 15 ميجا', 'Image is larger than 15 MB'), 'bad');
    toast(L('جاري تجهيز الصورة…', 'Preparing image…'));
    try {
      const blob = await shrinkImage(f, IS_LIVE ? maxW : Math.min(maxW, 900), square, IS_LIVE ? 0.85 : 0.72);
      if (!IS_LIVE) { const r = new FileReader(); r.onload = () => onDone(r.result); r.readAsDataURL(blob); return; }
      const path = `${folder}/${Date.now()}_${Math.random().toString(36).slice(2, 8)}.${blob.type === 'image/png' ? 'png' : 'jpg'}`;
      const { error } = await LIVE.sb.storage.from('site').upload(path, blob, { contentType: blob.type, upsert: false, cacheControl: '31536000' });
      if (error) return toast(liveErr(error.message), 'bad');
      onDone(LIVE.sb.storage.from('site').getPublicUrl(path).data.publicUrl);
    } catch (e) { console.error(e); toast(L('تعذّر قراءة الصورة', 'Could not read the image'), 'bad'); }
  };
  inp.click();
}
async function shrinkImage(file, maxW, square, q) {
  const url = URL.createObjectURL(file); const img = new Image(); img.src = url; await img.decode(); URL.revokeObjectURL(url);
  let sx = 0, sy = 0, sw = img.naturalWidth, sh = img.naturalHeight;
  if (square) { const m = Math.min(sw, sh); sx = (sw - m) / 2; sy = (sh - m) / 2; sw = sh = m; }
  const k = Math.min(1, maxW / sw); const c = document.createElement('canvas'); c.width = Math.round(sw * k); c.height = Math.round(sh * k);
  const g = c.getContext('2d'); const png = file.type === 'image/png' && !square;
  if (!png) { g.fillStyle = '#fff'; g.fillRect(0, 0, c.width, c.height); }
  g.drawImage(img, sx, sy, sw, sh, 0, 0, c.width, c.height);
  return await new Promise(res => c.toBlob(res, png ? 'image/png' : 'image/jpeg', q));
}
const imgField = (cur, onPick, onClear, opts = {}) => `<div class="img-field ${opts.round ? 'round' : ''}">${safeImg(cur) ? `<img src="${esc(safeImg(cur))}" alt="">` : `<div class="img-ph">${icon('upload')}<span>${L('مفيش صورة', 'No image')}</span></div>`}
  ${onPick ? `<div class="row" style="gap:6px"><button type="button" class="btn sm gold" onclick="${onPick}">${icon('upload')} ${safeImg(cur) ? L('تغيير', 'Change') : L('رفع صورة', 'Upload')}</button>${safeImg(cur) && onClear ? `<button type="button" class="btn sm bad ghost" onclick="${onClear}">${icon('trash')}</button>` : ''}</div>` : ''}</div>`;

/* ---------- محرّر الواجهة (لوحة الإدارة) ---------- */
const HE = { lang: 'ar', open: 'hero' };
function HE_get(path) { return path.split('.').reduce((o, k) => o == null ? o : o[k], HOME()); }
function HE_set(path, v, rerender) {
  const ks = path.split('.'); let o = HOME(); ks.slice(0, -1).forEach(k => { if (o[k] == null) o[k] = /^\d+$/.test(k) ? [] : {}; o = o[k]; });
  o[ks[ks.length - 1]] = v; HE_save(); if (rerender) render();
}
function HE_save() { clearTimeout(window.__heS); window.__heS = setTimeout(() => { save(); toast(L('تم الحفظ ✓ وظهر في الواجهة', 'Saved ✓ – live on the homepage'), 'ok'); }, 400); }
function HE_img(path, opts) { pickImage(u => HE_set(path, u, true), opts); }
function HE_list(path, act, i) {
  const a = HE_get(path); if (!Array.isArray(a)) return;
  if (act === 'add') { const tpl = { 'hero.slides': { img: '' }, 'hero.feats': { ic: '✔', t: T2('', '') }, 'stats.items': { v: '', t: T2('', '') }, 'why.items': { ic: '⭐', img: '', t: T2('', ''), d: T2('', '') }, 'steps.items': { ic: '•', t: T2('', ''), d: T2('', '') }, 'reviews.items': { name: '', role: T2('', ''), text: T2('', ''), stars: 5, img: '' }, 'faq.items': { q: T2('', ''), a: T2('', '') } }[path]; a.push(JSON.parse(JSON.stringify(tpl))); }
  if (act === 'del') a.splice(i, 1);
  if (act === 'up' && i > 0) [a[i - 1], a[i]] = [a[i], a[i - 1]];
  if (act === 'down' && i < a.length - 1) [a[i + 1], a[i]] = [a[i], a[i + 1]];
  HE_save(); render();
}
function HE_sec(id, act) {
  const H = HOME();
  if (act === 'toggle') H.off = H.off.includes(id) ? H.off.filter(x => x !== id) : [...H.off, id];
  const i = H.order.indexOf(id);
  if (act === 'up' && i > 0) [H.order[i - 1], H.order[i]] = [H.order[i], H.order[i - 1]];
  if (act === 'down' && i < H.order.length - 1) [H.order[i + 1], H.order[i]] = [H.order[i], H.order[i + 1]];
  HE_save(); render();
}
function HE_reset() { confirmBox(L('إرجاع كل محتوى الواجهة للنص الافتراضي؟ (الصور اللي رفعتها هتتشال من الواجهة)', 'Reset all homepage content to the defaults?'), () => { D.home = homeDefaults(); HE_save(); render(); }); }

// حقول التحرير
const heTxt = (path, label, opts = {}) => { const p = path + '.' + HE.lang; const v = HE_get(p) ?? '';
  return `<div class="field"><label>${label} <span class="tiny muted">(${HE.lang.toUpperCase()})</span></label>${opts.area ? `<textarea class="input" dir="${HE.lang === 'ar' ? 'rtl' : 'ltr'}" onchange="HE_set('${p}',this.value)">${esc(v)}</textarea>` : `<input class="input" dir="${HE.lang === 'ar' ? 'rtl' : 'ltr'}" value="${esc(v)}" onchange="HE_set('${p}',this.value)">`}${opts.hint ? `<div class="tiny muted">${opts.hint}</div>` : ''}</div>`; };
const heRaw = (path, label, opts = {}) => `<div class="field" ${opts.w ? `style="max-width:${opts.w}px"` : ''}><label>${label}</label><input class="input" ${opts.type ? `type="${opts.type}"` : ''} value="${esc(HE_get(path) ?? '')}" onchange="HE_set('${path}',${opts.type === 'number' ? '+this.value' : 'this.value'})"></div>`;
const heListBar = (path, i, n) => `<div class="row" style="gap:4px"><button class="btn sm ghost" ${i ? '' : 'disabled'} onclick="HE_list('${path}','up',${i})">▲</button><button class="btn sm ghost" ${i < n - 1 ? '' : 'disabled'} onclick="HE_list('${path}','down',${i})">▼</button><button class="btn sm bad ghost" onclick="HE_list('${path}','del',${i})">${icon('trash')}</button></div>`;
const heAdd = (path, label) => `<button class="btn sm ghost" onclick="HE_list('${path}','add')">${icon('plus')} ${label}</button>`;
const RICH_HINT = () => L('تقدر تكتب &lt;em&gt;كلمة&lt;/em&gt; عشان تبقى بالذهبي، و&lt;b&gt;كلمة&lt;/b&gt; للخط العريض', 'Use &lt;em&gt;word&lt;/em&gt; for gold and &lt;b&gt;word&lt;/b&gt; for bold');

function HE_body(id) {
  const H = HOME(); const add = L('إضافة', 'Add');
  const items = (path, render1) => { const a = HE_get(path) || []; return a.map((x, i) => `<div class="he-item"><div class="row between" style="margin-bottom:8px"><b class="small">#${i + 1}</b>${heListBar(path, i, a.length)}</div>${render1(x, i, path + '.' + i)}</div>`).join(''); };
  switch (id) {
    case 'hero': return `${heTxt('hero.title', L('العنوان الكبير', 'Headline'), { hint: RICH_HINT() })}${heTxt('hero.text', L('النص تحت العنوان', 'Sub text'), { area: true })}
      <h4 class="he-h">${L('صور البانر', 'Banner images')} <span class="tiny muted">${L('(لو أكتر من صورة هتتغير تلقائياً كل 5 ثواني – المقاس المناسب 1200×900)', '(more than one image rotates every 5 s – best 1200×900)')}</span></h4>
      <div class="he-imgs">${(H.hero.slides || []).map((s, i) => `<div class="he-item">${imgField(s.img, `HE_img('hero.slides.${i}.img',{folder:'home',maxW:1600})`, null)}${heListBar('hero.slides', i, H.hero.slides.length)}</div>`).join('')}</div>${heAdd('hero.slides', L('صورة جديدة', 'New image'))}
      <h4 class="he-h">${L('المميزات (4 نقاط)', 'Feature points')}</h4>${items('hero.feats', (x, i, p) => `<div class="form-grid" style="grid-template-columns:90px 1fr">${heRaw(p + '.ic', L('أيقونة', 'Icon'))}${heTxt(p + '.t', L('النص', 'Text'))}</div>`)}${heAdd('hero.feats', add)}
      <h4 class="he-h">${L('الأزرار', 'Buttons')}</h4>${heTxt('hero.note', L('سطر ملاحظة فوق الزرار', 'Note above the button'), { hint: RICH_HINT() })}<div class="form-grid">${heTxt('hero.btn', L('الزرار الرئيسي (إنشاء حساب)', 'Main button (sign up)'))}${heTxt('hero.btn2', L('الزرار التاني (المواد)', 'Second button (subjects)'))}</div>`;
    case 'stats': return `${items('stats.items', (x, i, p) => `<div class="form-grid" style="grid-template-columns:140px 1fr">${heRaw(p + '.v', L('الرقم', 'Number'))}${heTxt(p + '.t', L('الوصف', 'Label'))}</div>`)}${heAdd('stats.items', add)}`;
    case 'why': return `${heTxt('why.title', L('العنوان', 'Title'), { hint: RICH_HINT() })}${heTxt('why.sub', L('العنوان الفرعي', 'Subtitle'))}
      ${items('why.items', (x, i, p) => `<div class="he-split"><div>${imgField(x.img, `HE_img('${p}.img',{folder:'home',maxW:500,square:true})`, `HE_set('${p}.img','',true)`)}<div class="tiny muted" style="margin-top:4px">${L('أو أيقونة:', 'or icon:')}</div>${heRaw(p + '.ic', '', { w: 90 })}</div><div>${heTxt(p + '.t', L('العنوان', 'Title'))}${heTxt(p + '.d', L('الوصف', 'Description'), { area: true })}</div></div>`)}${heAdd('why.items', add)}`;
    case 'subjects': return `${heTxt('subjects.title', L('العنوان', 'Title'), { hint: RICH_HINT() })}${heTxt('subjects.sub', L('العنوان الفرعي', 'Subtitle'))}<div class="notice info">${icon('layers')} ${L('المواد والأسعار بتيجي تلقائياً من صفحة "المراحل والمواد" – ومن هناك كمان بتحط صورة لكل مادة.', 'Subjects and prices come from "Stages & subjects" – set each subject image there.')} <button class="btn link" onclick="go('subjects')">${L('فتح المراحل والمواد', 'Open subjects')}</button></div>`;
    case 'steps': return `${heTxt('steps.title', L('العنوان', 'Title'), { hint: RICH_HINT() })}${heTxt('steps.sub', L('العنوان الفرعي', 'Subtitle'))}${items('steps.items', (x, i, p) => `<div class="form-grid" style="grid-template-columns:90px 1fr 1.4fr">${heRaw(p + '.ic', L('أيقونة', 'Icon'))}${heTxt(p + '.t', L('الخطوة', 'Step'))}${heTxt(p + '.d', L('الوصف', 'Description'))}</div>`)}${heAdd('steps.items', add)}`;
    case 'teachers': return `${heTxt('teachers.title', L('العنوان', 'Title'), { hint: RICH_HINT() })}${heTxt('teachers.sub', L('العنوان الفرعي', 'Subtitle'))}${heRaw('teachers.max', L('أقصى عدد مدرسين يظهر', 'Max teachers shown'), { type: 'number', w: 200 })}<div class="notice info">${icon('cap')} ${L('بيظهر المدرسين المفعّلين بس، مترتبين حسب التقييم. صورة المدرس والتقييم المبدئي من صفحة "المدرسين".', 'Only active teachers appear, sorted by rating. Photos and initial ratings are set on the Teachers page.')}</div>`;
    case 'join': return `<div class="he-split"><div>${imgField(H.join.img, `HE_img('join.img',{folder:'home',maxW:900})`, `HE_set('join.img','',true)`)}</div><div>${heTxt('join.title', L('العنوان', 'Title'), { hint: RICH_HINT() })}${heTxt('join.text', L('النص', 'Text'), { area: true })}${heTxt('join.btn', L('الزرار', 'Button'))}<div class="tiny muted">${L('الزرار بيفتح صفحة "انضم كمدرس" لو منشورة، وإلا بيفتح الواتساب.', 'The button opens the “Teach with us” page if published, otherwise WhatsApp.')}</div></div></div>`;
    case 'reviews': return `${heTxt('reviews.title', L('العنوان', 'Title'), { hint: RICH_HINT() })}${heTxt('reviews.sub', L('العنوان الفرعي', 'Subtitle'))}
      ${items('reviews.items', (x, i, p) => `<div class="he-split"><div>${imgField(x.img, `HE_img('${p}.img',{folder:'home',maxW:300,square:true})`, `HE_set('${p}.img','',true)`, { round: true })}</div><div><div class="form-grid">${heRaw(p + '.name', L('الاسم', 'Name'))}${heRaw(p + '.stars', L('النجوم (1-5)', 'Stars (1-5)'), { type: 'number' })}</div>${heTxt(p + '.role', L('الصفة', 'Role'))}${heTxt(p + '.text', L('الرأي', 'Review'), { area: true })}</div></div>`)}${heAdd('reviews.items', add)}`;
    case 'faq': return `${heTxt('faq.title', L('العنوان', 'Title'), { hint: RICH_HINT() })}${items('faq.items', (x, i, p) => `${heTxt(p + '.q', L('السؤال', 'Question'))}${heTxt(p + '.a', L('الإجابة', 'Answer'), { area: true })}`)}${heAdd('faq.items', add)}`;
    case 'cta': return `${heTxt('cta.title', L('العنوان', 'Title'), { hint: RICH_HINT() })}${heTxt('cta.text', L('النص', 'Text'))}${heTxt('cta.btn', L('الزرار', 'Button'))}`;
  }
  return '';
}
function AD_home() {
  const H = HOME(); const names = Object.fromEntries(HOME_SECTIONS.map(s => [s[0], L(s[1], s[2])]));
  return `<div class="page-h"><div><div class="crumbs">${L('المحتوى', 'Content')}</div><h1>${L('واجهة الموقع', 'Homepage')}</h1><p>${L('عدّل كل نص وصورة في الصفحة الرئيسية اللي بيشوفها الزوار. أي تعديل بيتحفظ لوحده وبيظهر فوراً.', 'Edit every text and image visitors see. Changes save automatically and go live immediately.')}</p></div>
    <div class="row"><div class="tabs" style="margin:0;padding:3px"><button class="${HE.lang === 'ar' ? 'on' : ''}" onclick="HE.lang='ar';render()">عربي</button><button class="${HE.lang === 'en' ? 'on' : ''}" onclick="HE.lang='en';render()">English</button></div>
    <a class="btn gold" href="${location.pathname}" target="_blank" rel="noopener">${icon('eye')} ${L('معاينة الواجهة', 'Preview homepage')}</a></div></div>
  <div class="he-list">${H.order.map((id, i) => { const off = H.off.includes(id); const open = HE.open === id; return `<div class="card he-sec ${off ? 'off' : ''}"><div class="row between">
      <div class="row" style="gap:10px;cursor:pointer;flex:1" onclick="HE.open=HE.open==='${id}'?null:'${id}';render()"><span class="he-n num">${i + 1}</span><b>${names[id]}</b>${off ? `<span class="pill gray">${L('مخفي', 'Hidden')}</span>` : ''}<span class="muted">${open ? '▲' : '▼'}</span></div>
      <div class="row" style="gap:6px"><button class="btn sm ghost" ${i ? '' : 'disabled'} onclick="HE_sec('${id}','up')" title="${L('لفوق', 'Up')}">▲</button><button class="btn sm ghost" ${i < H.order.length - 1 ? '' : 'disabled'} onclick="HE_sec('${id}','down')" title="${L('لتحت', 'Down')}">▼</button>
      <label class="sw" title="${L('إظهار / إخفاء', 'Show / hide')}"><input type="checkbox" ${off ? '' : 'checked'} onchange="HE_sec('${id}','toggle')"><span></span></label></div></div>
      ${open ? `<div class="he-body">${HE_body(id)}</div>` : ''}</div>`; }).join('')}</div>
  <div class="card sec"><h3 style="margin-bottom:4px">${L('شعارات طرق الدفع (في آخر كل صفحة)', 'Payment logos (site footer)')}</h3><div class="small muted" style="margin-bottom:12px">${L('صورة واحدة فيها شعارات وسائل الدفع اللي بتقبلها. اعرض بس الوسائل المتاحة فعلاً للعملاء.', 'One image with the logos of the payment methods you accept. Show only methods customers can actually use.')}</div>
    <div style="max-width:420px">${imgField(H.payLogos, "HE_img('payLogos',{folder:'home',maxW:1200})", "HE_set('payLogos','',true)")}</div>${H.payLogos !== 'assets/payments.png' ? `<button class="btn link small" onclick="HE_set('payLogos','assets/payments.png',true)">${L('رجّع الصورة الأصلية', 'Restore original image')}</button>` : ''}</div>
  <div class="row between sec"><span class="small muted">${L('الهوية (الألوان والخط واللوجو) ثابتة على هوية NEXIUM.', 'Brand colours, font and logo follow the NEXIUM identity.')}</span><button class="btn bad ghost sm" onclick="HE_reset()">↺ ${L('إرجاع النصوص الافتراضية', 'Reset to defaults')}</button></div>`;
}
