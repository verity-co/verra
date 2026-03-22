"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { Mic, MicOff, Send } from "lucide-react"
import ReactMarkdown from "react-markdown"

import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Card } from "@/components/ui/card"
import { cn } from "@/lib/utils"

// --- Speech Recognition Interfaces ---
interface SpeechRecognitionEvent extends Event {
  readonly resultIndex: number;
  readonly results: SpeechRecognitionResultList;
}

interface SpeechRecognitionResultList {
  readonly length: number;
  item(index: number): SpeechRecognitionResult;
  [index: number]: SpeechRecognitionResult;
}

interface SpeechRecognitionResult {
  readonly length: number;
  item(index: number): SpeechRecognitionAlternative;
  [index: number]: SpeechRecognitionAlternative;
  readonly isFinal: boolean;
}

interface SpeechRecognitionAlternative {
  readonly transcript: string;
  readonly confidence: number;
}

type SpeechRecognitionConstructor = new () => {
  lang: string
  onstart: (() => void) | null
  onend: (() => void) | null
  onerror: (() => void) | null
  onresult: ((event: SpeechRecognitionEvent) => void) | null
  start: () => void
}

type BrowserWindow = Window & {
  SpeechRecognition?: SpeechRecognitionConstructor
  webkitSpeechRecognition?: SpeechRecognitionConstructor
}

type StreamEventPayload = {
  text?: string
  suggestedIndustry?: string
  error?: string
}

type JournalMessage = {
  id: string
  content: string
  ai_response: string
  created_at: string | null
}

// FIX 1: Role is "model" consistently everywhere — matches Gemini's convention and the API
type Message = {
  id: string
  role: "user" | "model"
  content: string
  isStreaming?: boolean
}

type Props = {
  initialMessages: JournalMessage[]
  studentId: string
}

