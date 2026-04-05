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

export interface ScheduleItem {
  id: string;
  date: string;
  title: string;
  note?: string;
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
