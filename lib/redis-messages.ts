import { Redis } from "@upstash/redis";

const redis = Redis.fromEnv();

export interface StoredMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: number;
}

/**
 * Save messages for a user (identified by IP or session)
 * Messages expire after 1 year
 */
export async function saveMessages(
  identifier: string,
  messages: StoredMessage[]
): Promise<void> {
  const key = `diet-messages:${identifier}`;
  const expirationInSeconds = 365 * 24 * 60 * 60; // 1 year

  await redis.set(key, JSON.stringify(messages), {
    ex: expirationInSeconds,
  });
}

/**
 * Load messages for a user
 */
export async function loadMessages(
  identifier: string
): Promise<StoredMessage[]> {
  const key = `diet-messages:${identifier}`;
  const data = await redis.get<StoredMessage[]>(key);

  if (!data) {
    return [];
  }

  try {
    return data as StoredMessage[];
  } catch (error) {
    console.error("Error parsing stored messages:", error);
    return [];
  }
}

/**
 * Clear messages for a user
 */
export async function clearMessages(identifier: string): Promise<void> {
  const key = `diet-messages:${identifier}`;
  await redis.del(key);
}
