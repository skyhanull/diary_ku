'use client';

import { supabase } from '@/lib/supabase';

export default function AuthPage() {
  const signInWithGoogle = async () => {
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
      <button
        onClick={signInWithGoogle}
        style={{
          width: '100%',
          padding: '12px 14px',
          borderRadius: 12,
          border: '1px solid var(--line)',
          cursor: 'pointer'
        }}
      >
        Google로 시작하기
      </button>
    </main>
  );
}
