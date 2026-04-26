import { createClient } from "@supabase/supabase-js";
import { APP_MESSAGES } from "@/lib/messages";

function getBearerToken(authHeader: string | null) {
  return authHeader?.replace("Bearer ", "").trim();
}

export async function getAuthenticatedSupabase(authHeader: string | null) {
  const token = getBearerToken(authHeader);
  if (!token) {
    throw new Error(APP_MESSAGES.authRequired);
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { global: { headers: { Authorization: `Bearer ${token}` } } },
  );

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser(token);

  if (error || !user) {
    throw new Error(APP_MESSAGES.authRequired);
  }

  return { supabase, user, token };
}
