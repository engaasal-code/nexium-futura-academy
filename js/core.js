/* ================= NEXIUM FUTURA ACADEMY — core (data, helpers, rules) ================= */
const STORE_KEY = 'nexium_demo_v1';
let LANG = 'ar';
const L = (ar, en) => (LANG === 'ar' ? ar : en);
const $ = (s, r = document) => r.querySelector(s);
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const uid = p => p + Math.random().toString(36).slice(2, 8) + Date.now().toString(36).slice(-3);
const WA_NUMBER = '201001074715'; // 01001074715
const WA_DISPLAY = '01001074715';

/* ---------- time helpers ---------- */
const DAY = 864e5, MIN = 6e4;
function atDay(offsetDays, h, m = 0) { const d = new Date(); d.setHours(0, 0, 0, 0); d.setDate(d.getDate() + offsetDays); d.setHours(h, m, 0, 0); return d.toISOString(); }
const pad = n => String(n).padStart(2, '0');
const ymd = d => { d = new Date(d); return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()); };
const fmtTime = iso => new Date(iso).toLocaleTimeString(LANG === 'ar' ? 'ar-EG' : 'en-US', { hour: 'numeric', minute: '2-digit' });
const fmtDate = iso => new Date(iso).toLocaleDateString(LANG === 'ar' ? 'ar-EG' : 'en-GB', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });
const fmtDateShort = iso => new Date(iso).toLocaleDateString(LANG === 'ar' ? 'ar-EG' : 'en-GB', { day: 'numeric', month: 'short' });
const fmtDT = iso => fmtDate(iso) + ' · ' + fmtTime(iso);
const dayNum = iso => new Date(iso).getDate();
const monShort = iso => new Date(iso).toLocaleDateString(LANG === 'ar' ? 'ar-EG' : 'en-US', { month: 'short' });
const overlaps = (aS, aE, bS, bE) => aS < bE && bS < aE;
const sEnd = s => new Date(s.start).getTime() + (s.dur || 60) * MIN;
function relTime(iso) {
  const diff = new Date(iso).getTime() - Date.now(); const a = Math.abs(diff);
  const m = Math.round(a / MIN), h = Math.round(a / 36e5), d = Math.round(a / DAY);
  const v = m < 60 ? L(`${m} دقيقة`, `${m} min`) : h < 48 ? L(`${h} ساعة`, `${h} h`) : L(`${d} يوم`, `${d} days`);
  return diff > 0 ? L('بعد ', 'in ') + v : L('منذ ', '') + v + L('', ' ago');
}

/* ---------- curriculum ---------- */
const STAGES = [
  { id: 'kg', e: '🧸', ar: 'رياض الأطفال', en: 'Kindergarten', grades: ['KG1', 'KG2'], color: '#E9A23B' },
  { id: 'pri', e: '✏️', ar: 'الابتدائية', en: 'Primary', grades: ['G1', 'G2', 'G3', 'G4', 'G5', 'G6'], color: '#2F6FDB' },
  { id: 'prep', e: '📘', ar: 'الإعدادية', en: 'Preparatory', grades: ['G7', 'G8', 'G9'], color: '#1F9D6B' },
  { id: 'sec', e: '🎓', ar: 'الثانوية', en: 'Secondary', grades: ['G10', 'G11', 'G12'], color: '#0B2463' },
  { id: 'summer', e: '☀️', ar: 'كورسات الصيف', en: 'Summer Courses', grades: [], color: '#D64545' },
];
const gradeName = g => { if (!g) return ''; if (g.startsWith('KG')) return g; const n = g.slice(1); return L('الصف ' + n, 'Grade ' + n); };
const SUBJ_LIB = {
  ar: ['اللغة العربية', 'Arabic', '📖'], en: ['اللغة الإنجليزية', 'English', '🔤'], math: ['الرياضيات', 'Mathematics', '➗'],
  bsci: ['العلوم المبسطة', 'Basic Science', '🔬'], sci: ['العلوم', 'Science', '🔬'], rel: ['التربية الدينية', 'Religious Education', '🕌'],
  life: ['المهارات الحياتية', 'Life Skills', '🌱'], art: ['التربية الفنية', 'Art', '🎨'], pe: ['التربية البدنية', 'Physical Education', '⚽'],
  soc: ['الدراسات الاجتماعية', 'Social Studies', '🌍'], ict: ['تكنولوجيا المعلومات', 'ICT', '💻'], cs: ['الكمبيوتر وتكنولوجيا المعلومات', 'Computer Science & ICT', '💻'],
  fl2: ['اللغة الأجنبية الثانية', 'Second Foreign Language', '🗣️'], phy: ['الفيزياء', 'Physics', '⚛️'], chem: ['الكيمياء', 'Chemistry', '🧪'],
  bio: ['الأحياء', 'Biology', '🧬'], his: ['التاريخ', 'History', '🏛️'], geo: ['الجغرافيا', 'Geography', '🗺️'],
  connect: ['كونكت', 'Connect', '🔗'], connectp: ['كونكت بلس', 'Connect Plus', '➕'],
  s_conv: ['محادثة إنجليزي', 'English Conversation', '💬'], s_code: ['برمجة للأطفال', 'Coding for Kids', '🤖'], s_quran: ['القرآن والتجويد', 'Quran & Tajweed', '📿'],
  s_olymp: ['أولمبياد الرياضيات', 'Math Olympiad', '🏅'], s_ielts: ['تحضير IELTS', 'IELTS Preparation', '🎯'], s_callig: ['الخط العربي', 'Arabic Calligraphy', '✒️'],
};
const STAGE_SUBJ = {
  kg: ['ar', 'en', 'connect', 'math', 'bsci', 'rel', 'life', 'art', 'pe'],
  pri: ['ar', 'en', 'connect', 'connectp', 'math', 'sci', 'soc', 'rel', 'ict', 'art', 'pe'],
  prep: ['ar', 'en', 'fl2', 'math', 'sci', 'soc', 'rel', 'cs', 'art', 'pe'],
  sec: ['ar', 'en', 'fl2', 'math', 'phy', 'chem', 'bio', 'his', 'geo', 'rel', 'ict'],
  summer: ['s_conv', 's_code', 's_quran', 's_olymp', 's_ielts', 's_callig'],
};
const BASE_PPS = { kg: { SAR: 45, EGP: 250 }, pri: { SAR: 55, EGP: 300 }, prep: { SAR: 65, EGP: 375 }, sec: { SAR: 80, EGP: 450 }, summer: { SAR: 60, EGP: 350 } };
const PACKAGES = [
  { n: 1, ar: 'حصة تجريبية', en: 'Trial session', disc: 0.5 },
  { n: 8, ar: 'باقة 8 حصص', en: '8 sessions', disc: 1 },
  { n: 16, ar: 'باقة 16 حصة', en: '16 sessions', disc: 0.93, best: true },
  { n: 24, ar: 'باقة 24 حصة', en: '24 sessions', disc: 0.88 },
];
const subjName = s => s ? (LANG === 'ar' ? s.ar : s.en) : '—';
const stageName = id => { const s = STAGES.find(x => x.id === id); return s ? (LANG === 'ar' ? s.ar : s.en) : ''; };

