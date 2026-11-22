-- =====================================================================
--  NEXIUM FUTURA ACADEMY — Supabase schema (tables, security, automation)
--  Run this whole file ONCE in Supabase → SQL Editor → New query → Run.
--  Then run seed.sql. Safe to re-run (uses IF NOT EXISTS / OR REPLACE).
-- =====================================================================

create schema if not exists extensions;
create extension if not exists btree_gist with schema extensions;
create extension if not exists pgcrypto with schema extensions;

-- ---------------------------------------------------------------------
-- 1) TABLES
-- ---------------------------------------------------------------------
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  role text not null check (role in ('student','teacher','supervisor','principal','ceo')),
  ref_id text not null,
  email text,
  created_at timestamptz not null default now()
);

create table if not exists public.students (
  id text primary key,
  user_id uuid unique references auth.users(id) on delete set null,
  name text not null default '',
  parent text not null default '',
  stage text, grade text,
  country text not null default 'SA',
  active boolean not null default true,
  confirmed boolean not null default false,
  provider text not null default 'email',
  joined timestamptz not null default now(),
  added_by text,
  withdrawn boolean not null default false,
  extra jsonb not null default '{}'
);
-- private contact data (never visible to teachers)
create table if not exists public.student_private (
  student_id text primary key references public.students(id) on delete cascade,
  email text, phone text
);

create table if not exists public.teachers (
  id text primary key,
  user_id uuid unique references auth.users(id) on delete set null,
  name text not null default '', name_en text,
  bio text, bio_en text, youtube text, zoom text, color text,
  camera boolean not null default true,
  active boolean not null default true,
  badge text,
  subject_ids text[] not null default '{}',
  added_students text[] not null default '{}',
  extra jsonb not null default '{}'
);
alter table public.teachers add column if not exists admin_rating numeric check (admin_rating between 1 and 5);
-- pay rates + contacts (visible only to the teacher himself and admin)
create table if not exists public.teacher_private (
  teacher_id text primary key references public.teachers(id) on delete cascade,
  email text, phone text,
  rates jsonb not null default '{}',
  rate_locked boolean not null default false
);

create table if not exists public.staff (
  id text primary key,
  user_id uuid unique references auth.users(id) on delete set null,
  name text not null default '',
  email text not null,
  role text not null check (role in ('supervisor','principal','ceo')),
  extra jsonb not null default '{}'
);

create table if not exists public.subjects (
  id text primary key,
  key text, stage text not null,
  ar text not null, en text not null, icon text,
  visible boolean not null default true,
  pps jsonb not null default '{"SAR":50,"EGP":300}',
  country_pps jsonb not null default '{}',
  extra jsonb not null default '{}'
);

create table if not exists public.sessions (
  id text primary key,
  teacher_id text not null references public.teachers(id) on delete cascade,
  subject_id text,
  student_id text references public.students(id) on delete set null,
  enrollment_id text,
  start_at timestamptz not null,
  dur int not null default 60 check (dur between 15 and 240),
  end_at timestamptz,
  status text not null default 'open' check (status in ('open','booked','done','absent','cancelled')),
  zoom text, objectives text, material text, assignment text, recording text,
  attended_at timestamptz,
  extra jsonb not null default '{}'
);
-- The database itself refuses two overlapping (non-cancelled) times for the same teacher
do $$ begin
  alter table public.sessions add constraint sessions_no_teacher_overlap
    exclude using gist (teacher_id with =, tstzrange(start_at, end_at) with &&) where (status <> 'cancelled');
exception when duplicate_object or duplicate_table then null; end $$;
create index if not exists sessions_student_idx on public.sessions(student_id);
create index if not exists sessions_start_idx on public.sessions(start_at);

create table if not exists public.enrollments (
  id text primary key,
  student_id text not null references public.students(id) on delete cascade,
  subject_id text not null,
  sessions int not null check (sessions > 0),
  amount numeric not null default 0,
  paid numeric not null default 0,
  currency text not null default 'SAR',
  method text,
  status text not null default 'pending' check (status in ('pending','paid','partial','withdrawn')),
  created timestamptz not null default now(),
  from_date date, to_date date,
  receipt text, approved_by text,
  extra jsonb not null default '{}'
);

create table if not exists public.homework (
  id text primary key,
  session_id text not null references public.sessions(id) on delete cascade,
  student_id text not null references public.students(id) on delete cascade,
  file text, note text, at timestamptz not null default now(),
  grade numeric, max numeric not null default 10, feedback text,
  extra jsonb not null default '{}'
);

create table if not exists public.evals (
  id text primary key,
  student_id text not null references public.students(id) on delete cascade,
  teacher_id text not null references public.teachers(id) on delete cascade,
  subject_id text not null,
  interaction int, homework int, commitment int, note text,
  at timestamptz not null default now(),
  extra jsonb not null default '{}'
);

create table if not exists public.certs (
  id text primary key,
  student_id text not null references public.students(id) on delete cascade,
  teacher_id text references public.teachers(id) on delete set null,
  type text, title text, reason text,
  at timestamptz not null default now(),
  extra jsonb not null default '{}'
);

create table if not exists public.ratings (
  id text primary key,
  teacher_id text not null references public.teachers(id) on delete cascade,
  student_id text not null references public.students(id) on delete cascade,
  stars int not null check (stars between 1 and 5),
  comment text, at timestamptz not null default now(),
  unique (teacher_id, student_id)
);

