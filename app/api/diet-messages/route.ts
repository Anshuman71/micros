import {
  loadMessages,
  clearMessages,
  saveMessages,
  type StoredMessage,
} from "@/lib/redis-messages";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { chatId, messages } = body as {
      chatId: string;
      messages: StoredMessage[];
    };

    if (!chatId) {
      return new Response(
        JSON.stringify({
          error: "Bad request",
          message: "chatId is required",
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    await saveMessages(chatId, messages);

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("[v0] Error saving messages:", error);
    return new Response(
      JSON.stringify({
        error: "Internal server error",
        message: "Failed to save messages",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const chatId = url.searchParams.get("chatId");

    if (!chatId) {
      return new Response(
        JSON.stringify({
          error: "Bad request",
          message: "chatId query parameter is required",
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    const messages = await loadMessages(chatId);

    return new Response(JSON.stringify({ messages }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("[v0] Error loading messages:", error);
    return new Response(
      JSON.stringify({
        error: "Internal server error",
        message: "Failed to load messages",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}

export async function DELETE(req: Request) {
  try {
    const url = new URL(req.url);
    const chatId = url.searchParams.get("chatId");

    if (!chatId) {
      return new Response(
        JSON.stringify({
          error: "Bad request",
          message: "chatId query parameter is required",
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    await clearMessages(chatId);

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("[v0] Error clearing messages:", error);
    return new Response(
      JSON.stringify({
        error: "Internal server error",
        message: "Failed to clear messages",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}
