'use client';

import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { getCurrentSession, signInWithEmail, signUpWithEmail } from '@/features/auth/lib/auth-client';
import { isSupabaseConfigured, supabase } from '@/lib/supabase';

type AuthMode = 'signin' | 'signup';

export default function AuthPage() {
  return (
    <Suspense fallback={<AuthPageFallback />}>
      <AuthPageContent />
    </Suspense>
  );
}

function AuthPageFallback() {
  return (
    <main className="min-h-screen bg-[#fdf8f5] px-6 py-16 text-[#34322f]">
      <div className="mx-auto max-w-[960px] rounded-[32px] border border-[#ece7e3] bg-white px-8 py-20 text-center shadow-[0_24px_60px_rgba(52,50,47,0.08)]">
        로그인 화면을 준비하고 있어요...
      </div>
    </main>
  );
}

function AuthPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get('next') ?? '/';
  const redirectPath = next.startsWith('/') ? next : '/';

  const [mode, setMode] = useState<AuthMode>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!supabase) return;
    let isMounted = true;

    const checkSession = async () => {
      const session = await getCurrentSession();
      if (!isMounted) return;

      if (session) {
        router.replace(redirectPath as '/');
      }
    };

    void checkSession();

    return () => {
      isMounted = false;
    };
  }, [redirectPath, router]);

  const resetFeedback = () => {
    setMessage(null);
    setError(null);
  };

  const handleSignIn = async () => {
    if (!supabase) return;

    setIsSubmitting(true);
    resetFeedback();

    try {
      await signInWithEmail({
        email,
        password
      });

      setMessage('로그인됐어요. 이동 중입니다.');
      router.replace(redirectPath as '/');
    } catch (authError) {
      setError(authError instanceof Error ? authError.message : '로그인 중 문제가 발생했어요.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSignUp = async () => {
    if (!supabase) return;

    if (password !== confirmPassword) {
      setError('비밀번호 확인이 일치하지 않아요.');
      return;
    }

    setIsSubmitting(true);
    resetFeedback();

    try {
      const data = await signUpWithEmail({
        email,
        password,
        emailRedirectTo: `${window.location.origin}${redirectPath}`
      });

      if (data.session) {
        setMessage('회원가입과 로그인이 완료됐어요. 이동 중입니다.');
        router.replace(redirectPath as '/');
        return;
      }

      setMessage('회원가입 요청이 완료됐어요. Supabase 설정에 따라 이메일 인증이 필요할 수 있어요.');
      setMode('signin');
    } catch (authError) {
      setError(authError instanceof Error ? authError.message : '회원가입 중 문제가 발생했어요.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#fdf8f5] px-6 py-16 text-[#34322f]">
      <div className="mx-auto max-w-[960px] overflow-hidden rounded-[32px] border border-[#ece7e3] bg-white shadow-[0_24px_60px_rgba(52,50,47,0.08)] md:grid md:grid-cols-[1.1fr_0.9fr]">
        <section className="bg-[#f8f3ef] px-8 py-10 md:px-10 md:py-14">
          <p className="font-['Epilogue'] text-sm font-bold uppercase tracking-[0.24em] text-[#8C6A5D]">Memolie</p>
          <h1 className="mt-4 font-['Epilogue'] text-4xl font-bold tracking-tight text-[#34322f]">기록을 남기고, 다시 열어보는 공간</h1>
          <p className="mt-4 max-w-md text-base leading-7 text-[#6f5c45]">
            회원가입을 하면 날짜별 일기와 꾸미기 요소를 내 계정에 저장할 수 있어요. 로그인 후에는 같은 날짜 일기를 다시 열어 이어서 쓸 수 있습니다.
          </p>

          <div className="mt-10 space-y-4 rounded-[24px] border border-[#ece7e3] bg-white/80 p-5">
            <div>
              <p className="text-sm font-semibold text-[#34322f]">왜 로그인이 필요하냐면</p>
              <p className="mt-2 text-sm leading-6 text-[#6f5c45]">
                Supabase는 로그인된 사용자 기준으로 데이터를 분리합니다. 그래서 저장할 때 현재 사용자가 누구인지 알아야 `내 날짜 일기`로 저장할 수 있어요.
              </p>
            </div>
            <div>
              <p className="text-sm font-semibold text-[#34322f]">회원가입 후 일어나는 일</p>
              <p className="mt-2 text-sm leading-6 text-[#6f5c45]">
                이메일과 비밀번호로 계정을 만들고, 이후 로그인하면 에디터 저장 버튼이 실제로 `diary_entries`와 `editor_items`에 연결될 수 있습니다.
              </p>
            </div>
          </div>
        </section>

        <section className="px-8 py-10 md:px-10 md:py-14">
          <div className="mb-8 flex rounded-full bg-[#f8f3ef] p-1">
            <button
              type="button"
              onClick={() => {
                setMode('signin');
                resetFeedback();
              }}
              className={`flex-1 rounded-full px-4 py-2 text-sm font-semibold transition ${
                mode === 'signin' ? 'bg-[#8C6A5D] text-white' : 'text-[#6f5c45]'
              }`}
            >
              로그인
            </button>
            <button
              type="button"
              onClick={() => {
                setMode('signup');
                resetFeedback();
              }}
              className={`flex-1 rounded-full px-4 py-2 text-sm font-semibold transition ${
                mode === 'signup' ? 'bg-[#8C6A5D] text-white' : 'text-[#6f5c45]'
              }`}
            >
              회원가입
            </button>
          </div>

          {!isSupabaseConfigured ? (
            <div className="mb-6 rounded-2xl border border-[#fa746f]/30 bg-[#fff1ef] px-4 py-3 text-sm text-[#a83836]">
              환경변수가 아직 비어 있어요. `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` 를 먼저 확인해주세요.
            </div>
          ) : null}

          <div className="space-y-4">
            <div>
              <label className="mb-2 block text-sm font-medium text-[#615f5b]">이메일</label>
              <Input
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="you@example.com"
                className="h-12 rounded-2xl border-[#ece7e3] bg-[#fcfaf8]"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-[#615f5b]">비밀번호</label>
              <Input
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="비밀번호를 입력하세요"
                className="h-12 rounded-2xl border-[#ece7e3] bg-[#fcfaf8]"
              />
            </div>

            {mode === 'signup' ? (
              <div>
                <label className="mb-2 block text-sm font-medium text-[#615f5b]">비밀번호 확인</label>
                <Input
                  type="password"
                  value={confirmPassword}
                  onChange={(event) => setConfirmPassword(event.target.value)}
                  placeholder="비밀번호를 한 번 더 입력하세요"
                  className="h-12 rounded-2xl border-[#ece7e3] bg-[#fcfaf8]"
                />
              </div>
            ) : null}
          </div>

          <Button
            className="mt-6 h-12 w-full rounded-2xl bg-[#8C6A5D] text-base font-semibold text-white hover:bg-[#78584b]"
            disabled={!isSupabaseConfigured || isSubmitting}
            onClick={() => {
              if (mode === 'signin') {
                void handleSignIn();
                return;
              }

              void handleSignUp();
            }}
          >
            {isSubmitting ? '처리 중...' : mode === 'signin' ? '로그인하기' : '회원가입하기'}
          </Button>

          {message ? <p className="mt-4 text-sm text-[#8C6A5D]">{message}</p> : null}
          {error ? <p className="mt-4 text-sm text-[#a83836]">{error}</p> : null}

          <div className="mt-8 rounded-2xl bg-[#f8f3ef] p-4 text-sm leading-6 text-[#6f5c45]">
            <p className="font-medium text-[#34322f]">백엔드 설명 짧게</p>
            <p className="mt-2">
              회원가입하면 Supabase Auth에 계정이 생기고, 로그인하면 브라우저에 세션이 저장됩니다. 그 뒤 저장 버튼을 누를 때 Supabase는 이 세션을 보고
              “누가 저장하는지”를 판단해서 `user_id` 기준으로 일기를 저장합니다.
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}
