"use client"

import { useState, useRef, useEffect, useCallback, useMemo } from "react"
import { useAssessment } from "@/lib/assessment-context"
import { useAuth } from "@/lib/auth-context"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Send,
  Bot,
  Sparkles,
  Loader2,
  Brain,
  Trash2,
  Mic,
  Gamepad2,
  PenTool,
  ScanLine,
  Activity,
  ArrowDown,
  Copy,
  Check,
  Clock,
  ShieldCheck,
} from "lucide-react"

interface ChatMessage {
  id: string
  role: "user" | "assistant"
  content: string
  timestamp: Date
}

const SUGGESTION_GROUPS = [
  {
    label: "Results",
    items: [
      "Summarize all my test results",
      "What does my speech analysis score mean?",
      "Explain my cognitive test performance",
    ],
  },
  {
    label: "Risk",
    items: [
      "Am I at risk for dementia?",
      "What does my risk score indicate?",
      "Compare my results with normal ranges",
    ],
  },
  {
    label: "Guidance",
    items: [
      "What should I do next?",
      "How can I improve my brain health?",
      "When should I get tested again?",
    ],
  },
  {
    label: "Learn",
    items: [
      "Explain the clock drawing test",
      "What is MRI analysis used for?",
      "How does dementia screening work?",
    ],
  },
]