create table if not exists public.messages (
  id text primary key,
  thread text not null,
  student_id text not null references public.students(id) on delete cascade,
  teacher_id text not null references public.teachers(id) on delete cascade,
  sender text not null,
  text text not null,
  at timestamptz not null default now(),
  blocked boolean not null default false,
  reason text, by text,
  reviewed boolean not null default false,
  read_s boolean not null default false,
  read_t boolean not null default false,
  extra jsonb not null default '{}'
);
create index if not exists messages_thread_idx on public.messages(thread);
-- the original text of blocked messages – readable only by chat monitors
create table if not exists public.blocked_originals (
  message_id text primary key references public.messages(id) on delete cascade deferrable initially deferred,
  original text
);

create table if not exists public.emails (
  id text primary key,
  session_id text,
  to_email text not null,
  type text not null,
  subject text not null,
  body text not null,
  send_at timestamptz not null default now(),
  status text not null default 'scheduled' check (status in ('scheduled','sent','failed')),
  read boolean not null default false,
  sent_at timestamptz,
  provider_ref text,
  error text
);
create index if not exists emails_due_idx on public.emails(status, send_at);

create table if not exists public.payouts (id text primary key, teacher_id text not null references public.teachers(id) on delete cascade, amount numeric not null, note text, at timestamptz not null default now());
create table if not exists public.expenses (id text primary key, title text not null, amount numeric not null, at timestamptz not null default now());
create table if not exists public.withdrawals (id text primary key, student_id text references public.students(id) on delete cascade, enrollment_id text, reason text, note text, refund numeric not null default 0, date timestamptz not null default now());

create table if not exists public.settings (key text primary key, value jsonb not null);

create table if not exists public.pages (
  id text primary key,
  slug text unique not null,
  type text not null default 'general',
  title jsonb not null default '{}',
  body jsonb not null default '{}',
  status text not null default 'draft' check (status in ('published','draft')),
  footer boolean not null default true,
  seo jsonb not null default '{}',
  updated timestamptz not null default now()
);

-- pre-registered emails: when this person signs up, the account is linked to the record
create table if not exists public.invites (
  email text primary key,
  role text not null check (role in ('student','teacher','supervisor','principal','ceo')),
  ref_id text not null,
  created_by uuid,
  created_at timestamptz not null default now()
);

-- secrets (Resend API key, sender address) – no API access at all
create table if not exists public.private_config (key text primary key, value text);

-- ---------------------------------------------------------------------
-- 2) HELPER FUNCTIONS (used by the security rules)
-- ---------------------------------------------------------------------
create or replace function public.my_role() returns text language sql stable security definer set search_path = public as
$$ select role from public.profiles where id = auth.uid() $$;
create or replace function public.my_ref() returns text language sql stable security definer set search_path = public as
$$ select ref_id from public.profiles where id = auth.uid() $$;
create or replace function public.is_staff() returns boolean language sql stable security definer set search_path = public as
$$ select coalesce(public.my_role() in ('supervisor','principal','ceo'), false) $$;
create or replace function public.has_perm(p text) returns boolean language sql stable security definer set search_path = public as $$
  select case
    when public.my_role() = 'ceo' then true
    when public.my_role() is null or public.my_role() = 'student' then false
    when public.my_role() = 'teacher' and not coalesce((select active from public.teachers where id = public.my_ref()), false) then false
    else coalesce((select (value -> public.my_role() ->> p)::boolean from public.settings where key = 'perms'), false)
  end $$;
create or replace function public.teaches_student(sid text) returns boolean language sql stable security definer set search_path = public as $$
  select public.my_role() = 'teacher' and (
    exists (select 1 from public.sessions where teacher_id = public.my_ref() and student_id = sid)
    or exists (select 1 from public.students where id = sid and added_by = public.my_ref()))
$$;
create or replace function public.setting(k text) returns jsonb language sql stable security definer set search_path = public as
$$ select value from public.settings where key = k $$;
create or replace function public.new_id(prefix text) returns text language sql volatile as
$$ select prefix || substr(md5(random()::text || clock_timestamp()::text), 1, 12) $$;

-- phone / email / social-handle detector (same rules as the website)
create or replace function public.contact_violation(t text) returns text language plpgsql immutable as $$
declare s text; digits text; words text[] := array['صفر','واحد','اتنين','اثنين','ثلاثة','تلاتة','اربعة','أربعة','خمسة','ستة','سبعة','ثمانية','تمانية','تسعة','zero','one','two','three','four','five','six','seven','eight','nine']; w text; n int := 0;
begin
  if t is null then return null; end if;
  s := translate(t, '٠١٢٣٤٥٦٧٨٩۰۱۲۳۴۵۶۷۸۹', '01234567890123456789');
  digits := regexp_replace(s, '[\s\-\.\(\)/_+]', '', 'g');
  if digits ~ '[0-9]{7,}' then return 'phone'; end if;
  if s ~* '[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}' then return 'email'; end if;
  if s ~* '(wa\.me|whatsapp|واتس|واتساب|وتس|telegram|تيليجرام|تليجرام|instagram|انستا|snap|سناب|facebook\.com|fb\.com|t\.me)' then return 'social'; end if;
  foreach w in array regexp_split_to_array(lower(s), '[\s,،\-]+') loop if w = any(words) then n := n + 1; end if; end loop;
  if n >= 6 then return 'spelled'; end if;
  return null;
end $$;