export default function JournalChat({ initialMessages }: Props) {
  const router = useRouter()
  const speechWindow =
    typeof window === "undefined" ? null : (window as BrowserWindow)

  const [messages, setMessages] = React.useState<Message[]>(() => {
    return initialMessages.flatMap((entry) => [
      { id: `${entry.id}:u`, role: "user", content: entry.content },
      { id: `${entry.id}:m`, role: "model", content: entry.ai_response },
    ])
  })

  const [input, setInput] = React.useState("")
  const [loading, setLoading] = React.useState(false)
  const [hasFirstChunk, setHasFirstChunk] = React.useState(false)
  const [listening, setListening] = React.useState(false)
  const [speechSupported, setSpeechSupported] = React.useState(false)
  const [suggestions, setSuggestions] = React.useState<{ entryId: string; industry?: string }[]>([])

  const scrollRef = React.useRef<HTMLDivElement | null>(null)
  const textareaRef = React.useRef<HTMLTextAreaElement | null>(null)

  React.useEffect(() => {
    const supported =
      Boolean(
        speechWindow?.SpeechRecognition || speechWindow?.webkitSpeechRecognition,
      )
    setSpeechSupported(Boolean(supported))
  }, [speechWindow])

  React.useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight
  }, [messages, loading, suggestions])

  React.useEffect(() => {
    if (!textareaRef.current) return
    const el = textareaRef.current
    el.style.height = "auto"
    el.style.height = `${Math.min(el.scrollHeight, 96)}px`
  }, [input])

  async function handleSend() {
    const trimmed = input.trim()
    if (!trimmed || loading) return

    setInput("")
    setLoading(true)
    setHasFirstChunk(false)

    const userId = `u-${Date.now()}`
    const assistantId = `m-${Date.now()}`

    // Build history from current messages before adding the new user message
    const history = messages.map((m) => ({ role: m.role, content: m.content }))

    setMessages((prev) => [
      ...prev,
      { id: userId, role: "user", content: trimmed },
      { id: assistantId, role: "model", content: "", isStreaming: true },
    ])

    try {
      const res = await fetch("/api/journal", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "text/event-stream",
        },
        body: JSON.stringify({
          message: trimmed,
          conversationHistory: history,
        }),
      })

      if (!res.ok || !res.body) throw new Error("Failed to connect to API")

      const reader = res.body.getReader()
      const decoder = new TextDecoder()
      let accumulatedContent = ""
      // FIX 2: Shared flag so [DONE] can break out of BOTH the inner for-loop
      // and signal the outer while-loop to stop reading.
      let streamDone = false

      while (!streamDone) {
        const { done, value } = await reader.read()
        if (done) break

        const chunk = decoder.decode(value, { stream: true })
        const lines = chunk.split("\n")

        for (const line of lines) {
          if (!line.startsWith("data: ")) continue
          const jsonStr = line.replace("data: ", "").trim()

          // FIX 3: Set the shared flag so the outer while-loop exits cleanly
          if (jsonStr === "[DONE]") {
            streamDone = true
            break
          }

          try {
            const data = JSON.parse(jsonStr) as StreamEventPayload

            if (data.text) {
              setHasFirstChunk(true)
              accumulatedContent += data.text
              setMessages((prev) =>
                prev.map((m) =>
                  m.id === assistantId ? { ...m, content: accumulatedContent } : m
                )
              )
            }

            if (data.suggestedIndustry) {
              setSuggestions((prev) => [
                ...prev,
                { entryId: assistantId, industry: data.suggestedIndustry },
              ])
            }

            if (data.error) {
              console.error("API error in stream:", data.error)
              streamDone = true
              break
            }
          } catch {
            // Partial or malformed JSON chunk — safe to skip
          }
        }
      }
    } catch (error) {
      console.error("Journal API error:", error)
    } finally {
      setMessages((prev) =>
        prev.map((m) => (m.id === assistantId ? { ...m, isStreaming: false } : m))
      )
      setLoading(false)
      router.refresh()
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  function startListening() {
    if (!speechSupported || listening) return
    const SpeechRecognition =
      speechWindow?.SpeechRecognition || speechWindow?.webkitSpeechRecognition
    if (!SpeechRecognition) return
    const recognition = new SpeechRecognition()
    recognition.lang = "en-AU"
    recognition.onstart = () => setListening(true)
    recognition.onend = () => setListening(false)
    recognition.onerror = () => setListening(false)
    recognition.onresult = (event: SpeechRecognitionEvent) => {
      const transcript = event.results[0][0].transcript
      setInput((prev) => (prev ? `${prev} ${transcript}` : transcript))
    }
    recognition.start()
  }

  return (
    <main className="flex h-[calc(100vh-56px)] flex-col bg-zinc-50 dark:bg-zinc-950">
      <div className="border-b border-zinc-200 bg-white/80 px-4 py-3 backdrop-blur-md dark:border-zinc-800 dark:bg-black/80">
        <div className="mx-auto flex w-full max-w-3xl flex-col gap-1">
          <h1 className="text-sm font-semibold text-zinc-950 dark:text-zinc-50">AI Career Advisor</h1>
          <p className="text-xs text-zinc-600 dark:text-zinc-400">A quiet space to think out loud.</p>
        </div>
      </div>

      <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col px-4 pb-3 pt-4 overflow-hidden">
        <div ref={scrollRef} className="flex-1 space-y-4 overflow-y-auto pr-1 scrollbar-hide">
          {messages.length === 0 && (
            <div className="mt-8 text-center text-sm text-zinc-500">
              Share whatever&apos;s on your mind...
            </div>
          )}

          {messages.map((m) => {
            const suggestion = suggestions.find((s) => s.entryId === m.id)
            const isUser = m.role === "user"

            return (
              <div
                key={m.id}
                className={cn("flex w-full", isUser ? "justify-end" : "justify-start items-start gap-2")}
              >
                {!isUser && (
                  <div className="mt-1 flex size-7 shrink-0 items-center justify-center rounded-full bg-amber-100 text-sm dark:bg-amber-900/40">
                    ☕
                  </div>
                )}
                <div className={cn("max-w-[85%] space-y-2", isUser ? "flex justify-end" : "")}>
                  <Card
                    className={cn(
                      "px-3 py-2 text-sm shadow-sm",
                      isUser
                        ? "bg-zinc-900 text-zinc-50 dark:bg-zinc-50 dark:text-zinc-900 rounded-2xl rounded-tr-none"
                        : "bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 text-zinc-800 dark:text-zinc-100 rounded-2xl rounded-tl-none"
                    )}
                  >
                    {!hasFirstChunk && m.isStreaming ? (
                      <span className="flex gap-1 py-1">
                        <span className="size-1.5 animate-bounce rounded-full bg-zinc-400" />
                        <span className="size-1.5 animate-bounce rounded-full bg-zinc-400 [animation-delay:0.2s]" />
                        <span className="size-1.5 animate-bounce rounded-full bg-zinc-400 [animation-delay:0.4s]" />
                      </span>
                    ) : (
                      <div className="prose prose-sm dark:prose-invert max-w-none prose-p:my-1 prose-ul:my-1 prose-li:my-0.5 prose-strong:font-semibold">
                        <ReactMarkdown>{m.content}</ReactMarkdown>
                        {m.isStreaming && (
                          <span className="ml-1 inline-block h-4 w-1 animate-pulse bg-zinc-400" />
                        )}
                      </div>
                    )}
                  </Card>

                  {suggestion && (
                    <Card className="border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-900 dark:border-amber-900/50 dark:bg-amber-950/30 dark:text-amber-100">
                      <div className="flex items-center justify-between gap-4">
                        <p>
                          Talk to someone in <span className="font-bold">{suggestion.industry}</span>?
                        </p>
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-7 border-amber-300 bg-amber-100 px-2 text-[11px] hover:bg-amber-200 dark:border-amber-800 dark:bg-amber-900/20"
                          onClick={() =>
                            router.push(
                              `/professionals?industry=${encodeURIComponent(suggestion.industry ?? "")}`
                            )
                          }
                        >
                          Browse Professionals
                        </Button>
                      </div>
                    </Card>
                  )}
                </div>
              </div>
            )
          })}
        </div>

        {/* Input Area */}
        <div className="mt-4 border-t border-zinc-200 pt-4 dark:border-zinc-800">
          <div className="flex items-end gap-2">
            <div className="relative flex-1">
              <Textarea
                ref={textareaRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="How are you feeling about your career path?"
                className="min-h-[44px] w-full resize-none rounded-xl border-zinc-200 bg-white pr-10 focus-visible:ring-zinc-400 dark:border-zinc-800 dark:bg-zinc-900"
              />
            </div>
            <div className="flex gap-2">
              <Button
                size="icon"
                variant={listening ? "destructive" : "outline"}
                disabled={!speechSupported || loading}
                onClick={startListening}
                className={cn("size-10 rounded-xl", listening && "animate-pulse")}
              >
                {listening ? <MicOff className="size-4" /> : <Mic className="size-4" />}
              </Button>
              <Button
                size="icon"
                onClick={handleSend}
                disabled={loading || !input.trim()}
                className="size-10 rounded-xl bg-zinc-900 hover:bg-zinc-800 dark:bg-zinc-50 dark:hover:bg-zinc-200"
              >
                <Send className="size-4" />
              </Button>
            </div>
          </div>
          <p className="mt-2 text-center text-[10px] text-zinc-400">
            {listening ? "Listening..." : "Your conversation is saved to your profile."}
          </p>
        </div>
      </div>
    </main>
  )
}
