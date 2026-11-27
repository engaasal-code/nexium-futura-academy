-- =====================================================================
--  NEXIUM FUTURA ACADEMY — تحديث v3
--  • ولي أمر واحد بأكثر من طفل تحت نفس الحساب
--  • تسجيلات الحصص: إيميل للطالب أول ما المدرس يضيف لينك التسجيل
--  • مدة صلاحية الباقة بتتحدد من الإدارة، والحجز بيقف بعد انتهاء الباقة
--  شغّله بعد update_v2.sql (مرة واحدة). آمن لو اتشغّل تاني، ومش بيمسح بيانات.
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1) أكتر من طفل لنفس حساب ولي الأمر
-- ---------------------------------------------------------------------
do $$ declare c text; begin
  select conname into c from pg_constraint where conrelid = 'public.students'::regclass and contype = 'u' and pg_get_constraintdef(oid) like 'UNIQUE (user_id)%';
  if c is not null then execute format('alter table public.students drop constraint %I', c); end if;
end $$;
create index if not exists students_user_idx on public.students(user_id);

-- هل الطالب ده من أولاد صاحب الحساب الحالي؟
create or replace function public.is_my_kid(sid text) returns boolean language sql stable security definer set search_path = public as $$
  select public.my_role() = 'student' and exists (select 1 from public.students where id = sid and user_id = auth.uid()) $$;

-- ولي الأمر يضيف طفل جديد (بياناته وطريقة التواصل بتتنسخ من حسابه)
create or replace function public.add_child(p_name text, p_stage text, p_grade text) returns text language plpgsql security definer set search_path = public as $$
declare me record; sid text; pr record;
begin
  if public.my_role() <> 'student' then raise exception 'ONLY_PARENTS'; end if;
  if length(trim(coalesce(p_name, ''))) < 2 then raise exception 'NAME_REQUIRED'; end if;
  if p_stage not in ('kg', 'pri', 'prep', 'sec') or p_grade !~ '^(KG[12]|G([1-9]|1[0-2]))$' then raise exception 'BAD_GRADE'; end if;
  if (select count(*) from public.students where user_id = auth.uid()) >= 10 then raise exception 'TOO_MANY_CHILDREN'; end if;
  select s.* into me from public.students s where s.id = public.my_ref();
  select * into pr from public.student_private where student_id = me.id;
  sid := public.new_id('s');
  insert into public.students(id, user_id, name, parent, stage, grade, country, active, confirmed, provider)
  values (sid, auth.uid(), left(trim(p_name), 80), me.parent, p_stage, p_grade, me.country, true, me.confirmed, me.provider);
  insert into public.student_private(student_id, email, phone) values (sid, pr.email, pr.phone);
  return sid;
end $$;
grant execute on function public.add_child(text, text, text) to authenticated;

-- لو المدرس أو الإدارة أضافوا طفل بإيميل ولي أمر عنده حساب بالفعل → يترِبط بحسابه على طول
create or replace function public.trg_invite_student() returns trigger language plpgsql security definer set search_path = public as $$
declare s record; u uuid;
begin
  select * into s from public.students where id = new.student_id;
  if s.user_id is null and new.email is not null and new.email <> '' then
    select p.id into u from public.profiles p where p.email = lower(new.email) and p.role = 'student';
    if u is not null then
      update public.students set user_id = u, confirmed = true where id = new.student_id;
      perform public.queue_email(new.email, 'invite', 'تمت إضافة ' || coalesce(s.name, '') || ' لحسابك – NEXIUM FUTURA ACADEMY',
        'مرحباً ' || coalesce(s.parent, '') || '،' || chr(10) || 'تمت إضافة الطالب ' || coalesce(s.name, '') || ' لحسابك. سجّل دخول واختاره من "أولادي".');
      return new;
    end if;
    insert into public.invites(email, role, ref_id, created_by) values (lower(new.email), 'student', new.student_id, auth.uid()) on conflict (email) do nothing;
    perform public.queue_email(new.email, 'invite', 'تفعيل حساب NEXIUM FUTURA ACADEMY',
      'مرحباً ' || coalesce(s.parent, '') || '،' || chr(10) || 'تم إنشاء حساب للطالب ' || coalesce(s.name, '') ||
      '. ادخل على موقع الأكاديمية واعمل "إنشاء حساب" بنفس البريد ده عشان تفعّل الحساب وتختار كلمة المرور.');
  end if;
  return new;
end $$;

-- القواعد: "الطالب" = أي طفل من أولاد صاحب الحساب
drop policy if exists sessions_read on public.sessions;
create policy sessions_read on public.sessions for select to authenticated using (
  status = 'open' or public.is_my_kid(student_id)
  or teacher_id = public.my_ref() and public.my_role() = 'teacher'
  or public.has_perm('ses.viewall') or public.has_perm('fin.dash'));
