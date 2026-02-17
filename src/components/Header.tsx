'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { User } from '@supabase/supabase-js';

import { supabase } from '@/lib/supabase';

const HIDDEN_PREFIXES = ['/editor'];

export function Header() {
  const pathname = usePathname();
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    if (!supabase) return;

    supabase.auth.getUser().then(({ data }) => setUser(data.user));

    const {
      data: { subscription }
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  if (HIDDEN_PREFIXES.some((prefix) => pathname.startsWith(prefix))) {
    return null;
  }

  const handleSignOut = async () => {
    if (!supabase) return;
    await supabase.auth.signOut();
    setUser(null);
  };

  return (
    <header className="sticky top-0 z-50 border-b border-border/60 bg-white/80 backdrop-blur-md">
      <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-5">
        {/* Logo */}
        <Link href="/" className="text-lg font-bold tracking-tight text-[#b45309]">
          DearMe
        </Link>

        {/* Nav */}
        <nav className="flex items-center gap-1">
          <NavLink href="/" pathname={pathname}>
            홈
          </NavLink>
          <NavLink href="/editor/demo-page" pathname={pathname}>
            에디터
          </NavLink>
          <NavLink href="/mypage" pathname={pathname}>
            마이페이지
          </NavLink>

          <span className="mx-2 h-5 w-px bg-border" />

          {user ? (
            <div className="flex items-center gap-2.5">
              <span className="text-xs text-foreground/60">{user.email}</span>
              <button
                type="button"
                onClick={handleSignOut}
                className="rounded-md border border-border px-3 py-1.5 text-xs font-medium text-foreground/70 transition-colors hover:bg-secondary"
              >
                로그아웃
              </button>
            </div>
          ) : (
            <Link
              href="/auth"
              className="rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground transition-colors hover:bg-primary/90"
            >
              로그인
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}

function NavLink({
  href,
  pathname,
  children
}: {
  href: string;
  pathname: string;
  children: React.ReactNode;
}) {
  const isActive = pathname === href;

  return (
    <Link
      href={href as React.ComponentProps<typeof Link>['href']}
      className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
        isActive
          ? 'bg-[#b45309]/10 text-[#b45309]'
          : 'text-foreground/60 hover:bg-secondary hover:text-foreground'
      }`}
    >
      {children}
    </Link>
  );
}
