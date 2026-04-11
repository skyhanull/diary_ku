'use client';

import type { ReactNode } from 'react';
import Link from 'next/link';
import { Search, Sparkles, UserCircle2 } from 'lucide-react';
import { Input } from '@/components/ui/input';

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
  return (
    <nav className="sticky top-0 z-50 h-16 w-full border-b border-[#b5b1ad]/10 bg-[#fdf8f5]/90 px-6 backdrop-blur-md lg:px-8">
      <div className="flex h-full w-full items-center justify-between gap-4">
        <div className="flex items-center gap-8">
          <Link href="/" className="flex items-center gap-2">
            <span className="font-['Epilogue'] text-3xl font-bold tracking-tight text-[#8C6A5D]">Memolie</span>
            <Sparkles className="h-4 w-4 text-[#8C6A5D]/80" />
          </Link>

          <div className="hidden items-center gap-8 md:flex">
            {navItems.map((item) => (
              <Link
                key={item}
                href={navLinks[item]}
                className={[
                  'font-sans text-sm font-semibold tracking-tight transition-colors duration-200',
                  item === activeItem
                    ? 'border-b-2 border-[#78584b] pb-1 text-[#78584b]'
                    : 'text-[#6f5c45] hover:text-[#78584b]'
                ].join(' ')}
              >
                {item}
              </Link>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-3">
          {actions}
          {showSearch ? (
            <div className="relative hidden items-center rounded-full sm:flex">
              <Search className="pointer-events-none absolute left-4 h-4 w-4 text-[#6f5c45]" />
              <Input
                type="text"
                placeholder="기록 검색..."
                className="h-10 w-44 rounded-full border-border/70 bg-secondary pl-10"
              />
            </div>
          ) : null}

          <Link
            href="/auth"
            className="flex h-10 w-10 items-center justify-center rounded-full bg-[#ece7e3] text-[#6f5c45] transition-colors duration-200 hover:bg-[#f8dec1]"
            aria-label="프로필"
          >
            <UserCircle2 className="h-5 w-5" />
          </Link>
        </div>
      </div>
    </nav>
  );
}
