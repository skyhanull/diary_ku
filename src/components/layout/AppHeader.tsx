'use client';

import { useEffect, useState, type ReactNode } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Search, Sparkles, UserCircle2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { getCurrentSession, signOutCurrentUser } from '@/features/auth/lib/auth-client';
import { supabase } from '@/lib/supabase';

const navItems = ['기록'] as const;
const navLinks = {
  기록: '/'
} as const;

interface AppHeaderProps {
  activeItem?: (typeof navItems)[number];
  actions?: ReactNode;
  showSearch?: boolean;
}

export function AppHeader({ activeItem = '기록', actions, showSearch = true }: AppHeaderProps) {
  const router = useRouter();
  const [isSignedIn, setIsSignedIn] = useState(false);

  useEffect(() => {
    if (!supabase) return;

    let isMounted = true;

    const checkSession = async () => {
      const session = await getCurrentSession();
      if (isMounted) {
        setIsSignedIn(Boolean(session));
      }
    };

    void checkSession();

    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsSignedIn(Boolean(session));
    });

    return () => {
      isMounted = false;
      data.subscription.unsubscribe();
    };
  }, []);

  const handleProfileClick = async () => {
    if (!isSignedIn) {
      router.push('/auth');
      return;
    }

    const shouldSignOut = window.confirm('로그아웃할까요?');
    if (!shouldSignOut) return;

    try {
      await signOutCurrentUser();
      window.alert('로그아웃됐어요.');
      router.refresh();
    } catch (error) {
      window.alert(error instanceof Error ? error.message : '로그아웃 중 문제가 발생했어요.');
    }
  };

  return (
    <nav className="sticky top-0 z-50 h-16 w-full border-b border-border/20 bg-vellum/90 px-ds-page backdrop-blur-md lg:px-ds-page-lg">
      <div className="flex h-full w-full items-center justify-between gap-ds-4">
        <div className="flex items-center gap-ds-8">
          <Link href="/" className="flex items-center gap-ds-2">
            <span className="font-display text-ds-brand font-bold text-cedar">Memolie</span>
            <Sparkles className="h-4 w-4 text-cedar/80" />
          </Link>

          <div className="hidden items-center gap-ds-8 md:flex">
            {navItems.map((item) => (
              <Link
                key={item}
                href={navLinks[item]}
                className={[
                  'font-sans text-ds-body font-semibold transition-colors duration-200',
                  item === activeItem
                    ? 'border-b-2 border-cedar-dark pb-ds-1 text-cedar-dark'
                    : 'text-ink-warm hover:text-cedar-dark'
                ].join(' ')}
              >
                {item}
              </Link>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-ds-3">
          {actions}
          {showSearch ? (
            <div className="relative hidden items-center rounded-full sm:flex">
              <Search className="pointer-events-none absolute left-4 h-4 w-4 text-ink-warm" />
              <Input
                type="text"
                placeholder="기록 검색..."
                className="h-10 w-44 rounded-full border-border/70 bg-secondary pl-10"
              />
            </div>
          ) : null}

          <button
            type="button"
            onClick={() => {
              void handleProfileClick();
            }}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-cedar-mist text-ink-warm transition-colors duration-200 hover:bg-peach"
            aria-label={isSignedIn ? '로그아웃' : '프로필'}
          >
            <UserCircle2 className="h-5 w-5" />
          </button>
        </div>
      </div>
    </nav>
  );
}
