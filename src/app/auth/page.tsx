"use client";
// 로그인 페이지: Supabase 인증(소셜/매직링크)을 처리하고 성공 시 홈으로 리다이렉트한다
import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { getCurrentSession, signInWithEmail, signUpWithEmail } from "@/features/auth/lib/auth-client";
import { isSupabaseConfigured, supabase } from "@/lib/supabase";

type AuthMode = "signin" | "signup";

const defaultTestAccountEmail = process.env.NEXT_PUBLIC_TEST_ACCOUNT_EMAIL ?? "test1234@naver.com";
const defaultTestAccountPassword = process.env.NEXT_PUBLIC_TEST_ACCOUNT_PASSWORD ?? "test1234";

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
      <div className="mx-auto max-w-[960px] rounded-[32px] border border-[#ece7e3] bg-white px-8 py-20 text-center shadow-[0_24px_60px_rgba(52,50,47,0.08)]">로그인 화면을 준비하고 있어요...</div>
    </main>
  );
}

function AuthPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get("next") ?? "/";
  const redirectPath = next.startsWith("/") ? next : "/";

  const [mode, setMode] = useState<AuthMode>("signin");
  const [email, setEmail] = useState(defaultTestAccountEmail);
  const [password, setPassword] = useState(defaultTestAccountPassword);
  const [confirmPassword, setConfirmPassword] = useState("");
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
        router.replace(redirectPath as "/");
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
        password,
      });

      setMessage("로그인됐어요. 이동 중입니다.");
      router.replace(redirectPath as "/");
    } catch (authError) {
      setError(authError instanceof Error ? authError.message : "로그인 중 문제가 발생했어요.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSignUp = async () => {
    if (!supabase) return;

    if (password !== confirmPassword) {
      setError("비밀번호 확인이 일치하지 않아요.");
      return;
    }

    setIsSubmitting(true);
    resetFeedback();

    try {
      const data = await signUpWithEmail({
        email,
        password,
        emailRedirectTo: `${window.location.origin}${redirectPath}`,
      });

      if (data.session) {
        setMessage("회원가입과 로그인이 완료됐어요. 이동 중입니다.");
        router.replace(redirectPath as "/");
        return;
      }

      setMessage("회원가입 요청이 완료됐어요. Supabase 설정에 따라 이메일 인증이 필요할 수 있어요.");
      setMode("signin");
    } catch (authError) {
      setError(authError instanceof Error ? authError.message : "회원가입 중 문제가 발생했어요.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#fdf8f5] px-6 py-16 text-[#34322f]">
      <div className="mx-auto max-w-[960px] overflow-hidden rounded-[32px] border border-[#ece7e3] bg-white shadow-[0_24px_60px_rgba(52,50,47,0.08)] md:grid md:grid-cols-[1.1fr_0.9fr]">
        <section className="bg-[#f8f3ef] px-8 py-10 md:px-10 md:py-14">
          <p className="font-['Epilogue'] text-sm font-bold uppercase tracking-[0.24em] text-[#8C6A5D]">Memolie</p>
          <h1 className="mt-4 font-['Epilogue'] text-4xl font-bold tracking-tight text-[#34322f] whitespace-pre-line">{`기록을 남기고, \n다시 열어보는 공간`}</h1>
        </section>

        <section className="px-8 py-10 md:px-10 md:py-14">
          <div className="mb-8 flex rounded-full bg-[#f8f3ef] p-1">
            <button
              type="button"
              onClick={() => {
                setMode("signin");
                resetFeedback();
              }}
              className={`flex-1 rounded-full px-4 py-2 text-sm font-semibold transition ${mode === "signin" ? "bg-[#8C6A5D] text-white" : "text-[#6f5c45]"}`}
            >
              로그인
            </button>
            <button
              type="button"
              onClick={() => {
                setMode("signup");
                resetFeedback();
              }}
              className={`flex-1 rounded-full px-4 py-2 text-sm font-semibold transition ${mode === "signup" ? "bg-[#8C6A5D] text-white" : "text-[#6f5c45]"}`}
            >
              회원가입
            </button>
          </div>

          <div className="space-y-4">
            <div>
              <label className="mb-2 block text-sm font-medium text-[#615f5b]">이메일</label>
              <Input type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@example.com" className="h-12 rounded-2xl border-[#ece7e3] bg-[#fcfaf8]" />
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

            {mode === "signup" ? (
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
              if (mode === "signin") {
                void handleSignIn();
                return;
              }

              void handleSignUp();
            }}
          >
            {isSubmitting ? "처리 중..." : mode === "signin" ? "로그인하기" : "회원가입하기"}
          </Button>

          {message ? <p className="mt-4 text-sm text-[#8C6A5D]">{message}</p> : null}
          {error ? <p className="mt-4 text-sm text-[#a83836]">{error}</p> : null}
        </section>
      </div>
    </main>
  );
}