create or replace function public.country_tz(code text) returns text language sql immutable as $$
  select case code when 'EG' then 'Africa/Cairo' when 'AE' then 'Asia/Dubai' when 'KW' then 'Asia/Kuwait' when 'OM' then 'Asia/Muscat'
    when 'QA' then 'Asia/Qatar' when 'BH' then 'Asia/Bahrain' when 'SA' then 'Asia/Riyadh' else 'Asia/Riyadh' end $$;

-- ---------------------------------------------------------------------
-- 3) TRIGGERS (business rules enforced by the database)
-- ---------------------------------------------------------------------
-- 3a. sessions: end time, no double-booking for a student, teacher limits
create or replace function public.trg_sessions_before() returns trigger language plpgsql security definer set search_path = public as $$
declare r text := public.my_role();
begin
  new.end_at := new.start_at + make_interval(mins => new.dur);
  if tg_op = 'UPDATE' and r = 'teacher' then
    new.teacher_id := old.teacher_id; new.student_id := old.student_id; new.enrollment_id := old.enrollment_id; new.subject_id := coalesce(old.subject_id, new.subject_id);
    if new.status <> old.status then
      if new.status in ('done','absent') and not public.has_perm('ses.attend') then raise exception 'PERMISSION: ses.attend'; end if;
      if new.status = 'cancelled' and old.status = 'booked' and not public.has_perm('ses.cancel') then raise exception 'PERMISSION: ses.cancel'; end if;
      if new.status in ('booked','open') then raise exception 'NOT_ALLOWED'; end if;
    end if;
    if new.zoom is distinct from old.zoom and not public.has_perm('ses.zoom') then new.zoom := old.zoom; end if;
    if new.assignment is distinct from old.assignment and not public.has_perm('hw.assign') then new.assignment := old.assignment; end if;
  end if;
  if new.status = 'booked' and new.student_id is not null and exists (
      select 1 from public.sessions s where s.student_id = new.student_id and s.id <> new.id and s.status = 'booked'
        and tstzrange(s.start_at, s.end_at) && tstzrange(new.start_at, new.end_at)) then
    raise exception 'STUDENT_OVERLAP';
  end if;
  return new;
end $$;
drop trigger if exists sessions_before on public.sessions;
create trigger sessions_before before insert or update on public.sessions for each row execute function public.trg_sessions_before();

-- 3b. reminder email 10 minutes before every booked session (sent by the scheduler below)
create or replace function public.trg_sessions_reminder() returns trigger language plpgsql security definer set search_path = public as $$
declare em text; st record; t record; sub record; mins int; tz text;
begin
  if tg_op = 'DELETE' then delete from public.emails where id = 'rem_' || old.id and status = 'scheduled'; return old; end if;
  if new.status = 'booked' and new.student_id is not null and new.end_at > now() then
    select s.*, p.email as pemail into st from public.students s left join public.student_private p on p.student_id = s.id where s.id = new.student_id;
    if st.pemail is null then return new; end if;
    select * into t from public.teachers where id = new.teacher_id;
    select * into sub from public.subjects where id = new.subject_id;
    mins := coalesce((public.setting('settings') ->> 'reminderMin')::int, 10);
    tz := public.country_tz(st.country);
    insert into public.emails (id, session_id, to_email, type, subject, body, send_at, status)
    values ('rem_' || new.id, new.id, st.pemail, 'reminder',
      '⏰ حصتك هتبدأ بعد ' || mins || ' دقايق – ' || coalesce(sub.ar, ''),
      'مرحباً ' || coalesce(st.parent, '') || '،' || chr(10) ||
      'حصة ' || coalesce(st.name, '') || ' في مادة ' || coalesce(sub.ar, '') || ' مع ' || coalesce(t.name, '') ||
      ' هتبدأ الساعة ' || to_char(new.start_at at time zone tz, 'HH12:MI AM') || ' (' || to_char(new.start_at at time zone tz, 'YYYY-MM-DD') || ').' || chr(10) ||
      'لينك الدخول: ' || coalesce(new.zoom, '') || chr(10) || chr(10) || 'NEXIUM FUTURA ACADEMY',
      new.start_at - make_interval(mins => mins), 'scheduled')
    on conflict (id) do update set to_email = excluded.to_email, subject = excluded.subject, body = excluded.body, send_at = excluded.send_at,
      status = case when public.emails.status = 'sent' and public.emails.send_at = excluded.send_at then 'sent' else 'scheduled' end;
  else
    delete from public.emails where id = 'rem_' || new.id and status = 'scheduled';
  end if;
  return new;
end $$;
drop trigger if exists sessions_reminder on public.sessions;
create trigger sessions_reminder after insert or update or delete on public.sessions for each row execute function public.trg_sessions_reminder();

