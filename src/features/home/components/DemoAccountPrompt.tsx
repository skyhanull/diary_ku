'use client';

import { useEffect, useState } from 'react';
import { Sparkles } from 'lucide-react';
import { useRouter } from 'next/navigation';

import { Button } from '@/components/ui/button';
import { getCurrentSession } from '@/lib/client-auth';
import { getUserFacingErrorMessage } from '@/lib/messages';
import { isSupabaseConfigured } from '@/lib/supabase';
import { signInWithTestAccount } from '@/features/auth/lib/auth-client';

const DEMO_PROMPT_STORAGE_KEY = 'memolie-demo-account-prompt-dismissed';

export function DemoAccountPrompt() {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isSupabaseConfigured) {
      return;
    }

    let isMounted = true;

    const syncPromptState = async () => {
      const hasDismissedPrompt = window.localStorage.getItem(DEMO_PROMPT_STORAGE_KEY) === 'true';
      if (hasDismissedPrompt) {
        return;
      }

      const session = await getCurrentSession();
      if (!isMounted) {
        return;
      }

      setIsOpen(!session);
    };

    void syncPromptState();

    return () => {
      isMounted = false;
    };
  }, []);

  const closePrompt = () => {
    window.localStorage.setItem(DEMO_PROMPT_STORAGE_KEY, 'true');
    setIsOpen(false);
    setError(null);
  };

  const handleStartWithTestAccount = async () => {
    setIsSubmitting(true);
    setError(null);

    try {
      await signInWithTestAccount();
      closePrompt();
      router.refresh();
      window.location.reload();
    } catch (signInError) {
      setError(getUserFacingErrorMessage(signInError, '테스트 계정 로그인 중 문제가 발생했어요.'));
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-[140] flex items-center justify-center bg-[rgba(38,30,28,0.46)] px-ds-4 backdrop-blur-[4px]">
      <div className="w-full max-w-[560px] overflow-hidden rounded-[28px] border border-line-warm bg-paper shadow-[0_28px_80px_rgba(52,50,47,0.22)]">
        <div className="border-b border-line-soft bg-oatmeal px-ds-6 py-ds-5">
          <div className="flex items-start gap-ds-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-cedar-soft text-cedar">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <p className="text-ds-caption font-semibold uppercase tracking-[0.22em] text-cedar">Portfolio Demo</p>
              <h2 className="mt-ds-1 font-display text-[1.7rem] font-bold tracking-tight text-ink">테스트 계정으로 바로 체험해보시겠어요?</h2>
            </div>
          </div>
        </div>

        <div className="space-y-ds-5 px-ds-6 py-ds-6">
          <p className="text-ds-body leading-relaxed text-ink-warm">
            주요 기능을 빠르게 확인할 수 있도록 데모용 테스트 계정을 준비해두었습니다. 둘러보기를 선택하면 메인 화면은 그대로 볼 수 있고, 필요할 때 우측 상단에서 직접 로그인할 수 있어요.
          </p>

          {error ? <p className="rounded-2xl border border-rose-200 bg-rose-50 px-ds-4 py-ds-3 text-ds-body text-rose-700">{error}</p> : null}

          <div className="flex flex-col gap-ds-3 sm:flex-row">
            <Button className="h-11 flex-1" onClick={() => void handleStartWithTestAccount()} disabled={isSubmitting}>
              {isSubmitting ? '로그인 중...' : '테스트 계정으로 시작'}
            </Button>
            <Button variant="outline" className="h-11 flex-1" onClick={closePrompt} disabled={isSubmitting}>
              둘러보기
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
