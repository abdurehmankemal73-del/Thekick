type Bucket = { count: number; resetAt: number };

const attempts = new Map<string, Bucket>();

const WINDOW_MS = 15 * 60 * 1000;
const MAX_ATTEMPTS = 20;

export function loginRateLimit(key: string) {
  const now = Date.now();
  const bucket = attempts.get(key);

  if (!bucket || bucket.resetAt < now) {
    attempts.set(key, { count: 1, resetAt: now + WINDOW_MS });
    return { ok: true as const, remaining: MAX_ATTEMPTS - 1 };
  }

  if (bucket.count >= MAX_ATTEMPTS) {
    const retryAfter = Math.ceil((bucket.resetAt - now) / 1000);
    return { ok: false as const, retryAfter };
  }

  bucket.count += 1;
  return { ok: true as const, remaining: MAX_ATTEMPTS - bucket.count };
}

export function clearLoginAttempts(key: string) {
  attempts.delete(key);
}

export function clientKey(request: Request, email: string) {
  const forwarded = request.headers.get("x-forwarded-for");
  const ip = forwarded?.split(",")[0]?.trim() || "unknown";
  return `${ip}:${email.toLowerCase()}`;
}