/* ---------- countries & currency ---------- */
const COUNTRIES_SEED = [
  { code: 'SA', ar: 'السعودية', en: 'Saudi Arabia', flag: '🇸🇦', cur: 'SAR', sym: { ar: 'ر.س', en: 'SAR' }, rate: 1 },
  { code: 'EG', ar: 'مصر', en: 'Egypt', flag: '🇪🇬', cur: 'EGP', sym: { ar: 'ج.م', en: 'EGP' }, rate: 13.2 },
  { code: 'AE', ar: 'الإمارات', en: 'UAE', flag: '🇦🇪', cur: 'AED', sym: { ar: 'د.إ', en: 'AED' }, rate: 0.98 },
  { code: 'KW', ar: 'الكويت', en: 'Kuwait', flag: '🇰🇼', cur: 'KWD', sym: { ar: 'د.ك', en: 'KWD' }, rate: 0.082, dec: 3 },
  { code: 'OM', ar: 'عُمان', en: 'Oman', flag: '🇴🇲', cur: 'OMR', sym: { ar: 'ر.ع', en: 'OMR' }, rate: 0.1026, dec: 3 },
  { code: 'QA', ar: 'قطر', en: 'Qatar', flag: '🇶🇦', cur: 'QAR', sym: { ar: 'ر.ق', en: 'QAR' }, rate: 0.97 },
  { code: 'BH', ar: 'البحرين', en: 'Bahrain', flag: '🇧🇭', cur: 'BHD', sym: { ar: 'د.ب', en: 'BHD' }, rate: 0.1003, dec: 3 },
  { code: 'US', ar: 'دولة أخرى (دولار)', en: 'Other (USD)', flag: '🌐', cur: 'USD', sym: { ar: '$', en: '$' }, rate: 0.2667 },
];
function guessCountry() {
  try { const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || '';
    const m = { 'Asia/Riyadh': 'SA', 'Africa/Cairo': 'EG', 'Asia/Dubai': 'AE', 'Asia/Kuwait': 'KW', 'Asia/Muscat': 'OM', 'Asia/Qatar': 'QA', 'Asia/Bahrain': 'BH' };
    return m[tz] || 'SA'; } catch (e) { return 'SA'; }
}

/* ---------- permissions ---------- */
const PERM_GROUPS = [
  { ar: 'الطلاب', en: 'Students', items: [
    ['stu.view', 'عرض قائمة الطلاب', 'View students'], ['stu.add', 'إضافة طالب', 'Add student'], ['stu.edit', 'تعديل بيانات الطالب', 'Edit student'],
    ['stu.delete', 'حذف طالب', 'Delete student'], ['stu.toggle', 'تفعيل / إيقاف حساب طالب', 'Activate / deactivate student']] },
  { ar: 'المدرسين', en: 'Teachers', items: [
    ['tch.view', 'عرض المدرسين', 'View teachers'], ['tch.add', 'إضافة مدرس', 'Add teacher'], ['tch.edit', 'تعديل بيانات المدرس ولينك اليوتيوب', 'Edit teacher & YouTube link'],
    ['tch.delete', 'حذف / إيقاف مدرس', 'Delete / suspend teacher'], ['tch.rates', 'تعديل أجر المدرس', 'Edit teacher pay rates'],
    ['tch.rating', 'تقييم المدرس بالنجوم من الإدارة', 'Set teacher star rating (admin)']] },
  { ar: 'الحصص والمواعيد', en: 'Sessions & schedule', items: [
    ['ses.slots', 'إضافة مواعيد متاحة', 'Add available slots'], ['ses.assign', 'إضافة طالب على حصة', 'Assign student to session'], ['ses.attend', 'تسجيل الحضور والغياب', 'Mark attendance'],
    ['ses.zoom', 'إضافة / تعديل لينك الزوم', 'Set Zoom link'], ['ses.cancel', 'إلغاء حصة محجوزة', 'Cancel booked session'], ['ses.viewall', 'عرض جداول كل المدرسين', 'View all teachers’ schedules']] },
  { ar: 'الواجبات والتقييم', en: 'Homework & evaluation', items: [
    ['hw.assign', 'إضافة واجب', 'Assign homework'], ['hw.grade', 'تصحيح الواجب', 'Grade homework'], ['hw.delete', 'حذف واجب', 'Delete homework'],
    ['ev.enter', 'إدخال تقييم الطالب', 'Enter student evaluation'], ['ev.edit', 'تعديل تقييم بعد حفظه', 'Change a saved evaluation'], ['ev.cert', 'إصدار شهادات', 'Issue certificates']] },
  { ar: 'المالية', en: 'Finance', items: [
    ['fin.dash', 'عرض الداشبورد المالي', 'View financial dashboard'], ['fin.profit', 'عرض صافي الربح', 'View net profit'], ['fin.record', 'تسجيل دفعة', 'Record payment'],
    ['fin.approve', 'اعتماد التحويلات', 'Approve transfers'], ['fin.payout', 'صرف مستحقات المدرسين', 'Pay teachers'], ['fin.prices', 'تعديل الأسعار والعملات', 'Edit prices & currencies'],
    ['fin.methods', 'التحكم في طرق الدفع', 'Manage payment methods'], ['fin.withdraw', 'تسجيل انسحاب طالب', 'Record withdrawal']] },
  { ar: 'المحتوى', en: 'Content', items: [
    ['cnt.subjects', 'إظهار / إخفاء المواد', 'Show / hide subjects'], ['cnt.summer', 'إدارة كورسات الصيف', 'Manage summer courses'],
    ['cnt.pages', 'إدارة الصفحات التعريفية ونشرها', 'Manage & publish site pages'], ['cnt.home', 'تعديل واجهة الموقع (الصور والنصوص)', 'Edit the homepage (images & text)'], ['cnt.social', 'تعديل روابط السوشيال وبيانات التواصل', 'Edit social links & contact info']] },
  { ar: 'التواصل', en: 'Communication', items: [
    ['com.chat', 'المحادثة مع أولياء الأمور', 'Chat with parents'], ['com.monitor', 'مراقبة كل المحادثات', 'Monitor all chats'], ['com.emails', 'عرض سجل الإيميلات', 'View email log']] },
  { ar: 'النظام', en: 'System', items: [
    ['sys.perms', 'تعديل الصلاحيات', 'Edit permissions'], ['sys.staff', 'إدارة حسابات الإدارة', 'Manage admin accounts']] },
];
const ROLES = [
  { id: 'teacher', ar: 'مدرس', en: 'Teacher' },
  { id: 'supervisor', ar: 'مشرف', en: 'Supervisor' },
  { id: 'principal', ar: 'مدير المدرسة', en: 'School Principal' },
  { id: 'ceo', ar: 'الرئيس التنفيذي', en: 'CEO' },
];
const roleName = id => { const r = ROLES.find(x => x.id === id); return r ? (LANG === 'ar' ? r.ar : r.en) : id; };
function defaultPerms() {
  const all = PERM_GROUPS.flatMap(g => g.items.map(i => i[0]));
  const on = {
    teacher: ['stu.view', 'stu.add', 'ses.slots', 'ses.assign', 'ses.attend', 'ses.zoom', 'hw.assign', 'hw.grade', 'ev.enter', 'ev.cert', 'com.chat'],
    supervisor: ['stu.view', 'stu.add', 'stu.edit', 'tch.view', 'ses.slots', 'ses.assign', 'ses.attend', 'ses.zoom', 'ses.cancel', 'ses.viewall', 'hw.assign', 'hw.grade', 'hw.delete', 'ev.enter', 'ev.edit', 'ev.cert', 'com.chat', 'com.monitor', 'com.emails'],
    principal: all.filter(p => !['sys.perms', 'sys.staff', 'fin.profit', 'fin.prices', 'fin.methods'].includes(p)),
    ceo: all,
  };
  const P = {}; ROLES.forEach(r => { P[r.id] = {}; all.forEach(p => P[r.id][p] = on[r.id].includes(p)); }); return P;
}

