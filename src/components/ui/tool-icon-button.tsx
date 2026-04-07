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
      className={cn(active ? 'bg-[#e7e2dd] text-[#8C6A5D] hover:bg-[#e7e2dd]' : 'text-[#6f5c45] hover:bg-[#efe7df]', className)}
      {...props}
    />
  );
});

ToolIconButton.displayName = 'ToolIconButton';

export { ToolIconButton };