-- 3c. chat: block phone numbers / emails / social handles (server-side, can't be bypassed)
create or replace function public.trg_messages_filter() returns trigger language plpgsql security definer set search_path = public as $$
declare v text;
begin
  new.thread := new.student_id || '|' || new.teacher_id;
  v := public.contact_violation(new.text);
  if v is not null then
    insert into public.blocked_originals(message_id, original) values (new.id, new.text);
    new.blocked := true; new.reason := v; new.by := new.sender; new.text := '[محجوب]';
  end if;
  return new;
end $$;
drop trigger if exists messages_filter on public.messages;
create trigger messages_filter before insert on public.messages for each row execute function public.trg_messages_filter();

-- 3d. protect fields people must not change on their own record
create or replace function public.trg_guard_students() returns trigger language plpgsql security definer set search_path = public as $$
begin
  if public.my_role() = 'student' then
    new.active := old.active; new.confirmed := old.confirmed; new.user_id := old.user_id; new.added_by := old.added_by; new.withdrawn := old.withdrawn; new.provider := old.provider;
  end if;
  if public.my_role() is not null and not public.has_perm('stu.toggle') and public.my_role() <> 'student' then new.active := old.active; end if;
  return new;
end $$;
drop trigger if exists guard_students on public.students;
create trigger guard_students before update on public.students for each row execute function public.trg_guard_students();

create or replace function public.trg_guard_teachers() returns trigger language plpgsql security definer set search_path = public as $$
begin
  if public.my_role() = 'teacher' then
    new.youtube := old.youtube; new.active := old.active; new.badge := old.badge; new.user_id := old.user_id;
  end if;
  -- only people with the "tch.rating" permission can set the admin star rating
  if public.my_role() is not null and not public.has_perm('tch.rating') then new.admin_rating := old.admin_rating; end if;
  return new;
end $$;
drop trigger if exists guard_teachers on public.teachers;
create trigger guard_teachers before update on public.teachers for each row execute function public.trg_guard_teachers();

create or replace function public.trg_guard_teacher_private() returns trigger language plpgsql security definer set search_path = public as $$
begin
  if public.my_role() = 'teacher' then
    new.email := old.email; new.rate_locked := old.rate_locked;
    if old.rate_locked then new.rates := old.rates; end if;
  elsif public.my_role() is not null and not public.has_perm('tch.rates') then
    new.rates := old.rates; new.rate_locked := old.rate_locked;
  end if;
  return new;
end $$;
drop trigger if exists guard_teacher_private on public.teacher_private;
create trigger guard_teacher_private before update on public.teacher_private for each row execute function public.trg_guard_teacher_private();

-- 3e. invitations: teacher-added students, new teachers and new admin accounts
create or replace function public.queue_email(p_to text, p_type text, p_subject text, p_body text) returns void language sql security definer set search_path = public as $$
  insert into public.emails (id, to_email, type, subject, body, send_at, status) values (public.new_id('em'), p_to, p_type, p_subject, p_body, now(), 'scheduled')
$$;
create or replace function public.trg_invite_student() returns trigger language plpgsql security definer set search_path = public as $$
declare s record;
begin
  select * into s from public.students where id = new.student_id;
  if s.user_id is null and new.email is not null and new.email <> '' then
    insert into public.invites(email, role, ref_id, created_by) values (lower(new.email), 'student', new.student_id, auth.uid()) on conflict (email) do nothing;
    perform public.queue_email(new.email, 'invite', 'تفعيل حساب NEXIUM FUTURA ACADEMY',
      'مرحباً ' || coalesce(s.parent, '') || '،' || chr(10) || 'تم إنشاء حساب للطالب ' || coalesce(s.name, '') ||
      '. ادخل على موقع الأكاديمية واعمل "إنشاء حساب" بنفس البريد ده عشان تفعّل الحساب وتختار كلمة المرور.');
  end if;
  return new;
end $$;
drop trigger if exists invite_student on public.student_private;
create trigger invite_student after insert on public.student_private for each row execute function public.trg_invite_student();

create or replace function public.trg_invite_teacher() returns trigger language plpgsql security definer set search_path = public as $$
declare t record;
begin
  select * into t from public.teachers where id = new.teacher_id;
  if t.user_id is null and new.email is not null and new.email <> '' then
    insert into public.invites(email, role, ref_id, created_by) values (lower(new.email), 'teacher', new.teacher_id, auth.uid()) on conflict (email) do nothing;
    perform public.queue_email(new.email, 'invite', 'انضمامك لفريق مدرسين NEXIUM FUTURA ACADEMY',
      'مرحباً ' || coalesce(t.name, '') || '،' || chr(10) || 'تمت إضافتك كمدرس. افتح بوابة المدرس (رابط الموقع + #teacher) واضغط "تفعيل الحساب لأول مرة" بنفس البريد ده.');
  end if;
  return new;
end $$;
drop trigger if exists invite_teacher on public.teacher_private;
create trigger invite_teacher after insert on public.teacher_private for each row execute function public.trg_invite_teacher();

create or replace function public.trg_invite_staff() returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.user_id is null then
    insert into public.invites(email, role, ref_id, created_by) values (lower(new.email), new.role, new.id, auth.uid())
      on conflict (email) do update set role = excluded.role, ref_id = excluded.ref_id;
    perform public.queue_email(new.email, 'invite', 'حساب إدارة NEXIUM FUTURA ACADEMY',
      'مرحباً ' || coalesce(new.name, '') || '،' || chr(10) || 'تم إنشاء حساب إدارة لك. افتح لوحة الإدارة (رابط الموقع + #admin) واضغط "تفعيل الحساب لأول مرة" بنفس البريد ده.');
  end if;
  return new;
end $$;
drop trigger if exists invite_staff on public.staff;
create trigger invite_staff after insert on public.staff for each row execute function public.trg_invite_staff();

create or replace function public.trg_staff_role_sync() returns trigger language plpgsql security definer set search_path = public as $$
begin
  update public.profiles set role = new.role where ref_id = new.id and role in ('supervisor','principal','ceo');
  update public.invites set role = new.role where ref_id = new.id;
  return new;
end $$;
drop trigger if exists staff_role_sync on public.staff;
create trigger staff_role_sync after update of role on public.staff for each row execute function public.trg_staff_role_sync();

create or replace function public.trg_staff_deleted() returns trigger language plpgsql security definer set search_path = public as $$
begin
  delete from public.profiles where ref_id = old.id and role in ('supervisor','principal','ceo');
  delete from public.invites where ref_id = old.id;
  return old;
end $$;
drop trigger if exists staff_deleted on public.staff;
create trigger staff_deleted after delete on public.staff for each row execute function public.trg_staff_deleted();

-- tells the teacher/admin login page whether this email was pre-registered by the admin
create or replace function public.check_invite(p_email text) returns text language sql stable security definer set search_path = public as
$$ select role from public.invites where email = lower(trim(p_email)) $$;

-- 3f. new sign-up → profile + student record (or link to an invitation)
create or replace function public.handle_new_user() returns trigger language plpgsql security definer set search_path = public as $$
declare inv record; m jsonb := coalesce(new.raw_user_meta_data, '{}'); sid text; prov text := coalesce(new.raw_app_meta_data ->> 'provider', 'email');
begin
  select * into inv from public.invites where email = lower(new.email);
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
  values (sid, new.id, coalesce(m ->> 'name', ''), coalesce(m ->> 'parent', m ->> 'full_name', m ->> 'name', ''),
          coalesce(m ->> 'stage', 'pri'), coalesce(m ->> 'grade', 'G1'), coalesce(m ->> 'country', 'SA'),
          new.email_confirmed_at is not null, prov);
  insert into public.student_private(student_id, email, phone) values (sid, lower(new.email), coalesce(m ->> 'phone', ''));
  insert into public.profiles(id, role, ref_id, email) values (new.id, 'student', sid, lower(new.email));
  return new;
end $$;
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users for each row execute function public.handle_new_user();

create or replace function public.handle_user_confirmed() returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.email_confirmed_at is not null and old.email_confirmed_at is null then
    update public.students set confirmed = true where user_id = new.id;
  end if;
  return new;
end $$;
drop trigger if exists on_auth_user_confirmed on auth.users;
create trigger on_auth_user_confirmed after update on auth.users for each row execute function public.handle_user_confirmed();

-- 3g. payment approved → email to the parent
create or replace function public.trg_enrollment_paid() returns trigger language plpgsql security definer set search_path = public as $$
declare em text; sub record;
begin
  if new.status = 'paid' and old.status = 'pending' then
    select email into em from public.student_private where student_id = new.student_id;
    select * into sub from public.subjects where id = new.subject_id;
    if em is not null then
      perform public.queue_email(em, 'payment', 'تم تأكيد الدفع وتفعيل الباقة ✓',
        'تم تفعيل باقة ' || new.sessions || ' حصة في مادة ' || coalesce(sub.ar, '') || '. تقدر تحجز حصصك دلوقتي من المنصة.');
    end if;
  end if;
  return new;
end $$;
drop trigger if exists enrollment_paid on public.enrollments;
create trigger enrollment_paid after update on public.enrollments for each row execute function public.trg_enrollment_paid();

-- ---------------------------------------------------------------------
-- 4) SERVER ACTIONS (called from the website)
-- ---------------------------------------------------------------------
create or replace function public.enrollment_remaining(e_id text) returns int language sql stable security definer set search_path = public as $$
  select e.sessions - (select count(*) from public.sessions s where s.enrollment_id = e.id and s.status in ('booked','done','absent'))::int
  from public.enrollments e where e.id = e_id $$;

