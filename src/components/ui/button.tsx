// 기본 버튼 컴포넌트: variant(default/outline/ghost 등)와 size 옵션을 지원한다
import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';

import { cn } from '@/lib/utils';

const buttonVariants = cva(
  'inline-flex items-center justify-center whitespace-nowrap rounded-lg text-ds-body font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 active:scale-[0.98]',
  {
    variants: {
      variant: {
        default: 'bg-primary text-primary-foreground shadow-[0_12px_32px_rgba(52,50,47,0.08)] hover:brightness-[1.03]',
        secondary: 'bg-secondary text-secondary-foreground hover:bg-secondary/80',
        outline: 'border border-border bg-card text-foreground hover:bg-secondary/70',
        ghost: 'text-secondary-foreground hover:bg-secondary/70',
        soft: 'bg-oatmeal text-ink-warm hover:bg-cedar-soft',
        warm: 'bg-cedar-deep text-white shadow-[0_12px_24px_rgba(125,100,86,0.28)] hover:brightness-[1.03]'
      },
      size: {
        default: 'h-10 px-ds-4 py-ds-2',
        sm: 'h-9 px-ds-3',
        lg: 'h-11 px-ds-8',
        iconSoft: 'h-10 w-10 rounded-full',
        tool: 'h-11 w-11 rounded-2xl p-0',
        iconCircle: 'h-10 w-10 rounded-full p-0',
        pill: 'h-11 rounded-full px-ds-6'
      }
    },
    defaultVariants: {
      variant: 'default',
      size: 'default'
    }
  }
);

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof buttonVariants> {}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(({ className, variant, size, ...props }, ref) => {
  return <button className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />;
});

Button.displayName = 'Button';

export { Button, buttonVariants };
