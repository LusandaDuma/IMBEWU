-- Supabase Migration: core RPC backend flows
-- Adds helper join code generation and atomic class creation.

create extension if not exists "pgcrypto";

create or replace function public.generate_join_code()
returns text
language plpgsql
security definer
set search_path = public
as $generate_join_code$
declare
  candidate text;
begin
  loop
    candidate := upper(substr(encode(gen_random_bytes(6), 'hex'), 1, 6));
    exit when not exists (select 1 from classes where join_code = candidate);
  end loop;

  return candidate;
end;
$generate_join_code$;

create or replace function public.create_class_atomic(
  p_coordinator_id uuid,
  p_course_id uuid,
  p_name text,
  p_join_code text default null
)
returns classes
language plpgsql
security definer
set search_path = public
as $create_class_atomic$
declare
  v_join_code text;
  v_class classes;
begin
  if auth.uid() is distinct from p_coordinator_id then
    raise exception 'Unauthorized';
  end if;

  v_join_code := coalesce(nullif(trim(p_join_code), ''), public.generate_join_code());

  insert into classes (course_id, created_by, name, join_code, is_active)
  values (p_course_id, p_coordinator_id, p_name, v_join_code, true)
  returning * into v_class;

  insert into class_members (class_id, user_id, role)
  values (v_class.id, p_coordinator_id, 'coordinator')
  on conflict (class_id, user_id) do nothing;

  insert into course_enrolments (user_id, course_id, enrolment_type)
  values (p_coordinator_id, p_course_id, 'class_based')
  on conflict (user_id, course_id) do nothing;

  return v_class;
end;
$create_class_atomic$;
