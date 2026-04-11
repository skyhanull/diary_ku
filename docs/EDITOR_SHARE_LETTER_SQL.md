# Editor Share Letter SQL

```sql
create extension if not exists pgcrypto;

create table if not exists public.shared_letters (
  id uuid primary key default gen_random_uuid(),
  entry_id uuid not null references public.diary_entries(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  share_token text not null unique,
  title text,
  recipient_name text,
  cover_message text,
  snapshot_json jsonb not null,
  theme text not null default 'paper' check (theme in ('paper', 'cream', 'midnight')),
  is_public boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists shared_letters_entry_id_idx
  on public.shared_letters (entry_id);

create index if not exists shared_letters_user_id_idx
  on public.shared_letters (user_id);

create index if not exists shared_letters_share_token_idx
  on public.shared_letters (share_token);

alter table public.shared_letters enable row level security;

create policy "shared_letters_select_public"
on public.shared_letters
for select
using (is_public = true);

create policy "shared_letters_select_own"
on public.shared_letters
for select
using (auth.uid() = user_id);

create policy "shared_letters_insert_own"
on public.shared_letters
for insert
with check (auth.uid() = user_id);

create policy "shared_letters_update_own"
on public.shared_letters
for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "shared_letters_delete_own"
on public.shared_letters
for delete
using (auth.uid() = user_id);
```