/* ---------- seed ---------- */
function seed() {
  const subjects = [];
  Object.entries(STAGE_SUBJ).forEach(([st, keys]) => keys.forEach(k => {
    const [ar, en, ic] = SUBJ_LIB[k];
    subjects.push({ id: st + '_' + k, key: k, stage: st, ar, en, icon: ic, visible: !(k === 'pe' && st !== 'kg'), pps: { ...BASE_PPS[st] }, countryPps: {} });
  }));
  // a custom country price example: Kuwait secondary math
  const sm = subjects.find(s => s.id === 'sec_math'); sm.countryPps = { KW: 7.5, AE: 85 };
  const TC = ['#0B2463', '#A67812', '#1F9D6B', '#7B3FA0', '#C2410C', '#2F6FDB'];
  const teachers = [
    { id: 't1', name: 'أ. منى عبد الرحمن', nameEn: 'Ms. Mona Abdelrahman', email: 'mona@nexium.academy', phone: '0100000001', color: TC[0], bio: 'مدرسة لغة إنجليزية ومنهج كونكت – خبرة 9 سنوات مع رياض الأطفال والابتدائي.', bioEn: 'English & Connect teacher – 9 years with KG and primary.', youtube: 'https://youtu.be/dQw4w9WgXcQ', zoom: 'https://zoom.us/j/8812345001', subjects: [{ id: 'kg_en', rate: 22 }, { id: 'kg_connect', rate: 22 }, { id: 'pri_en', rate: 26 }, { id: 'pri_connect', rate: 25 }, { id: 'pri_connectp', rate: 27 }, { id: 'summer_s_conv', rate: 28 }], active: true, camera: true, badge: 'top' },
    { id: 't2', name: 'أ. أحمد سمير', nameEn: 'Mr. Ahmed Samir', email: 'ahmed.s@nexium.academy', phone: '0100000002', color: TC[1], bio: 'مدرس رياضيات للمرحلتين الإعدادية والثانوية ومدرب أولمبياد.', bioEn: 'Math teacher for prep & secondary, Olympiad coach.', youtube: 'https://youtu.be/dQw4w9WgXcQ', zoom: 'https://zoom.us/j/8812345002', subjects: [{ id: 'prep_math', rate: 32 }, { id: 'sec_math', rate: 40 }, { id: 'pri_math', rate: 26 }, { id: 'summer_s_olymp', rate: 35 }], active: true, camera: true },
    { id: 't3', name: 'أ. فاطمة الزهراء', nameEn: 'Ms. Fatma Elzahraa', email: 'fatma@nexium.academy', phone: '0100000003', color: TC[2], bio: 'مدرسة لغة عربية وتربية دينية وتحفيظ قرآن بالتجويد.', bioEn: 'Arabic, religious studies and Quran with Tajweed.', youtube: 'https://youtu.be/dQw4w9WgXcQ', zoom: 'https://zoom.us/j/8812345003', subjects: [{ id: 'kg_ar', rate: 20 }, { id: 'pri_ar', rate: 24 }, { id: 'prep_ar', rate: 20 }, { id: 'pri_rel', rate: 22 }, { id: 'summer_s_quran', rate: 25 }, { id: 'summer_s_callig', rate: 25 }], active: true, camera: true, badge: 'rising', baseRating: 4.8, baseCount: 10 },
    { id: 't4', name: 'د. كريم حسن', nameEn: 'Dr. Karim Hassan', email: 'karim@nexium.academy', phone: '0100000004', color: TC[3], bio: 'دكتوراه في الفيزياء – يدرّس الفيزياء والكيمياء والعلوم.', bioEn: 'PhD Physics – teaches physics, chemistry and science.', youtube: 'https://youtu.be/dQw4w9WgXcQ', zoom: 'https://zoom.us/j/8812345004', subjects: [{ id: 'sec_phy', rate: 42 }, { id: 'sec_chem', rate: 42 }, { id: 'prep_sci', rate: 22 }, { id: 'pri_sci', rate: 26 }], active: true, camera: false },
    { id: 't5', name: 'أ. سارة يوسف', nameEn: 'Ms. Sara Youssef', email: 'sara@nexium.academy', phone: '0100000005', color: TC[4], bio: 'مدرسة لغة إنجليزية للثانوي ومدربة IELTS معتمدة.', bioEn: 'Secondary English teacher, certified IELTS trainer.', youtube: 'https://youtu.be/dQw4w9WgXcQ', zoom: 'https://zoom.us/j/8812345005', subjects: [{ id: 'prep_en', rate: 30 }, { id: 'sec_en', rate: 38 }, { id: 'summer_s_ielts', rate: 40 }, { id: 'summer_s_conv', rate: 28 }], active: true, camera: true },
    { id: 't6', name: 'أ. عمر خالد', nameEn: 'Mr. Omar Khaled', email: 'omar@nexium.academy', phone: '0100000006', color: TC[5], bio: 'مهندس برمجيات ومدرس تكنولوجيا معلومات وبرمجة للأطفال.', bioEn: 'Software engineer teaching ICT and kids coding.', youtube: 'https://youtu.be/dQw4w9WgXcQ', zoom: 'https://zoom.us/j/8812345006', subjects: [{ id: 'pri_ict', rate: 24 }, { id: 'prep_cs', rate: 30 }, { id: 'sec_ict', rate: 34 }, { id: 'summer_s_code', rate: 30 }], active: true, camera: true, baseRating: 4.6, baseCount: 5 },
  ];
  const students = [
    { id: 's1', name: 'يوسف أحمد', parent: 'أحمد محمود', email: 'parent.youssef@gmail.com', phone: '0551234567', country: 'SA', stage: 'pri', grade: 'G4', pass: '123456', confirmed: true, provider: 'email', active: true, joined: atDay(-70, 10), withdrawn: false },
    { id: 's9', name: 'سارة أحمد', parent: 'أحمد محمود', email: 'parent.youssef@gmail.com', phone: '0551234567', country: 'SA', stage: 'pri', grade: 'G2', pass: '123456', confirmed: true, provider: 'email', active: true, joined: atDay(-30, 10), withdrawn: false },
    { id: 's2', name: 'ليان خالد', parent: 'خالد العتيبي', email: 'layan.parent@gmail.com', phone: '0559876543', country: 'SA', stage: 'sec', grade: 'G11', pass: '123456', confirmed: true, provider: 'google', active: true, joined: atDay(-55, 10) },
    { id: 's3', name: 'مريم حسام', parent: 'حسام فؤاد', email: 'hossam.f@yahoo.com', phone: '01012345678', country: 'EG', stage: 'prep', grade: 'G8', pass: '123456', confirmed: true, provider: 'yahoo', active: true, joined: atDay(-40, 10) },
    { id: 's4', name: 'عبدالله سعيد', parent: 'سعيد الكندي', email: 'saeed.k@outlook.com', phone: '96891234567', country: 'OM', stage: 'kg', grade: 'KG2', pass: '123456', confirmed: true, provider: 'email', active: true, joined: atDay(-35, 10) },
    { id: 's5', name: 'نور الهدى', parent: 'منى إبراهيم', email: 'mona.ibr@gmail.com', phone: '0501112233', country: 'AE', stage: 'sec', grade: 'G10', pass: '123456', confirmed: false, provider: 'facebook', active: true, joined: atDay(-20, 10) },
    { id: 's6', name: 'آدم وليد', parent: 'وليد الصباح', email: 'waleed.s@gmail.com', phone: '96550001122', country: 'KW', stage: 'pri', grade: 'G2', pass: '123456', confirmed: true, provider: 'email', active: true, joined: atDay(-90, 10) },
    { id: 's7', name: 'جنى طارق', parent: 'طارق عادل', email: 'tarek.adel@gmail.com', phone: '01098765432', country: 'EG', stage: 'pri', grade: 'G5', pass: '123456', confirmed: true, provider: 'google', active: true, joined: atDay(-60, 10) },
    { id: 's8', name: 'سلمان فهد', parent: 'فهد القحطاني', email: 'fahad.q@gmail.com', phone: '0543334455', country: 'SA', stage: 'prep', grade: 'G9', pass: '123456', confirmed: true, provider: 'email', active: false, joined: atDay(-100, 10) },
  ];
  const staff = [
    { id: 'a1', name: 'م. أحمد عسل', email: 'ceo@nexium.academy', role: 'ceo' },
    { id: 'a2', name: 'أ. هالة منصور', email: 'principal@nexium.academy', role: 'principal' },
    { id: 'a3', name: 'أ. ياسر جمال', email: 'supervisor@nexium.academy', role: 'supervisor' },
  ];
  const DB = { v: 1, subjects, teachers, students, staff, sessions: [], enrollments: [], homework: [], evals: [], certs: [], ratings: [], messages: [], emails: [], payouts: [], expenses: [], withdrawals: [],
    perms: defaultPerms(), countries: COUNTRIES_SEED.map(c => ({ ...c })),
    settings: { displayCur: 'auto', reportCur: 'SAR', sessionMin: 60, reminderMin: 10, academyPhone: WA_DISPLAY, packageDays: 60 },
    methods: [
      { id: 'bank', ar: 'تحويل بنكي', en: 'Bank transfer', on: true, details: 'البنك الأهلي – IBAN: SA00 0000 0000 0000 0000 0000 – باسم NEXIUM FUTURA ACADEMY' },
      { id: 'vf', ar: 'فودافون كاش', en: 'Vodafone Cash', on: true, details: 'حوّل على الرقم 01001074715 ثم ارفع صورة الإيصال' },
      { id: 'insta', ar: 'إنستاباي', en: 'InstaPay', on: true, details: 'nexium@instapay' },
    ],
    social: { facebook: 'https://facebook.com/nexiumfutura', instagram: 'https://instagram.com/nexiumfutura', x: 'https://x.com/nexiumfutura', tiktok: 'https://tiktok.com/@nexiumfutura', youtube: 'https://youtube.com/@nexiumfutura', linkedin: 'https://linkedin.com/company/nexiumfutura', email: 'info@nexium.academy', phone: '01001074715', whatsapp: '01001074715' },
    footerAbout: { ar: 'NEXIUM FUTURA ACADEMY منصة تعليمية أونلاين لكل المراحل الدراسية من KG حتى الثانوية، بمدرسين متخصصين وحصص مباشرة ومتابعة كاملة لولي الأمر.', en: 'NEXIUM FUTURA ACADEMY is an online learning platform for every stage from KG to secondary, with specialist teachers, live sessions and full parent follow-up.' },
    pages: seedPages(), home: {},
    withdrawReasons: ['السعر مرتفع', 'ظروف سفر', 'عدم التوافق مع المدرس', 'ضغط الدراسة في المدرسة', 'انتقل لمنصة أخرى', 'أسباب أخرى'],
  };
  const S = DB.sessions, E = DB.enrollments;
  const sub = id => subjects.find(s => s.id === id);
  const enroll = (stu, sid, n, payStatus, daysAgo, paidFrac = 1, method = 'bank') => {
    const st = students.find(x => x.id === stu); const s = sub(sid);
    const cur = st.country === 'EG' ? 'EGP' : 'SAR';
    const pk = PACKAGES.find(p => p.n === n);
    const amount = Math.round(s.pps[cur] * n * pk.disc);
    const e = { id: uid('e'), studentId: stu, subjectId: sid, sessions: n, amount, currency: cur, method,
      paid: payStatus === 'paid' ? amount : payStatus === 'partial' ? Math.round(amount * paidFrac) : 0,
      status: payStatus, created: atDay(-daysAgo, 12), from: ymd(atDay(-daysAgo, 0)), to: ymd(atDay(-daysAgo + 60, 0)), receipt: payStatus === 'pending' ? 'receipt_transfer.jpg' : '' };
    E.push(e); return e;
  };
  const mk = (tid, sid, day, h, stu, status, extra = {}) => {
    const t = teachers.find(x => x.id === tid);
    const s = { id: uid('ss'), teacherId: tid, subjectId: sid, start: atDay(day, h), dur: 60, studentId: stu || null, status, zoom: t.zoom, objectives: '', material: '', assignment: '', recording: '', enrollmentId: extra.e || null, ...extra };
    S.push(s); return s;
  };
  // Youssef (s1): English with Mona (16 pkg), Math with Ahmed (8 pkg)
  const e1 = enroll('s1', 'pri_en', 16, 'paid', 45); const e2 = enroll('s1', 'pri_math', 8, 'partial', 20, 0.5, 'vf');
  const pastDays = [-40, -37, -33, -30, -26, -23, -19, -16, -12, -9, -5, -2];
  pastDays.forEach((d, i) => mk('t1', 'pri_en', d, 17, 's1', i === 6 ? 'absent' : 'done', { e: e1.id,
    objectives: L('مراجعة الوحدة ' + (i + 1) + ' – مفردات وقواعد', 'Unit ' + (i + 1) + ' review'), material: 'Connect Plus – Unit ' + (i + 1) + '.pdf',
    assignment: i >= 9 ? 'حل تمارين صفحة ' + (20 + i) + ' وتسجيل فيديو قراءة القطعة' : '', recording: 'https://zoom.us/rec/share/demo' + i }));
  [-15, -8, -1].forEach(d => mk('t2', 'pri_math', d, 18, 's1', 'done', { e: e2.id, objectives: 'الكسور العشرية', assignment: d === -1 ? 'ورقة عمل الكسور (10 مسائل)' : '' }));
  mk('t1', 'pri_en', 0, new Date().getHours() + 1 > 22 ? 22 : new Date().getHours() + 1, 's1', 'booked', { e: e1.id, objectives: 'Unit 13 – Reading' });
  mk('t1', 'pri_en', 3, 17, 's1', 'booked', { e: e1.id });
  mk('t2', 'pri_math', 2, 18, 's1', 'booked', { e: e2.id });
  mk('t2', 'pri_math', -4, 18, 's1', 'cancelled', { e: e2.id });
  // Sara (s9) – Youssef's sister, same parent account: Arabic package close to its end
  const e9b = enroll('s9', 'pri_ar', 8, 'paid', 52); [-30, -26, -22, -18, -12, -6].forEach((d, i) => mk('t3', 'pri_ar', d, 16, 's9', i === 2 ? 'absent' : 'done', { e: e9b.id, recording: i > 3 ? 'https://zoom.us/rec/share/demo-sara' + i : '' })); mk('t3', 'pri_ar', 2, 16, 's9', 'booked', { e: e9b.id });
  // Layan (s2) sec math & physics
  const e3 = enroll('s2', 'sec_math', 24, 'paid', 50); const e4 = enroll('s2', 'sec_phy', 8, 'pending', 2, 1, 'insta');
  [-30, -25, -20, -15, -10, -6, -3].forEach((d, i) => mk('t2', 'sec_math', d, 20, 's2', i === 3 ? 'absent' : 'done', { e: e3.id }));
  mk('t2', 'sec_math', 1, 20, 's2', 'booked', { e: e3.id }); mk('t2', 'sec_math', 4, 20, 's2', 'booked', { e: e3.id });
  // Mariam (s3) prep arabic & science (EGP)
  const e5 = enroll('s3', 'prep_ar', 16, 'paid', 38); const e6 = enroll('s3', 'prep_sci', 8, 'paid', 30, 1, 'vf');
  [-28, -21, -14, -7].forEach(d => mk('t3', 'prep_ar', d, 16, 's3', 'done', { e: e5.id }));
  [-20, -13, -6].forEach(d => mk('t4', 'prep_sci', d, 19, 's3', 'done', { e: e6.id }));
  mk('t3', 'prep_ar', 0, 21, 's3', 'booked', { e: e5.id }); mk('t4', 'prep_sci', 1, 19, 's3', 'booked', { e: e6.id });
  // Abdullah (s4) KG
  const e7 = enroll('s4', 'kg_connect', 8, 'paid', 30); [-24, -17, -10, -3].forEach(d => mk('t1', 'kg_connect', d, 15, 's4', 'done', { e: e7.id })); mk('t1', 'kg_connect', 4, 15, 's4', 'booked', { e: e7.id });
  // Nour (s5) trial
  const e8 = enroll('s5', 'sec_en', 1, 'paid', 5, 1, 'bank'); mk('t5', 'sec_en', 2, 19, 's5', 'booked', { e: e8.id });
  // Adam (s6) withdrawn
  const e9 = enroll('s6', 'pri_connect', 16, 'partial', 80, 0.5); [-75, -71, -68, -64].forEach(d => mk('t1', 'pri_connect', d, 16, 's6', 'done', { e: e9.id }));
  e9.status = 'withdrawn'; DB.withdrawals.push({ id: uid('w'), studentId: 's6', enrollmentId: e9.id, reason: 'ظروف سفر', note: 'سافروا خارج الكويت لمدة 3 شهور', date: atDay(-60, 12), refund: 0 });
  // Jana (s7) EGP pending + withdrawn other
  const e10 = enroll('s7', 'pri_ar', 8, 'pending', 1, 1, 'vf');
  const e11 = enroll('s7', 'pri_sci', 8, 'paid', 50); [-45, -41, -38].forEach(d => mk('t4', 'pri_sci', d, 17, 's7', 'done', { e: e11.id }));
  e11.status = 'withdrawn'; DB.withdrawals.push({ id: uid('w'), studentId: 's7', enrollmentId: e11.id, reason: 'عدم التوافق مع المدرس', note: 'طلبت مدرسة بدلاً من مدرس', date: atDay(-36, 12), refund: 600 });
  // Salman (s8) inactive, withdrew – price
  const e12 = enroll('s8', 'prep_math', 8, 'paid', 95); [-90, -86].forEach(d => mk('t2', 'prep_math', d, 18, 's8', 'done', { e: e12.id }));
  e12.status = 'withdrawn'; DB.withdrawals.push({ id: uid('w'), studentId: 's8', enrollmentId: e12.id, reason: 'السعر مرتفع', note: '', date: atDay(-84, 12), refund: 0 });
  // open availability slots for next 14 days
  const avail = { t1: [[16, 17, 18, 19]], t2: [[17, 19, 21]], t3: [[15, 16, 17, 20]], t4: [[18, 20]], t5: [[17, 18, 20, 21]], t6: [[16, 18, 19]] };
  Object.entries(avail).forEach(([tid, [hours]]) => {
    const t = teachers.find(x => x.id === tid);
    for (let d = 0; d <= 14; d++) {
      const wd = new Date(atDay(d, 0)).getDay(); if (wd === 5) continue; // Friday off
      if ((d + tid.charCodeAt(1)) % 4 === 0) continue; // some days off
      hours.forEach(h => {
        const st = atDay(d, h); if (new Date(st).getTime() < Date.now() + 30 * MIN) return;
        const busy = S.some(x => x.teacherId === tid && x.status !== 'cancelled' && overlaps(new Date(st).getTime(), new Date(st).getTime() + 60 * MIN, new Date(x.start).getTime(), sEnd(x)));
        if (!busy) S.push({ id: uid('ss'), teacherId: tid, subjectId: null, start: st, dur: 60, studentId: null, status: 'open', zoom: t.zoom });
      });
    }
  });
  // homework submissions
  const hwS = S.filter(s => s.studentId === 's1' && s.assignment && s.status === 'done');
  if (hwS[0]) DB.homework.push({ id: uid('h'), sessionId: hwS[0].id, studentId: 's1', file: 'youssef_unit10.pdf', note: 'تم الحل', at: atDay(-8, 21), grade: 9, max: 10, feedback: 'ممتاز يا يوسف، انتبه لكتابة الحروف الكبيرة.' });
  if (hwS[1]) DB.homework.push({ id: uid('h'), sessionId: hwS[1].id, studentId: 's1', file: 'reading_video.mp4', note: '', at: atDay(-4, 20), grade: null, max: 10, feedback: '' });
  // evaluations
  DB.evals.push({ id: uid('v'), studentId: 's1', teacherId: 't1', subjectId: 'pri_en', interaction: 88, homework: 80, commitment: 92, note: 'يوسف متفاعل جداً ومستواه في القراءة تحسّن بشكل ملحوظ.', at: atDay(-2, 19) });
  DB.evals.push({ id: uid('v'), studentId: 's1', teacherId: 't2', subjectId: 'pri_math', interaction: 75, homework: 65, commitment: 80, note: 'يحتاج تدريب إضافي على الكسور.', at: atDay(-1, 19) });
  DB.evals.push({ id: uid('v'), studentId: 's2', teacherId: 't2', subjectId: 'sec_math', interaction: 90, homework: 95, commitment: 85, note: '', at: atDay(-3, 21) });
  DB.certs.push({ id: uid('c'), studentId: 's1', teacherId: 't1', type: 'thanks', title: 'شهادة شكر وتقدير', reason: 'للالتزام والتفوق في مستوى Connect Plus 4', at: atDay(-10, 12) });
  DB.certs.push({ id: uid('c'), studentId: 's1', teacherId: 't1', type: 'level', title: 'شهادة إتمام مستوى', reason: 'أتمّ الوحدات 1–6 بنجاح', at: atDay(-30, 12) });
  // ratings
  [['t1', 's1', 5, 'مدرسة ممتازة وصبورة'], ['t1', 's4', 5, ''], ['t1', 's6', 4, ''], ['t2', 's1', 4, 'شرح واضح'], ['t2', 's2', 5, 'أفضل مدرس رياضيات'], ['t3', 's3', 5, ''], ['t4', 's3', 4, ''], ['t4', 's7', 3, ''], ['t5', 's5', 5, '']].forEach(([t, s, n, c]) => DB.ratings.push({ id: uid('r'), teacherId: t, studentId: s, stars: n, comment: c, at: atDay(-5, 12) }));
  // messages
  const th = (s, t) => s + '|' + t;
  DB.messages.push({ id: uid('m'), thread: th('s1', 't1'), from: 't1', text: 'أهلاً أ. أحمد، يوسف كان ممتاز في حصة النهارده 👏 الواجب على المنصة.', at: atDay(-2, 18, 10) });
  DB.messages.push({ id: uid('m'), thread: th('s1', 't1'), from: 's1', text: 'شكراً جزيلاً يا أستاذة، هيحلّه النهارده إن شاء الله.', at: atDay(-2, 18, 40) });
  DB.messages.push({ id: uid('m'), thread: th('s1', 't1'), from: 't1', text: '[محجوب] محاولة مشاركة رقم هاتف', at: atDay(-2, 18, 45), blocked: true, original: 'لو حابب كلمني على 0100 123 4567', by: 't1' });
  DB.messages.push({ id: uid('m'), thread: th('s1', 't2'), from: 't2', text: 'يوسف محتاج يراجع الكسور قبل الحصة الجاية.', at: atDay(-1, 19) });
  // finance: payouts & expenses
  DB.payouts.push({ id: uid('p'), teacherId: 't1', amount: 300, at: atDay(-20, 12), note: 'دفعة أكتوبر' });
  DB.payouts.push({ id: uid('p'), teacherId: 't2', amount: 250, at: atDay(-15, 12), note: '' });
  DB.payouts.push({ id: uid('p'), teacherId: 't3', amount: 100, at: atDay(-10, 12), note: '' });
  DB.expenses.push({ id: uid('x'), title: 'اشتراك Zoom Pro', amount: 180, at: atDay(-25, 12) }, { id: uid('x'), title: 'إعلانات سوشيال ميديا', amount: 900, at: atDay(-18, 12) }, { id: uid('x'), title: 'استضافة المنصة', amount: 120, at: atDay(-5, 12) });
  // emails
  S.filter(s => s.studentId && ['booked', 'done', 'absent'].includes(s.status)).forEach(s => queueReminder(DB, s));
  DB.emails.forEach(e => { if (e.status === 'sent' && new Date(e.at).getTime() < Date.now() - DAY) e.read = true; });
  DB.emails.push({ id: uid('em'), to: 'mona.ibr@gmail.com', type: 'confirm', subject: 'أكّد بريدك الإلكتروني – NEXIUM FUTURA ACADEMY', body: 'اضغط على الرابط لتأكيد حسابك.', at: atDay(-20, 10), status: 'sent' });
  return DB;
}
function seedPages() {
  const P = (slug, type, ar, en, bodyAr, bodyEn, status = 'published', footer = true) => ({ id: uid('pg'), slug, type, title: { ar, en }, body: { ar: bodyAr, en: bodyEn }, status, footer, seo: { desc: '' }, updated: new Date().toISOString() });
  return [
    P('about', 'general', 'من نحن', 'About us', '<p class="muted">من نحن</p><h2>أكاديمية تعليمية متكاملة لكل المراحل</h2><p>NEXIUM FUTURA ACADEMY منصة تعليمية أونلاين بتقدّم حصص مباشرة مع مدرسين متخصصين في كل المواد، من رياض الأطفال لحد الثانوية، بالإضافة لكورسات صيفية في المهارات واللغات.</p><h3>رؤيتنا</h3><p>إن كل طالب عربي يوصل لأفضل مدرس في مادته من بيته، وبمتابعة كاملة لولي الأمر.</p><h3>رسالتنا</h3><ul><li>حصص مباشرة بمواعيد مرنة</li><li>تقارير أداء واضحة لولي الأمر</li><li>أسعار عادلة بعملة بلدك</li></ul>', '<h2>A complete academy for every stage</h2><p>NEXIUM FUTURA ACADEMY offers live online sessions with specialist teachers in every subject, from kindergarten to secondary, plus summer skill and language courses.</p><h3>Vision</h3><p>Every Arab student reaches the best teacher for their subject from home, with full parent follow-up.</p>'),
    P('faq', 'general', 'أسئلة شائعة', 'FAQ', '<h3>إزاي أحجز حصة؟</h3><p>من "احجز حصة" اختار المرحلة والمادة والمدرس، وبعدين اختار ميعاد من المواعيد المتاحة عنده.</p><h3>هل أقدر أغيّر ميعاد الحصة؟</h3><p>أيوه، قبل الحصة بـ12 ساعة على الأقل من صفحة حصصي.</p><h3>إزاي أدفع؟</h3><p>تحويل بنكي أو فودافون كاش أو إنستاباي، وبعد التأكيد الباقة بتتفعّل.</p>', '<h3>How do I book?</h3><p>Go to “Book a session”, pick stage, subject and teacher, then choose one of the teacher’s free times.</p><h3>How do I pay?</h3><p>Bank transfer, Vodafone Cash or InstaPay.</p>'),
    P('terms', 'general', 'الشروط والأحكام', 'Terms & Conditions', '<h2>الشروط والأحكام</h2><p>باستخدامك منصة NEXIUM FUTURA ACADEMY فأنت توافق على الشروط التالية:</p><ol><li>الحساب شخصي ولا يجوز مشاركته.</li><li>يُمنع تبادل أرقام الهواتف أو وسائل التواصل الخارجية بين المدرس وولي الأمر، والتواصل يكون من خلال المنصة فقط.</li><li>يتم إرسال لينك الحصة على البريد المسجّل قبل موعدها بـ10 دقائق، ويُعتبر ذلك إخطاراً كافياً.</li><li>الغياب بدون اعتذار قبل 12 ساعة يُحتسب حصة.</li><li>صلاحية الباقة 60 يوماً من تاريخ التفعيل.</li></ol>', '<h2>Terms & Conditions</h2><ol><li>Accounts are personal.</li><li>Sharing phone numbers or outside contact between teachers and parents is not allowed.</li><li>The session link is emailed 10 minutes before start, which counts as notice.</li><li>No-shows without 12 hours notice count as a session.</li><li>Packages are valid for 60 days.</li></ol>'),
    P('refund', 'refund', 'سياسة الاسترداد والإلغاء', 'Refund & Cancellation Policy', '<h2>سياسة الاسترداد</h2><p>يمكن استرداد قيمة الحصص المتبقية خلال 14 يوماً من الشراء، بعد خصم الحصص المستخدمة ورسوم التحويل.</p>', '<h2>Refund policy</h2><p>Remaining sessions can be refunded within 14 days of purchase, minus used sessions and transfer fees.</p>'),
    P('privacy', 'privacy', 'سياسة الاستخدام والخصوصية', 'Privacy Policy', '<h2>الخصوصية</h2><p>بنحافظ على بيانات الطالب وولي الأمر ولا نشاركها مع أي طرف ثالث. أرقام الهواتف لا تظهر للمدرسين.</p>', '<h2>Privacy</h2><p>We protect student and parent data and never share it. Phone numbers are not shown to teachers.</p>'),
    P('teach', 'general', 'انضم كمدرس', 'Teach with us', '<h2>انضم لفريق المدرسين</h2><p>ابعت سيرتك الذاتية وفيديو تعريفي قصير عن طريق الواتساب.</p>', '<h2>Join our teachers</h2><p>Send your CV and a short intro video on WhatsApp.</p>', 'draft', true),
    P('blog', 'general', 'المدونة', 'Blog', '<h2>المدونة</h2><p>قريباً…</p>', '<h2>Blog</h2><p>Coming soon…</p>', 'draft', false),
  ];
}
function queueReminder(D, s) {
  const st = D.students.find(x => x.id === s.studentId); if (!st) return;
  const t = D.teachers.find(x => x.id === s.teacherId); const sub = D.subjects.find(x => x.id === s.subjectId);
  const sendAt = new Date(new Date(s.start).getTime() - (D.settings?.reminderMin || 10) * MIN).toISOString();
  D.emails = D.emails.filter(e => !(e.type === 'reminder' && e.sessionId === s.id));
  D.emails.push({ id: uid('em'), sessionId: s.id, to: st.email, type: 'reminder', subject: `⏰ حصتك هتبدأ بعد 10 دقايق – ${sub ? sub.ar : ''}`,
    body: `مرحباً ${st.parent}،\nحصة ${st.name} في مادة ${sub ? sub.ar : ''} مع ${t ? t.name : ''} هتبدأ الساعة ${new Date(s.start).toLocaleTimeString('ar-EG', { hour: 'numeric', minute: '2-digit' })}.\nلينك الدخول: ${s.zoom}`,
    at: sendAt, status: new Date(sendAt).getTime() <= Date.now() ? 'sent' : 'scheduled' });
}

