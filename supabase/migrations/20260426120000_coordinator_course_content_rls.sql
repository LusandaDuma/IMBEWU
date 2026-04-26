-- Coordinator: read unpublished courses for courses they have a class for, update course metadata, manage lessons.
-- Lessons: readable when parent course is published, or for admins, or for coordinators with a class on that course.

-- Courses: coordinators see and update rows when they own a class for that course
create policy "courses select for coordinator with class"
on public.courses
for select
using (
  exists (
    select 1
    from public.classes cl
    where cl.course_id = courses.id
    and cl.created_by = auth.uid()
  )
);

create policy "courses update for coordinator with class"
on public.courses
for update
using (
  exists (
    select 1
    from public.classes cl
    where cl.course_id = courses.id
    and cl.created_by = auth.uid()
  )
)
with check (
  exists (
    select 1
    from public.classes cl
    where cl.course_id = courses.id
    and cl.created_by = auth.uid()
  )
);

-- Lessons: any reader can see content for published courses (learners, catalogue)
create policy "lessons select for published or admin or coordinator with class"
on public.lessons
for select
using (
  exists (select 1 from public.courses c where c.id = lessons.course_id and c.is_published = true)
  or exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin')
  or exists (
    select 1
    from public.classes cl
    where cl.course_id = lessons.course_id
    and cl.created_by = auth.uid()
  )
);

-- Admins: full control (matches existing app checks via profiles)
create policy "lessons all for admin"
on public.lessons
for all
using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin'))
with check (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin'));

-- Coordinators: insert/update/delete only for courses they have a class for
create policy "lessons insert for coordinator with class"
on public.lessons
for insert
with check (
  exists (
    select 1
    from public.classes cl
    where cl.course_id = course_id
    and cl.created_by = auth.uid()
  )
);

create policy "lessons update for coordinator with class"
on public.lessons
for update
using (
  exists (
    select 1
    from public.classes cl
    where cl.course_id = lessons.course_id
    and cl.created_by = auth.uid()
  )
)
with check (
  exists (
    select 1
    from public.classes cl
    where cl.course_id = course_id
    and cl.created_by = auth.uid()
  )
);

create policy "lessons delete for coordinator with class"
on public.lessons
for delete
using (
  exists (
    select 1
    from public.classes cl
    where cl.course_id = lessons.course_id
    and cl.created_by = auth.uid()
  )
);
