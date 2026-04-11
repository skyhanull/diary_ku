import { supabase } from '@/lib/supabase';

function getSupabaseClient() {
  if (!supabase) {
    throw new Error('Supabase client is not configured.');
  }

  return supabase;
}

export async function getCurrentSession() {
  const client = getSupabaseClient();
  const { data, error } = await client.auth.getSession();

  if (error) throw error;
  return data.session;
}

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

export async function signOutCurrentUser() {
  const client = getSupabaseClient();
  const { error } = await client.auth.signOut();

  if (error) throw error;
}
