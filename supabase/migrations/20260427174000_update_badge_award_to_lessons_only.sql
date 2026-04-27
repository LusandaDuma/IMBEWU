-- Award completion badges when all course lessons are completed.
-- Keeps auth guard and idempotent insert behavior.

create or replace function public.check_and_award_badges(
  p_user_id uuid,
  p_course_id uuid
)
returns table (
  awarded_count int
)
language plpgsql
security definer
set search_path = public
as $check_and_award_badges$
declare
  v_total_lessons int := 0;
  v_completed_lessons int := 0;
  v_awarded int := 0;
begin
  if auth.uid() is distinct from p_user_id then
    raise exception 'Unauthorized';
  end if;

  select count(*)
  into v_total_lessons
  from lessons l
  where l.course_id = p_course_id;

  select count(*)
  into v_completed_lessons
  from lessons l
  join lesson_progress lp on lp.lesson_id = l.id and lp.user_id = p_user_id
  where l.course_id = p_course_id
    and lp.is_completed = true;

  if v_total_lessons > 0
     and v_completed_lessons = v_total_lessons then
    insert into student_badges (user_id, badge_id)
    select p_user_id, b.id
    from badges b
    where b.course_id = p_course_id
    on conflict (user_id, badge_id) do nothing;

    get diagnostics v_awarded = row_count;
  end if;

  return query select v_awarded;
end;
$check_and_award_badges$;
