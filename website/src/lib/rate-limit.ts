const rateLimit = new Map<string, { count: number; resetTime: number }>();

export function checkRateLimit(
  key: string,
  limit: number,
  windowMs: number
): { allowed: boolean; remaining: number; resetIn: number } {
  const now = Date.now();
  const record = rateLimit.get(key);

  if (!record || now > record.resetTime) {
    rateLimit.set(key, { count: 1, resetTime: now + windowMs });
    return { allowed: true, remaining: limit - 1, resetIn: windowMs };
  }

  if (record.count >= limit) {
    return { allowed: false, remaining: 0, resetIn: record.resetTime - now };
  }

  record.count++;
  return { allowed: true, remaining: limit - record.count, resetIn: record.resetTime - now };
}
