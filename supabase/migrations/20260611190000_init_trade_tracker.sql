create extension if not exists pgcrypto;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

create table public.trade_tables (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null check (char_length(trim(name)) >= 1),
  description text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table public.trade_entries (
  id uuid primary key default gen_random_uuid(),
  trade_table_id uuid not null references public.trade_tables(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  type text not null check (type in ('BUY', 'SELL')),
  item_name text not null check (char_length(trim(item_name)) >= 1),
  amount integer not null check (amount > 0),
  unit_price numeric(18,2) not null check (unit_price >= 0),
  episode integer not null check (episode >= 0),
  note text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create index trade_tables_user_id_idx on public.trade_tables (user_id, updated_at desc);
create index trade_entries_trade_table_id_idx on public.trade_entries (trade_table_id, created_at desc);
create index trade_entries_user_id_idx on public.trade_entries (user_id);
create index trade_entries_item_name_idx on public.trade_entries (trade_table_id, lower(item_name));
create index trade_entries_episode_idx on public.trade_entries (trade_table_id, episode);

create trigger set_trade_tables_updated_at
before update on public.trade_tables
for each row execute procedure public.set_updated_at();

create trigger set_trade_entries_updated_at
before update on public.trade_entries
for each row execute procedure public.set_updated_at();

grant select, insert, update, delete on public.trade_tables to authenticated;
grant select, insert, update, delete on public.trade_entries to authenticated;

alter table public.trade_tables enable row level security;
alter table public.trade_entries enable row level security;

create policy "Users can view their own trade tables"
on public.trade_tables
for select
to authenticated
using ((select auth.uid()) = user_id);

create policy "Users can create their own trade tables"
on public.trade_tables
for insert
to authenticated
with check ((select auth.uid()) = user_id);

create policy "Users can update their own trade tables"
on public.trade_tables
for update
to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

create policy "Users can delete their own trade tables"
on public.trade_tables
for delete
to authenticated
using ((select auth.uid()) = user_id);

create policy "Users can view their own trade entries"
on public.trade_entries
for select
to authenticated
using ((select auth.uid()) = user_id);

create policy "Users can create their own trade entries"
on public.trade_entries
for insert
to authenticated
with check (
  (select auth.uid()) = user_id
  and exists (
    select 1
    from public.trade_tables
    where trade_tables.id = trade_entries.trade_table_id
      and trade_tables.user_id = (select auth.uid())
  )
);

create policy "Users can update their own trade entries"
on public.trade_entries
for update
to authenticated
using ((select auth.uid()) = user_id)
with check (
  (select auth.uid()) = user_id
  and exists (
    select 1
    from public.trade_tables
    where trade_tables.id = trade_entries.trade_table_id
      and trade_tables.user_id = (select auth.uid())
  )
);

create policy "Users can delete their own trade entries"
on public.trade_entries
for delete
to authenticated
using ((select auth.uid()) = user_id);
