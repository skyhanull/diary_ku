import { getCurrentSession } from "@/lib/client-auth";
import { APP_MESSAGES } from "@/lib/messages";
import { supabase } from "@/lib/supabase";

type AuthorizedFetchOptions = RequestInit & {
  requireAuth?: boolean;
};

export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

export async function authorizedFetch(
  input: RequestInfo | URL,
  options: AuthorizedFetchOptions = {},
) {
  const { requireAuth = true, headers, ...rest } = options;
  const nextHeaders = new Headers(headers);

  if (requireAuth) {
    if (!supabase) {
      throw new Error(APP_MESSAGES.supabaseNotConfigured);
    }

    const session = await getCurrentSession();
    const token = session?.access_token;
    if (!token) {
      throw new Error(APP_MESSAGES.authRequired);
    }

    nextHeaders.set("Authorization", `Bearer ${token}`);
  }

  if (!nextHeaders.has("Content-Type") && rest.body) {
    nextHeaders.set("Content-Type", "application/json");
  }

  const response = await fetch(input, {
    ...rest,
    headers: nextHeaders,
  });

  if (!response.ok) {
    let message: string = APP_MESSAGES.requestFailed;

    try {
      const data = (await response.json()) as { error?: string | { message?: string } };
      if (typeof data.error === "string") {
        message = data.error;
      } else if (typeof data.error?.message === "string") {
        message = data.error.message;
      }
    } catch {
      // JSON 응답이 아니면 기본 메시지를 사용한다.
    }

    throw new ApiError(message, response.status);
  }

  return response;
}
