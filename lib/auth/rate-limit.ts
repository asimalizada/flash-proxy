const WINDOW_MS = 60 * 1000; // 1 minute
const MAX_REQUESTS = 5;

type RateLimitRecord = {
  count: number;
  resetAt: number;
};

const rateLimits = new Map<string, RateLimitRecord>();

export function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const record = rateLimits.get(ip);

  if (!record || now > record.resetAt) {
    rateLimits.set(ip, {
      count: 1,
      resetAt: now + WINDOW_MS,
    });
    return true;
  }

  if (record.count >= MAX_REQUESTS) {
    return false;
  }

  record.count += 1;
  return true;
}