export function ChatView() {
  const { user } = useAuth()
  const { currentSpeech, currentCognitive, currentDrawing, currentMri, currentRisk, history } = useAssessment()
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [showScrollBtn, setShowScrollBtn] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [])

  useEffect(() => {
    scrollToBottom()
  }, [messages, scrollToBottom])

  useEffect(() => {
    const container = scrollContainerRef.current
    if (!container) return
    const onScroll = () => {
      const distFromBottom = container.scrollHeight - container.scrollTop - container.clientHeight
      setShowScrollBtn(distFromBottom > 200)
    }
    container.addEventListener("scroll", onScroll)
    return () => container.removeEventListener("scroll", onScroll)
  }, [])

  const completedTests = useMemo(() => {
    const tests: { name: string; icon: typeof Mic; score: number }[] = []
    if (currentSpeech) tests.push({ name: "Speech", icon: Mic, score: currentSpeech.score })
    if (currentCognitive) tests.push({ name: "Cognitive", icon: Gamepad2, score: currentCognitive.score })
    if (currentDrawing) tests.push({ name: "Drawing", icon: PenTool, score: currentDrawing.score })
    if (currentMri) tests.push({ name: "MRI", icon: ScanLine, score: currentMri.overallScore })
    return tests
  }, [currentSpeech, currentCognitive, currentDrawing, currentMri])

  const assessmentContext = useMemo(() => {
    const parts: string[] = []
    parts.push(`Patient: ${user?.name ?? "Unknown"}, Role: ${user?.role ?? "patient"}`)
    if (currentSpeech) {
      parts.push(`\nSPEECH ANALYSIS (Score: ${currentSpeech.score}/100):`)
      parts.push(`  Vocabulary Richness: ${currentSpeech.vocabularyRichness}%, Sentence Complexity: ${currentSpeech.sentenceComplexity}%`)
      parts.push(`  Word Repetition: ${currentSpeech.wordRepetition}%, Speech Pauses: ${currentSpeech.speechPauses}%, Speech Rate: ${currentSpeech.speechRate}%`)
      if (currentSpeech.aiSummary) parts.push(`  AI Summary: ${currentSpeech.aiSummary}`)
    }
    if (currentCognitive) {
      parts.push(`\nCOGNITIVE TESTS (Score: ${currentCognitive.score}/100):`)
      parts.push(`  Word Recall: ${currentCognitive.wordRecall.accuracy}% accuracy, ${currentCognitive.wordRecall.reactionTime}ms`)
      parts.push(`  Number Sequence: ${currentCognitive.numberSequence.accuracy}%, Object Recognition: ${currentCognitive.objectRecognition.accuracy}%`)
      parts.push(`  Pattern Recognition: ${currentCognitive.patternRecognition.accuracy}%`)
      if (currentCognitive.aiSummary) parts.push(`  AI Summary: ${currentCognitive.aiSummary}`)
    }
    if (currentDrawing) {
      parts.push(`\nDRAWING TEST (Score: ${currentDrawing.score}/100):`)
      parts.push(`  Shape: ${currentDrawing.shapeDistortion}%, Numbers: ${currentDrawing.numberPlacement}%, Symmetry: ${currentDrawing.symmetry}%, Tremor: ${currentDrawing.tremorDetection}%`)
      if (currentDrawing.aiSummary) parts.push(`  AI Summary: ${currentDrawing.aiSummary}`)
    }
    if (currentMri) {
      parts.push(`\nMRI ANALYSIS (Score: ${currentMri.overallScore}/100, Risk: ${currentMri.riskLevel}):`)
      parts.push(`  Hippocampal: ${currentMri.hippocampalVolume}%, Cortical: ${currentMri.corticalAtrophy}%, White Matter: ${currentMri.whiteMatterIntegrity}%`)
      parts.push(`  Summary: ${currentMri.summary}`)
    }
    if (currentRisk) {
      parts.push(`\nOVERALL RISK: Score ${currentRisk.overallScore}/100, Level: ${currentRisk.riskLevel}, Confidence: ${currentRisk.confidence}%`)
      if (currentRisk.insights.length > 0) parts.push(`  Insights: ${currentRisk.insights.join("; ")}`)
    }
    if (history.length > 0) {
      parts.push(`\nHISTORY: ${history.length} previous assessments.`)
      const latest = history[history.length - 1]
      if (latest.risk) parts.push(`  Most recent: ${latest.date}, Score: ${latest.risk.overallScore}/100, Risk: ${latest.risk.riskLevel}`)
    }
    return parts.join("\n")
  }, [currentSpeech, currentCognitive, currentDrawing, currentMri, currentRisk, history, user])

  const sendMessage = useCallback(async (text: string) => {
    if (!text.trim() || isLoading) return
    const userMsg: ChatMessage = { id: `u-${Date.now()}`, role: "user", content: text.trim(), timestamp: new Date() }
    setMessages((prev) => [...prev, userMsg])
    setInput("")
    setIsLoading(true)
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text.trim(), assessmentContext }),
      })
      const data = await res.json()
      setMessages((prev) => [...prev, {
        id: `b-${Date.now()}`,
        role: "assistant",
        content: data.reply || "I was unable to generate a response. Please try again.",
        timestamp: new Date(),
      }])
    } catch {
      setMessages((prev) => [...prev, {
        id: `e-${Date.now()}`,
        role: "assistant",
        content: "I'm having trouble connecting right now. Please try again in a moment.",
        timestamp: new Date(),
      }])
    } finally {
      setIsLoading(false)
    }
  }, [isLoading, assessmentContext])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    sendMessage(input)
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      sendMessage(input)
    }
  }

  const copyMessage = (id: string, content: string) => {
    navigator.clipboard.writeText(content)
    setCopiedId(id)
    setTimeout(() => setCopiedId(null), 2000)
  }

  const initials = user?.name?.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2) ?? "U"

  const hasData = completedTests.length > 0

  return (
    <div className="mx-auto flex h-[calc(100vh-7rem)] max-w-5xl flex-col">
      {/* Header */}
      <div className="mb-4 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
              <Brain className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-foreground">NeuroSense AI Assistant</h1>
              <p className="text-sm text-muted-foreground">Powered by Google Gemini -- ask anything about your cognitive health</p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {messages.length > 0 && (
            <Button variant="outline" size="sm" onClick={() => { setMessages([]); }}>
              <Trash2 className="mr-2 h-3.5 w-3.5" />
              Clear Chat
            </Button>
          )}
          <Badge variant="outline" className="gap-1.5 border-primary/30 text-primary">
            <ShieldCheck className="h-3 w-3" />
            HIPAA Compliant
          </Badge>
        </div>
      </div>

      {/* Data Context Bar */}
      {hasData && (
        <div className="mb-4 flex flex-wrap items-center gap-2 rounded-xl border border-border bg-card p-3">
          <span className="text-xs font-medium text-muted-foreground">Active Data:</span>
          {completedTests.map((t) => {
            const Icon = t.icon
            return (
              <Badge key={t.name} variant="secondary" className="gap-1.5 text-xs">
                <Icon className="h-3 w-3" />
                {t.name}: {t.score}/100
              </Badge>
            )
          })}
          {currentRisk && (
            <Badge className={`gap-1.5 text-xs ${
              currentRisk.riskLevel === "low" ? "bg-success/10 text-success" :
              currentRisk.riskLevel === "moderate" ? "bg-warning/10 text-warning" :
              "bg-destructive/10 text-destructive"
            }`}>
              <Activity className="h-3 w-3" />
              Risk: {currentRisk.riskLevel}
            </Badge>
          )}
        </div>
      )}

      {/* Chat Area */}
      <Card className="flex flex-1 flex-col overflow-hidden">
        <div ref={scrollContainerRef} className="relative flex-1 overflow-y-auto p-4 sm:p-6">
          {/* Empty state */}
          {messages.length === 0 && (
            <div className="flex h-full flex-col items-center justify-center">
              <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-3xl bg-primary/10">
                <Sparkles className="h-10 w-10 text-primary" />
              </div>
              <h2 className="mb-2 text-lg font-bold text-foreground">
                Hello{user?.name ? `, ${user.name.split(" ")[0]}` : ""}!
              </h2>
              <p className="mb-8 max-w-md text-center text-sm leading-relaxed text-muted-foreground">
                I can analyze your assessment results, explain what your scores mean, provide guidance on brain health,
                and answer any questions about cognitive screening. {!hasData && "Complete some tests first for personalized insights."}
              </p>

              {/* Suggestion grid */}
              <div className="grid w-full max-w-2xl grid-cols-1 gap-3 sm:grid-cols-2">
                {SUGGESTION_GROUPS.map((group) => (
                  <div key={group.label} className="rounded-xl border border-border bg-card p-3">
                    <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                      {group.label}
                    </p>
                    <div className="flex flex-col gap-1.5">
                      {group.items.map((q) => (
                        <button
                          key={q}
                          onClick={() => sendMessage(q)}
                          className="rounded-lg px-3 py-2 text-left text-sm text-foreground transition-colors hover:bg-muted"
                        >
                          {q}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Messages */}
          {messages.map((msg) => (
            <div key={msg.id} className={`mb-5 flex gap-3 ${msg.role === "user" ? "flex-row-reverse" : "flex-row"}`}>
              {/* Avatar */}
              <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                msg.role === "user"
                  ? "bg-primary text-primary-foreground"
                  : "bg-primary/10 text-primary"
              }`}>
                {msg.role === "user" ? initials : <Bot className="h-4 w-4" />}
              </div>

              {/* Bubble */}
              <div className={`group flex max-w-[75%] flex-col gap-1 ${msg.role === "user" ? "items-end" : "items-start"}`}>
                <div className={`relative rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                  msg.role === "user"
                    ? "rounded-tr-sm bg-primary text-primary-foreground"
                    : "rounded-tl-sm border border-border bg-muted/50 text-foreground"
                }`}>
                  {msg.content.split("\n").map((line, i) => (
                    <p key={i} className={i > 0 ? "mt-2" : ""}>{line}</p>
                  ))}

                  {/* Copy button - assistant only */}
                  {msg.role === "assistant" && (
                    <button
                      onClick={() => copyMessage(msg.id, msg.content)}
                      className="absolute -right-2 -bottom-2 flex h-6 w-6 items-center justify-center rounded-full border border-border bg-card opacity-0 shadow-sm transition-opacity group-hover:opacity-100"
                      aria-label="Copy message"
                    >
                      {copiedId === msg.id ? (
                        <Check className="h-3 w-3 text-success" />
                      ) : (
                        <Copy className="h-3 w-3 text-muted-foreground" />
                      )}
                    </button>
                  )}
                </div>
                <span className="flex items-center gap-1 px-1 text-[10px] text-muted-foreground">
                  <Clock className="h-2.5 w-2.5" />
                  {msg.timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                </span>
              </div>
            </div>
          ))}

          {/* Typing indicator */}
          {isLoading && (
            <div className="mb-5 flex gap-3">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                <Bot className="h-4 w-4" />
              </div>
              <div className="flex items-center gap-2.5 rounded-2xl rounded-tl-sm border border-border bg-muted/50 px-4 py-3">
                <Loader2 className="h-4 w-4 animate-spin text-primary" />
                <span className="text-sm text-muted-foreground">Analyzing your data...</span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Scroll to bottom */}
        {showScrollBtn && (
          <div className="absolute right-6 bottom-24 z-10">
            <button
              onClick={scrollToBottom}
              className="flex h-8 w-8 items-center justify-center rounded-full border border-border bg-card shadow-md transition-transform hover:scale-105"
            >
              <ArrowDown className="h-4 w-4 text-muted-foreground" />
            </button>
          </div>
        )}

        {/* Input area */}
        <CardContent className="border-t border-border p-4">
          <form onSubmit={handleSubmit} className="flex items-end gap-3">
            <div className="relative flex-1">
              <textarea
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask about your results, brain health, next steps..."
                disabled={isLoading}
                rows={1}
                className="max-h-32 min-h-[44px] w-full resize-none rounded-xl border border-input bg-background px-4 py-3 pr-4 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none disabled:opacity-50"
                style={{ height: "44px" }}
                onInput={(e) => {
                  const target = e.target as HTMLTextAreaElement
                  target.style.height = "44px"
                  target.style.height = Math.min(target.scrollHeight, 128) + "px"
                }}
              />
            </div>
            <Button
              type="submit"
              size="icon"
              disabled={!input.trim() || isLoading}
              className="h-11 w-11 shrink-0 rounded-xl"
            >
              <Send className="h-4 w-4" />
              <span className="sr-only">Send message</span>
            </Button>
          </form>
          <p className="mt-2 text-center text-[10px] text-muted-foreground">
            AI responses are for informational purposes only. Always consult a healthcare professional for medical advice.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
