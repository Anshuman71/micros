"use client";

import type React from "react";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport, type UIMessage } from "ai";
import { customAlphabet, nanoid } from "nanoid";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Spinner } from "@/components/ui/spinner";
import { Response } from "@/components/ai-elements/response";
import { Suggestion, Suggestions } from "@/components/ai-elements/suggestion";
import type { DietPreferences } from "./preferences-modal";

interface DietPlanTabProps {
  preferences: DietPreferences | null;
  onOpenPreferences: () => void;
  chatId: string;
}

type PromptType =
  | "initial"
  | "follow-up"
  | "weekly-meal-plan"
  | "breakfast-options"
  | "mix-and-match";

// Generate a random chat ID
function generateChatId(): string {
  return customAlphabet("0123456789abcdefghijklmnopqrstuvwxyz", 10)();
}

export function DietPlanTab({
  chatId,
  preferences,
  onOpenPreferences,
}: DietPlanTabProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [isGeneratingInitial, setIsGeneratingInitial] = useState(false);
  const [hasGeneratedInitial, setHasGeneratedInitial] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [currentPromptType, setCurrentPromptType] =
    useState<PromptType>("initial");
  const [rateLimitInfo, setRateLimitInfo] = useState<{
    remaining: number;
    resetAt?: string;
  } | null>(null);
  const [input, setInput] = useState("");
  const [isHistoryLoaded, setIsHistoryLoaded] = useState(false);

  // Use the AI SDK's useChat hook for automatic stream handling
  const { messages, sendMessage, status, error, setMessages, stop } = useChat({
    transport: new DefaultChatTransport<UIMessage>({
      api: "/api/diet-chat",
      body: {
        userPreferences: preferences
          ? {
              dietOptions: preferences.dietOptions,
              age: preferences.ageGroup,
              gender: preferences.gender,
            }
          : undefined,
        chatId: chatId,
        promptType: currentPromptType,
      },
    }),
    onFinish: async ({ message, messages: allMessages }) => {
      // Save messages to Redis after each interaction
      if (!chatId) return;

      try {
        const messagesToSave = allMessages.map((msg) => ({
          id: msg.id,
          role: msg.role,
          content: msg.parts
            .map((part) => {
              if ("text" in part) return part.text;
              if ("toolResult" in part) return JSON.stringify(part.toolResult);
              return "";
            })
            .join(""),
          timestamp: Date.now(),
        }));

        await fetch("/api/diet-messages", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ chatId, messages: messagesToSave }),
        });

        // After first assistant response, show suggestions and disable initial loading state
        const hasAssistantMessage = allMessages.some(
          (msg) => msg.role === "assistant"
        );
        if (hasAssistantMessage) {
          setIsGeneratingInitial(false);
          setShowSuggestions(true);
        }
      } catch (error) {
        console.error("Error saving messages:", error);
      }
    },
  });

  // Load persisted messages on mount
  useEffect(() => {
    const loadPersistedMessages = async () => {
      if (!chatId) return;

      try {
        const response = await fetch(`/api/diet-messages?chatId=${chatId}`);
        if (response.ok) {
          const data = await response.json();
          if (data.messages && data.messages.length > 0) {
            // Convert stored messages to UIMessage format
            const uiMessages = data.messages.map((msg: any) => ({
              id: msg.id,
              role: msg.role,
              parts: [{ type: "text", text: msg.content }],
              status: "ready",
            }));
            setMessages(uiMessages);

            // Check if there's at least one assistant message (meaning initial generation is complete)
            const hasAssistantMessage = data.messages.some(
              (msg: any) => msg.role === "assistant"
            );
            const hasUserMessage = data.messages.some(
              (msg: any) => msg.role === "user"
            );

            if (hasAssistantMessage) {
              // Initial generation completed successfully
              setHasGeneratedInitial(true);
              setIsGeneratingInitial(false);
              setShowSuggestions(true);
            } else if (hasUserMessage && !hasAssistantMessage) {
              // User message exists but no assistant response - generation was interrupted
              // Mark as generated to prevent re-triggering, but don't show loading state
              setHasGeneratedInitial(true);
              setIsGeneratingInitial(false);
            }
          }
        }
      } catch (error) {
        console.error("Error loading persisted messages:", error);
      } finally {
        // Mark history as loaded regardless of outcome
        setIsHistoryLoaded(true);
      }
    };

    if (chatId) {
      loadPersistedMessages();
    }
  }, [chatId, setMessages]);

  // Generate initial diet plan when preferences are available
  useEffect(() => {
    if (
      preferences &&
      isHistoryLoaded && // wait for history check to complete
      !hasGeneratedInitial &&
      messages.length === 0 &&
      chatId
    ) {
      generateInitialPlan();
    }
  }, [
    preferences,
    isHistoryLoaded,
    hasGeneratedInitial,
    messages.length,
    chatId,
  ]);

  // Safety mechanism: Clear initial loading state when assistant message appears
  useEffect(() => {
    if (
      isGeneratingInitial &&
      messages.some((msg) => msg.role === "assistant")
    ) {
      setIsGeneratingInitial(false);
      setShowSuggestions(true);
    }
  }, [isGeneratingInitial, messages]);

  const generateInitialPlan = async () => {
    if (!preferences || !chatId) return;

    setHasGeneratedInitial(true);
    setIsGeneratingInitial(true);
    setCurrentPromptType("initial");

    const initialPrompt = `Create a personalized diet plan for me based on my preferences: Diet includes ${preferences.dietOptions.join(
      ", "
    )}, Age group: ${preferences.ageGroup}, Gender: ${
      preferences.gender
    }. Please suggest 10-12 nutrient-dense foods with their serving sizes and micronutrient contributions.`;

    sendMessage({ text: initialPrompt });
  };

  const handleClearChat = async () => {
    if (!chatId) return;

    try {
      const response = await fetch(`/api/diet-messages?chatId=${chatId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        setMessages([]);
        setHasGeneratedInitial(false);
        setShowSuggestions(false);
        setIsGeneratingInitial(false);
        setIsHistoryLoaded(true); // optional, keeps gating consistent

        router.replace(`/diet-plan/${chatId}`);
      }
    } catch (error) {
      console.error("Error clearing chat:", error);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (
      !input.trim() ||
      status === "streaming" ||
      isGeneratingInitial ||
      !chatId
    )
      return;

    setCurrentPromptType("follow-up");
    sendMessage({ text: input });
    setInput("");
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInput(e.target.value);
  };

  const handleSuggestionClick = (suggestion: string) => {
    if (status === "streaming" || isGeneratingInitial || !chatId) return;

    // Determine prompt type based on suggestion
    let promptType: PromptType = "follow-up";
    if (suggestion.includes("weekly meal plan")) {
      promptType = "weekly-meal-plan";
    } else if (suggestion.includes("breakfast")) {
      promptType = "breakfast-options";
    } else if (suggestion.includes("mix and match")) {
      promptType = "mix-and-match";
    }

    setCurrentPromptType(promptType);
    sendMessage({ text: suggestion });

    // Hide suggestions after first click
    setShowSuggestions(false);
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

  const isLoading = status === "streaming" || isGeneratingInitial;
  const isInputDisabled = isGeneratingInitial || status === "streaming";

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
            {messages.length > 0 && (
              <button
                onClick={handleClearChat}
                className="p-2 rounded-md hover:bg-muted transition-colors"
                title="Clear chat history"
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
                    d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                  />
                </svg>
              </button>
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
        <ScrollArea className="h-[60vh] px-6 py-4">
          <div className="space-y-4">
            {messages.length === 0 && isGeneratingInitial && (
              <div className="text-center text-muted-foreground py-8">
                <p className="text-sm">
                  Generating your personalized diet plan...
                </p>
              </div>
            )}

            {messages.map((message) => {
              // Extract text content from message parts
              const textContent = message.parts
                .map((part) => {
                  if ("text" in part) return part.text;
                  if ("toolResult" in part)
                    return JSON.stringify(part.toolResult);
                  return "";
                })
                .join("");

              return (
                <div
                  key={message.id}
                  className={`flex ${
                    message.role === "user" ? "justify-end" : "justify-start"
                  }`}
                >
                  <div
                    className={`rounded-lg px-4 py-3 ${
                      message.role === "user"
                        ? "bg-primary text-primary-foreground max-w-[85%]"
                        : "bg-muted text-foreground w-full"
                    }`}
                  >
                    {message.role === "user" ? (
                      <p className="text-sm whitespace-pre-wrap leading-relaxed">
                        {message.parts
                          .map((part) => {
                            if (part.type === "text") return part.text;
                            return "";
                          })
                          .join("")}
                      </p>
                    ) : (
                      <div className="prose prose-sm max-w-none dark:prose-invert prose-table:text-sm prose-headings:text-foreground prose-th:text-left">
                        <Response parseIncompleteMarkdown={true}>
                          {message.parts
                            .map((part) => {
                              if (part.type === "text") return part.text;
                              if (part.type.startsWith("tool-"))
                                return JSON.stringify(part);
                              return "";
                            })
                            .join("")}
                        </Response>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}

            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-muted rounded-lg px-4 py-3 flex items-center gap-2">
                  <Spinner className="w-4 h-4" />
                  <span className="text-sm text-muted-foreground">
                    {isGeneratingInitial
                      ? "Creating your diet plan..."
                      : "Generating response..."}
                  </span>
                </div>
              </div>
            )}

            {error && (
              <div className="bg-destructive/10 border border-destructive/20 rounded-lg px-4 py-3">
                <p className="text-sm text-destructive font-medium">Error</p>
                <p className="text-xs text-destructive/80 mt-1">
                  {error.message}
                </p>
              </div>
            )}

            {/* Suggestions */}
            {showSuggestions && !isLoading && messages.length > 0 && (
              <div className="pt-4">
                <p className="text-sm text-foreground/60 mb-3">
                  Try these suggestions:
                </p>
                <Suggestions>
                  <Suggestion
                    suggestion="Create a weekly meal plan"
                    onClick={handleSuggestionClick}
                  />
                  <Suggestion
                    suggestion="Suggest breakfast options"
                    onClick={handleSuggestionClick}
                  />
                  <Suggestion
                    suggestion="Mix and match options for variety"
                    onClick={handleSuggestionClick}
                  />
                </Suggestions>
              </div>
            )}
          </div>
        </ScrollArea>

        {/* Chat input */}
        <form
          onSubmit={handleSubmit}
          data-chat-form="true"
          className="p-4 border-t border-border bg-muted/30"
        >
          <div className="flex gap-2">
            <input
              type="text"
              value={input}
              onChange={handleInputChange}
              placeholder={
                isInputDisabled
                  ? "Generating your diet plan..."
                  : "Ask to modify your diet plan, get recipe ideas, or nutrition advice..."
              }
              disabled={isInputDisabled}
              className="flex-1 px-4 py-2 rounded-md border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-50 disabled:cursor-not-allowed"
            />
            <button
              type="submit"
              disabled={isInputDisabled || !input.trim()}
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