-- student books one of the teacher's free times
create or replace function public.book_slot(p_slot text, p_subject text) returns public.sessions language plpgsql security definer set search_path = public as $$
declare me text := public.my_ref(); s public.sessions; st record; enr text;
begin
  if public.my_role() <> 'student' then raise exception 'ONLY_STUDENTS'; end if;
  select * into st from public.students where id = me;
  if not st.active then raise exception 'ACCOUNT_SUSPENDED'; end if;
  if not st.confirmed then raise exception 'EMAIL_NOT_CONFIRMED'; end if;
  select * into s from public.sessions where id = p_slot for update;
  if not found or s.status <> 'open' then raise exception 'SLOT_TAKEN'; end if;
  if s.start_at < now() + interval '15 minutes' then raise exception 'SLOT_TOO_SOON'; end if;
  if not exists (select 1 from public.teachers t where t.id = s.teacher_id and t.active and p_subject = any(t.subject_ids)) then raise exception 'TEACHER_SUBJECT'; end if;
  select e.id into enr from public.enrollments e where e.student_id = me and e.subject_id = p_subject and e.status in ('paid','partial')
    and public.enrollment_remaining(e.id) > 0 order by e.created limit 1;
  if enr is null then raise exception 'NO_BALANCE'; end if;
  update public.sessions set status = 'booked', student_id = me, subject_id = p_subject, enrollment_id = enr,
    objectives = '', material = '', assignment = '', recording = '' where id = p_slot returning * into s;
  return s;
end $$;

