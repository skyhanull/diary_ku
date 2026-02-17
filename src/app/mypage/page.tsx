'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import type { User } from '@supabase/supabase-js';

import { isSupabaseConfigured, supabase } from '@/lib/supabase';

export default function MyPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!supabase) {
      setLoading(false);
      return;
    }

    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user);
      setLoading(false);
    });

    const {
      data: { subscription }
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleSignOut = async () => {
    if (!supabase) return;
    await supabase.auth.signOut();
    router.push('/');
  };

  if (loading) {
    return (
      <main className="mx-auto max-w-md px-5 py-20 text-center">
        <p className="text-sm text-foreground/50">로딩 중...</p>
      </main>
    );
  }

  if (!isSupabaseConfigured) {
    return (
      <main className="mx-auto max-w-md px-5 py-20">
        <p className="text-sm text-red-600">Supabase 환경변수가 설정되지 않았어요.</p>
      </main>
    );
  }

  if (!user) {
    return (
      <main className="mx-auto max-w-md px-5 py-20 text-center">
        <h1 className="text-xl font-semibold">마이페이지</h1>
        <p className="mt-3 text-sm text-foreground/60">로그인이 필요해요.</p>
        <button
          type="button"
          onClick={() => router.push('/auth')}
          className="mt-5 rounded-md bg-primary px-5 py-2 text-sm font-medium text-primary-foreground"
        >
          로그인하기
        </button>
      </main>
    );
  }

  const avatarUrl = user.user_metadata?.avatar_url as string | undefined;
  const displayName = (user.user_metadata?.full_name as string) || user.email || '사용자';

  return (
    <main className="mx-auto max-w-lg px-5 py-14">
      <h1 className="text-xl font-semibold">마이페이지</h1>

      {/* Profile card */}
      <div className="mt-6 rounded-2xl border border-border bg-card p-6">
        <div className="flex items-center gap-4">
          {avatarUrl ? (
            <img
              src={avatarUrl}
              alt="프로필"
              className="h-14 w-14 rounded-full border border-border object-cover"
              referrerPolicy="no-referrer"
            />
          ) : (
            <div className="grid h-14 w-14 place-items-center rounded-full bg-secondary text-lg font-bold text-foreground/40">
              {displayName.charAt(0).toUpperCase()}
            </div>
          )}
          <div className="min-w-0">
            <p className="truncate text-base font-semibold">{displayName}</p>
            {user.email ? <p className="truncate text-sm text-foreground/50">{user.email}</p> : null}
          </div>
        </div>

        <hr className="my-5 border-border/60" />

        {/* Info rows */}
        <dl className="space-y-3 text-sm">
          <div className="flex justify-between">
            <dt className="text-foreground/50">가입일</dt>
            <dd className="font-medium">
              {new Date(user.created_at).toLocaleDateString('ko-KR', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })}
            </dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-foreground/50">로그인 방법</dt>
            <dd className="font-medium">{user.app_metadata?.provider ?? '이메일'}</dd>
          </div>
        </dl>

        <hr className="my-5 border-border/60" />

        <button
          type="button"
          onClick={handleSignOut}
          className="w-full rounded-lg border border-red-200 px-4 py-2.5 text-sm font-medium text-red-600 transition-colors hover:bg-red-50"
        >
          로그아웃
        </button>
      </div>
    </main>
  );
}
