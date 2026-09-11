// High-performance in-memory sliding-window rate limiter

const tracker = new Map();

// Periodic cleanup every 60 seconds to purge expired records
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    const now = Date.now();
    for (const [key, record] of tracker.entries()) {
      if (record.resetTime <= now) {
        tracker.delete(key);
      }
    }
  }, 60 * 1000).unref?.();
}

/**
 * Extracts a reliable client IP address from request headers
 */
export function getClientIp(request) {
  if (!request) return '127.0.0.1';

  const cfIp = request.headers.get('cf-connecting-ip');
  if (cfIp) return cfIp.trim();

  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) {
    const first = forwarded.split(',')[0].trim();
    if (first) return first;
  }

  const realIp = request.headers.get('x-real-ip');
  if (realIp) return realIp.trim();

  return '127.0.0.1';
}

/**
 * Enforces rate limiting on a specific key (e.g. IP + endpoint)
 *
 * @param {string} key Unique identifier for the rate limit target
 * @param {object} options
 * @param {number} options.limit Maximum allowed requests within the window
 * @param {number} options.windowMs Time window in milliseconds
 * @returns {{ success: boolean, limit: number, remaining: number, resetTime: number }}
 */
export function checkRateLimit(key, optionsOrLimit = 10, maybeWindowMs = 60 * 1000) {
  let limit = 10;
  let windowMs = 60 * 1000;

  if (typeof optionsOrLimit === 'object' && optionsOrLimit !== null) {
    limit = optionsOrLimit.limit ?? 10;
    windowMs = optionsOrLimit.windowMs ?? 60 * 1000;
  } else if (typeof optionsOrLimit === 'number') {
    limit = optionsOrLimit;
    if (typeof maybeWindowMs === 'number') {
      windowMs = maybeWindowMs;
    }
  }

  const now = Date.now();
  let record = tracker.get(key);

  if (!record || record.resetTime <= now) {
    record = {
      count: 1,
      resetTime: now + windowMs
    };
    tracker.set(key, record);
    return {
      success: true,
      allowed: true,
      limit,
      remaining: limit - 1,
      resetTime: record.resetTime
    };
  }

  record.count += 1;

  if (record.count > limit) {
    const retryAfter = Math.max(1, Math.ceil((record.resetTime - now) / 1000));
    return {
      success: false,
      allowed: false,
      limit,
      remaining: 0,
      resetTime: record.resetTime,
      retryAfter
    };
  }

  return {
    success: true,
    allowed: true,
    limit,
    remaining: limit - record.count,
    resetTime: record.resetTime
  };
}