-- teacher / admin puts a student on a free time
create or replace function public.assign_slot(p_slot text, p_student text, p_subject text) returns public.sessions language plpgsql security definer set search_path = public as $$
declare s public.sessions; enr text;
begin
  select * into s from public.sessions where id = p_slot for update;
  if not found or s.status <> 'open' then raise exception 'SLOT_TAKEN'; end if;
  if not public.has_perm('ses.assign') then raise exception 'PERMISSION: ses.assign'; end if;
  if public.my_role() = 'teacher' and s.teacher_id <> public.my_ref() then raise exception 'NOT_YOUR_SLOT'; end if;
  select e.id into enr from public.enrollments e where e.student_id = p_student and e.subject_id = p_subject and e.status in ('paid','partial')
    and public.enrollment_remaining(e.id) > 0 order by e.created limit 1;
  update public.sessions set status = 'booked', student_id = p_student, subject_id = p_subject, enrollment_id = enr,
    objectives = '', material = '', assignment = '', recording = '' where id = p_slot returning * into s;
  return s;
end $$;

-- student requests a package: the PRICE IS CALCULATED HERE, never trusted from the browser
create or replace function public.request_package(p_subject text, p_sessions int, p_method text, p_receipt text) returns public.enrollments language plpgsql security definer set search_path = public as $$
declare me text := public.my_ref(); st record; sub record; mode text; ccode text; c jsonb; pps numeric; disc numeric; dec int; total numeric; e public.enrollments;
begin
  if public.my_role() <> 'student' then raise exception 'ONLY_STUDENTS'; end if;
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

-- run ONCE after you sign up on the website, to make yourself the CEO:
--   select public.make_ceo('your@email.com');
create or replace function public.make_ceo(p_email text) returns text language plpgsql security definer set search_path = public as $$
declare u uuid; sid text;
begin
  select id into u from auth.users where lower(email) = lower(p_email);
  if u is null then return 'سجّل حساب على الموقع بالبريد ده الأول ثم أعد المحاولة'; end if;
  select id into sid from public.staff where user_id = u;
  if sid is null then sid := public.new_id('a');
    insert into public.staff(id, user_id, name, email, role) values (sid, u, split_part(p_email, '@', 1), lower(p_email), 'ceo');
  else update public.staff set role = 'ceo' where id = sid; end if;
  insert into public.profiles(id, role, ref_id, email) values (u, 'ceo', sid, lower(p_email))
    on conflict (id) do update set role = 'ceo', ref_id = sid;
  delete from public.students s where s.user_id = u and not exists (select 1 from public.enrollments e where e.student_id = s.id);
  return 'تم – الحساب ' || p_email || ' بقى الرئيس التنفيذي. ادخل على #admin';
end $$;

-- ---------------------------------------------------------------------
-- 5) EMAIL SENDER (Resend) – runs every minute via pg_cron + pg_net
-- ---------------------------------------------------------------------
create or replace function public.send_due_emails() returns int language plpgsql security definer set search_path = public as $$
declare k text; frm text; r record; n int := 0; rid bigint;
begin
  select value into k from public.private_config where key = 'resend_api_key';
  select value into frm from public.private_config where key = 'email_from';
  if k is null or k = '' then return 0; end if;
  for r in select * from public.emails where status = 'scheduled' and send_at <= now() order by send_at limit 50 for update skip locked loop
    select net.http_post(
      url := 'https://api.resend.com/emails',
      headers := jsonb_build_object('Authorization', 'Bearer ' || k, 'Content-Type', 'application/json'),
      body := jsonb_build_object('from', coalesce(frm, 'NEXIUM FUTURA ACADEMY <onboarding@resend.dev>'), 'to', jsonb_build_array(r.to_email), 'subject', r.subject, 'text', r.body)
    ) into rid;
    update public.emails set status = 'sent', sent_at = now(), provider_ref = rid::text where id = r.id;
    n := n + 1;
  end loop;
  return n;
end $$;

-- ---------------------------------------------------------------------
-- 6) ROW LEVEL SECURITY – who can read / write what
-- ---------------------------------------------------------------------
do $$ declare t text; begin
  foreach t in array array['profiles','students','student_private','teachers','teacher_private','staff','subjects','sessions','enrollments','homework','evals','certs','ratings','messages','blocked_originals','emails','payouts','expenses','withdrawals','settings','pages','invites','private_config'] loop
    execute format('alter table public.%I enable row level security', t);
    execute format('do $x$ declare p record; begin for p in select policyname from pg_policies where schemaname = ''public'' and tablename = %L loop execute format(''drop policy %%I on public.%%I'', p.policyname, %L); end loop; end $x$', t, t);
  end loop;
end $$;

-- profiles
create policy profiles_read on public.profiles for select to authenticated using (id = auth.uid() or public.is_staff());

-- students
create policy students_read on public.students for select to authenticated using (
  user_id = auth.uid() or public.has_perm('stu.view') or public.teaches_student(id) or public.has_perm('fin.dash'));
create policy students_insert on public.students for insert to authenticated with check (public.has_perm('stu.add'));
create policy students_update on public.students for update to authenticated using (
  user_id = auth.uid() or public.has_perm('stu.edit') or public.has_perm('stu.toggle'));
create policy students_delete on public.students for delete to authenticated using (public.has_perm('stu.delete'));

create policy student_private_read on public.student_private for select to authenticated using (
  exists (select 1 from public.students s where s.id = student_id and s.user_id = auth.uid()) or (public.is_staff() and public.has_perm('stu.view')));
create policy student_private_insert on public.student_private for insert to authenticated with check (public.has_perm('stu.add'));
create policy student_private_update on public.student_private for update to authenticated using (
  exists (select 1 from public.students s where s.id = student_id and s.user_id = auth.uid()) or public.has_perm('stu.edit'));

