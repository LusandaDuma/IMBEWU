-- Supabase Migration: allow anonymous reads of published courses
-- Enables first screen catalogue for signed-out users.

drop policy if exists "published courses visible to all" on public.courses;

create policy "published courses visible to all"
on public.courses
for select
using (is_published = true);
