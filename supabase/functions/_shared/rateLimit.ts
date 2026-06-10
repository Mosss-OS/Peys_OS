import { createClient } from "jsr:@supabase/supabase-js@2";

const WINDOW_MS = 60 * 1000;
const MAX_REQUESTS = 100;
const MAX_REQUESTS_AUTH = 10;

interface RateLimitConfig {
  windowMs?: number;
  maxRequests?: number;
}

export async function checkRateLimit(
  supabaseUrl: string,
  serviceRoleKey: string,
  clientIp: string,
  config: RateLimitConfig = {}
): Promise<{ allowed: boolean; remaining: number; resetAt: number }> {
  const windowMs = config.windowMs || WINDOW_MS;
  const maxRequests = config.maxRequests || MAX_REQUESTS;
  const now = Date.now();
  const resetAt = now + windowMs;

  const supabaseClient = createClient(supabaseUrl, serviceRoleKey);

  const { data: rateLimit } = await supabaseClient
    .from("api_rate_limits")
    .select("request_count, window_start")
    .eq("ip_address", clientIp)
    .single();

  if (!rateLimit) {
    await supabaseClient
      .from("api_rate_limits")
      .insert({
        ip_address: clientIp,
        request_count: 1,
        window_start: new Date(now).toISOString(),
      });
    return { allowed: true, remaining: maxRequests - 1, resetAt };
  }

  const windowStart = new Date(rateLimit.window_start).getTime();

  if (now - windowStart > windowMs) {
    await supabaseClient
      .from("api_rate_limits")
      .update({
        request_count: 1,
        window_start: new Date(now).toISOString(),
      })
      .eq("ip_address", clientIp);
    return { allowed: true, remaining: maxRequests - 1, resetAt };
  }

  if (rateLimit.request_count >= maxRequests) {
    return { allowed: false, remaining: 0, resetAt };
  }

  await supabaseClient
    .from("api_rate_limits")
    .update({
      request_count: rateLimit.request_count + 1,
    })
    .eq("ip_address", clientIp);

  return {
    allowed: true,
    remaining: maxRequests - rateLimit.request_count - 1,
    resetAt,
  };
}

export function getClientIp(request: Request): string {
  const forwardedFor = request.headers.get("x-forwarded-for");
  if (forwardedFor) {
    return forwardedFor.split(",")[0].trim();
  }

  const realIp = request.headers.get("x-real-ip");
  if (realIp) {
    return realIp;
  }

  return "unknown";
}

export function rateLimitResponse(resetAt: number): Response {
  const retryAfter = Math.ceil((resetAt - Date.now()) / 1000);
  return new Response(
    JSON.stringify({
      error: "Rate limit exceeded",
      message: `Too many requests. Please try again in ${retryAfter} seconds.`,
      retryAfter,
    }),
    {
      status: 429,
      headers: {
        "Content-Type": "application/json",
        "Retry-After": retryAfter.toString(),
        "X-RateLimit-Reset": resetAt.toString(),
      },
    }
  );
}