/* ---------- persistence ---------- */
let D;
function load() { try { const raw = localStorage.getItem(STORE_KEY); if (raw) { D = JSON.parse(raw); const dp = defaultPerms(); Object.keys(dp).forEach(r => { D.perms[r] = Object.assign({}, dp[r], D.perms[r] || {}); }); return; } } catch (e) {} D = seed(); save(); }
function save() { try { localStorage.setItem(STORE_KEY, JSON.stringify(D)); } catch (e) {} }
function resetDemo() { D = seed(); save(); }
function refreshEmailStatus() { const now = Date.now(); D.emails.forEach(e => { if (e.status === 'scheduled' && new Date(e.at).getTime() <= now) e.status = 'sent'; }); }

/* ---------- lookups ---------- */
const subjById = id => D.subjects.find(s => s.id === id);
const tchById = id => D.teachers.find(t => t.id === id);
const stuById = id => D.students.find(s => s.id === id);
const tName = t => t ? (LANG === 'ar' ? t.name : (t.nameEn || t.name)) : '—';
const initials = n => String(n || '?').replace(/^(أ\.|د\.|م\.|Mr\.|Ms\.|Dr\.)\s*/, '').trim().split(/\s+/).slice(0, 2).map(w => w[0]).join('');
const countryBy = code => D.countries.find(c => c.code === code) || D.countries[0];
// التقييم = تقييمات أولياء الأمور + التقييم المبدئي اللي حدده الرئيس التنفيذي (كأنه عدد تقييمات بوزن معيّن)
const parentRating = tid => { const r = D.ratings.filter(x => x.teacherId === tid); return r.length ? r.reduce((a, b) => a + b.stars, 0) / r.length : 0; };
const ratingOf = tid => { const t = tchById(tid); const n = D.ratings.filter(x => x.teacherId === tid).length; const base = t && t.baseRating != null && t.baseRating !== '' ? t.baseRating : (t && t.adminRating ? +t.adminRating : null); return combinedRating(parentRating(tid), n, base, t && t.baseRating != null && t.baseRating !== '' ? t.baseCount : 10); };
const avgRating = tid => ratingOf(tid).v;
const stars = (v, n = 5) => { let h = ''; const r = Math.round((+v || 0) * 2) / 2; for (let i = 1; i <= n; i++) h += i <= r ? '★' : i - 0.5 === r ? '<span class="half">★</span>' : '<span class="off">★</span>'; return `<span class="stars" title="${(+v || 0).toFixed(1)}">${h}</span>`; };

