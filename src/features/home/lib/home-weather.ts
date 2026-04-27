// 날씨 유틸: 서울 좌표 기준으로 기상청 API를 호출해 오늘의 날씨를 가져온다
import type { HomeWeather, WeatherForecastItem, WeatherIconName } from '@/features/home/types/home.types';

// 위치 권한을 거부했을 때 기본값으로 사용할 서울 좌표
const SEOUL_COORDINATES = {
  latitude: 37.5665,
  longitude: 126.978
} as const;

// Open-Meteo API 응답 형태를 정의하는 타입
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

// Nominatim 역지오코딩 API 응답에서 주소 부분을 정의하는 타입
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

// WMO 날씨 코드를 한국어 레이블과 아이콘 이름으로 변환한다
function toWeatherMeta(code: number): { label: string; icon: WeatherIconName } {
  if (code === 0) return { label: '맑음', icon: 'sun' };
  if (code <= 3) return { label: '구름 조금', icon: 'cloud-sun' };
  if (code <= 48) return { label: '흐림', icon: 'cloud' };
  if (code <= 67) return { label: '비', icon: 'rain' };
  if (code <= 77) return { label: '눈', icon: 'cloud' };
  if (code <= 99) return { label: '소나기', icon: 'rain' };

  return { label: '맑음', icon: 'sun' };
}

// 숫자 온도를 반올림해 'N°' 형식의 문자열로 포맷한다
function formatTemperature(value: number) {
  return `${Math.round(value)}°`;
}

// 예보 인덱스(0=내일, 1=모레, 2=글피)를 한국어 레이블로 변환한다
function buildForecastLabel(index: number) {
  if (index === 0) return '내일';
  if (index === 1) return '모레';
  return '글피';
}

// Open-Meteo 일별 데이터에서 내일~글피 3일치 예보 배열을 만든다
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

// 위도·경도를 Nominatim API로 역지오코딩해 한국어 지역명을 반환한다
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

// 주어진 좌표와 지역명으로 Open-Meteo에서 현재 날씨와 예보를 가져온다
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

// 브라우저 위치 권한으로 현재 위치를 얻어 날씨를 조회하고, 실패 시 서울 기준으로 대체한다
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