drop policy if exists enrollments_read on public.enrollments;
create policy enrollments_read on public.enrollments for select to authenticated using (public.is_my_kid(student_id) or public.has_perm('fin.dash'));
drop policy if exists homework_read on public.homework;
create policy homework_read on public.homework for select to authenticated using (
  public.is_my_kid(student_id)
  or exists (select 1 from public.sessions s where s.id = session_id and s.teacher_id = public.my_ref() and public.my_role() = 'teacher')
  or public.is_staff());
drop policy if exists homework_insert on public.homework;
create policy homework_insert on public.homework for insert to authenticated with check (
  public.is_my_kid(student_id) and grade is null
  and exists (select 1 from public.sessions s where s.id = session_id and s.student_id = homework.student_id));
drop policy if exists evals_read on public.evals;
create policy evals_read on public.evals for select to authenticated using (
  public.is_my_kid(student_id)
  or (public.my_role() = 'teacher' and (teacher_id = public.my_ref() or public.teaches_student(student_id)))
  or public.is_staff());
drop policy if exists certs_read on public.certs;
create policy certs_read on public.certs for select to authenticated using (public.is_my_kid(student_id) or teacher_id = public.my_ref() or public.is_staff());
drop policy if exists ratings_insert on public.ratings;
create policy ratings_insert on public.ratings for insert to authenticated with check (
  public.is_my_kid(student_id)
  and exists (select 1 from public.sessions s where s.student_id = ratings.student_id and s.teacher_id = ratings.teacher_id and s.status in ('booked', 'done', 'absent')));
drop policy if exists ratings_update on public.ratings;
create policy ratings_update on public.ratings for update to authenticated using (public.is_my_kid(student_id));
drop policy if exists messages_read on public.messages;
create policy messages_read on public.messages for select to authenticated using (
  public.is_my_kid(student_id) or (teacher_id = public.my_ref() and public.my_role() = 'teacher') or public.has_perm('com.monitor'));
drop policy if exists messages_insert on public.messages;
create policy messages_insert on public.messages for insert to authenticated with check (
  (public.my_role() = 'student' and sender = student_id and public.is_my_kid(student_id)
    and exists (select 1 from public.sessions s where s.student_id = messages.student_id and s.teacher_id = messages.teacher_id))
  or (public.my_role() = 'teacher' and sender = public.my_ref() and teacher_id = public.my_ref() and public.has_perm('com.chat')));
drop policy if exists messages_update on public.messages;
create policy messages_update on public.messages for update to authenticated using (
  public.is_my_kid(student_id) or (teacher_id = public.my_ref() and public.my_role() = 'teacher') or public.has_perm('com.monitor'));

-- ---------------------------------------------------------------------
-- 2) الحجز والاشتراك لطفل معيّن + انتهاء صلاحية الباقة
-- ---------------------------------------------------------------------
create or replace function public.enrollment_remaining(e_id text) returns int language sql stable security definer set search_path = public as $$
  select e.sessions - (select count(*) from public.sessions s where s.enrollment_id = e.id and s.status in ('booked','done','absent'))::int
  from public.enrollments e where e.id = e_id $$;

drop function if exists public.book_slot(text, text);
create or replace function public.book_slot(p_slot text, p_subject text, p_student text default null) returns public.sessions language plpgsql security definer set search_path = public as $$
declare me text := coalesce(p_student, public.my_ref()); s public.sessions; st record; enr text;
begin
  if public.my_role() <> 'student' then raise exception 'ONLY_STUDENTS'; end if;
  if not public.is_my_kid(me) then raise exception 'NOT_YOUR_CHILD'; end if;
  select * into st from public.students where id = me;
  if not st.active then raise exception 'ACCOUNT_SUSPENDED'; end if;
  if not st.confirmed then raise exception 'EMAIL_NOT_CONFIRMED'; end if;
  select * into s from public.sessions where id = p_slot for update;
  if not found or s.status <> 'open' then raise exception 'SLOT_TAKEN'; end if;
  if s.start_at < now() + interval '15 minutes' then raise exception 'SLOT_TOO_SOON'; end if;
  if not exists (select 1 from public.teachers t where t.id = s.teacher_id and t.active and p_subject = any(t.subject_ids)) then raise exception 'TEACHER_SUBJECT'; end if;
  select e.id into enr from public.enrollments e where e.student_id = me and e.subject_id = p_subject and e.status in ('paid','partial')
    and public.enrollment_remaining(e.id) > 0 and (e.to_date is null or e.to_date >= (s.start_at at time zone 'Asia/Riyadh')::date)
    order by e.to_date nulls last, e.created limit 1;
  if enr is null then
    if exists (select 1 from public.enrollments e where e.student_id = me and e.subject_id = p_subject and e.status in ('paid','partial') and public.enrollment_remaining(e.id) > 0) then raise exception 'PACKAGE_EXPIRED'; end if;
    raise exception 'NO_BALANCE';
  end if;
  update public.sessions set status = 'booked', student_id = me, subject_id = p_subject, enrollment_id = enr,
    objectives = '', material = '', assignment = '', recording = '' where id = p_slot returning * into s;
  return s;
