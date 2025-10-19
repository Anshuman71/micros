"use client";

import type React from "react";

import { useState, useEffect, useRef } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Spinner } from "@/components/ui/spinner";
import type { DietPreferences } from "./preferences-modal";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
}

interface DietPlanTabProps {
  preferences: DietPreferences | null;
  onOpenPreferences: () => void;
}

export function DietPlanTab({
  preferences,
  onOpenPreferences,
}: DietPlanTabProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [rateLimitInfo, setRateLimitInfo] = useState<{
    remaining: number;
    resetAt?: string;
  } | null>(null);
  const [hasGeneratedInitial, setHasGeneratedInitial] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  // Generate initial diet plan when preferences are available
  useEffect(() => {
    if (preferences && !hasGeneratedInitial && messages.length === 0) {
      generateInitialPlan();
    }
  }, [preferences, hasGeneratedInitial]);

  const generateInitialPlan = async () => {
    if (!preferences) return;

    setIsLoading(true);
    setError(null);

    const initialPrompt = `Create a personalized diet plan for me based on my preferences: Diet includes ${preferences.dietOptions.join(
      ", "
    )}, Age group: ${preferences.ageGroup}, Gender: ${
      preferences.gender
    }. Please provide a comprehensive weekly meal plan with micronutrient considerations.`;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: initialPrompt,
    };

    setMessages([userMessage]);

    try {
      const response = await fetch("/api/diet-chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messages: [userMessage],
          userPreferences: {
            dietType: preferences.dietOptions.join(", "),
            age: preferences.ageGroup,
            gender: preferences.gender,
          },
        }),
      });

      const remaining = response.headers.get("X-RateLimit-Remaining");
      const resetAt = response.headers.get("X-RateLimit-Reset");
      if (remaining) {
        setRateLimitInfo({
          remaining: Number.parseInt(remaining),
          resetAt: resetAt || undefined,
        });
      }

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to generate diet plan");
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let assistantMessage = "";

      if (reader) {
        const assistantMessageId = (Date.now() + 1).toString();

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value);
          const lines = chunk.split("\n");

          for (const line of lines) {
            if (line.startsWith("0:")) {
              try {
                const jsonStr = line.slice(2);
                const parsed = JSON.parse(jsonStr);
                if (parsed && typeof parsed === "string") {
                  assistantMessage += parsed;
                  setMessages((prev) => {
                    const existing = prev.find(
                      (m) => m.id === assistantMessageId
                    );
                    if (existing) {
                      return prev.map((m) =>
                        m.id === assistantMessageId
                          ? { ...m, content: assistantMessage }
                          : m
                      );
                    }
                    return [
                      ...prev,
                      {
                        id: assistantMessageId,
                        role: "assistant" as const,
                        content: assistantMessage,
                      },
                    ];
                  });
                }
              } catch (e) {
                // Ignore parse errors
              }
            }
          }
        }
      }

      setHasGeneratedInitial(true);
    } catch (err) {
      console.error("[v0] Diet plan generation error:", err);
      setError(
        err instanceof Error ? err.message : "Failed to generate diet plan"
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleChatSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading || !preferences) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: input.trim(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/diet-chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messages: [...messages, userMessage],
          userPreferences: {
            dietType: preferences.dietOptions.join(", "),
            age: preferences.ageGroup,
            gender: preferences.gender,
          },
        }),
      });

      const remaining = response.headers.get("X-RateLimit-Remaining");
      const resetAt = response.headers.get("X-RateLimit-Reset");
      if (remaining) {
        setRateLimitInfo({
          remaining: Number.parseInt(remaining),
          resetAt: resetAt || undefined,
        });
      }

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to get response");
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let assistantMessage = "";

      if (reader) {
        const assistantMessageId = (Date.now() + 1).toString();

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value);
          const lines = chunk.split("\n");

          for (const line of lines) {
            if (line.startsWith("0:")) {
              try {
                const jsonStr = line.slice(2);
                const parsed = JSON.parse(jsonStr);
                if (parsed && typeof parsed === "string") {
                  assistantMessage += parsed;
                  setMessages((prev) => {
                    const existing = prev.find(
                      (m) => m.id === assistantMessageId
                    );
                    if (existing) {
                      return prev.map((m) =>
                        m.id === assistantMessageId
                          ? { ...m, content: assistantMessage }
                          : m
                      );
                    }
                    return [
                      ...prev,
                      {
                        id: assistantMessageId,
                        role: "assistant" as const,
                        content: assistantMessage,
                      },
                    ];
                  });
                }
              } catch (e) {
                // Ignore parse errors
              }
            }
          }
        }
      }
    } catch (err) {
      console.error("[v0] Chat error:", err);
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  // Show preferences prompt if no preferences set
  if (!preferences) {
    return (
      <div className="max-w-3xl mx-auto py-16 px-6 text-center">
        <div className="bg-card border border-border rounded-lg p-8 shadow-sm">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-primary/10 flex items-center justify-center">
            <svg
              className="w-8 h-8 text-primary"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 6v6m0 0v6m0-6h6m-6 0H6"
              />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-foreground mb-2">
            Create Your Personalized Diet Plan
          </h2>
          <p className="text-foreground/60 mb-6">
            Get started by setting your dietary preferences, age group, and
            gender. Our AI will create a customized meal plan tailored to your
            micronutrient needs.
          </p>
          <button
            onClick={onOpenPreferences}
            className="px-6 py-3 bg-primary text-primary-foreground rounded-md font-semibold hover:bg-primary/90 transition-colors"
          >
            Set Preferences
          </button>
        </div>
      </div>
    );
  }

  // Show chat interface with diet plan
  return (
    <div className="max-w-5xl mx-auto">
      <div className="bg-card border border-border rounded-lg shadow-sm overflow-hidden">
        {/* Header with rate limit info */}
        <div className="px-6 py-4 border-b border-border bg-muted/30 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-foreground">
              Your Personalized Diet Plan
            </h2>
            <p className="text-sm text-foreground/60">
              Based on: {preferences.dietOptions.join(", ")} •{" "}
              {preferences.ageGroup} • {preferences.gender}
            </p>
          </div>
          <div className="flex items-center gap-3">
            {rateLimitInfo && (
              <div className="text-xs text-muted-foreground">
                {rateLimitInfo.remaining} messages remaining today
              </div>
            )}
            <button
              onClick={onOpenPreferences}
              className="p-2 rounded-md hover:bg-muted transition-colors"
              title="Edit preferences"
            >
              <svg
                className="w-5 h-5 text-foreground/60 hover:text-foreground"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                />
              </svg>
            </button>
          </div>
        </div>

        {/* Chat messages */}
        <ScrollArea className="h-[60vh] px-6 py-4" ref={scrollRef}>
          <div className="space-y-4">
            {messages.length === 0 && !isLoading && (
              <div className="text-center text-muted-foreground py-8">
                <p className="text-sm">
                  Generating your personalized diet plan...
                </p>
              </div>
            )}

            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${
                  message.role === "user" ? "justify-end" : "justify-start"
                }`}
              >
                <div
                  className={`max-w-[85%] rounded-lg px-4 py-3 ${
                    message.role === "user"
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-foreground prose prose-sm max-w-none"
                  }`}
                >
                  <p className="text-sm whitespace-pre-wrap leading-relaxed">
                    {message.content}
                  </p>
                </div>
              </div>
            ))}

            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-muted rounded-lg px-4 py-3 flex items-center gap-2">
                  <Spinner className="w-4 h-4" />
                  <span className="text-sm text-muted-foreground">
                    Generating response...
                  </span>
                </div>
              </div>
            )}

            {error && (
              <div className="bg-destructive/10 border border-destructive/20 rounded-lg px-4 py-3">
                <p className="text-sm text-destructive font-medium">Error</p>
                <p className="text-xs text-destructive/80 mt-1">{error}</p>
              </div>
            )}
          </div>
        </ScrollArea>

        {/* Chat input */}
        <form
          onSubmit={handleChatSubmit}
          className="p-4 border-t border-border bg-muted/30"
        >
          <div className="flex gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask to modify your diet plan, get recipe ideas, or nutrition advice..."
              disabled={isLoading}
              className="flex-1 px-4 py-2 rounded-md border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-50"
            />
            <button
              type="submit"
              disabled={isLoading || !input.trim()}
              className="px-6 py-2 bg-primary text-primary-foreground rounded-md font-semibold hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Send
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
