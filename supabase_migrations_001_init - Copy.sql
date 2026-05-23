-- Supabase Migration: Initial Database Schema
-- Run this entire block in Supabase SQL Editor

-- Enable extensions
create extension if not exists "pgcrypto";

-- PROFILES (1-to-1 with auth.users, created by trigger on signup)
create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  first_name text not null,
  last_name text not null,
  role text not null check (role in ('admin', 'coordinator', 'student', 'independent')),
  language text default 'en',
  is_active bool default true,
  last_login timestamptz,
  updated_at timestamptz default now()
);

-- Auto-create profile on signup trigger
create or replace function handle_new_user()
returns trigger as $$
begin
  insert into profiles (id, first_name, last_name, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'first_name', ''),
    coalesce(new.raw_user_meta_data->>'last_name', ''),
    coalesce(new.raw_user_meta_data->>'role', 'independent')
  );
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure handle_new_user();

-- SUBSCRIPTIONS
create table subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid unique not null references auth.users(id) on delete cascade,
  plan text not null check (plan in ('coordinator', 'enterprise')),
  student_slots int default 20,
  is_active bool default true,
  expires_at timestamptz,
  created_at timestamptz default now()
);

-- COURSES
create table courses (
  id uuid primary key default gen_random_uuid(),
  created_by uuid not null references auth.users(id),
  title text not null,
  description text,
  offline_url text,
  is_published bool default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- LESSONS
create table lessons (
  id uuid primary key default gen_random_uuid(),
  course_id uuid not null references courses(id) on delete cascade,
  order_index int not null,
  title text not null,
  description text,
  content text,
  duration_mins int,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- CLASSES
create table classes (
  id uuid primary key default gen_random_uuid(),
  course_id uuid not null references courses(id),
  created_by uuid not null references auth.users(id),
  name text not null,
  join_code text unique not null,
  is_active bool default true,
  created_at timestamptz default now()
);

-- CLASS MEMBERS
create table class_members (
  id uuid primary key default gen_random_uuid(),
  class_id uuid not null references classes(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null check (role in ('coordinator', 'student')),
  joined_at timestamptz default now(),
  unique(class_id, user_id)
);

-- COURSE ENROLMENTS
create table course_enrolments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  course_id uuid not null references courses(id) on delete cascade,
  enrolment_type text not null check (enrolment_type in ('independent', 'class_based')),
  enrolled_at timestamptz default now(),
  unique(user_id, course_id)
);

-- LESSON PROGRESS
create table lesson_progress (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  lesson_id uuid not null references lessons(id) on delete cascade,
  pct_complete int default 0 check (pct_complete between 0 and 100),
  is_completed bool default false,
  completed_at timestamptz,
  unique(user_id, lesson_id)
);

-- QUIZZES
create table quizzes (
  id uuid primary key default gen_random_uuid(),
  lesson_id uuid not null references lessons(id) on delete cascade,
  title text not null,
  pass_score int default 70 check (pass_score between 0 and 100),
  max_attempts int default 3,
  due_date date,
  created_at timestamptz default now()
);

-- QUESTIONS
create table questions (
  id uuid primary key default gen_random_uuid(),
  quiz_id uuid not null references quizzes(id) on delete cascade,
  text text not null,
  type text not null check (type in ('mcq', 'true_false', 'short_answer')),
  order_index int not null
);

-- QUESTION OPTIONS
create table question_options (
  id uuid primary key default gen_random_uuid(),
  question_id uuid not null references questions(id) on delete cascade,
  text text not null,
  is_correct bool not null,
  order_index int
);

-- QUIZ ATTEMPTS
create table quiz_attempts (
  id uuid primary key default gen_random_uuid(),
  quiz_id uuid not null references quizzes(id),
  user_id uuid not null references auth.users(id),
  score int,
  passed bool,
  attempt_number int not null,
  attempted_at timestamptz default now()
);

-- ATTEMPT ANSWERS
create table attempt_answers (
  id uuid primary key default gen_random_uuid(),
  attempt_id uuid not null references quiz_attempts(id) on delete cascade,
  question_id uuid not null references questions(id),
  option_id uuid references question_options(id),
  text_answer text,
  is_correct bool
);

-- BADGES
create table badges (
  id uuid primary key default gen_random_uuid(),
  course_id uuid not null references courses(id) on delete cascade,
  name text not null,
  icon_url text,
  criteria text
);

-- STUDENT BADGES
create table student_badges (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  badge_id uuid not null references badges(id) on delete cascade,
  awarded_at timestamptz default now(),
  unique(user_id, badge_id)
);

-- RLS POLICIES
alter table profiles enable row level security;
alter table subscriptions enable row level security;
alter table courses enable row level security;
alter table lessons enable row level security;
alter table classes enable row level security;
alter table class_members enable row level security;
alter table course_enrolments enable row level security;
alter table lesson_progress enable row level security;
alter table quizzes enable row level security;
alter table questions enable row level security;
alter table question_options enable row level security;
alter table quiz_attempts enable row level security;
alter table attempt_answers enable row level security;
alter table badges enable row level security;
alter table student_badges enable row level security;

-- Profiles: users can read own profile, admin reads all
create policy "users read own profile" on profiles for select using (auth.uid() = id);
create policy "admin reads all profiles" on profiles for select using (
  coalesce(auth.jwt() -> 'user_metadata' ->> 'role', '') = 'admin'
);
create policy "users update own profile" on profiles for update using (auth.uid() = id);

-- Courses: published visible to all authenticated, admin sees all
create policy "published courses visible to all" on courses for select using (
  is_published = true and auth.uid() is not null
);
create policy "admin manages courses" on courses for all using (
  coalesce(auth.jwt() -> 'user_metadata' ->> 'role', '') = 'admin'
);

-- Lesson progress: users only see own progress
create policy "own progress only" on lesson_progress for all using (auth.uid() = user_id);

-- Coordinators see progress of students in their classes
create policy "coordinator sees class progress" on lesson_progress for select using (
  exists (
    select 1 from class_members cm
    join classes c on c.id = cm.class_id
    join course_enrolments ce on ce.user_id = lesson_progress.user_id and ce.course_id = c.course_id
    where cm.user_id = auth.uid() and cm.role = 'coordinator'
  )
);

-- Quiz attempts: users see own, coordinators see their class students
create policy "own attempts" on quiz_attempts for all using (auth.uid() = user_id);
