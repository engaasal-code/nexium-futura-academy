/* =====================================================================
   إعدادات المنصة
   ---------------------------------------------------------------------
   1) اللوجو: غيّر المسارات لو حبيت تبدّل الصور.
   2) الربط بالسيرفر (Supabase): الصق رابط مشروعك والمفتاح العام هنا.
      - لو سبتهم فاضيين → المنصة تشتغل "نسخة تجريبية" ببيانات وهمية.
      - لو ملّيتهم → المنصة تشتغل "نسخة حقيقية" بحسابات وبيانات مشتركة.
      المكانين دول بتلاقيهم في Supabase: Project Settings → API
      (المفتاح العام اسمه anon / public وده آمن إنه يكون في الموقع).
   ===================================================================== */
const LOGO_FULL = 'assets/logo.jpg';      // اللوجو الكامل (صفحة الدخول والفوتر)
const LOGO_EMBLEM = 'assets/emblem.jpg';  // الشعار الصغير (الهيدر)

const SUPABASE_URL = 'https://nvqrirctdfkcykkiokpb.supabase.co';       // مثال: 'https://abcdefgh.supabase.co'
const SUPABASE_ANON_KEY = 'sb_publishable_Zf9Uva_toRaDp9HTT3TDhQ_cauXTWqY';  // مثال: 'eyJhbGciOiJIUzI1NiIsInR5cCI6...'

// أزرار الدخول بحسابات خارجية اللي بتظهر في صفحة التسجيل والدخول.
// لازم كل واحد يتفعّل في Supabase (Authentication → Providers) – لو لسه متفعّلش، الزرار بيقول للزائر يستخدم الإيميل.
// تقدر تشيل أي واحد من القائمة لو مش عايزه يظهر.
const SOCIAL_LOGIN = ['google', 'facebook', 'apple'];

const IS_LIVE = !!(SUPABASE_URL && SUPABASE_ANON_KEY && typeof supabase !== 'undefined');
