-- Fix recursive RLS policy on profiles and dependent admin checks
-- Run this in Supabase SQL editor for existing databases.

drop policy if exists "admin reads all profiles" on profiles;
create policy "admin reads all profiles"
on profiles for select
using (
  coalesce(auth.jwt() -> 'user_metadata' ->> 'role', '') = 'admin'
);

drop policy if exists "admin manages courses" on courses;
create policy "admin manages courses"
on courses for all
using (
  coalesce(auth.jwt() -> 'user_metadata' ->> 'role', '') = 'admin'
);
