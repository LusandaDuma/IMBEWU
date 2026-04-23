-- Supabase Migration: guarantee course seed once a user exists
-- Handles the case where initial seed migration ran before auth.users had rows.

create or replace function public.seed_courses_if_empty(p_author_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if p_author_id is null then
    return;
  end if;

  if exists (select 1 from public.courses) then
    return;
  end if;

  insert into public.courses (id, created_by, title, description, offline_url, is_published)
  values
    (
      '11111111-1111-4111-8111-111111111111',
      p_author_id,
      'Sustainable Soil Management',
      'Build practical soil health skills: structure, organic matter, nutrient cycles, and low-cost field diagnostics.',
      null,
      true
    ),
    (
      '22222222-2222-4222-8222-222222222222',
      p_author_id,
      'Water-Smart Irrigation Basics',
      'Learn efficient irrigation planning, scheduling, and moisture monitoring for smallholder and mixed farms.',
      null,
      true
    ),
    (
      '33333333-3333-4333-8333-333333333333',
      p_author_id,
      'Integrated Pest Management Foundations',
      'Apply prevention-first pest control using scouting, thresholds, biological controls, and safe intervention.',
      null,
      true
    ),
    (
      '44444444-4444-4444-8444-444444444444',
      p_author_id,
      'Farm Business and Market Readiness',
      'Strengthen farm decision-making with cost tracking, market timing, and post-harvest value protection.',
      null,
      true
    )
  on conflict (id) do update
  set
    created_by = excluded.created_by,
    title = excluded.title,
    description = excluded.description,
    offline_url = excluded.offline_url,
    is_published = excluded.is_published,
    updated_at = now();
end;
$$;

create or replace function public.seed_courses_on_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  perform public.seed_courses_if_empty(new.id);
  return new;
end;
$$;

drop trigger if exists trg_seed_courses_on_auth_user_created on auth.users;
create trigger trg_seed_courses_on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.seed_courses_on_new_user();

do $$
declare
  v_author_id uuid;
begin
  select id into v_author_id from auth.users order by created_at asc limit 1;
  perform public.seed_courses_if_empty(v_author_id);
end $$;
