// Supabase 클라이언트 초기화: 환경변수가 없으면 null을 반환해 미설정 환경에서도 앱이 뜬다
import { createClient } from '@supabase/supabase-js';

// Supabase 프로젝트 URL 환경변수 값이다
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
// Supabase 익명 API 키 환경변수 값이다
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// URL과 키가 모두 설정되어 있는지 여부를 나타내는 플래그다
export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

// 설정이 완료된 경우 Supabase 클라이언트를, 아니면 null을 내보낸다
export const supabase = isSupabaseConfigured ? createClient(supabaseUrl!, supabaseAnonKey!) : null;
