import { supabase } from "@/lib/supabase";
import { APP_MESSAGES, isMissingAuthSessionMessage } from "@/lib/messages";

export function getSupabaseClient() {
  if (!supabase) {
    throw new Error(APP_MESSAGES.supabaseNotConfigured);
  }

  return supabase;
}

export async function getCurrentSession() {
  const client = getSupabaseClient();
  const { data, error } = await client.auth.getSession();

  if (error) throw error;
  return data.session;
}

export async function getCurrentUser() {
  const client = getSupabaseClient();
  const { data, error } = await client.auth.getUser();

  if (error) {
    if (isMissingAuthSessionMessage(error.message)) {
      return null;
    }
    throw error;
  }

  return data.user ?? null;
}
