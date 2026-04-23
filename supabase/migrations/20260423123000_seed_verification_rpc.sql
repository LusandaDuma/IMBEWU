-- Supabase Migration: helper RPC to verify seeded data counts

create or replace function public.get_seed_data_counts()
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_result jsonb;
begin
  v_result := jsonb_build_object(
    'profiles', (select count(*) from public.profiles),
    'courses', (select count(*) from public.courses),
    'lessons', (select count(*) from public.lessons),
    'quizzes', (select count(*) from public.quizzes),
    'questions', (select count(*) from public.questions),
    'question_options', (select count(*) from public.question_options),
    'badges', (select count(*) from public.badges),
    'class_members', (select count(*) from public.class_members),
    'course_enrolments', (select count(*) from public.course_enrolments)
  );

  return v_result;
end;
$$;

grant execute on function public.get_seed_data_counts() to anon, authenticated;
