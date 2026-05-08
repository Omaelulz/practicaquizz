-- =====================================================
-- QUIZ DAW - Schema
-- =====================================================
-- Run this in the Supabase SQL editor.
-- It creates all the tables, policies, and views needed.
-- =====================================================

-- Profiles (linked to Supabase auth.users)
create table if not exists public.profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  username    text unique not null check (char_length(username) between 3 and 24),
  avatar_url  text,
  created_at  timestamptz default now()
);

-- Subjects (Programación, Marcas, BD)
create table if not exists public.subjects (
  id          serial primary key,
  slug        text unique not null,
  name        text not null,
  description text,
  color       text default '#7c5cff',
  icon        text
);

-- Bosses (Laura, Luján)
create table if not exists public.bosses (
  id          serial primary key,
  slug        text unique not null,
  name        text not null,
  title       text,
  description text,
  image_url   text,
  max_hp      int default 1000,
  theme_color text default '#7c5cff',
  taunts      jsonb default '[]'::jsonb
);

-- Subject -> Boss mapping
alter table public.subjects
  add column if not exists boss_id int references public.bosses(id);

-- Questions
-- type: 'multiple_choice' | 'fill_code' | 'code_output' | 'true_false' | 'er_diagram'
-- difficulty: 1 (easy) - 3 (hard)
create table if not exists public.questions (
  id           serial primary key,
  subject_id   int not null references public.subjects(id) on delete cascade,
  type         text not null check (type in ('multiple_choice','fill_code','code_output','true_false','er_diagram')),
  difficulty   int  not null default 1 check (difficulty between 1 and 3),
  statement    text not null,
  code_snippet text,
  image_url    text,                    -- used for er_diagram
  options      jsonb,                   -- ["a","b","c","d"] for multiple_choice
  answer       jsonb not null,          -- index, string, or array depending on type
  explanation  text,
  tags         text[] default '{}',
  created_at   timestamptz default now()
);

create index if not exists idx_questions_subject on public.questions(subject_id);
create index if not exists idx_questions_difficulty on public.questions(subject_id, difficulty);

-- Attempts (every quiz/sprint/exam played)
-- mode: 'study' | 'exam' | 'sprint' | 'daily'
create table if not exists public.attempts (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references public.profiles(id) on delete cascade,
  subject_id    int  not null references public.subjects(id),
  mode          text not null check (mode in ('study','exam','sprint','daily')),
  total         int  not null default 0,
  correct       int  not null default 0,
  wrong         int  not null default 0,
  skipped       int  not null default 0,
  score         int  not null default 0,
  duration_sec  int  not null default 0,
  finished_at   timestamptz default now()
);

create index if not exists idx_attempts_user on public.attempts(user_id);
create index if not exists idx_attempts_subject on public.attempts(subject_id, score desc);

-- Boss fights
create table if not exists public.boss_fights (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references public.profiles(id) on delete cascade,
  boss_id       int  not null references public.bosses(id),
  subject_id    int  not null references public.subjects(id),
  won           boolean not null default false,
  hp_left       int not null default 0,
  time_left_sec int not null default 0,
  score         int not null default 0,
  finished_at   timestamptz default now()
);

create index if not exists idx_bossfights_user on public.boss_fights(user_id);
create index if not exists idx_bossfights_boss on public.boss_fights(boss_id, score desc);

-- =====================================================
-- VIEWS for leaderboards
-- =====================================================

create or replace view public.leaderboard_global as
select
  p.id              as user_id,
  p.username,
  p.avatar_url,
  coalesce(sum(a.score), 0)::int as total_score,
  count(a.id)                    as attempts_count,
  max(a.finished_at)             as last_played
from public.profiles p
left join public.attempts a
  on a.user_id = p.id and a.mode = 'exam'
group by p.id, p.username, p.avatar_url
order by total_score desc;

create or replace view public.leaderboard_by_subject as
select
  a.subject_id,
  s.slug         as subject_slug,
  s.name         as subject_name,
  p.id           as user_id,
  p.username,
  p.avatar_url,
  max(a.score)::int as best_score,
  count(a.id)    as attempts_count,
  max(a.finished_at) as last_played
from public.attempts a
join public.profiles p on p.id = a.user_id
join public.subjects s on s.id = a.subject_id
where a.mode = 'exam'
group by a.subject_id, s.slug, s.name, p.id, p.username, p.avatar_url
order by a.subject_id, best_score desc;

create or replace view public.boss_hall_of_fame as
select
  b.id   as boss_id,
  b.slug as boss_slug,
  b.name as boss_name,
  p.id   as user_id,
  p.username,
  p.avatar_url,
  bf.score,
  bf.hp_left,
  bf.time_left_sec,
  bf.finished_at
from public.boss_fights bf
join public.bosses b   on b.id = bf.boss_id
join public.profiles p on p.id = bf.user_id
where bf.won = true
order by b.id, bf.score desc, bf.time_left_sec desc;

-- =====================================================
-- ROW LEVEL SECURITY
-- =====================================================

alter table public.profiles     enable row level security;
alter table public.subjects     enable row level security;
alter table public.bosses       enable row level security;
alter table public.questions    enable row level security;
alter table public.attempts     enable row level security;
alter table public.boss_fights  enable row level security;

-- Profiles: anyone can read, only owner can update
drop policy if exists profiles_select on public.profiles;
create policy profiles_select on public.profiles
  for select using (true);

drop policy if exists profiles_insert on public.profiles;
create policy profiles_insert on public.profiles
  for insert with check (auth.uid() = id);

drop policy if exists profiles_update on public.profiles;
create policy profiles_update on public.profiles
  for update using (auth.uid() = id);

-- Subjects & bosses: read-only for everyone
drop policy if exists subjects_select on public.subjects;
create policy subjects_select on public.subjects for select using (true);

drop policy if exists bosses_select on public.bosses;
create policy bosses_select on public.bosses for select using (true);

-- Questions: read-only for everyone (the API hides 'answer' field)
drop policy if exists questions_select on public.questions;
create policy questions_select on public.questions for select using (true);

-- Attempts: users can read their own + leaderboard via view (which is public)
drop policy if exists attempts_select on public.attempts;
create policy attempts_select on public.attempts
  for select using (auth.uid() = user_id);

drop policy if exists attempts_insert on public.attempts;
create policy attempts_insert on public.attempts
  for insert with check (auth.uid() = user_id);

-- Boss fights: same as attempts
drop policy if exists boss_fights_select on public.boss_fights;
create policy boss_fights_select on public.boss_fights
  for select using (auth.uid() = user_id);

drop policy if exists boss_fights_insert on public.boss_fights;
create policy boss_fights_insert on public.boss_fights
  for insert with check (auth.uid() = user_id);

-- =====================================================
-- Auto-create profile after signup
-- =====================================================
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, username)
  values (new.id, coalesce(new.raw_user_meta_data->>'username', split_part(new.email, '@', 1)));
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
