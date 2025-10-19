"use client"

import type React from "react"
import { useState, useRef, useEffect } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogClose,
  DialogPortal,
  DialogOverlay,
} from "@/components/ui/dialog"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Spinner } from "@/components/ui/spinner"

interface DietPlanFormData {
  dietOptions: string[]
  ageGroup: string
  gender: string
}

interface DietPlanDialogProps {
  isOpen: boolean
  onClose: () => void
}

interface Message {
  id: string
  role: "user" | "assistant"
  content: string
}

const DefaultDietOptions = ["Dairy", "Plants", "Legumes", "Meat", "Fish", "Eggs", "Nuts"]
const DefaultAgeOptions = ["4 to 8", "9 to 13", "14 to 50", "51 and above"]
const DEFAULT_GENDERS = ["Male", "Female"]

export function DietPlanDialog({ isOpen, onClose }: DietPlanDialogProps) {
  const [formData, setFormData] = useState<DietPlanFormData>({
    dietOptions: [...DefaultDietOptions],
    ageGroup: "",
    gender: "",
  })
  const [showChat, setShowChat] = useState(false)
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [rateLimitInfo, setRateLimitInfo] = useState<{ remaining: number; resetAt?: string } | null>(null)
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages])

  const handleDietToggle = (option: string) => {
    setFormData((prev) => ({
      ...prev,
      dietOptions: prev.dietOptions.includes(option)
        ? prev.dietOptions.filter((item) => item !== option)
        : [...prev.dietOptions, option],
    }))
  }

  const handlePreferencesSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setShowChat(true)
  }

  const handleChatSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || isLoading) return

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: input.trim(),
    }

    setMessages((prev) => [...prev, userMessage])
    setInput("")
    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch("/api/diet-chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messages: [...messages, userMessage],
          userPreferences: {
            dietType: formData.dietOptions.join(", "),
            age: formData.ageGroup,
            gender: formData.gender,
          },
        }),
      })

      const remaining = response.headers.get("X-RateLimit-Remaining")
      const resetAt = response.headers.get("X-RateLimit-Reset")
      if (remaining) {
        setRateLimitInfo({
          remaining: Number.parseInt(remaining),
          resetAt: resetAt || undefined,
        })
      }

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to get response")
      }

      const reader = response.body?.getReader()
      const decoder = new TextDecoder()
      let assistantMessage = ""

      if (reader) {
        const assistantMessageId = (Date.now() + 1).toString()

        while (true) {
          const { done, value } = await reader.read()
          if (done) break

          const chunk = decoder.decode(value)
          const lines = chunk.split("\n")

          for (const line of lines) {
            if (line.startsWith("0:")) {
              try {
                const jsonStr = line.slice(2)
                const parsed = JSON.parse(jsonStr)
                if (parsed && typeof parsed === "string") {
                  assistantMessage += parsed
                  setMessages((prev) => {
                    const existing = prev.find((m) => m.id === assistantMessageId)
                    if (existing) {
                      return prev.map((m) => (m.id === assistantMessageId ? { ...m, content: assistantMessage } : m))
                    }
                    return [
                      ...prev,
                      {
                        id: assistantMessageId,
                        role: "assistant" as const,
                        content: assistantMessage,
                      },
                    ]
                  })
                }
              } catch (e) {
                console.error("[v0] Parse error:", e)
              }
            }
          }
        }
      }
    } catch (err) {
      console.error("[v0] Chat error:", err)
      setError(err instanceof Error ? err.message : "An error occurred")
    } finally {
      setIsLoading(false)
    }
  }

  const handleReset = () => {
    setShowChat(false)
    setMessages([])
    setInput("")
    setError(null)
    setFormData({
      dietOptions: [...DefaultDietOptions],
      ageGroup: "",
      gender: "",
    })
  }

  const handleDialogClose = () => {
    handleReset()
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleDialogClose}>
      <DialogPortal>
        <DialogOverlay />
        <DialogContent className="max-w-2xl max-h-[85vh]">
          <DialogHeader>
            <DialogTitle>{showChat ? "AI Diet Plan Assistant" : "Create Diet Plan"}</DialogTitle>
            <DialogClose />
          </DialogHeader>

          {!showChat ? (
            <form onSubmit={handlePreferencesSubmit} className="p-6 space-y-6">
              <div>
                <label className="block text-sm font-semibold text-foreground mb-3">Diet Options</label>
                <div className="grid grid-cols-4 gap-2">
                  {DefaultDietOptions.map((option) => (
                    <button
                      key={option}
                      type="button"
                      onClick={() => handleDietToggle(option)}
                      className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                        formData.dietOptions.includes(option)
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted text-muted-foreground hover:bg-muted/80"
                      }`}
                    >
                      {option}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-foreground mb-3">Age Group</label>
                <div className="space-y-2">
                  {DefaultAgeOptions.map((group) => (
                    <label key={group} className="flex items-center gap-3 cursor-pointer">
                      <input
                        type="radio"
                        name="ageGroup"
                        value={group}
                        checked={formData.ageGroup === group}
                        onChange={(e) => setFormData((prev) => ({ ...prev, ageGroup: e.target.value }))}
                        className="w-4 h-4 accent-primary"
                      />
                      <span className="text-foreground">{group}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-foreground mb-3">Gender</label>
                <div className="space-x-2 flex flex-row">
                  {DEFAULT_GENDERS.map((gender) => (
                    <label key={gender} className="flex items-center gap-3 cursor-pointer">
                      <input
                        type="radio"
                        name="gender"
                        value={gender}
                        checked={formData.gender === gender}
                        onChange={(e) => setFormData((prev) => ({ ...prev, gender: e.target.value }))}
                        className="w-4 h-4 accent-primary"
                      />
                      <span className="text-foreground">{gender}</span>
                    </label>
                  ))}
                </div>
              </div>

              <button
                type="submit"
                disabled={!formData.ageGroup || !formData.gender || formData.dietOptions.length === 0}
                className="w-full bg-primary text-primary-foreground py-2 rounded-md font-semibold hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Start Chat
              </button>
            </form>
          ) : (
            <div className="flex flex-col h-[60vh]">
              {rateLimitInfo && (
                <div className="px-6 py-2 bg-muted/50 text-xs text-muted-foreground border-b">
                  {rateLimitInfo.remaining} messages remaining today
                </div>
              )}

              <ScrollArea className="flex-1 px-6 py-4" ref={scrollRef}>
                <div className="space-y-4">
                  {messages.length === 0 && (
                    <div className="text-center text-muted-foreground py-8">
                      <p className="text-sm">
                        Hi! I'm your AI nutrition assistant. I'll help you create a personalized diet plan based on your
                        preferences.
                      </p>
                      <p className="text-xs mt-2">Ask me anything about nutrition, meal planning, or specific foods!</p>
                    </div>
                  )}

                  {messages.map((message) => (
                    <div
                      key={message.id}
                      className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
                    >
                      <div
                        className={`max-w-[80%] rounded-lg px-4 py-2 ${
                          message.role === "user" ? "bg-primary text-primary-foreground" : "bg-muted text-foreground"
                        }`}
                      >
                        <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                      </div>
                    </div>
                  ))}

                  {isLoading && (
                    <div className="flex justify-start">
                      <div className="bg-muted rounded-lg px-4 py-2 flex items-center gap-2">
                        <Spinner className="w-4 h-4" />
                        <span className="text-sm text-muted-foreground">Thinking...</span>
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

              <form onSubmit={handleChatSubmit} className="p-4 border-t">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Ask about your diet plan..."
                    disabled={isLoading}
                    className="flex-1 px-4 py-2 rounded-md border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-50"
                  />
                  <button
                    type="submit"
                    disabled={isLoading || !input.trim()}
                    className="px-4 py-2 bg-primary text-primary-foreground rounded-md font-semibold hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    Send
                  </button>
                </div>
                <button
                  type="button"
                  onClick={handleReset}
                  className="mt-2 text-xs text-muted-foreground hover:text-foreground transition-colors"
                >
                  ← Change preferences
                </button>
              </form>
            </div>
          )}
        </DialogContent>
      </DialogPortal>
    </Dialog>
  )
}
