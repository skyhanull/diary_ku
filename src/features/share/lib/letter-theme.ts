// 편지 테마 단일 소스: 봉투/편지지/모달/OG 이미지가 같은 색과 라벨을 공유하도록 한곳에 모은다.
// 이전에는 SharedLetterScreen(봉투색)·LetterEnvelopeStage(편지지색)·EditorShareModal(라벨)에
// 같은 테마 지식이 따로 흩어져 있어 하나만 바꿔도 다른 곳과 어긋나기 쉬웠다.
import type { SharedLetterTheme } from '@/features/editor/types/editor.types';

// OG 이미지(서버 렌더 PNG)는 Tailwind가 아니라 CSS 값 문자열로만 스타일을 준다.
interface LetterThemeOg {
  background: string;
  card: string;
  accent: string;
  ink: string;
  inkSoft: string;
}

export interface LetterThemeVisual {
  key: SharedLetterTheme;
  label: string;
  description: string;
  // 닫힌 봉투 화면(SharedLetterScreen)에서 쓰는 그라데이션/색 클래스
  shell: string;
  envelope: string;
  flap: string;
  seal: string;
  ink: string;
  inkSoft: string;
  // 펼친 편지지(LetterEnvelopeStage) 배경 클래스
  paperTone: string;
  // 링크 미리보기용 OG 이미지 색
  og: LetterThemeOg;
}

const PAPER_TONE_LIGHT =
  'border-[#eadfd2] bg-[linear-gradient(180deg,#fffdf8_0%,#fff8f0_48%,#f7eadc_100%)]';
const PAPER_TONE_MIDNIGHT =
  'border-[#d4c2b0] bg-[linear-gradient(180deg,#fffaf4_0%,#fffdf9_52%,#f0e4d7_100%)]';

export const LETTER_THEMES: Record<SharedLetterTheme, LetterThemeVisual> = {
  paper: {
    key: 'paper',
    label: '종이 편지',
    description: '가장 기본적인 따뜻한 편지 무드예요.',
    shell: 'from-[#f8efe6] via-[#fffaf5] to-[#efe2d6]',
    envelope: 'from-[#f3e3d2] via-[#f9ecdf] to-[#e8d4c2]',
    flap: 'from-[#ead7c6] to-[#f7ebde]',
    seal: '#b98c6d',
    ink: 'text-[#6f5c45]',
    inkSoft: 'text-[#9b8170]',
    paperTone: PAPER_TONE_LIGHT,
    og: {
      background: 'linear-gradient(135deg,#f8efe6,#efe2d6)',
      card: '#fffaf5',
      accent: '#b98c6d',
      ink: '#4a3f36',
      inkSoft: '#8a7565'
    }
  },
  cream: {
    key: 'cream',
    label: '크림 편지',
    description: '부드러운 크림빛 편지 무드예요.',
    shell: 'from-[#f5eedc] via-[#fff9ec] to-[#e7dcbc]',
    envelope: 'from-[#efe4c9] via-[#faf4df] to-[#decfa8]',
    flap: 'from-[#e8dbb8] to-[#f8f1d8]',
    seal: '#b39a52',
    ink: 'text-[#6f5c45]',
    inkSoft: 'text-[#9b8170]',
    paperTone: PAPER_TONE_LIGHT,
    og: {
      background: 'linear-gradient(135deg,#f5eedc,#e7dcbc)',
      card: '#fff9ec',
      accent: '#b39a52',
      ink: '#4a4230',
      inkSoft: '#8a7f5a'
    }
  },
  midnight: {
    key: 'midnight',
    label: '밤 편지',
    description: '저녁 분위기의 깊은 그라데이션이에요.',
    shell: 'from-[#1f2030] via-[#2c2438] to-[#49354e]',
    envelope: 'from-[#403149] via-[#5a4260] to-[#7a5f78]',
    flap: 'from-[#674f6d] to-[#8d6f86]',
    seal: '#e6c79a',
    ink: 'text-[#e7d6c2]',
    inkSoft: 'text-[#c4b3c8]',
    paperTone: PAPER_TONE_MIDNIGHT,
    og: {
      background: 'linear-gradient(135deg,#1f2030,#49354e)',
      card: '#2c2438',
      accent: '#e6c79a',
      ink: '#f2e6d6',
      inkSoft: '#c4b3c8'
    }
  }
};

// 모달 옵션 노출 순서
export const LETTER_THEME_ORDER: SharedLetterTheme[] = ['paper', 'cream', 'midnight'];

// 알 수 없는 테마 값이 들어와도 기본(paper)로 안전하게 되돌린다.
export function getLetterTheme(theme: SharedLetterTheme | string | null | undefined): LetterThemeVisual {
  if (theme && theme in LETTER_THEMES) {
    return LETTER_THEMES[theme as SharedLetterTheme];
  }
  return LETTER_THEMES.paper;
}
