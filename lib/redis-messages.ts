import { Redis } from "@upstash/redis";

const redis = Redis.fromEnv();

export interface StoredMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: number;
}

/**
 * Save messages for a chat (identified by chatId)
 * Messages expire after 1 year
 */
export async function saveMessages(
  chatId: string,
  messages: StoredMessage[]
): Promise<void> {
  const key = `diet-messages:${chatId}`;
  const expirationInSeconds = 365 * 24 * 60 * 60; // 1 year

  await redis.set(key, JSON.stringify(messages), {
    ex: expirationInSeconds,
  });
}

/**
 * Load messages for a chat
 */
export async function loadMessages(chatId: string): Promise<StoredMessage[]> {
  const key = `diet-messages:${chatId}`;
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
 * Clear messages for a chat
 */
export async function clearMessages(chatId: string): Promise<void> {
  const key = `diet-messages:${chatId}`;
  await redis.del(key);
}
