import type { HomeWeather, WeatherForecastItem, WeatherIconName } from '@/features/home/types/home.types';

const SEOUL_COORDINATES = {
  latitude: 37.5665,
  longitude: 126.978
} as const;

interface OpenMeteoResponse {
  current: {
    temperature_2m: number;
    weather_code: number;
  };
  daily: {
    time: string[];
    weather_code: number[];
    temperature_2m_max: number[];
    temperature_2m_min: number[];
  };
}

interface ReverseGeocodeResponse {
  address?: {
    city?: string;
    borough?: string;
    city_district?: string;
    town?: string;
    village?: string;
    suburb?: string;
    county?: string;
    state?: string;
  };
}

function toWeatherMeta(code: number): { label: string; icon: WeatherIconName } {
  if (code === 0) return { label: '맑음', icon: 'sun' };
  if (code <= 3) return { label: '구름 조금', icon: 'cloud-sun' };
  if (code <= 48) return { label: '흐림', icon: 'cloud' };
  if (code <= 67) return { label: '비', icon: 'rain' };
  if (code <= 77) return { label: '눈', icon: 'cloud' };
  if (code <= 99) return { label: '소나기', icon: 'rain' };

  return { label: '맑음', icon: 'sun' };
}

function formatTemperature(value: number) {
  return `${Math.round(value)}°`;
}

function buildForecastLabel(index: number) {
  if (index === 0) return '내일';
  if (index === 1) return '모레';
  return '글피';
}

function buildForecast(daily: OpenMeteoResponse['daily']): WeatherForecastItem[] {
  return daily.time.slice(1, 4).map((_, index) => {
    const code = daily.weather_code[index + 1];
    const min = daily.temperature_2m_min[index + 1];
    const max = daily.temperature_2m_max[index + 1];
    const meta = toWeatherMeta(code);

    return {
      label: buildForecastLabel(index),
      temperature: `${Math.round(min)}° / ${Math.round(max)}°`,
      icon: meta.icon
    };
  });
}

async function reverseGeocode(latitude: number, longitude: number) {
  const search = new URLSearchParams({
    format: 'jsonv2',
    lat: String(latitude),
    lon: String(longitude),
    zoom: '10',
    'accept-language': 'ko'
  });
  const response = await fetch(`https://nominatim.openstreetmap.org/reverse?${search.toString()}`, {
    cache: 'no-store'
  });

  if (!response.ok) {
    return null;
  }

  const data = (await response.json()) as ReverseGeocodeResponse;
  const primary = data.address?.city ?? data.address?.town ?? data.address?.village ?? data.address?.state ?? null;
  const secondary = data.address?.borough ?? data.address?.city_district ?? data.address?.suburb ?? data.address?.county ?? null;

  if (primary && secondary && primary !== secondary) {
    return `${primary} ${secondary}`;
  }

  return primary ?? secondary;
}

export async function fetchWeather(latitude: number, longitude: number, locationLabel: string): Promise<HomeWeather> {
  const search = new URLSearchParams({
    latitude: String(latitude),
    longitude: String(longitude),
    current: 'temperature_2m,weather_code',
    daily: 'weather_code,temperature_2m_max,temperature_2m_min',
    forecast_days: '4',
    timezone: 'auto'
  });
  const response = await fetch(`https://api.open-meteo.com/v1/forecast?${search.toString()}`, {
    cache: 'no-store'
  });

  if (!response.ok) {
    throw new Error('Failed to fetch weather');
  }

  const data = (await response.json()) as OpenMeteoResponse;
  const currentMeta = toWeatherMeta(data.current.weather_code);

  return {
    locationLabel,
    currentTemperature: formatTemperature(data.current.temperature_2m),
    currentCondition: currentMeta.label,
    currentIcon: currentMeta.icon,
    forecast: buildForecast(data.daily)
  };
}

export async function fetchWeatherForCurrentPosition(): Promise<HomeWeather> {
  if (typeof window === 'undefined' || !('geolocation' in navigator)) {
    return fetchWeather(SEOUL_COORDINATES.latitude, SEOUL_COORDINATES.longitude, '서울');
  }

  const position = await new Promise<GeolocationPosition>((resolve, reject) => {
    navigator.geolocation.getCurrentPosition(resolve, reject, {
      enableHighAccuracy: false,
      timeout: 8000,
      maximumAge: 1000 * 60 * 10
    });
  }).catch(() => null);

  if (!position) {
    return fetchWeather(SEOUL_COORDINATES.latitude, SEOUL_COORDINATES.longitude, '서울');
  }

  const locationLabel = (await reverseGeocode(position.coords.latitude, position.coords.longitude)) ?? '현재 위치';

  return fetchWeather(position.coords.latitude, position.coords.longitude, locationLabel);
}
