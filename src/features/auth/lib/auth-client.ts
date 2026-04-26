// 인증 클라이언트: 로그인·로그아웃·세션 조회를 Supabase Auth로 처리하는 유틸
import { supabase } from '@/lib/supabase';

// Supabase 클라이언트가 초기화되지 않았으면 에러를 던지고, 정상이면 반환한다
function getSupabaseClient() {
  if (!supabase) {
    throw new Error('Supabase client is not configured.');
  }

  return supabase;
}

// 현재 로그인된 세션을 Supabase에서 가져온다
export async function getCurrentSession() {
  const client = getSupabaseClient();
  const { data, error } = await client.auth.getSession();

  if (error) throw error;
  return data.session;
}

// 이메일·비밀번호로 Supabase 로그인을 시도하고 세션 데이터를 반환한다
export async function signInWithEmail(input: { email: string; password: string }) {
  const client = getSupabaseClient();
  const { email, password } = input;

  const { data, error } = await client.auth.signInWithPassword({
    email: email.trim().toLowerCase(),
    password
  });

  if (error) throw error;
  return data;
}

// 이메일·비밀번호로 신규 계정을 생성하고 인증 메일 리다이렉트 URL도 함께 전달한다
export async function signUpWithEmail(input: { email: string; password: string; emailRedirectTo?: string }) {
  const client = getSupabaseClient();
  const { email, password, emailRedirectTo } = input;

  const { data, error } = await client.auth.signUp({
    email: email.trim().toLowerCase(),
    password,
    options: {
      emailRedirectTo
    }
  });

  if (error) throw error;
  return data;
}

// 현재 로그인된 사용자를 Supabase에서 로그아웃시킨다
export async function signOutCurrentUser() {
  const client = getSupabaseClient();
  const { error } = await client.auth.signOut();

  if (error) throw error;
}
