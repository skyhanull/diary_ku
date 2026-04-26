// 홈 기능 관련 TypeScript 타입 전체 정의 (일기 요약·캘린더·일정·날씨 등)
// 일기 항목의 저장 상태를 나타내는 유니언 타입
export type EntryStatus = 'empty' | 'draft' | 'saved' | 'published';

// 홈·보관함에서 카드/캘린더 표시에 쓰이는 일기 요약 데이터 구조
export interface DiaryEntrySummary {
  id: string;
  date: string;
  title?: string;
  bodyText?: string;
  mood?: string;
  tags?: string[];
  updatedAt?: string;
  coverImageUrl?: string;
  status: EntryStatus;
  moodScore?: number;
  hasPhoto?: boolean;
  hasText?: boolean;
  hasSticker?: boolean;
  itemCount?: number;
  itemSearchText?: string;
}

// 월별 감정 분포 차트에서 각 감정의 비율과 메타 정보를 담는 타입
export interface MoodDistributionItem {
  score: number;
  emoji: string;
  label: string;
  count: number;
  percentage: number;
  color: string;
}

// UI에서 사용하는 일정 항목의 기본 데이터 구조
export interface ScheduleItem {
  id: string;
  date: string;
  title: string;
  note?: string;
}

// Supabase schedules 테이블의 실제 행 구조를 나타내는 타입
export interface ScheduleRow {
  id: string;
  user_id: string;
  schedule_date: string;
  title: string;
  note: string | null;
  created_at: string;
  updated_at: string;
}

// 캘린더 그리드 한 칸에 들어가는 날짜·일기·일정 정보를 담는 타입
export interface CalendarDay {
  date: Date;
  day: number;
  inMonth: boolean;
  isToday: boolean;
  isSelected: boolean;
  entry?: DiaryEntrySummary;
  schedules: ScheduleItem[];
}

// 날씨 아이콘 컴포넌트에서 허용되는 아이콘 이름 유니언 타입
export type WeatherIconName = 'sun' | 'cloud-sun' | 'cloud' | 'rain';

// 단기 예보 한 항목(내일/모레/글피)의 레이블·기온·아이콘을 담는 타입
export interface WeatherForecastItem {
  label: string;
  temperature: string;
  icon: WeatherIconName;
}

// 홈 화면 날씨 위젯에 표시할 현재 날씨와 예보 전체 데이터 구조
export interface HomeWeather {
  locationLabel: string;
  currentTemperature: string;
  currentCondition: string;
  currentIcon: WeatherIconName;
  forecast: WeatherForecastItem[];
}
