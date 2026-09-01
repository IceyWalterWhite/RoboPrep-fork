interface Bucket {
  timestamps: number[];
}

const buckets = new Map<string, Bucket>();

/** Small in-process limiter used by server routes; replace storage in production. */
export function checkRateLimit(
  key: string,
  limit: number,
  windowMs: number,
  now = Date.now(),
): { allowed: boolean; retryAfterSeconds: number } {
  const cutoff = now - windowMs;
  const bucket = buckets.get(key) ?? { timestamps: [] };
  bucket.timestamps = bucket.timestamps.filter((timestamp) => timestamp > cutoff);
  if (bucket.timestamps.length >= limit) {
    const retryAfterSeconds = Math.max(1, Math.ceil((bucket.timestamps[0] + windowMs - now) / 1000));
    buckets.set(key, bucket);
    return { allowed: false, retryAfterSeconds };
  }
  bucket.timestamps.push(now);
  buckets.set(key, bucket);
  return { allowed: true, retryAfterSeconds: 0 };
}
