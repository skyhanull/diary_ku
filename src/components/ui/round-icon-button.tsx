// 원형 아이콘 버튼: variant/size가 고정된 Button 래퍼 (툴바 등에서 사용)
import * as React from 'react';

import { Button, type ButtonProps } from '@/components/ui/button';

const RoundIconButton = React.forwardRef<HTMLButtonElement, Omit<ButtonProps, 'variant' | 'size'>>((props, ref) => {
  return <Button ref={ref} variant="soft" size="iconCircle" {...props} />;
});

RoundIconButton.displayName = 'RoundIconButton';

export { RoundIconButton };