/* ---------- pricing ---------- */
let VISITOR_COUNTRY = guessCountry();
function displayCountry(student) {
  const mode = D.settings.displayCur;
  if (mode === 'SAR') return countryBy('SA'); if (mode === 'EGP') return countryBy('EG');
  return countryBy(student ? student.country : VISITOR_COUNTRY);
}
function ppsFor(subject, country) {
  if (subject.countryPps && subject.countryPps[country.code] != null && subject.countryPps[country.code] !== '') return { v: +subject.countryPps[country.code], custom: true };
  if (country.cur === 'EGP') return { v: subject.pps.EGP, custom: false };
  return { v: subject.pps.SAR * country.rate, custom: false };
}
function money(v, country, opts = {}) {
  const dec = country.dec || 0; const n = (+v || 0).toLocaleString(LANG === 'ar' ? 'ar-EG' : 'en-US', { minimumFractionDigits: dec, maximumFractionDigits: dec });
  return `<span class="num">${n}</span> ${LANG === 'ar' ? country.sym.ar : country.sym.en}`;
}
function pkgPrice(subject, pkg, country) { const p = ppsFor(subject, country); const total = p.v * pkg.n * pkg.disc; const dec = country.dec || 0; const f = Math.pow(10, dec); return { total: Math.round(total * f) / f, per: Math.round(total / pkg.n * f) / f, custom: p.custom }; }
// accounting: convert any currency amount to report currency
function toSAR(amount, cur) { if (cur === 'SAR') return amount; const c = D.countries.find(x => x.cur === cur); return c ? amount / c.rate : amount; }
function fromSAR(v, cur) { if (cur === 'SAR') return v; const c = D.countries.find(x => x.cur === cur); return c ? v * c.rate : v; }
// التحكم في ظهور الأسعار: where = 'home' (الصفحة الرئيسية للزوار) أو 'students' (صفحات الطالب)
const pricesOn = where => !(D.settings && D.settings.showPrices && D.settings.showPrices[where] === false);
// سعر مادة معيّنة ظاهر؟ = الأسعار شغالة في المكان ده + المادة نفسها مش مقفول سعرها (المراحل والمواد ← إظهار السعر)
const priceShown = (where, subject) => pricesOn(where) && !(subject && subject.hidePrice);
const repC = () => countryBy(D.settings.reportCur === 'EGP' ? 'EG' : 'SA');
const rep = vSAR => money(fromSAR(vSAR, repC().cur), repC());

