-- ============================================================
--  NEXIUM FUTURA ACADEMY – تحديث قاعدة البيانات v4
--  Supabase → SQL Editor → New query → الصق الملف كله → Run (مرة واحدة)
--  لازم يظهر في الآخر: تم التحديث ✓ – NEXIUM v4
--  آمن لو اتشغّل أكتر من مرة، ومش بيمسح أي بيانات.
--  لو حصل أي خطأ مفيش أي حاجة بتتغيّر (الملف كله بيتنفّذ مرة واحدة).
--
--  فيه إيه:
--   1) المدرسين بيفعّلوا حسابهم بالإيميل + تأكيد البريد بس (من غير كود)
--      كود التفعيل فاضل لحسابات الإدارة بس (مشرف / مدير مدرسة / رئيس تنفيذي)
--   2) إضافة nexiumfutura.education@gmail.com كرئيس تنفيذي
--   3) عدّاد زيارات الموقع (للوحة الإدارة ← نظرة عامة)
-- ============================================================
begin;

-- ---------------------------------------------------------------------
-- 1) تفعيل المدرسين بالإيميل بس – الكود للإدارة بس
-- ---------------------------------------------------------------------
-- دعوة المدرس: من غير كود، والإيميل بيقوله يفعّل بنفس البريد
create or replace function public.trg_invite_teacher() returns trigger language plpgsql security definer set search_path = public as $$
declare t record;
begin
  select * into t from public.teachers where id = new.teacher_id;
  if t.user_id is null and new.email is not null and new.email <> '' then
    insert into public.invites(email, role, ref_id, created_by, code_hash) values (lower(new.email), 'teacher', new.teacher_id, auth.uid(), null)
      on conflict (email) do update set code_hash = null where public.invites.ref_id = excluded.ref_id;
    perform public.queue_email(new.email, 'invite', 'انضمامك لفريق مدرسين NEXIUM FUTURA ACADEMY',
      'مرحباً ' || coalesce(t.name, '') || '،' || chr(10) || 'تمت إضافتك كمدرس في NEXIUM FUTURA ACADEMY.' || chr(10) ||
      'افتح بوابة المدرس (رابط الموقع + #teacher) واضغط "تفعيل الحساب لأول مرة"، واكتب نفس البريد ده واختار كلمة مرور.' || chr(10) ||
      'هيوصلك إيميل تأكيد – اضغط على الرابط اللي فيه وبعدين سجّل دخول.');
  end if;
  return new;
end $$;

-- الدعوات القديمة للمدرسين: الكود مبقاش مطلوب
update public.invites set code_hash = null where role = 'teacher';

-- صفحة التفعيل: المدرس بالبريد بس، الإدارة بالبريد + الكود
drop function if exists public.check_invite(text);
create or replace function public.check_invite(p_email text, p_code text default '') returns text language sql stable security definer set search_path = public as $$
  select role from public.invites
  where email = lower(trim(coalesce(p_email, ''))) and role <> 'student'
    and (role = 'teacher'
         or (code_hash is not null and code_hash = extensions.crypt(upper(trim(coalesce(p_code, ''))), code_hash))) $$;
grant execute on function public.check_invite(text, text) to anon, authenticated;

