create type user_role as enum ('member', 'coach', 'admin');
create type membership_status as enum ('pending', 'active', 'paused', 'cancelled');

create table public.users (
  id uuid primary key references auth.users(id) on delete cascade,
  name text not null,
  avatar_url text,
  location text,
  role user_role not null default 'member',
  membership_status membership_status not null default 'pending',
  created_at timestamptz not null default now()
);

alter table public.users enable row level security;

create policy "Users can read own row"
  on public.users for select
  using (auth.uid() = id);

create policy "Users can update own row"
  on public.users for update
  using (auth.uid() = id);

create policy "Members can read other users"
  on public.users for select
  using (exists (
    select 1 from public.users u
    where u.id = auth.uid()
    and u.membership_status = 'active'
  ));
