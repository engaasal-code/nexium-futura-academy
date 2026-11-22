-- =====================================================================
--  NEXIUM FUTURA ACADEMY – تحديث رقم 2
--  (تقييم المدرس بالنجوم من الإدارة + الرئيس التنفيذي له كل الصلاحيات)
--  الصقه في Supabase → SQL Editor → Run  (مرة واحدة – آمن لو اتشغّل تاني)
-- =====================================================================
alter table public.teachers add column if not exists admin_rating numeric check (admin_rating between 1 and 5);

create or replace function public.has_perm(p text) returns boolean language sql stable security definer set search_path = public as $$
  select case
    when public.my_role() = 'ceo' then true
    when public.my_role() is null or public.my_role() = 'student' then false
    when public.my_role() = 'teacher' and not coalesce((select active from public.teachers where id = public.my_ref()), false) then false
    else coalesce((select (value -> public.my_role() ->> p)::boolean from public.settings where key = 'perms'), false)
  end $$;

create or replace function public.trg_guard_teachers() returns trigger language plpgsql security definer set search_path = public as $$
begin
  if public.my_role() = 'teacher' then
    new.youtube := old.youtube; new.active := old.active; new.badge := old.badge; new.user_id := old.user_id;
  end if;
  if public.my_role() is not null and not public.has_perm('tch.rating') then new.admin_rating := old.admin_rating; end if;
  return new;
end $$;

-- new permission "tch.rating": on for the principal and the CEO, off for supervisor and teacher
update public.settings set value =
  jsonb_set(jsonb_set(jsonb_set(jsonb_set(value,
    '{principal,tch.rating}', coalesce(value -> 'principal' -> 'tch.rating', 'true'::jsonb)),
    '{ceo,tch.rating}', 'true'::jsonb),
    '{supervisor,tch.rating}', coalesce(value -> 'supervisor' -> 'tch.rating', 'false'::jsonb)),
    '{teacher,tch.rating}', coalesce(value -> 'teacher' -> 'tch.rating', 'false'::jsonb))
where key = 'perms';

select 'تم التحديث ✓' as result;
