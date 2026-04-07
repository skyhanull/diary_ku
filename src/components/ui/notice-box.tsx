import * as React from 'react';

import { cn } from '@/lib/utils';

interface NoticeBoxProps extends React.HTMLAttributes<HTMLDivElement> {
  tone?: 'info' | 'success' | 'error' | 'overlay';
}

const toneClasses = {
  info: 'bg-[#f8f3ef] text-[#8C6A5D]',
  success: 'bg-[#f3f0ea] text-[#8C6A5D]',
  error: 'bg-[#fff1ef] text-[#a83836]',
  overlay: 'bg-white/70 text-[#6f5c45] backdrop-blur'
} as const;

function NoticeBox({ tone = 'info', className, ...props }: NoticeBoxProps) {
  return <div className={cn('rounded-2xl px-4 py-3 text-sm', toneClasses[tone], className)} {...props} />;
}

export { NoticeBox };
