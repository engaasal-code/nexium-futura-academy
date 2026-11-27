-- =====================================================================
--  NEXIUM FUTURA ACADEMY — تحديث v2 (الأمان + الواجهة + تصحيح الواجبات + صور المواد + تقييم مبدئي)
--  لو قاعدة البيانات شغالة بالفعل: الصق الملف ده كله في Supabase → SQL Editor → Run (مرة واحدة).
--  آمن لو اتشغّل أكتر من مرة، ومش بيمسح أي بيانات.
-- =====================================================================

-- ---------------------------------------------------------------------
-- 0) إيميل صاحب المنصة: بيوصله تنبيه أي تغيير في كلمات مرور حسابات الإدارة، وطلبات المساعدة (غيّره هنا لو حبيت)
-- ---------------------------------------------------------------------
insert into public.private_config (key, value) values ('reset_admin_email', 'eng.a.asal@gmail.com')
on conflict (key) do nothing;

-- ---------------------------------------------------------------------
-- 1) أعمدة جديدة
-- ---------------------------------------------------------------------
alter table public.subjects add column if not exists image text;                 -- صورة المادة
alter table public.teachers add column if not exists photo text;                 -- صورة المدرس
alter table public.teachers add column if not exists base_rating numeric(2,1);   -- تقييم مبدئي من الرئيس التنفيذي
alter table public.teachers add column if not exists base_count int not null default 0; -- وزن التقييم المبدئي (كأنه عدد تقييمات)
alter table public.homework add column if not exists marked text[] not null default '{}'; -- صفحات الواجب بعد التصحيح
alter table public.homework add column if not exists marks_file text;            -- رسومات المدرس (عشان يرجع يعدّل)
alter table public.homework add column if not exists marked_at timestamptz;
alter table public.invites add column if not exists code_hash text;              -- كود تفعيل حسابات المدرسين والإدارة

