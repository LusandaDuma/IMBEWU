-- Supabase Migration: secure quiz scoring RPC

create or replace function public.submit_quiz_attempt(
  p_user_id uuid,
  p_quiz_id uuid,
  p_answers jsonb default '[]'::jsonb
)
returns table (
  attempt_id uuid,
  score int,
  passed boolean,
  attempt_number int
)
language plpgsql
security definer
set search_path = public
as $submit_quiz_attempt$
declare
  v_pass_score int;
  v_max_attempts int;
  v_previous_attempts int;
  v_attempt_id uuid;
  v_attempt_number int;
  v_auto_total int := 0;
  v_auto_correct int := 0;
  v_score int := 0;
  v_passed bool := false;
  q record;
  a jsonb;
  v_option_id uuid;
  v_is_correct bool;
begin
  if auth.uid() is distinct from p_user_id then
    raise exception 'Unauthorized';
  end if;

  select pass_score, coalesce(max_attempts, 3)
  into v_pass_score, v_max_attempts
  from quizzes
  where id = p_quiz_id;

  if v_pass_score is null then
    raise exception 'Quiz not found';
  end if;

  select count(*)
  into v_previous_attempts
  from quiz_attempts
  where quiz_id = p_quiz_id
    and user_id = p_user_id;

  if v_previous_attempts >= v_max_attempts then
    raise exception 'Maximum attempts reached';
  end if;

  v_attempt_number := v_previous_attempts + 1;

  insert into quiz_attempts (quiz_id, user_id, score, passed, attempt_number)
  values (p_quiz_id, p_user_id, 0, false, v_attempt_number)
  returning id into v_attempt_id;

  for q in
    select id, type
    from questions
    where quiz_id = p_quiz_id
    order by order_index asc
  loop
    select elem
    into a
    from jsonb_array_elements(p_answers) as elem
    where (elem ->> 'question_id')::uuid = q.id
    limit 1;

    v_option_id := case
      when a ? 'option_id' and nullif(a ->> 'option_id', '') is not null then (a ->> 'option_id')::uuid
      else null
    end;

    if q.type in ('mcq', 'true_false') then
      v_auto_total := v_auto_total + 1;
      v_is_correct := exists (
        select 1
        from question_options qo
        where qo.id = v_option_id
          and qo.question_id = q.id
          and qo.is_correct = true
      );

      if v_is_correct then
        v_auto_correct := v_auto_correct + 1;
      end if;
    else
      v_is_correct := null;
    end if;

    insert into attempt_answers (attempt_id, question_id, option_id, text_answer, is_correct)
    values (
      v_attempt_id,
      q.id,
      v_option_id,
      case when a ? 'text_answer' then nullif(a ->> 'text_answer', '') else null end,
      v_is_correct
    );
  end loop;

  if v_auto_total > 0 then
    v_score := round((v_auto_correct::numeric * 100.0) / v_auto_total)::int;
  else
    v_score := 0;
  end if;

  v_passed := v_score >= v_pass_score;

  update quiz_attempts
  set score = v_score, passed = v_passed
  where id = v_attempt_id;

  return query select v_attempt_id, v_score, v_passed, v_attempt_number;
end;
$submit_quiz_attempt$;
