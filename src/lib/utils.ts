// cn() 유틸: clsx + tailwind-merge를 합쳐 조건부 클래스를 안전하게 병합한다
import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

// clsx로 조건부 클래스를 합친 뒤 tailwind-merge로 중복 클래스를 제거한다
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
