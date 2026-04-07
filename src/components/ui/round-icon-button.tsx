import * as React from 'react';

import { Button, type ButtonProps } from '@/components/ui/button';

const RoundIconButton = React.forwardRef<HTMLButtonElement, Omit<ButtonProps, 'variant' | 'size'>>((props, ref) => {
  return <Button ref={ref} variant="soft" size="iconCircle" {...props} />;
});

RoundIconButton.displayName = 'RoundIconButton';

export { RoundIconButton };