-- teachers
create policy teachers_read on public.teachers for select to authenticated using (true);
create policy teachers_insert on public.teachers for insert to authenticated with check (public.has_perm('tch.add'));
create policy teachers_update on public.teachers for update to authenticated using (
  user_id = auth.uid() or public.has_perm('tch.edit') or public.has_perm('tch.delete'));
create policy teachers_delete on public.teachers for delete to authenticated using (public.has_perm('tch.delete'));

create policy teacher_private_read on public.teacher_private for select to authenticated using (
  exists (select 1 from public.teachers t where t.id = teacher_id and t.user_id = auth.uid())
  or public.has_perm('tch.view') and public.is_staff() or public.has_perm('fin.dash') or public.has_perm('fin.payout'));
create policy teacher_private_insert on public.teacher_private for insert to authenticated with check (public.has_perm('tch.add'));
create policy teacher_private_update on public.teacher_private for update to authenticated using (
  exists (select 1 from public.teachers t where t.id = teacher_id and t.user_id = auth.uid()) or public.has_perm('tch.edit') or public.has_perm('tch.rates'));

-- staff
create policy staff_read on public.staff for select to authenticated using (public.is_staff());
create policy staff_write on public.staff for all to authenticated using (public.has_perm('sys.staff')) with check (public.has_perm('sys.staff'));

-- subjects (public catalogue)
create policy subjects_read on public.subjects for select to anon, authenticated using (true);
create policy subjects_insert on public.subjects for insert to authenticated with check (public.has_perm('cnt.summer') or public.has_perm('cnt.subjects'));
create policy subjects_update on public.subjects for update to authenticated using (public.has_perm('cnt.subjects') or public.has_perm('fin.prices'));

-- sessions
create policy sessions_read on public.sessions for select to authenticated using (
  status = 'open'
  or student_id = public.my_ref() and public.my_role() = 'student'
  or teacher_id = public.my_ref() and public.my_role() = 'teacher'
  or public.has_perm('ses.viewall') or public.has_perm('fin.dash'));
create policy sessions_insert on public.sessions for insert to authenticated with check (
  status = 'open' and student_id is null and (
    (public.my_role() = 'teacher' and teacher_id = public.my_ref() and public.has_perm('ses.slots'))
    or (public.is_staff() and public.has_perm('ses.slots'))));
create policy sessions_update on public.sessions for update to authenticated using (
  (public.my_role() = 'teacher' and teacher_id = public.my_ref()) or (public.is_staff() and (public.has_perm('ses.cancel') or public.has_perm('ses.attend'))));
create policy sessions_delete on public.sessions for delete to authenticated using (
  status = 'open' and ((public.my_role() = 'teacher' and teacher_id = public.my_ref()) or public.is_staff()));

-- enrollments (money – students only see their own, teachers see nothing)
create policy enrollments_read on public.enrollments for select to authenticated using (
  student_id = public.my_ref() and public.my_role() = 'student' or public.has_perm('fin.dash'));
create policy enrollments_insert on public.enrollments for insert to authenticated with check (public.has_perm('fin.record'));
create policy enrollments_update on public.enrollments for update to authenticated using (
  public.has_perm('fin.record') or public.has_perm('fin.approve') or public.has_perm('fin.withdraw'));
create policy enrollments_delete on public.enrollments for delete to authenticated using (public.has_perm('fin.approve'));

-- homework
create policy homework_read on public.homework for select to authenticated using (
  student_id = public.my_ref() and public.my_role() = 'student'
  or exists (select 1 from public.sessions s where s.id = session_id and s.teacher_id = public.my_ref() and public.my_role() = 'teacher')
  or public.is_staff());
create policy homework_insert on public.homework for insert to authenticated with check (
  student_id = public.my_ref() and public.my_role() = 'student' and grade is null
  and exists (select 1 from public.sessions s where s.id = session_id and s.student_id = public.my_ref()));
create policy homework_update on public.homework for update to authenticated using (
  public.has_perm('hw.grade') and (public.is_staff() or exists (select 1 from public.sessions s where s.id = session_id and s.teacher_id = public.my_ref())));
create policy homework_delete on public.homework for delete to authenticated using (public.has_perm('hw.delete'));

-- evaluations & certificates
create policy evals_read on public.evals for select to authenticated using (
  student_id = public.my_ref() and public.my_role() = 'student' or public.my_role() = 'teacher' or public.is_staff());
create policy evals_insert on public.evals for insert to authenticated with check (
  public.has_perm('ev.enter') and (teacher_id = public.my_ref() or public.is_staff()));
create policy evals_update on public.evals for update to authenticated using (
  public.has_perm('ev.edit') and (teacher_id = public.my_ref() or public.is_staff()));
create policy certs_read on public.certs for select to authenticated using (
  student_id = public.my_ref() and public.my_role() = 'student' or teacher_id = public.my_ref() or public.is_staff());
create policy certs_insert on public.certs for insert to authenticated with check (public.has_perm('ev.cert'));

-- ratings (parents rate teachers; everyone can read the reviews)
create policy ratings_read on public.ratings for select to authenticated using (true);
create policy ratings_insert on public.ratings for insert to authenticated with check (student_id = public.my_ref() and public.my_role() = 'student');
create policy ratings_update on public.ratings for update to authenticated using (student_id = public.my_ref() and public.my_role() = 'student');

