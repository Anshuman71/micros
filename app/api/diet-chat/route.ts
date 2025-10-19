import { streamText, convertToModelMessages, type UIMessage } from "ai";
import { openai } from "@ai-sdk/openai";
import { checkRateLimit } from "@/lib/rate-limit";
import { saveMessages, type StoredMessage } from "@/lib/redis-messages";
import { getSystemPrompt } from "@/lib/prompts";
import { geolocation } from "@vercel/functions";

export const maxDuration = 30;
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    console.log("[v0] Diet chat request received");

    const body = await req.json();
    const { messages, userPreferences } = body as {
      messages: UIMessage[];
      userPreferences: {
        dietOptions: string[];
        age: string;
        gender: string;
      };
    };

    console.log("[v0] Messages received:", messages?.length || 0);

    // Get IP address for rate limiting
    const forwarded = req.headers.get("x-forwarded-for");
    const ip = forwarded ? forwarded.split(",")[0] : "unknown";

    // Get geolocation hints
    const geo = geolocation(req);
    const requestHints = {
      longitude: parseFloat(geo.longitude || "0"),
      latitude: parseFloat(geo.latitude || "0"),
      city: geo.city || "Unknown",
      country: geo.country || "Unknown",
    };

    // Check rate limit
    const rateLimitResult = await checkRateLimit(ip);

    if (!rateLimitResult.allowed) {
      return new Response(
        JSON.stringify({
          error: "Rate limit exceeded",
          message: `You've reached the daily limit of 5 messages. Please try again after ${rateLimitResult.resetAt.toLocaleTimeString()}.`,
          resetAt: rateLimitResult.resetAt.toISOString(),
        }),
        {
          status: 429,
          headers: {
            "Content-Type": "application/json",
            "X-RateLimit-Remaining": rateLimitResult.remaining.toString(),
            "X-RateLimit-Reset": rateLimitResult.resetAt.toISOString(),
          },
        }
      );
    }

    console.log("[v0] Calling streamText with", messages.length, "messages");

    const result = await streamText({
      model: openai("gpt-4o-mini"),
      system: getSystemPrompt({
        dietOptions: userPreferences?.dietOptions || [],
        age: userPreferences?.age || "",
        gender: userPreferences?.gender || "",
        requestHints: requestHints,
      }),
      messages: convertToModelMessages(messages),
      temperature: 0.7,
    });

    // Save messages after streaming completes (in the background)
    result.text
      .then(async (fullText) => {
        try {
          const allMessages: StoredMessage[] = messages
            .filter((msg) => msg.role === "user" || msg.role === "assistant")
            .map((msg) => {
              const content = msg.parts
                .map((part) => {
                  if (part.type === "text") return part.text;
                  // Handle tool-result parts safely
                  if (part.type.startsWith("tool-")) {
                    return JSON.stringify(part);
                  }
                  return "";
                })
                .join("");

              return {
                id: msg.id,
                role: msg.role as "user" | "assistant",
                content,
                timestamp: Date.now(),
              };
            });

          // Add the assistant's response
          allMessages.push({
            id: Date.now().toString(),
            role: "assistant",
            content: fullText,
            timestamp: Date.now(),
          });

          await saveMessages(ip, allMessages);
          console.log("[v0] Messages saved to Redis for", ip);
        } catch (error) {
          console.error("[v0] Error saving messages:", error);
        }
      })
      .catch((error) => {
        console.error("[v0] Error in text promise:", error);
      });

    // Return the UIMessage stream response as per the official guide
    return result.toUIMessageStreamResponse({
      headers: {
        "X-RateLimit-Remaining": rateLimitResult.remaining.toString(),
        "X-RateLimit-Reset": rateLimitResult.resetAt.toISOString(),
      },
    });
  } catch (error) {
    console.error("[v0] Diet chat error:", error);
    return new Response(
      JSON.stringify({
        error: "Internal server error",
        message: "Failed to process your request. Please try again.",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}
