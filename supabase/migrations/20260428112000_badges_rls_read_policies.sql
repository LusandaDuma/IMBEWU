-- Add read policies for badge tables.
-- Without these, authenticated learners cannot read earned badges when RLS is enabled.

drop policy if exists "badges_select_published_or_enrolled_or_admin" on public.badges;
drop policy if exists "student_badges_select_own_or_admin" on public.student_badges;

create policy "badges_select_published_or_enrolled_or_admin"
on public.badges
for select
to authenticated
using (
  exists (
    select 1
    from public.courses c
    where c.id = badges.course_id
      and c.is_published = true
  )
  or exists (
    select 1
    from public.course_enrolments ce
    where ce.user_id = auth.uid()
      and ce.course_id = badges.course_id
  )
  or exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.role = 'admin'
  )
);

create policy "student_badges_select_own_or_admin"
on public.student_badges
for select
to authenticated
using (
  user_id = auth.uid()
  or exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.role = 'admin'
  )
);
