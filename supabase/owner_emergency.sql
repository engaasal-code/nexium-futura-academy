-- ============================================================
--  NEXIUM – طوارئ لحساب صاحب المنصة فقط
--  استخدمه لو: نسيت كلمة المرور ورابط التغيير مش بيوصل، أو ضاع موبايل التحقق بخطوتين،
--  أو شاكك إن حد دخل على حسابك.
--  الملف ده بيشتغل من Supabase بس (يعني محتاج دخولك على حساب Supabase نفسه).
--
--  1) اكتب كلمة مرور جديدة قوية مكان المثال تحت (12 حرف على الأقل، حروف وأرقام ورموز)
--  2) Supabase → SQL Editor → New query → الصق الملف → Run
--  3) ادخل #admin بكلمة المرور الجديدة، وفعّل التحقق بخطوتين من جديد (لوحة الإدارة ← الأمان)
-- ============================================================
do $$
declare
  v_email text := 'eng.a.asal@gmail.com';
  v_pass  text := 'اكتب-كلمة-مرور-جديدة-هنا';
  v_reset_mfa boolean := true;   -- true = امسح التحقق بخطوتين القديم (لو الموبايل ضاع)
  u uuid;
begin
  if v_pass like 'اكتب%' or length(v_pass) < 12 then raise exception 'اكتب كلمة مرور جديدة (12 حرف على الأقل) مكان المثال'; end if;
  select id into u from auth.users where lower(email) = v_email;
  if u is null then raise exception 'الحساب % مش موجود', v_email; end if;
  update auth.users set encrypted_password = extensions.crypt(v_pass, extensions.gen_salt('bf')), updated_at = now() where id = u;
  delete from auth.refresh_tokens where user_id = u::text;   -- خروج من كل الأجهزة
  delete from auth.sessions where user_id = u;
  if v_reset_mfa then delete from auth.mfa_factors where user_id = u; end if;
  raise notice 'تم ✓ – سجّل دخول بكلمة المرور الجديدة';
end $$;