-- messages
create policy messages_read on public.messages for select to authenticated using (
  (student_id = public.my_ref() and public.my_role() = 'student') or (teacher_id = public.my_ref() and public.my_role() = 'teacher') or public.has_perm('com.monitor'));
create policy messages_insert on public.messages for insert to authenticated with check (
  sender = public.my_ref() and (
    (public.my_role() = 'student' and student_id = public.my_ref() and exists (select 1 from public.sessions s where s.student_id = public.my_ref() and s.teacher_id = messages.teacher_id))
    or (public.my_role() = 'teacher' and teacher_id = public.my_ref() and public.has_perm('com.chat'))));
create policy messages_update on public.messages for update to authenticated using (
  (student_id = public.my_ref() and public.my_role() = 'student') or (teacher_id = public.my_ref() and public.my_role() = 'teacher') or public.has_perm('com.monitor'));
create policy blocked_read on public.blocked_originals for select to authenticated using (public.has_perm('com.monitor'));

-- emails log
create policy emails_read on public.emails for select to authenticated using (
  to_email = (select email from public.profiles where id = auth.uid()) or public.has_perm('com.emails'));
create policy emails_update on public.emails for update to authenticated using (to_email = (select email from public.profiles where id = auth.uid()));

-- finance tables
create policy payouts_read on public.payouts for select to authenticated using (
  teacher_id = public.my_ref() and public.my_role() = 'teacher' or public.has_perm('fin.dash') or public.has_perm('fin.payout'));
create policy payouts_insert on public.payouts for insert to authenticated with check (public.has_perm('fin.payout'));
create policy expenses_read on public.expenses for select to authenticated using (public.has_perm('fin.profit') or public.has_perm('fin.dash'));
create policy expenses_write on public.expenses for all to authenticated using (public.has_perm('fin.record')) with check (public.has_perm('fin.record'));
create policy withdrawals_read on public.withdrawals for select to authenticated using (public.has_perm('fin.dash'));
create policy withdrawals_insert on public.withdrawals for insert to authenticated with check (public.has_perm('fin.withdraw'));

-- settings (public read: prices, currencies, social links, payment methods)
create policy settings_read on public.settings for select to anon, authenticated using (true);
create policy settings_write on public.settings for update to authenticated using (
  case key when 'perms' then public.has_perm('sys.perms')
           when 'countries' then public.has_perm('fin.prices') when 'settings' then public.has_perm('fin.prices') or public.has_perm('fin.dash')
           when 'methods' then public.has_perm('fin.methods')
           when 'social' then public.has_perm('cnt.social') when 'footerAbout' then public.has_perm('cnt.social')
           else public.my_role() = 'ceo' end);

-- site pages
create policy pages_read on public.pages for select to anon, authenticated using (status = 'published' or public.has_perm('cnt.pages'));
create policy pages_write on public.pages for all to authenticated using (public.has_perm('cnt.pages')) with check (public.has_perm('cnt.pages'));

-- invites
create policy invites_read on public.invites for select to authenticated using (public.is_staff());
-- private_config: RLS on, no policies → nobody can read it through the API.

-- ---------------------------------------------------------------------
-- 7) GRANTS
-- ---------------------------------------------------------------------
grant usage on schema public to anon, authenticated;
grant select, insert, update, delete on all tables in schema public to authenticated;
grant select on public.subjects, public.settings, public.pages to anon;
revoke all on public.private_config from anon, authenticated;
revoke all on public.invites from anon;
grant execute on function public.check_invite(text) to anon, authenticated;
grant execute on function public.book_slot(text, text), public.assign_slot(text, text, text), public.request_package(text, int, text, text) to authenticated;
revoke execute on function public.make_ceo(text) from public, anon, authenticated;
revoke execute on function public.send_due_emails() from public, anon, authenticated;

-- ---------------------------------------------------------------------
-- 8) FILE STORAGE (homework answers, payment receipts) – private buckets
-- ---------------------------------------------------------------------
insert into storage.buckets (id, name, public) values ('homework', 'homework', false) on conflict (id) do nothing;
insert into storage.buckets (id, name, public) values ('receipts', 'receipts', false) on conflict (id) do nothing;
drop policy if exists nexium_upload on storage.objects;
drop policy if exists nexium_read on storage.objects;
create policy nexium_upload on storage.objects for insert to authenticated with check (
  bucket_id in ('homework', 'receipts') and (storage.foldername(name))[1] = auth.uid()::text);
create policy nexium_read on storage.objects for select to authenticated using (
  bucket_id in ('homework', 'receipts') and (
    (storage.foldername(name))[1] = auth.uid()::text
    or (bucket_id = 'homework' and public.my_role() in ('teacher', 'supervisor', 'principal', 'ceo'))
    or (bucket_id = 'receipts' and public.is_staff())));

-- ---------------------------------------------------------------------
-- 9) LIVE UPDATES + EMAIL SCHEDULER (Supabase-only features)
-- ---------------------------------------------------------------------
do $$ begin
  begin alter publication supabase_realtime add table public.messages; exception when others then null; end;
  begin alter publication supabase_realtime add table public.sessions; exception when others then null; end;
  begin alter publication supabase_realtime add table public.enrollments; exception when others then null; end;
end $$;

do $$ begin
  create extension if not exists pg_net;
  create extension if not exists pg_cron;
  perform cron.schedule('nexium-send-emails', '* * * * *', 'select public.send_due_emails()');
exception when others then raise notice 'pg_cron / pg_net not available here: %', sqlerrm;
end $$;
