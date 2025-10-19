import { streamText, type CoreMessage } from "ai";
import { openai } from "@ai-sdk/openai";
import { checkRateLimit } from "@/lib/rate-limit";

export const maxDuration = 30;

const systemPrompt = `You are a knowledgeable nutrition expert helping users create personalized diet plans based on their micronutrient needs.

Your role is to:
- Create balanced diet plans that meet daily vitamin and mineral requirements
- Consider user preferences (vegetarian, vegan, gluten-free, etc.)
- Suggest specific foods rich in needed micronutrients
- Explain the benefits of different vitamins and minerals
- Provide practical meal suggestions and recipes
- Answer questions about nutrition and dietary choices

Be conversational, supportive, and educational. Keep responses concise but informative.`;

interface SimpleMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
}

export async function POST(req: Request) {
  try {
    console.log("[v0] Diet chat request received");

    const body = await req.json();
    const { messages, userPreferences } = body as {
      messages: SimpleMessage[];
      userPreferences?: { dietType: string; age: string; gender: string };
    };

    console.log("[v0] Messages received:", messages?.length || 0);

    // Get IP address for rate limiting
    const forwarded = req.headers.get("x-forwarded-for");
    const ip = forwarded ? forwarded.split(",")[0] : "unknown";

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

    const coreMessages: CoreMessage[] = messages.map((msg) => ({
      role: msg.role,
      content: msg.content,
    }));

    if (userPreferences && coreMessages.length === 1) {
      const { dietType, age, gender } = userPreferences;
      const contextPrefix = `[User Context: ${dietType} diet, ${age} years old, ${gender}]\n\n`;
      coreMessages[0] = {
        ...coreMessages[0],
        content: contextPrefix + coreMessages[0].content,
      };
    }

    console.log(
      "[v0] Calling streamText with",
      coreMessages.length,
      "messages"
    );

    const result = streamText({
      model: openai("gpt-4o-mini"),
      system: systemPrompt,
      messages: coreMessages,
      temperature: 0.7,
      maxTokens: 1000,
      abortSignal: req.signal,
    });

    return result.toTextStreamResponse({
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
