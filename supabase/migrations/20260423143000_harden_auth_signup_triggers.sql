-- Supabase Migration: harden auth signup trigger path
-- Goal: prevent "Database error saving new user" from blocking account creation.

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_role text;
  v_first_name text;
  v_last_name text;
begin
  v_role := coalesce(new.raw_user_meta_data->>'role', 'independent');
  if v_role not in ('admin', 'coordinator', 'student', 'independent') then
    v_role := 'independent';
  end if;

  v_first_name := coalesce(nullif(trim(coalesce(new.raw_user_meta_data->>'first_name', '')), ''), 'New');
  v_last_name := coalesce(nullif(trim(coalesce(new.raw_user_meta_data->>'last_name', '')), ''), 'User');

  insert into public.profiles (id, first_name, last_name, role, language, is_active, updated_at)
  values (new.id, v_first_name, v_last_name, v_role, 'en', true, now())
  on conflict (id) do update
  set
    first_name = excluded.first_name,
    last_name = excluded.last_name,
    role = excluded.role,
    language = coalesce(public.profiles.language, excluded.language),
    is_active = true,
    updated_at = now();

  return new;
exception
  when others then
    -- Never block auth user creation due to profile-side issues.
    raise warning 'handle_new_user failed for %: %', new.id, sqlerrm;
    return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

create or replace function public.seed_courses_on_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  perform public.seed_courses_if_empty(new.id);
  return new;
exception
  when others then
    -- Seeding must not block sign-up flow.
    raise warning 'seed_courses_on_new_user failed for %: %', new.id, sqlerrm;
    return new;
end;
$$;
