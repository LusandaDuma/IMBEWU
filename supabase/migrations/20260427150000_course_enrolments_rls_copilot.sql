-- RLS for course_enrolments: the initial migration enabled RLS but had no policies.
-- Security definer RPCs (e.g. join_class_with_code) continue to bypass RLS.
-- This migration adds user-scoped and admin read policies for direct client/Edge (JWT) access.

-- Idempotent: drop if re-run in dev
drop policy if exists "course_enrolments_select_own_or_admin" on public.course_enrolments;
drop policy if exists "course_enrolments_insert_self_serve_independent" on public.course_enrolments;
drop policy if exists "course_enrolments_update_own" on public.course_enrolments;

-- Own rows + admins (dashboards / analytics)
create policy "course_enrolments_select_own_or_admin"
on public.course_enrolments
for select
to authenticated
using (
  user_id = auth.uid()
  or exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin')
);

-- Self-serve independent enrolment: published course, active learner, catalogue flow (matches app discover)
create policy "course_enrolments_insert_self_serve_independent"
on public.course_enrolments
for insert
to authenticated
with check (
  user_id = auth.uid()
  and enrolment_type = 'independent'
  and exists (
    select 1
    from public.courses c
    where c.id = course_id
      and c.is_published = true
  )
  and exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.is_active = true
      and p.role in ('student', 'independent')
  )
);

-- Upsert updates for own row (e.g. refresh enrolled_at) — no privilege escalation
create policy "course_enrolments_update_own"
on public.course_enrolments
for update
to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());
