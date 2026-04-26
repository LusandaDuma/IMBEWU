-- Optional lesson video: YouTube (or youtu.be) link for learners. Safe if column already exists.
alter table public.lessons add column if not exists video_url text;

comment on column public.lessons.video_url is 'Optional YouTube / youtu.be URL; opened in the learner app browser.';