/* ---------- scheduling rules ---------- */
function teacherConflict(tid, startMs, dur, ignoreId) {
  const end = startMs + dur * MIN;
  return D.sessions.find(s => s.teacherId === tid && s.id !== ignoreId && s.status !== 'cancelled' && overlaps(startMs, end, new Date(s.start).getTime(), sEnd(s)));
}
function studentConflict(sid, startMs, dur, ignoreId) {
  const end = startMs + dur * MIN;
  return D.sessions.find(s => s.studentId === sid && s.id !== ignoreId && ['booked'].includes(s.status) && overlaps(startMs, end, new Date(s.start).getTime(), sEnd(s)));
}
function freeSlots(tid, studentId) {
  const now = Date.now() + 15 * MIN;
  return D.sessions.filter(s => s.teacherId === tid && s.status === 'open' && new Date(s.start).getTime() > now)
    .filter(s => !studentId || !studentConflict(studentId, new Date(s.start).getTime(), s.dur))
    .sort((a, b) => a.start.localeCompare(b.start));
}

/* ---------- enrollment balance ---------- */
function enrollUsage(e) {
  const ss = D.sessions.filter(s => s.enrollmentId === e.id);
  const used = ss.filter(s => ['done', 'absent', 'booked'].includes(s.status)).length;
  return { done: ss.filter(s => s.status === 'done').length, absent: ss.filter(s => s.status === 'absent').length, booked: ss.filter(s => s.status === 'booked').length, cancelled: ss.filter(s => s.status === 'cancelled').length, remaining: Math.max(0, e.sessions - used), used };
}
function activeEnrollment(studentId, subjectId) {
  const today = ymd(new Date());
  return D.enrollments.filter(e => e.studentId === studentId && e.subjectId === subjectId && ['paid', 'partial'].includes(e.status) && (!e.to || e.to >= today)).sort((a, b) => String(a.to || '9').localeCompare(String(b.to || '9'))).find(e => enrollUsage(e).remaining > 0);
}
// حالة الباقة لولي الأمر: كام حصة وكام يوم باقيين، وهل قربت تخلص
const PKG_DAYS = () => Math.max(7, Math.min(365, +(D.settings && D.settings.packageDays) || 60));
function pkgState(e) {
  const us = enrollUsage(e); const today = new Date(ymd(new Date()) + 'T00:00:00');
  const days = e.to ? Math.round((new Date(e.to + 'T00:00:00') - today) / DAY) : null;
  let st = 'active';
  if (e.status === 'withdrawn') st = 'withdrawn'; else if (e.status === 'pending') st = 'pending';
  else if (us.remaining <= 0) st = 'finished'; else if (days != null && days < 0) st = 'expired';
  else if ((days != null && days <= 7) || us.remaining <= 2) st = 'expiring';
  return { ...us, days, st };
}

