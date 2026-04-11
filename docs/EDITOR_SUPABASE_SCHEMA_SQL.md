# Editor Supabase Schema SQL

아래 SQL은 현재 Memolie 에디터 데이터 모델 규칙을 기준으로 정리한 초안이다.

## Schema SQL

```sql
create extension if not exists pgcrypto;

do $$ begin
  create type public.entry_status as enum ('draft', 'saved', 'published');
exception
  when duplicate_object then null;
end $$;

do $$ begin
  create type public.entry_view_mode as enum ('single', 'spread');
exception
  when duplicate_object then null;
end $$;

do $$ begin
  create type public.editor_item_type as enum ('text', 'sticker', 'image', 'gif');
exception
  when duplicate_object then null;
end $$;

do $$ begin
  create type public.editor_page_side as enum ('single', 'left', 'right');
exception
  when duplicate_object then null;
end $$;

create table if not exists public.diary_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  entry_date date not null,
  title text,
  body_html text,
  mood text,
  tags text[] not null default '{}',
  view_mode public.entry_view_mode not null default 'spread',
  status public.entry_status not null default 'draft',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint diary_entries_user_date_unique unique (user_id, entry_date)
);

create table if not exists public.editor_items (
  id uuid primary key default gen_random_uuid(),
  entry_id uuid not null references public.diary_entries(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  type public.editor_item_type not null,
  page_side public.editor_page_side not null default 'single',
  x numeric(10,2) not null default 0,
  y numeric(10,2) not null default 0,
  width numeric(10,2) not null default 120,
  height numeric(10,2) not null default 120,
  rotation numeric(8,2) not null default 0,
  z_index integer not null default 1,
  opacity numeric(4,2) not null default 1.0,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.schedules (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  schedule_date date not null,
  title text not null,
  note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists diary_entries_user_id_idx
  on public.diary_entries (user_id);

create index if not exists diary_entries_entry_date_idx
  on public.diary_entries (entry_date);

create index if not exists editor_items_entry_id_idx
  on public.editor_items (entry_id);

create index if not exists editor_items_user_id_idx
  on public.editor_items (user_id);

create index if not exists editor_items_type_idx
  on public.editor_items (type);

create index if not exists schedules_user_id_idx
  on public.schedules (user_id);

create index if not exists schedules_schedule_date_idx
  on public.schedules (schedule_date);
```

## RLS SQL

```sql
alter table public.diary_entries enable row level security;
alter table public.editor_items enable row level security;
alter table public.schedules enable row level security;

create policy "diary_entries_select_own"
on public.diary_entries
for select
to authenticated
using (user_id = auth.uid());

create policy "diary_entries_insert_own"
on public.diary_entries
for insert
to authenticated
with check (user_id = auth.uid());

create policy "diary_entries_update_own"
on public.diary_entries
for update
to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());

create policy "diary_entries_delete_own"
on public.diary_entries
for delete
to authenticated
using (user_id = auth.uid());

create policy "editor_items_select_own"
on public.editor_items
for select
to authenticated
using (
  user_id = auth.uid()
  and exists (
    select 1
    from public.diary_entries e
    where e.id = entry_id
      and e.user_id = auth.uid()
  )
);

create policy "editor_items_insert_own"
on public.editor_items
for insert
to authenticated
with check (
  user_id = auth.uid()
  and exists (
    select 1
    from public.diary_entries e
    where e.id = entry_id
      and e.user_id = auth.uid()
  )
);

create policy "editor_items_update_own"
on public.editor_items
for update
to authenticated
using (
  user_id = auth.uid()
  and exists (
    select 1
    from public.diary_entries e
    where e.id = entry_id
      and e.user_id = auth.uid()
  )
)
with check (
  user_id = auth.uid()
  and exists (
    select 1
    from public.diary_entries e
    where e.id = entry_id
      and e.user_id = auth.uid()
  )
);

create policy "editor_items_delete_own"
on public.editor_items
for delete
to authenticated
using (
  user_id = auth.uid()
  and exists (
    select 1
    from public.diary_entries e
    where e.id = entry_id
      and e.user_id = auth.uid()
  )
);

create policy "schedules_select_own"
on public.schedules
for select
to authenticated
using (user_id = auth.uid());

create policy "schedules_insert_own"
on public.schedules
for insert
to authenticated
with check (user_id = auth.uid());

create policy "schedules_update_own"
on public.schedules
for update
to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());

create policy "schedules_delete_own"
on public.schedules
for delete
to authenticated
using (user_id = auth.uid());
```

## Storage SQL

```sql
insert into storage.buckets (id, name, public)
values ('diary-media', 'diary-media', false)
on conflict (id) do nothing;

create policy "Users can upload own diary media"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'diary-media'
  and (storage.foldername(name))[1] = (select auth.uid()::text)
);

create policy "Users can view own diary media"
on storage.objects
for select
to authenticated
using (
  bucket_id = 'diary-media'
  and (storage.foldername(name))[1] = (select auth.uid()::text)
);

create policy "Users can update own diary media"
on storage.objects
for update
to authenticated
using (
  bucket_id = 'diary-media'
  and (storage.foldername(name))[1] = (select auth.uid()::text)
)
with check (
  bucket_id = 'diary-media'
  and (storage.foldername(name))[1] = (select auth.uid()::text)
);

create policy "Users can delete own diary media"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'diary-media'
  and (storage.foldername(name))[1] = (select auth.uid()::text)
);
```

## Implementation Notes

- `user_id + entry_date` unique 제약이 하루 1개 일기 규칙을 보장한다.
- `editor_items.payload`는 타입별 상세 데이터를 유연하게 저장하기 위해 `jsonb`로 둔다.
- AI 스티커는 `type = 'sticker'`로 저장하고 `payload.source = 'ai'`로 구분한다.
- GIF는 `type = 'gif'`로 저장하고 `payload.imageUrl`에 storage URL을 넣는다.
- `schedules`는 메인 달력 전용 날짜 일정 데이터지만 로그인 사용자 데이터이므로 별도 테이블로 분리한다.
- MVP에서는 저장 시 `editor_items`를 전체 삭제 후 재삽입하는 전략을 사용한다.