-- إنشاء الحساب: الكود مطلوب لحسابات الإدارة بس
create or replace function public.handle_new_user() returns trigger language plpgsql security definer set search_path = public as $$
declare inv record; m jsonb := coalesce(new.raw_user_meta_data, '{}'); sid text; prov text := coalesce(new.raw_app_meta_data ->> 'provider', 'email');
begin
  select * into inv from public.invites where email = lower(new.email);
  if found and inv.role in ('supervisor', 'principal', 'ceo') then
    if inv.code_hash is null or inv.code_hash <> extensions.crypt(upper(trim(coalesce(m ->> 'invite_code', ''))), inv.code_hash) then
      raise exception 'INVITE_CODE_REQUIRED';
    end if;
  end if;
  if found then
    insert into public.profiles(id, role, ref_id, email) values (new.id, inv.role, inv.ref_id, lower(new.email)) on conflict (id) do nothing;
    if inv.role = 'student' then update public.students set user_id = new.id, confirmed = (new.email_confirmed_at is not null), provider = prov where id = inv.ref_id;
    elsif inv.role = 'teacher' then update public.teachers set user_id = new.id where id = inv.ref_id;
    else update public.staff set user_id = new.id where id = inv.ref_id; end if;
    delete from public.invites where email = lower(new.email);
    return new;
  end if;
  sid := public.new_id('s');
  insert into public.students(id, user_id, name, parent, stage, grade, country, confirmed, provider)
  values (sid, new.id, left(coalesce(m ->> 'name', ''), 80), left(coalesce(m ->> 'parent', m ->> 'full_name', m ->> 'name', ''), 80),
          coalesce(m ->> 'stage', 'pri'), coalesce(m ->> 'grade', 'G1'), coalesce(m ->> 'country', 'SA'),
          new.email_confirmed_at is not null, prov);
  insert into public.student_private(student_id, email, phone) values (sid, lower(new.email), left(coalesce(m ->> 'phone', ''), 30));
  insert into public.profiles(id, role, ref_id, email) values (new.id, 'student', sid, lower(new.email));
  return new;
end $$;

-- حماية إضافية: حساب المدرس مايشتغلش غير بعد تأكيد البريد
-- (حتى لو "تأكيد البريد" اتقفل بالغلط في إعدادات Supabase)
create or replace function public.my_role() returns text language sql stable security definer set search_path = public as $$
  select case
    when p.role in ('supervisor', 'principal', 'ceo') and not public.mfa_ok() then null
    when p.role = 'teacher' and not exists (select 1 from auth.users u where u.id = p.id and u.email_confirmed_at is not null) then null
    else p.role end
  from public.profiles p where p.id = auth.uid() $$;

-- كود التفعيل: لحسابات الإدارة بس
create or replace function public.invite_code(p_ref text) returns text language plpgsql security definer set search_path = public as $$
declare inv record; code text := public.gen_code();
begin
  select * into inv from public.invites where ref_id = p_ref;
  if not found then raise exception 'NO_INVITE'; end if;
  if inv.role not in ('supervisor', 'principal', 'ceo') then raise exception 'NOT_ALLOWED'; end if;
  if not public.has_perm('sys.staff') then raise exception 'PERMISSION: sys.staff'; end if;
  update public.invites set code_hash = extensions.crypt(code, extensions.gen_salt('bf')) where ref_id = p_ref;
  return code;
end $$;

-- الإدارة تعيد إرسال إيميل الدعوة للمدرس (لو ضاع أو اتمسح)
create or replace function public.resend_teacher_invite(p_ref text) returns text language plpgsql security definer set search_path = public as $$
declare t record; em text;
begin
  if not public.has_perm('tch.add') then raise exception 'PERMISSION: tch.add'; end if;
  select * into t from public.teachers where id = p_ref;
  if not found or t.user_id is not null then raise exception 'NO_INVITE'; end if;
  select email into em from public.teacher_private where teacher_id = p_ref;
  if coalesce(em, '') = '' then raise exception 'NO_EMAIL'; end if;
  insert into public.invites(email, role, ref_id, created_by, code_hash) values (lower(em), 'teacher', p_ref, auth.uid(), null)
    on conflict (email) do update set role = 'teacher', ref_id = excluded.ref_id, code_hash = null;
  perform public.queue_email(em, 'invite', 'انضمامك لفريق مدرسين NEXIUM FUTURA ACADEMY',
    'مرحباً ' || coalesce(t.name, '') || '،' || chr(10) ||
    'افتح بوابة المدرس (رابط الموقع + #teacher) واضغط "تفعيل الحساب لأول مرة"، واكتب نفس البريد ده واختار كلمة مرور.' || chr(10) ||
    'هيوصلك إيميل تأكيد – اضغط على الرابط اللي فيه وبعدين سجّل دخول.');
  return lower(em);
