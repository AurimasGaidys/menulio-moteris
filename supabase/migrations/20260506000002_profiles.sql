create table public.profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  topics text[] not null default '{}',
  availability jsonb not null default '{}',
  level int check (level between 1 and 5),
  comfort_level int check (comfort_level between 1 and 5),
  bio text,
  unique(user_id)
);

alter table public.profiles enable row level security;

create policy "Users can manage own profile"
  on public.profiles for all
  using (auth.uid() = user_id);

create policy "Active members can read profiles"
  on public.profiles for select
  using (exists (
    select 1 from public.users u
    where u.id = auth.uid()
    and u.membership_status = 'active'
  ));
