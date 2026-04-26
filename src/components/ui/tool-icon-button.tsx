// 에디터 툴바 아이콘 버튼: 활성/비활성 상태 표시가 있는 도구 선택 버튼
import * as React from 'react';

import { Button, type ButtonProps } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface ToolIconButtonProps extends Omit<ButtonProps, 'variant' | 'size'> {
  active?: boolean;
}

const ToolIconButton = React.forwardRef<HTMLButtonElement, ToolIconButtonProps>(({ active = false, className, ...props }, ref) => {
  return (
    <Button
      ref={ref}
      variant="ghost"
      size="tool"
      className={cn(active ? 'bg-cedar-mist text-cedar hover:bg-cedar-mist' : 'text-ink-warm hover:bg-cedar-soft', className)}
      {...props}
    />
  );
});

ToolIconButton.displayName = 'ToolIconButton';

export { ToolIconButton };
