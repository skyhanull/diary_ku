// 인증 클라이언트: 로그인·로그아웃·세션 조회를 Supabase Auth로 처리하는 유틸
import { getCurrentSession, getSupabaseClient } from '@/lib/client-auth';

export const DEFAULT_TEST_ACCOUNT_EMAIL = process.env.NEXT_PUBLIC_TEST_ACCOUNT_EMAIL ?? 'test1234@naver.com';
export const DEFAULT_TEST_ACCOUNT_PASSWORD = process.env.NEXT_PUBLIC_TEST_ACCOUNT_PASSWORD ?? 'test1234';

// 현재 로그인된 세션을 Supabase에서 가져온다
export { getCurrentSession };

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

// 데모용 테스트 계정으로 로그인한다
export async function signInWithTestAccount() {
  return signInWithEmail({
    email: DEFAULT_TEST_ACCOUNT_EMAIL,
    password: DEFAULT_TEST_ACCOUNT_PASSWORD
  });
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