/* ---------- chat contact filter ---------- */
function contactViolation(text) {
  const t = String(text).replace(/[٠-٩]/g, d => '٠١٢٣٤٥٦٧٨٩'.indexOf(d)).replace(/[۰-۹]/g, d => '۰۱۲۳۴۵۶۷۸۹'.indexOf(d));
  const digits = t.replace(/[\s\-\.\(\)\/_+]/g, '');
  if (/\d{7,}/.test(digits)) return L('أرقام الهواتف', 'phone numbers');
  if (/[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}/i.test(t)) return L('الإيميلات', 'email addresses');
  if (/(wa\.me|whatsapp|واتس|واتساب|وتس|telegram|تيليجرام|تليجرام|instagram|انستا|snap|سناب|facebook\.com|fb\.com|t\.me)/i.test(t)) return L('وسائل التواصل الخارجية', 'external contact apps');
  const words = ['صفر', 'واحد', 'اتنين', 'اثنين', 'ثلاثة', 'تلاتة', 'اربعة', 'أربعة', 'خمسة', 'ستة', 'سبعة', 'ثمانية', 'تمانية', 'تسعة', 'zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine'];
  const cnt = t.toLowerCase().split(/[\s,،\-]+/).filter(w => words.includes(w)).length; if (cnt >= 6) return L('أرقام مكتوبة بالحروف', 'spelled-out numbers');
  return null;
}
