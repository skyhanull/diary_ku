export type EntryStatus = 'empty' | 'draft' | 'saved' | 'published';

export interface DiaryEntrySummary {
  id: string;
  date: string;
  title?: string;
  status: EntryStatus;
  moodScore?: number;
  hasPhoto?: boolean;
  hasText?: boolean;
  hasSticker?: boolean;
}

export interface MoodTrendPoint {
  date: string;
  label: string;
  score: number | null;
}

export interface ScheduleItem {
  id: string;
  date: string;
  title: string;
  note?: string;
}

export interface ScheduleRow {
  id: string;
  user_id: string;
  schedule_date: string;
  title: string;
  note: string | null;
  created_at: string;
  updated_at: string;
}

export interface CalendarDay {
  date: Date;
  day: number;
  inMonth: boolean;
  isToday: boolean;
  isSelected: boolean;
  entry?: DiaryEntrySummary;
  schedules: ScheduleItem[];
}

export type WeatherIconName = 'sun' | 'cloud-sun' | 'cloud' | 'rain';

export interface WeatherForecastItem {
  label: string;
  temperature: string;
  icon: WeatherIconName;
}

export interface HomeWeather {
  locationLabel: string;
  currentTemperature: string;
  currentCondition: string;
  currentIcon: WeatherIconName;
  forecast: WeatherForecastItem[];
}