end $$;
revoke execute on function public.resend_teacher_invite(text) from public, anon;
grant execute on function public.resend_teacher_invite(text) to authenticated;

-- ---------------------------------------------------------------------
-- 2) رئيس تنفيذي جديد: nexiumfutura.education@gmail.com
--    • لو الإيميل ده عامل حساب بالفعل → بيتحوّل رئيس تنفيذي على طول
--    • لو لسه → بيتعمل له حساب إدارة، ويفعّله من #admin ← "تفعيل الحساب لأول مرة"
--      بكود التفعيل (بيوصله على الإيميل، أو خده من: حسابات الإدارة ← كود التفعيل)
-- ---------------------------------------------------------------------
do $$
declare em text := 'nexiumfutura.education@gmail.com'; u uuid;
begin
  select id into u from auth.users where lower(email) = em;
  if u is not null then
    perform public.make_ceo(em);
  elsif exists (select 1 from public.staff where lower(email) = em) then
    update public.staff set role = 'ceo' where lower(email) = em;
  else
    insert into public.staff(id, name, email, role) values (public.new_id('a'), 'NEXIUM Futura Education', em, 'ceo');
  end if;
end $$;

-- ---------------------------------------------------------------------
-- 3) عدّاد الزيارات
--    كل زيارة للموقع (جلسة تصفح) = زيارة، وكل جهاز مختلف في اليوم = زائر.
--    مفيش أي بيانات شخصية بتتسجل (لا IP ولا إيميل) – رقم عشوائي من المتصفح بس.
-- ---------------------------------------------------------------------
create table if not exists public.site_visits (
  day date primary key,
  visits int not null default 0,
  visitors int not null default 0
);
create table if not exists public.site_visitors (
  day date not null,
  vid text not null,
  hits int not null default 1,
  primary key (day, vid)
);
alter table public.site_visits enable row level security;
alter table public.site_visitors enable row level security;
revoke all on public.site_visits, public.site_visitors from anon, authenticated;

create or replace function public.track_visit(p_vid text) returns void language plpgsql security definer set search_path = public as $$
declare d date := (now() at time zone 'Asia/Riyadh')::date; h int; first boolean;
begin
  if p_vid is null or p_vid !~ '^[A-Za-z0-9_-]{8,40}$' then return; end if;
  insert into public.site_visitors(day, vid) values (d, p_vid)
    on conflict (day, vid) do update set hits = public.site_visitors.hits + 1
    returning hits, (xmax = 0) into h, first;
  if h > 30 then return; end if;                      -- نفس الجهاز مايتعدّش أكتر من 30 مرة في اليوم
  insert into public.site_visits(day, visits, visitors) values (d, 1, case when first then 1 else 0 end)
    on conflict (day) do update set visits = public.site_visits.visits + 1,
      visitors = public.site_visits.visitors + case when first then 1 else 0 end;
  if random() < 0.02 then delete from public.site_visitors where day < d - 3; end if;
end $$;
grant execute on function public.track_visit(text) to anon, authenticated;

create or replace function public.visit_stats() returns jsonb language sql stable security definer set search_path = public as $$
  select case when not public.is_staff() then '[]'::jsonb else coalesce((
    select jsonb_agg(jsonb_build_object('day', v.day, 'visits', v.visits, 'visitors', v.visitors) order by v.day)
    from public.site_visits v where v.day >= (now() at time zone 'Asia/Riyadh')::date - 800), '[]'::jsonb) end $$;
revoke execute on function public.visit_stats() from public, anon;
grant execute on function public.visit_stats() to authenticated;

commit;
select 'تم التحديث ✓ – NEXIUM v4' as result;
