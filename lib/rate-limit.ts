import { Redis } from "@upstash/redis";

const redis = Redis.fromEnv();

export async function checkRateLimit(identifier: string): Promise<{
  allowed: boolean;
  remaining: number;
  resetAt: Date;
}> {
  const key = `rate-limit:diet-chat:${identifier}`;
  const limit = 5;

  // Get current count
  const count = await redis.get<number>(key);

  if (count === null) {
    // First request of the day
    await redis.set(key, 1, {
      exat: getEndOfDayTimestamp(),
    });
    return {
      allowed: true,
      remaining: limit - 1,
      resetAt: getEndOfDay(),
    };
  }

  if (count >= limit) {
    // Rate limit exceeded
    const ttl = await redis.ttl(key);
    return {
      allowed: false,
      remaining: 0,
      resetAt: new Date(Date.now() + ttl * 1000),
    };
  }

  // Increment count
  await redis.incr(key);

  return {
    allowed: true,
    remaining: 100, // limit - count - 1,
    resetAt: getEndOfDay(),
  };
}

function getEndOfDay(): Date {
  const now = new Date();
  const endOfDay = new Date(now);
  endOfDay.setHours(23, 59, 59, 999);
  return endOfDay;
}

function getEndOfDayTimestamp(): number {
  return Math.floor(getEndOfDay().getTime() / 1000);
}