end $$;
grant execute on function public.book_slot(text, text, text) to authenticated;

drop function if exists public.request_package(text, int, text, text);
create or replace function public.request_package(p_subject text, p_sessions int, p_method text, p_receipt text, p_student text default null) returns public.enrollments language plpgsql security definer set search_path = public as $$
declare me text := coalesce(p_student, public.my_ref()); st record; sub record; mode text; ccode text; c jsonb; pps numeric; disc numeric; dec int; total numeric; days int; e public.enrollments;
begin
  if public.my_role() <> 'student' then raise exception 'ONLY_STUDENTS'; end if;
  if not public.is_my_kid(me) then raise exception 'NOT_YOUR_CHILD'; end if;
  if p_receipt is null or p_receipt !~ ('^' || auth.uid()::text || '/[A-Za-z0-9_.-]{1,120}$') then raise exception 'BAD_FILE'; end if;
  if (select count(*) from public.enrollments x where x.student_id in (select id from public.students where user_id = auth.uid()) and x.status = 'pending') >= 5 then raise exception 'TOO_MANY_PENDING'; end if;
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
  days := least(365, greatest(7, coalesce((public.setting('settings') ->> 'packageDays')::int, 60)));
  insert into public.enrollments(id, student_id, subject_id, sessions, amount, paid, currency, method, status, created, from_date, to_date, receipt)
  values (public.new_id('e'), me, p_subject, p_sessions, total, 0, coalesce(c ->> 'cur', 'SAR'), p_method, 'pending', now(), current_date, current_date + days, p_receipt)
  returning * into e;
  return e;
end $$;
grant execute on function public.request_package(text, int, text, text, text) to authenticated;

-- الباقة بتبدأ من يوم اعتماد الدفع (مش يوم الطلب) عشان ولي الأمر ميخسرش أيام
create or replace function public.trg_enrollment_dates() returns trigger language plpgsql as $$
declare days int;
begin
  if new.status in ('paid', 'partial') and old.status = 'pending' and new.from_date is not distinct from old.from_date and new.to_date is not distinct from old.to_date then
    days := coalesce(old.to_date - old.from_date, 60);
    new.from_date := current_date; new.to_date := current_date + days;
  end if;
  return new;
end $$;
drop trigger if exists enrollment_dates on public.enrollments;
create trigger enrollment_dates before update on public.enrollments for each row execute function public.trg_enrollment_dates();

-- ---------------------------------------------------------------------
-- 3) تسجيلات الحصص: إيميل لولي الأمر أول ما المدرس يضيف التسجيل
-- ---------------------------------------------------------------------
create or replace function public.trg_recording_added() returns trigger language plpgsql security definer set search_path = public as $$
declare em text; st record; sub record;
begin
  if coalesce(new.recording, '') <> '' and coalesce(old.recording, '') = '' and new.student_id is not null then
    select s.name, s.parent, p.email into st from public.students s left join public.student_private p on p.student_id = s.id where s.id = new.student_id;
    select ar into sub from public.subjects where id = new.subject_id;
    if st.email is not null then
      perform public.queue_email(st.email, 'recording', '🎬 تسجيل حصة ' || coalesce(sub.ar, '') || ' متاح – NEXIUM',
        'مرحباً ' || coalesce(st.parent, '') || '،' || chr(10) || 'تسجيل حصة ' || coalesce(st.name, '') || ' في مادة ' || coalesce(sub.ar, '') ||
        ' (' || to_char(new.start_at at time zone 'Asia/Riyadh', 'YYYY-MM-DD') || ') بقى متاح.' || chr(10) ||
        'تقدر تشوفه من المنصة ← "تسجيلات حصصي".');
    end if;
  end if;
  return new;
end $$;
drop trigger if exists sessions_recording on public.sessions;
create trigger sessions_recording after update of recording on public.sessions for each row execute function public.trg_recording_added();

select 'تم التحديث ✓ – NEXIUM v3' as result;
