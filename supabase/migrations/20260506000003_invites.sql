create table public.invites (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  token text not null unique,
  invited_by uuid references public.users(id),
  used_at timestamptz,
  created_at timestamptz not null default now()
);

alter table public.invites enable row level security;

create policy "Admins can manage invites"
  on public.invites for all
  using (exists (
    select 1 from public.users u
    where u.id = auth.uid() and u.role = 'admin'
  ));

create policy "Anyone can read invite by token"
  on public.invites for select
  using (true);
