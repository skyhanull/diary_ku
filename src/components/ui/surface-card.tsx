import * as React from 'react';

import { cn } from '@/lib/utils';

interface SurfaceCardProps extends React.HTMLAttributes<HTMLDivElement> {
  tone?: 'default' | 'soft' | 'overlay';
  radius?: 'lg' | 'xl';
}

const toneClasses = {
  default: 'border border-line bg-white',
  soft: 'border border-line-soft bg-white/80',
  overlay: 'border border-white/40 bg-white/45 backdrop-blur'
} as const;

const radiusClasses = {
  lg: 'rounded-2xl',
  xl: 'rounded-[24px]'
} as const;

function SurfaceCard({ tone = 'default', radius = 'lg', className, ...props }: SurfaceCardProps) {
  return <div className={cn(toneClasses[tone], radiusClasses[radius], className)} {...props} />;
}

export { SurfaceCard };
