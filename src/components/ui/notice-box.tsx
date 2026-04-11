import * as React from 'react';

import { cn } from '@/lib/utils';

interface NoticeBoxProps extends React.HTMLAttributes<HTMLDivElement> {
  tone?: 'info' | 'success' | 'error' | 'overlay';
}

const toneClasses = {
  info: 'bg-oatmeal text-cedar',
  success: 'bg-oatmeal text-cedar',
  error: 'bg-rose-pale text-rose-danger',
  overlay: 'bg-white/70 text-ink-warm backdrop-blur'
} as const;

function NoticeBox({ tone = 'info', className, ...props }: NoticeBoxProps) {
  return <div className={cn('rounded-2xl px-ds-4 py-ds-3 text-ds-body', toneClasses[tone], className)} {...props} />;
}

export { NoticeBox };
