import {
  loadMessages,
  clearMessages,
  saveMessages,
  type StoredMessage,
} from "@/lib/redis-messages";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { messages } = body as { messages: StoredMessage[] };

    // Get IP address for identifying the user
    const forwarded = req.headers.get("x-forwarded-for");
    const ip = forwarded ? forwarded.split(",")[0] : "unknown";

    await saveMessages(ip, messages);

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
    // Get IP address for identifying the user
    const forwarded = req.headers.get("x-forwarded-for");
    const ip = forwarded ? forwarded.split(",")[0] : "unknown";

    const messages = await loadMessages(ip);

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
    // Get IP address for identifying the user
    const forwarded = req.headers.get("x-forwarded-for");
    const ip = forwarded ? forwarded.split(",")[0] : "unknown";

    await clearMessages(ip);

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
