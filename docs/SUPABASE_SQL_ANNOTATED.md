# Supabase SQL 주석 가이드 (DearMe)

처음 실행한 SQL을 이해하기 쉽게 주석과 함께 정리한 문서.

## 1) Schema SQL (테이블/타입 생성)

```sql
-- UUID 랜덤 생성 함수(gen_random_uuid)를 쓰기 위한 확장
create extension if not exists pgcrypto;

-- enum 타입: 페이지 공개 상태(private/public)
do $$ begin
  create type page_visibility as enum ('private', 'public');
exception
  -- 이미 타입이 있으면 에러 무시(재실행 안전)
  when duplicate_object then null;
end $$;

-- enum 타입: 에디터 아이템 종류(text/sticker/image)
do $$ begin
  create type item_type as enum ('text', 'sticker', 'image');
exception
  when duplicate_object then null;
end $$;

-- 유저 프로필 테이블
create table if not exists public.profiles (
  -- auth.users.id와 동일한 값(1:1)
  id uuid primary key references auth.users(id) on delete cascade,
  username text unique,
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 하루 단위 다이어리 페이지
create table if not exists public.diary_pages (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  page_date date not null,
  title text,
  mood text,
  theme text,
  background_color text default '#ffffff',
  background_pattern text,
  visibility page_visibility not null default 'private',
  share_token text unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  -- 같은 유저가 같은 날짜에 페이지 1개만 만들게 강제
  constraint uq_user_date unique (user_id, page_date)
);

-- 기본 스티커 카탈로그
create table if not exists public.stickers (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  category text not null,
  image_url text not null,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

-- 에디터 요소(텍스트/스티커/이미지)
create table if not exists public.page_items (
  id uuid primary key default gen_random_uuid(),
  page_id uuid not null references public.diary_pages(id) on delete cascade,
  type item_type not null,
  z_index int not null default 0,
  x numeric(10,2) not null default 0,
  y numeric(10,2) not null default 0,
  width numeric(10,2),
  height numeric(10,2),
  rotation numeric(8,2) not null default 0,
  opacity numeric(4,2) not null default 1.0,

  -- 텍스트 타입일 때 사용
  text_content text,
  font_family text,
  font_size int,
  text_color text,

  -- 스티커 타입일 때 사용
  sticker_id uuid references public.stickers(id),

  -- 이미지 타입일 때 사용
  image_url text,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
```

## 2) RLS SQL (데이터 권한)

```sql
-- 각 테이블에 RLS(행 단위 권한) 활성화
alter table public.profiles enable row level security;
alter table public.diary_pages enable row level security;
alter table public.stickers enable row level security;
alter table public.page_items enable row level security;

-- profiles: 본인 프로필만 조회
create policy "profiles_select_own"
on public.profiles
for select
to authenticated
using (id = auth.uid());

-- profiles: 본인 id로만 생성
create policy "profiles_insert_own"
on public.profiles
for insert
to authenticated
with check (id = auth.uid());

-- profiles: 본인 것만 수정
create policy "profiles_update_own"
on public.profiles
for update
to authenticated
using (id = auth.uid())
with check (id = auth.uid());

-- diary_pages: 본인 페이지만 조회
create policy "diary_pages_select_own"
on public.diary_pages
for select
to authenticated
using (user_id = auth.uid());

-- diary_pages: 본인 user_id로만 생성
create policy "diary_pages_insert_own"
on public.diary_pages
for insert
to authenticated
with check (user_id = auth.uid());

-- diary_pages: 본인 것만 수정
create policy "diary_pages_update_own"
on public.diary_pages
for update
to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());

-- diary_pages: 본인 것만 삭제
create policy "diary_pages_delete_own"
on public.diary_pages
for delete
to authenticated
using (user_id = auth.uid());

-- stickers: 로그인 유저 전체가 활성 스티커 조회 가능
create policy "stickers_select_all_auth"
on public.stickers
for select
to authenticated
using (is_active = true);

-- page_items: 연결된 page의 주인이 본인일 때만 접근 허용
create policy "page_items_select_own"
on public.page_items
for select
to authenticated
using (
  exists (
    select 1
    from public.diary_pages p
    where p.id = page_id
      and p.user_id = auth.uid()
  )
);

create policy "page_items_insert_own"
on public.page_items
for insert
to authenticated
with check (
  exists (
    select 1
    from public.diary_pages p
    where p.id = page_id
      and p.user_id = auth.uid()
  )
);

create policy "page_items_update_own"
on public.page_items
for update
to authenticated
using (
  exists (
    select 1
    from public.diary_pages p
    where p.id = page_id
      and p.user_id = auth.uid()
  )
)
with check (
  exists (
    select 1
    from public.diary_pages p
    where p.id = page_id
      and p.user_id = auth.uid()
  )
);

create policy "page_items_delete_own"
on public.page_items
for delete
to authenticated
using (
  exists (
    select 1
    from public.diary_pages p
    where p.id = page_id
      and p.user_id = auth.uid()
  )
);
```

## 3) Storage SQL (파일 권한)

```sql
-- 이미지 저장 버킷 생성(없으면 생성)
insert into storage.buckets (id, name, public)
values ('diary-images', 'diary-images', false)
on conflict (id) do nothing;

-- 업로드: 로그인 유저가 자기 uid 폴더에만 업로드 가능
create policy "Users can upload own files"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'diary-images'
  and (storage.foldername(name))[1] = (select auth.uid()::text)
);

-- 조회: 로그인 유저가 자기 uid 폴더 파일만 조회 가능
create policy "Users can view own files"
on storage.objects
for select
to authenticated
using (
  bucket_id = 'diary-images'
  and (storage.foldername(name))[1] = (select auth.uid()::text)
);

-- 수정: 자기 uid 폴더 파일만 수정 가능
create policy "Users can update own files"
on storage.objects
for update
to authenticated
using (
  bucket_id = 'diary-images'
  and (storage.foldername(name))[1] = (select auth.uid()::text)
)
with check (
  bucket_id = 'diary-images'
  and (storage.foldername(name))[1] = (select auth.uid()::text)
);

-- 삭제: 자기 uid 폴더 파일만 삭제 가능
create policy "Users can delete own files"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'diary-images'
  and (storage.foldername(name))[1] = (select auth.uid()::text)
);
```

## 4) 왜 `Success. No rows returned`가 뜨나?
- `CREATE`, `ALTER`, `POLICY`는 구조/권한 변경 쿼리라 결과 행을 반환하지 않음.
- 즉 "정상 실행" 메시지다.

## 5) 다음 진행 순서 (지금 해야 할 일)
1. 로컬 환경변수 설정
   - `.env.local` 생성
   - `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` 입력
2. Google OAuth 설정
   - Supabase `Authentication > Providers > Google`에서 Client ID/Secret 등록
   - `Redirect URL`에 `http://localhost:3000/auth/callback` 추가
3. 앱 실행 확인
   - `npm install`
   - `npm run dev`
   - `/auth`에서 로그인 버튼 테스트
4. 로그인 후 첫 데이터 쓰기
   - `profiles` upsert
   - 오늘 날짜 `diary_pages` 1건 생성
5. Storage 업로드 테스트
   - 업로드 경로를 반드시 `auth.uid()/filename.png` 형태로 사용

## 6) 자주 나는 에러
- `new row violates row-level security policy`
  - 원인: user_id가 auth.uid()와 다르거나, 업로드 경로가 uid 폴더 규칙과 다름
- `invalid login credentials`/OAuth 오류
  - 원인: Google provider 미설정 또는 redirect URL 불일치