-- ---------------------------------------------------------------------
-- 2) صلاحية جديدة: cnt.home (تعديل واجهة الموقع) + إعدادات الواجهة
-- ---------------------------------------------------------------------
update public.settings set value = jsonb_set(jsonb_set(jsonb_set(jsonb_set(value,
    '{ceo,cnt.home}', coalesce(value #> '{ceo,cnt.home}', 'true')),
    '{principal,cnt.home}', coalesce(value #> '{principal,cnt.home}', 'true')),
    '{supervisor,cnt.home}', coalesce(value #> '{supervisor,cnt.home}', 'false')),
    '{teacher,cnt.home}', coalesce(value #> '{teacher,cnt.home}', 'false'))
where key = 'perms';
insert into public.settings (key, value) values ('home', '{}'::jsonb) on conflict (key) do nothing;

drop policy if exists settings_write on public.settings;
create policy settings_write on public.settings for update to authenticated using (
  case key when 'perms' then public.has_perm('sys.perms')
           when 'countries' then public.has_perm('fin.prices') when 'settings' then public.has_perm('fin.prices') or public.has_perm('fin.dash')
           when 'methods' then public.has_perm('fin.methods')
           when 'social' then public.has_perm('cnt.social') when 'footerAbout' then public.has_perm('cnt.social')
           when 'home' then public.has_perm('cnt.home')
           else public.my_role() = 'ceo' end);

-- الرئيس التنفيذي عنده كل الصلاحيات دايماً (حتى لو صلاحية اتقفلت بالغلط)
create or replace function public.has_perm(p text) returns boolean language sql stable security definer set search_path = public as $$
  select case
    when public.my_role() = 'ceo' then true
    when public.my_role() is null or public.my_role() = 'student' then false
    when public.my_role() = 'teacher' and not coalesce((select active from public.teachers where id = public.my_ref()), false) then false
    else coalesce((select (value -> public.my_role() ->> p)::boolean from public.settings where key = 'perms'), false)
  end $$;

-- ---------------------------------------------------------------------
-- 3) قيود على شكل البيانات (تمنع حقن أكواد في الصفحات عن طريق الـ API)
--    NOT VALID = بتتطبق على أي إضافة أو تعديل جديد بس، ومش بتلمس البيانات القديمة
-- ---------------------------------------------------------------------
do $$ declare t text; begin
  foreach t in array array['students','teachers','staff','subjects','sessions','enrollments','homework','evals','certs','ratings','messages','emails','payouts','expenses','withdrawals','pages'] loop
    begin
      execute format('alter table public.%I add constraint %I check (id ~ ''^[A-Za-z0-9_-]{1,64}$'') not valid', t, t || '_id_format');
    exception when duplicate_object then null; end;
  end loop;
end $$;
do $$ begin
  alter table public.sessions add constraint sessions_subject_format check (subject_id is null or subject_id ~ '^[A-Za-z0-9_-]{1,64}$') not valid;
exception when duplicate_object then null; end $$;
do $$ begin
  alter table public.pages add constraint pages_slug_format check (slug ~ '^[a-z0-9-]{1,60}$') not valid;
exception when duplicate_object then null; end $$;

-- تنظيف النصوص والروابط قبل الحفظ (بدل رفض العملية)
create or replace function public.clean_txt(t text) returns text language sql immutable as
$$ select case when t is null then null else translate(t, '<>', '‹›') end $$;
create or replace function public.clean_url(u text) returns text language sql immutable as $$
  select case
    when u is null or btrim(u) = '' then coalesce(u, null)
    when btrim(u) ~* '^https?://[^\s"''<>`]+$' then btrim(u)
    when btrim(u) ~* '^[a-z0-9][a-z0-9.-]*\.[a-z]{2,}(/[^\s"''<>`]*)?$' then 'https://' || btrim(u)
    else '' end $$;
create or replace function public.clean_img(u text) returns text language sql immutable as
$$ select case when u is null or u = '' then null when u ~ '^https://[^\s"''<>`]+$' then u else null end $$;

create or replace function public.trg_clean_rows() returns trigger language plpgsql as $$
begin
  if tg_table_name = 'students' then new.name := public.clean_txt(new.name); new.parent := public.clean_txt(new.parent);
  elsif tg_table_name = 'teachers' then
    new.name := public.clean_txt(new.name); new.name_en := public.clean_txt(new.name_en);
    new.youtube := public.clean_url(new.youtube); new.zoom := public.clean_url(new.zoom); new.photo := public.clean_img(new.photo);
    if new.color is not null and new.color !~ '^#[0-9A-Fa-f]{3,8}$' then new.color := '#0B2463'; end if;
    if new.badge is not null and new.badge not in ('top', 'rising') then new.badge := null; end if;
  elsif tg_table_name = 'staff' then new.name := public.clean_txt(new.name);
  elsif tg_table_name = 'subjects' then
    new.ar := public.clean_txt(new.ar); new.en := public.clean_txt(new.en); new.icon := left(translate(coalesce(new.icon, ''), '<>"''&`', ''), 8);
    new.image := public.clean_img(new.image);
  elsif tg_table_name = 'sessions' then new.zoom := public.clean_url(new.zoom); new.recording := public.clean_url(new.recording);
  end if;
  return new;
end $$;
do $$ declare t text; begin
  foreach t in array array['students','teachers','staff','subjects','sessions'] loop
    execute format('drop trigger if exists a0_clean on public.%I', t);
    execute format('create trigger a0_clean before insert or update on public.%I for each row execute function public.trg_clean_rows()', t);
  end loop;
end $$;

-- ---------------------------------------------------------------------
-- 4) سد ثغرات في الصلاحيات
-- ---------------------------------------------------------------------
-- 4a. الشات: ممنوع تعديل نص رسالة بعد إرسالها (كان ممكن يتحايل على فلتر الأرقام بالتعديل)
create or replace function public.trg_guard_messages() returns trigger language plpgsql security definer set search_path = public as $$
declare rs boolean := new.read_s; rt boolean := new.read_t; rv boolean := new.reviewed;
begin
  if auth.uid() is null then return new; end if;
  new := old;                                   -- كل الحقول ترجع زي ما كانت
  if public.my_role() = 'student' then new.read_s := rs; end if;   -- الطالب يقدر يعلّم "اتقرت" بس
  if public.my_role() = 'teacher' then new.read_t := rt; end if;   -- المدرس كذلك
  if public.has_perm('com.monitor') then new.reviewed := rv; end if; -- المراقب يعلّم "تمت المراجعة"
  return new;
end $$;
drop trigger if exists guard_messages on public.messages;
create trigger guard_messages before update on public.messages for each row execute function public.trg_guard_messages();

-- 4b. سجل الإيميلات: صاحب الإيميل يقدر يعلّمه "مقروء" بس (مش يغيّر النص أو يعيد إرساله)
create or replace function public.trg_guard_emails() returns trigger language plpgsql as $$
declare r boolean := new.read;
begin
  if current_user in ('authenticated', 'anon') then new := old; new.read := r; end if;
  return new;
end $$;
drop trigger if exists guard_emails on public.emails;
create trigger guard_emails before update on public.emails for each row execute function public.trg_guard_emails();

-- 4c. التقييمات (evals): المدرس يشوف تقييمات طلابه بس، مش كل طلاب الأكاديمية
drop policy if exists evals_read on public.evals;
create policy evals_read on public.evals for select to authenticated using (
  student_id = public.my_ref() and public.my_role() = 'student'
  or (public.my_role() = 'teacher' and (teacher_id = public.my_ref() or public.teaches_student(student_id)))
  or public.is_staff());

-- 4d. تقييم المدرس من ولي الأمر: لازم يكون الطالب أخد حصة مع المدرس ده فعلاً
drop policy if exists ratings_insert on public.ratings;
create policy ratings_insert on public.ratings for insert to authenticated with check (
  student_id = public.my_ref() and public.my_role() = 'student'
  and exists (select 1 from public.sessions s where s.student_id = public.my_ref() and s.teacher_id = ratings.teacher_id and s.status in ('booked', 'done', 'absent')));

-- 4e. الواجبات: الملف لازم يكون من رفع نفس الشخص، والمدرس مايقدرش يغيّر الطالب أو الملف الأصلي
create or replace function public.trg_guard_homework() returns trigger language plpgsql security definer set search_path = public as $$
declare me text := coalesce(auth.uid()::text, ''); p text;
begin
  if auth.uid() is null then return new; end if;              -- SQL Editor / النظام
  if tg_op = 'INSERT' then
    if new.file is null or new.file !~ ('^' || me || '/[A-Za-z0-9_.-]{1,120}$') then raise exception 'BAD_FILE'; end if;
    new.marked := '{}'; new.marks_file := null; new.marked_at := null; new.grade := null; new.feedback := null;
    return new;
  end if;
  new.session_id := old.session_id; new.student_id := old.student_id; new.file := old.file; new.note := old.note; new.at := old.at;
  foreach p in array coalesce(new.marked, '{}') loop
    if not (p = any(coalesce(old.marked, '{}'))) and p !~ ('^' || me || '/[A-Za-z0-9_.-]{1,120}$') then raise exception 'BAD_FILE'; end if;
  end loop;
  if new.marks_file is distinct from old.marks_file and new.marks_file is not null and new.marks_file !~ ('^' || me || '/[A-Za-z0-9_.-]{1,120}$') then raise exception 'BAD_FILE'; end if;
  if public.contact_violation(new.feedback) is not null then raise exception 'CONTACT_NOT_ALLOWED'; end if;
  return new;
end $$;
drop trigger if exists guard_homework on public.homework;
create trigger guard_homework before insert or update on public.homework for each row execute function public.trg_guard_homework();

-- 4f. المدرس: ممنوع يكتب بيانات تواصل في النبذة، ومايقدرش يغيّر صورته أو تقييمه المبدئي
--     التقييم المبدئي للرئيس التنفيذي بس
create or replace function public.trg_guard_teachers() returns trigger language plpgsql security definer set search_path = public as $$
begin
  if public.my_role() = 'teacher' then
    new.youtube := old.youtube; new.active := old.active; new.badge := old.badge; new.user_id := old.user_id; new.photo := old.photo;
    if public.contact_violation(coalesce(new.bio, '') || ' ' || coalesce(new.bio_en, '')) is not null then raise exception 'CONTACT_NOT_ALLOWED'; end if;
  end if;
  if auth.uid() is not null and coalesce(public.my_role(), '') <> 'ceo' then
    new.base_rating := old.base_rating; new.base_count := old.base_count;
  end if;
  if new.base_rating is not null then new.base_rating := least(5, greatest(1, new.base_rating)); end if;
  new.base_count := least(1000, greatest(0, coalesce(new.base_count, 0)));
  return new;
end $$;
drop trigger if exists guard_teachers on public.teachers;
create trigger guard_teachers before update on public.teachers for each row execute function public.trg_guard_teachers();

create or replace function public.trg_teachers_insert() returns trigger language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is not null and coalesce(public.my_role(), '') <> 'ceo' then new.base_rating := null; new.base_count := 0; end if;
  return new;
end $$;
drop trigger if exists teachers_insert_guard on public.teachers;
create trigger teachers_insert_guard before insert on public.teachers for each row execute function public.trg_teachers_insert();

-- 4g. الطالب مايقدرش يغيّر دولته بعد أول باقة (عشان السعر بيتحسب حسب الدولة)
create or replace function public.trg_guard_students() returns trigger language plpgsql security definer set search_path = public as $$
begin
  if public.my_role() = 'student' then
    new.id := old.id; new.active := old.active; new.confirmed := old.confirmed; new.user_id := old.user_id; new.added_by := old.added_by; new.withdrawn := old.withdrawn; new.provider := old.provider; new.joined := old.joined;
    if exists (select 1 from public.enrollments e where e.student_id = old.id) then new.country := old.country; end if;
  end if;
  if public.my_role() is not null and not public.has_perm('stu.toggle') and public.my_role() <> 'student' then new.active := old.active; end if;
  return new;
end $$;

-- 4h. إيصال الدفع لازم يكون ملف رفعه الطالب نفسه
create or replace function public.request_package(p_subject text, p_sessions int, p_method text, p_receipt text) returns public.enrollments language plpgsql security definer set search_path = public as $$
declare me text := public.my_ref(); st record; sub record; mode text; ccode text; c jsonb; pps numeric; disc numeric; dec int; total numeric; e public.enrollments;
begin
  if public.my_role() <> 'student' then raise exception 'ONLY_STUDENTS'; end if;
  if p_receipt is null or p_receipt !~ ('^' || auth.uid()::text || '/[A-Za-z0-9_.-]{1,120}$') then raise exception 'BAD_FILE'; end if;
  if (select count(*) from public.enrollments where student_id = me and status = 'pending') >= 5 then raise exception 'TOO_MANY_PENDING'; end if;
  select * into st from public.students where id = me;
  select * into sub from public.subjects where id = p_subject and visible;
  if not found then raise exception 'SUBJECT_NOT_AVAILABLE'; end if;
  if not exists (select 1 from jsonb_array_elements(coalesce(public.setting('methods'), '[]')) m where m ->> 'id' = p_method and (m ->> 'on')::boolean) then raise exception 'METHOD_DISABLED'; end if;
  disc := case p_sessions when 1 then 0.5 when 8 then 1 when 16 then 0.93 when 24 then 0.88 else null end;
  if disc is null then raise exception 'INVALID_PACKAGE'; end if;
  mode := coalesce(public.setting('settings') ->> 'displayCur', 'auto');
  ccode := case mode when 'SAR' then 'SA' when 'EGP' then 'EG' else st.country end;
  select x into c from jsonb_array_elements(coalesce(public.setting('countries'), '[]')) x where x ->> 'code' = ccode;
  if c is null then select x into c from jsonb_array_elements(coalesce(public.setting('countries'), '[]')) x where x ->> 'code' = 'SA'; ccode := 'SA'; end if;
  if sub.country_pps ? ccode and coalesce(sub.country_pps ->> ccode, '') <> '' then pps := (sub.country_pps ->> ccode)::numeric;
  elsif c ->> 'cur' = 'EGP' then pps := (sub.pps ->> 'EGP')::numeric;
  else pps := (sub.pps ->> 'SAR')::numeric * coalesce((c ->> 'rate')::numeric, 1); end if;
  dec := coalesce((c ->> 'dec')::int, 0);
  total := round(pps * p_sessions * disc, dec);
  insert into public.enrollments(id, student_id, subject_id, sessions, amount, paid, currency, method, status, created, from_date, to_date, receipt)
  values (public.new_id('e'), me, p_subject, p_sessions, total, 0, coalesce(c ->> 'cur', 'SAR'), p_method, 'pending', now(), current_date, current_date + 60, p_receipt)
  returning * into e;
  return e;
end $$;

-- ---------------------------------------------------------------------
-- 5) تفعيل حسابات المدرسين والإدارة بكود سري (مش بالإيميل بس)
--    قبل كده: أي حد يعرف إيميل مدرس جديد كان يقدر يفعّل الحساب مكانه لو "تأكيد البريد" مقفول.
-- ---------------------------------------------------------------------
create or replace function public.gen_code() returns text language plpgsql volatile as $$
declare a text := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; b bytea := extensions.gen_random_bytes(12); r text := ''; i int;
begin
  for i in 0..11 loop r := r || substr(a, (get_byte(b, i) % 32) + 1, 1); if i in (3, 7) then r := r || '-'; end if; end loop;
  return r;
end $$;

-- الإدارة تطلب كود جديد لأي دعوة (بيرجع الكود مرة واحدة بس)
create or replace function public.invite_code(p_ref text) returns text language plpgsql security definer set search_path = public as $$
declare inv record; code text := public.gen_code();
begin
  select * into inv from public.invites where ref_id = p_ref;
  if not found then raise exception 'NO_INVITE'; end if;
  if inv.role = 'teacher' and not public.has_perm('tch.add') then raise exception 'PERMISSION: tch.add'; end if;
  if inv.role in ('supervisor', 'principal', 'ceo') and not public.has_perm('sys.staff') then raise exception 'PERMISSION: sys.staff'; end if;
  if inv.role = 'student' then raise exception 'NOT_ALLOWED'; end if;
  update public.invites set code_hash = extensions.crypt(code, extensions.gen_salt('bf')) where ref_id = p_ref;
  return code;
end $$;

create or replace function public.trg_invite_teacher() returns trigger language plpgsql security definer set search_path = public as $$
declare t record; code text := public.gen_code();
begin
  select * into t from public.teachers where id = new.teacher_id;
  if t.user_id is null and new.email is not null and new.email <> '' then
    insert into public.invites(email, role, ref_id, created_by, code_hash) values (lower(new.email), 'teacher', new.teacher_id, auth.uid(), extensions.crypt(code, extensions.gen_salt('bf')))
      on conflict (email) do update set code_hash = excluded.code_hash where public.invites.ref_id = excluded.ref_id;
    perform public.queue_email(new.email, 'invite', 'انضمامك لفريق مدرسين NEXIUM FUTURA ACADEMY',
      'مرحباً ' || coalesce(t.name, '') || '،' || chr(10) || 'تمت إضافتك كمدرس. افتح بوابة المدرس (رابط الموقع + #teacher) واضغط "تفعيل الحساب لأول مرة" بنفس البريد ده.' || chr(10) ||
      'كود التفعيل: ' || code || chr(10) || 'متشاركش الكود ده مع أي حد.');
  end if;
  return new;
end $$;

create or replace function public.trg_invite_staff() returns trigger language plpgsql security definer set search_path = public as $$
declare code text := public.gen_code();
begin
  if new.user_id is null then
    insert into public.invites(email, role, ref_id, created_by, code_hash) values (lower(new.email), new.role, new.id, auth.uid(), extensions.crypt(code, extensions.gen_salt('bf')))
      on conflict (email) do update set role = excluded.role, ref_id = excluded.ref_id, code_hash = excluded.code_hash;
    perform public.queue_email(new.email, 'invite', 'حساب إدارة NEXIUM FUTURA ACADEMY',
      'مرحباً ' || coalesce(new.name, '') || '،' || chr(10) || 'تم إنشاء حساب إدارة لك. افتح لوحة الإدارة (رابط الموقع + #admin) واضغط "تفعيل الحساب لأول مرة" بنفس البريد ده.' || chr(10) ||
      'كود التفعيل: ' || code || chr(10) || 'متشاركش الكود ده مع أي حد.');
  end if;
  return new;
end $$;

-- صفحة التفعيل بتتأكد من البريد + الكود مع بعض (مش بتكشف أي حاجة لو الكود غلط)
drop function if exists public.check_invite(text);
create or replace function public.check_invite(p_email text, p_code text) returns text language sql stable security definer set search_path = public as $$
  select role from public.invites
  where email = lower(trim(p_email)) and role <> 'student' and code_hash is not null
    and code_hash = extensions.crypt(upper(trim(coalesce(p_code, ''))), code_hash) $$;
grant execute on function public.check_invite(text, text) to anon, authenticated;

create or replace function public.handle_new_user() returns trigger language plpgsql security definer set search_path = public as $$
declare inv record; m jsonb := coalesce(new.raw_user_meta_data, '{}'); sid text; prov text := coalesce(new.raw_app_meta_data ->> 'provider', 'email');
begin
  select * into inv from public.invites where email = lower(new.email);
  if found and inv.role <> 'student' then
    -- حساب مدرس / إدارة: لازم كود التفعيل الصحيح
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

-- ---------------------------------------------------------------------
-- 6) استعادة كلمة المرور عن طريق الإدارة
--    المستخدم يطلب ← يوصل إيميل للإدارة (eng.a.asal@gmail.com) ← الرئيس التنفيذي يوافق من لوحة الإدارة
--    ← بيطلع كود صالح 30 دقيقة لمرة واحدة ← المستخدم يكتب الكود ويختار كلمة مرور جديدة.
--    الكود مبيتبعتش في إيميل الإدارة نفسه، ومتخزن مشفّر، و5 محاولات غلط بتقفل الطلب.
-- ---------------------------------------------------------------------
create table if not exists public.reset_requests (
  id bigserial primary key,
  user_id uuid not null,
  email text not null,
  role text, ref_id text, name text, phone text, note text,
  status text not null default 'pending' check (status in ('pending', 'approved', 'used', 'rejected', 'expired', 'locked')),
  code_hash text,
  attempts int not null default 0,
  created_at timestamptz not null default now(),
  approved_at timestamptz, approved_by uuid, expires_at timestamptz, used_at timestamptz
);
create index if not exists reset_requests_email_idx on public.reset_requests(email, created_at desc);
alter table public.reset_requests enable row level security;
drop policy if exists reset_read on public.reset_requests;
create policy reset_read on public.reset_requests for select to authenticated using (public.my_role() = 'ceo');
revoke all on public.reset_requests from anon, authenticated;
grant select (id, email, role, name, phone, note, status, attempts, created_at, approved_at, expires_at, used_at) on public.reset_requests to authenticated;

create or replace function public.request_password_reset(p_email text, p_note text default '') returns text language plpgsql security definer set search_path = public as $$
declare em text := lower(trim(coalesce(p_email, ''))); u record; pr record; nm text; ph text; admin_em text;
begin
  if em !~ '^[^@\s]+@[^@\s]+\.[^@\s]+$' then return 'OK'; end if;
  -- حماية من الإزعاج: 3 طلبات في الساعة لكل بريد، و40 في الساعة على المنصة كلها
  if (select count(*) from public.reset_requests where email = em and created_at > now() - interval '1 hour') >= 3 then return 'OK'; end if;
  if (select count(*) from public.reset_requests where created_at > now() - interval '1 hour') >= 40 then return 'OK'; end if;
  select id, email into u from auth.users where lower(email) = em;
  if not found then return 'OK'; end if;                       -- نفس الرد سواء البريد موجود أو لأ
  select * into pr from public.profiles where id = u.id;
  if pr.role = 'student' then select s.parent || ' (' || s.name || ')', p.phone into nm, ph from public.students s left join public.student_private p on p.student_id = s.id where s.id = pr.ref_id;
  elsif pr.role = 'teacher' then select t.name, p.phone into nm, ph from public.teachers t left join public.teacher_private p on p.teacher_id = t.id where t.id = pr.ref_id;
  else select s.name into nm from public.staff s where s.id = pr.ref_id; end if;
  update public.reset_requests set status = 'expired' where user_id = u.id and status in ('pending', 'approved');
  insert into public.reset_requests(user_id, email, role, ref_id, name, phone, note)
  values (u.id, em, pr.role, pr.ref_id, left(coalesce(nm, ''), 120), left(coalesce(ph, ''), 30), left(public.clean_txt(coalesce(p_note, '')), 300));
  select value into admin_em from public.private_config where key = 'reset_admin_email';
  perform public.queue_email(coalesce(admin_em, 'eng.a.asal@gmail.com'), 'reset_request', '🔐 طلب استعادة كلمة مرور – NEXIUM FUTURA ACADEMY',
    'في طلب استعادة كلمة مرور جديد:' || chr(10) ||
    'الاسم: ' || coalesce(nm, '—') || chr(10) || 'البريد: ' || em || chr(10) || 'النوع: ' || coalesce(pr.role, '—') || chr(10) ||
    'الموبايل المسجّل: ' || coalesce(nullif(ph, ''), '—') || chr(10) || 'ملاحظة: ' || coalesce(nullif(p_note, ''), '—') || chr(10) || chr(10) ||
    'لو الطلب ده منك أو من صاحب الحساب فعلاً: افتح لوحة الإدارة ← "طلبات استعادة كلمة المرور" ← موافقة، وابعت الكود لصاحب الحساب على رقمه المسجّل.' || chr(10) ||
    'لو مش متأكد إن الطلب من صاحب الحساب، ارفضه.');
  return 'OK';
end $$;

create or replace function public.approve_password_reset(p_id bigint, p_send_email boolean default false) returns jsonb language plpgsql security definer set search_path = public as $$
declare r record; code text := public.gen_code();
begin
  if coalesce(public.my_role(), '') <> 'ceo' then raise exception 'PERMISSION: ceo'; end if;
  select * into r from public.reset_requests where id = p_id for update;
  if not found or r.status not in ('pending', 'approved') then raise exception 'REQUEST_CLOSED'; end if;
  update public.reset_requests set status = 'approved', code_hash = extensions.crypt(code, extensions.gen_salt('bf')), attempts = 0,
    approved_at = now(), approved_by = auth.uid(), expires_at = now() + interval '30 minutes' where id = p_id;
  if p_send_email then
    perform public.queue_email(r.email, 'reset_code', 'كود تغيير كلمة المرور – NEXIUM FUTURA ACADEMY',
      'مرحباً ' || coalesce(r.name, '') || '،' || chr(10) || 'كود تغيير كلمة المرور: ' || code || chr(10) ||
      'الكود صالح لمدة 30 دقيقة ولمرة واحدة. افتح الموقع ← نسيت كلمة المرور ← "معايا كود".' || chr(10) || 'لو مطلبتش تغيير كلمة المرور تجاهل الرسالة.');
  end if;
  return jsonb_build_object('code', code, 'email', r.email, 'phone', r.phone, 'name', r.name, 'expires_at', now() + interval '30 minutes');
end $$;

create or replace function public.reject_password_reset(p_id bigint) returns void language plpgsql security definer set search_path = public as $$
begin
  if coalesce(public.my_role(), '') <> 'ceo' then raise exception 'PERMISSION: ceo'; end if;
  update public.reset_requests set status = 'rejected', code_hash = null where id = p_id and status in ('pending', 'approved');
end $$;

create or replace function public.complete_password_reset(p_email text, p_code text, p_password text) returns text language plpgsql security definer set search_path = public as $$
declare em text := lower(trim(coalesce(p_email, ''))); r record; admin_em text;
begin
  if length(coalesce(p_password, '')) < 8 or p_password !~ '[A-Za-z\u0600-\u06FF]' or p_password !~ '[0-9]' then return 'WEAK_PASSWORD'; end if;
  select * into r from public.reset_requests where email = em and status = 'approved' order by approved_at desc limit 1 for update;
  if not found then return 'BAD_CODE'; end if;
  if r.expires_at < now() then update public.reset_requests set status = 'expired', code_hash = null where id = r.id; return 'EXPIRED'; end if;
  if r.code_hash is null or r.code_hash <> extensions.crypt(upper(regexp_replace(coalesce(p_code, ''), '\s', '', 'g')), r.code_hash) then
    update public.reset_requests set attempts = attempts + 1, status = case when attempts + 1 >= 5 then 'locked' else status end,
      code_hash = case when attempts + 1 >= 5 then null else code_hash end where id = r.id;
    return case when r.attempts + 1 >= 5 then 'LOCKED' else 'BAD_CODE' end;
  end if;
  update auth.users set encrypted_password = extensions.crypt(p_password, extensions.gen_salt('bf')), updated_at = now(),
    email_confirmed_at = coalesce(email_confirmed_at, now()) where id = r.user_id;
  -- تسجيل خروج من كل الأجهزة القديمة
  begin execute 'delete from auth.refresh_tokens where user_id = $1' using r.user_id::text; exception when others then null; end;
  begin execute 'delete from auth.sessions where user_id = $1' using r.user_id; exception when others then null; end;
  update public.reset_requests set status = 'used', used_at = now(), code_hash = null where id = r.id;
  perform public.queue_email(em, 'security', 'تم تغيير كلمة المرور – NEXIUM FUTURA ACADEMY',
    'تم تغيير كلمة مرور حسابك الآن. لو مش إنت اللي غيّرتها، كلّم الإدارة فوراً.');
  return 'OK';
end $$;

create or replace function public.list_reset_requests() returns jsonb language sql stable security definer set search_path = public as $$
  select case when coalesce(public.my_role(), '') <> 'ceo' then '[]'::jsonb else coalesce((select jsonb_agg(jsonb_build_object(
    'id', r.id, 'email', r.email, 'role', r.role, 'name', r.name, 'phone', r.phone, 'note', r.note, 'status',
    case when r.status = 'approved' and r.expires_at < now() then 'expired' else r.status end,
    'attempts', r.attempts, 'created_at', r.created_at, 'approved_at', r.approved_at, 'expires_at', r.expires_at, 'used_at', r.used_at) order by r.created_at desc)
    from (select * from public.reset_requests order by created_at desc limit 200) r), '[]'::jsonb) end $$;
grant execute on function public.list_reset_requests() to authenticated;
revoke execute on function public.approve_password_reset(bigint, boolean), public.reject_password_reset(bigint) from public, anon;
grant execute on function public.approve_password_reset(bigint, boolean), public.reject_password_reset(bigint) to authenticated;
grant execute on function public.request_password_reset(text, text), public.complete_password_reset(text, text, text) to anon, authenticated;
revoke execute on function public.gen_code() from public, anon, authenticated;

-- ---------------------------------------------------------------------
-- 6b) حماية حساب صاحب المنصة وحسابات الإدارة
--   • تحقق بخطوتين (تطبيق Authenticator): أول ما حساب إدارة يفعّله، قاعدة البيانات نفسها
--     بترفض أي صلاحية إدارة لحد ما يدخل الكود – حتى لو حد سرق كلمة المرور أو رابط التغيير.
--   • تنبيه على إيميل صاحب المنصة عند تغيير كلمة مرور أي حساب إدارة.
-- ---------------------------------------------------------------------
create or replace function public.mfa_ok() returns boolean language sql stable security definer set search_path = public as $$
  select coalesce(auth.jwt() ->> 'aal', 'aal1') = 'aal2'
      or not exists (select 1 from auth.mfa_factors f where f.user_id = auth.uid() and f.status::text = 'verified') $$;
create or replace function public.my_role() returns text language sql stable security definer set search_path = public as $$
  select case when p.role in ('supervisor', 'principal', 'ceo') and not public.mfa_ok() then null else p.role end
  from public.profiles p where p.id = auth.uid() $$;

create or replace function public.trg_staff_pw_alert() returns trigger language plpgsql security definer set search_path = public as $$
declare r record; em text;
begin
  if new.encrypted_password is distinct from old.encrypted_password then
    select role into r from public.profiles where id = new.id;
    if r.role in ('supervisor', 'principal', 'ceo') then
      select value into em from public.private_config where key = 'reset_admin_email';
      perform public.queue_email(coalesce(em, 'eng.a.asal@gmail.com'), 'security', '⚠️ تم تغيير كلمة مرور حساب إدارة – NEXIUM',
        'الحساب: ' || coalesce(new.email, '') || ' (' || r.role || ')' || chr(10) ||
        'الوقت: ' || to_char(now() at time zone 'Asia/Riyadh', 'YYYY-MM-DD HH24:MI') || ' بتوقيت السعودية' || chr(10) || chr(10) ||
        'لو التغيير ده مش منك أو مش متوقع: ادخل Supabase فوراً وشغّل ملف owner_emergency.sql.');
    end if;
  end if;
  return new;
end $$;
drop trigger if exists on_staff_password_changed on auth.users;
create trigger on_staff_password_changed after update of encrypted_password on auth.users for each row execute function public.trg_staff_pw_alert();

-- ---------------------------------------------------------------------
-- 7) بيانات المدرسين العامة للواجهة (للزوار من غير تسجيل دخول) – بدون أي بيانات خاصة
-- ---------------------------------------------------------------------
drop function if exists public.public_teachers();
create or replace function public.public_teachers() returns jsonb language sql stable security definer set search_path = public as $$
  select coalesce(jsonb_agg(jsonb_build_object(
    'id', t.id, 'name', t.name, 'name_en', t.name_en, 'bio', t.bio, 'bio_en', t.bio_en, 'photo', t.photo, 'color', t.color, 'badge', t.badge,
    'youtube', t.youtube, 'subject_ids', t.subject_ids, 'base_rating', t.base_rating, 'base_count', t.base_count,
    'rating', (select avg(stars)::numeric(3,2) from public.ratings r where r.teacher_id = t.id),
    'rating_count', (select count(*) from public.ratings r where r.teacher_id = t.id),
    'sessions_done', (select count(*) from public.sessions s where s.teacher_id = t.id and s.status = 'done')) order by t.name), '[]'::jsonb)
  from public.teachers t where t.active $$;
grant execute on function public.public_teachers() to anon, authenticated;

-- ---------------------------------------------------------------------
-- 8) الملفات: حدود الحجم والنوع، وقراءة الواجب بس للي ليه علاقة بيه
-- ---------------------------------------------------------------------
insert into storage.buckets (id, name, public) values ('site', 'site', true) on conflict (id) do nothing;   -- صور الواجهة والمواد والمدرسين (عامة)
do $$ begin
  update storage.buckets set file_size_limit = 5242880, allowed_mime_types = array['image/jpeg', 'image/png', 'image/webp', 'image/gif'] where id = 'site';
  update storage.buckets set file_size_limit = 20971520 where id in ('homework', 'receipts');
  update storage.buckets set allowed_mime_types = array['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/heic', 'application/pdf'] where id = 'receipts';
exception when undefined_column then raise notice 'storage limits not supported here'; end $$;

drop policy if exists nexium_upload on storage.objects;
drop policy if exists nexium_read on storage.objects;
drop policy if exists nexium_site_write on storage.objects;
drop policy if exists nexium_site_update on storage.objects;
drop policy if exists nexium_site_delete on storage.objects;
create policy nexium_upload on storage.objects for insert to authenticated with check (
  bucket_id in ('homework', 'receipts') and (storage.foldername(name))[1] = auth.uid()::text);
create policy nexium_read on storage.objects for select to authenticated using (
  (bucket_id in ('homework', 'receipts') and (storage.foldername(name))[1] = auth.uid()::text)
  or (bucket_id = 'homework' and exists (select 1 from public.homework h where h.file = storage.objects.name or h.marks_file = storage.objects.name or storage.objects.name = any(h.marked)))
  or (bucket_id = 'receipts' and (public.has_perm('fin.dash') or public.has_perm('fin.approve'))));
create policy nexium_site_write on storage.objects for insert to authenticated with check (
  bucket_id = 'site' and (public.has_perm('cnt.home') or public.has_perm('cnt.subjects') or public.has_perm('tch.edit')));
create policy nexium_site_update on storage.objects for update to authenticated using (
  bucket_id = 'site' and (public.has_perm('cnt.home') or public.has_perm('cnt.subjects') or public.has_perm('tch.edit')));
create policy nexium_site_delete on storage.objects for delete to authenticated using (
  bucket_id = 'site' and (public.has_perm('cnt.home') or public.has_perm('cnt.subjects')));

-- ---------------------------------------------------------------------
-- 9) صلاحيات الجداول للأعمدة الجديدة
-- ---------------------------------------------------------------------
grant select, insert, update, delete on public.subjects, public.teachers, public.homework to authenticated;
select 'تم التحديث ✓ – NEXIUM v2' as result;
