'use client';

import { isSupabaseConfigured, supabase } from '@/lib/supabase';

export default function AuthPage() {
  const signInWithGoogle = async () => {
    if (!supabase) return;

    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`
      }
    });
  };

  return (
    <main style={{ maxWidth: 420, margin: '56px auto', padding: '0 20px' }}>
      <h1>로그인</h1>
      {!isSupabaseConfigured ? (
        <p style={{ fontSize: 14, color: '#b42318' }}>
          환경변수 누락: NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY
        </p>
      ) : null}
      <button
        onClick={signInWithGoogle}
        disabled={!isSupabaseConfigured}
        style={{
          width: '100%',
          padding: '12px 14px',
          borderRadius: 12,
          border: '1px solid var(--line)',
          cursor: isSupabaseConfigured ? 'pointer' : 'not-allowed',
          opacity: isSupabaseConfigured ? 1 : 0.6
        }}
      >
        Google로 시작하기
      </button>
    </main>
  );
}
