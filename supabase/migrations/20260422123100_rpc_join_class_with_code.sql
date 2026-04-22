-- Supabase Migration: join class by code with slot checks

create or replace function public.join_class_with_code(
  p_student_id uuid,
  p_join_code text
)
returns table (
  class_id uuid,
  course_id uuid,
  enrolled boolean,
  message text
)
language plpgsql
security definer
set search_path = public
as $join_class_with_code$
declare
  v_class classes;
  v_slot_limit int := 20;
  v_current_students int := 0;
begin
  if auth.uid() is distinct from p_student_id then
    raise exception 'Unauthorized';
  end if;

  select *
  into v_class
  from classes
  where upper(join_code) = upper(trim(p_join_code))
    and is_active = true
  limit 1;

  if v_class.id is null then
    return query select null::uuid, null::uuid, false, 'Class not found.';
    return;
  end if;

  select coalesce(s.student_slots, 20)
  into v_slot_limit
  from subscriptions s
  where s.user_id = v_class.created_by
    and s.is_active = true
  order by s.created_at desc
  limit 1;

  select count(*)
  into v_current_students
  from class_members cm
  join classes c on c.id = cm.class_id
  where c.created_by = v_class.created_by
    and cm.role = 'student';

  if v_current_students >= v_slot_limit then
    return query select v_class.id, v_class.course_id, false, 'Class is full for this coordinator plan.';
    return;
  end if;

  insert into class_members (class_id, user_id, role)
  values (v_class.id, p_student_id, 'student')
  on conflict (class_id, user_id) do nothing;

  insert into course_enrolments (user_id, course_id, enrolment_type)
  values (p_student_id, v_class.course_id, 'class_based')
  on conflict (user_id, course_id) do nothing;

  return query select v_class.id, v_class.course_id, true, 'Joined class successfully.';
end;
$join_class_with_code$;
