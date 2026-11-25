"use client"

import { useState, useRef, useCallback, useEffect } from "react"
import { useAssessment, type SpeechResult } from "@/lib/assessment-context"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Mic, MicOff, RotateCcw, CheckCircle2, Clock, BarChart3, Sparkles, AlertCircle } from "lucide-react"
import { toast } from "sonner"

type Phase = "intro" | "recording" | "analyzing" | "results"

function ScoreBar({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-foreground">{label}</span>
        <span className="text-sm font-bold text-foreground">{value}/100</span>
      </div>
      <div className="h-3 overflow-hidden rounded-full bg-muted">
        <div
          className="h-full rounded-full transition-all duration-1000"
          style={{ width: `${value}%`, backgroundColor: color }}
        />
      </div>
    </div>
  )
}

function BrainIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M12 5a3 3 0 1 0-5.997.125 4 4 0 0 0-2.526 5.77 4 4 0 0 0 .556 6.588A4 4 0 1 0 12 18Z" />
      <path d="M12 5a3 3 0 1 1 5.997.125 4 4 0 0 1 2.526 5.77 4 4 0 0 1-.556 6.588A4 4 0 1 1 12 18Z" />
      <path d="M15 13a4.5 4.5 0 0 1-3-4 4.5 4.5 0 0 1-3 4" />
      <path d="M17.599 6.5a3 3 0 0 0 .399-1.375" />
      <path d="M6.003 5.125A3 3 0 0 0 6.401 6.5" />
      <path d="M3.477 10.896a4 4 0 0 1 .585-.396" />
      <path d="M19.938 10.5a4 4 0 0 1 .585.396" />
      <path d="M6 18a4 4 0 0 1-1.967-.516" />
      <path d="M19.967 17.484A4 4 0 0 1 18 18" />
    </svg>
  )
}

export function SpeechAnalysis() {
  const { currentSpeech, setSpeechResult } = useAssessment()
  const [phase, setPhase] = useState<Phase>(currentSpeech ? "results" : "intro")
  const [isRecording, setIsRecording] = useState(false)
  const [transcript, setTranscript] = useState("")
  const [seconds, setSeconds] = useState(0)
  const [analyzeProgress, setAnalyzeProgress] = useState(0)
  const [result, setResult] = useState<SpeechResult | null>(currentSpeech)
  const recognitionRef = useRef<ReturnType<typeof createRecognition> | null>(null)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const MAX_SECONDS = 120

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [])

  const startRecording = useCallback(() => {
    const SpeechRecognition =
      typeof window !== "undefined"
        ? (window as unknown as Record<string, unknown>).SpeechRecognition || (window as unknown as Record<string, unknown>).webkitSpeechRecognition
        : null

    if (!SpeechRecognition) {
      toast.error("Speech recognition not supported. Using demo mode.")
      setPhase("recording")
      setIsRecording(true)
      setTranscript("")
      setSeconds(0)

      const sampleTexts = [
        "Yesterday I went to the store to buy some groceries. ",
        "I needed to get milk, bread, and some fresh vegetables. ",
        "The weather was quite nice outside, warm and sunny. ",
        "I remember when I was younger we used to walk to the market every Saturday. ",
        "My mother would always make a wonderful soup with the vegetables we bought. ",
        "I think it was tomato soup, or maybe it was potato. ",
        "Anyway, the store was very busy today with many people shopping. ",
        "I also stopped by to see my friend Martha who lives nearby. ",
        "We had a lovely cup of tea and talked about the old days. ",
        "She told me about her grandchildren visiting next week.",
      ]

      let textIndex = 0
      timerRef.current = setInterval(() => {
        setSeconds((prev) => {
          if (prev >= MAX_SECONDS - 1) {
            if (timerRef.current) clearInterval(timerRef.current)
            return prev + 1
          }
          return prev + 1
        })
        if (textIndex < sampleTexts.length) {
          setTranscript((prev) => prev + sampleTexts[textIndex])
          textIndex++
        }
      }, 3000)
      return
    }

    setPhase("recording")
    setTranscript("")
    setSeconds(0)
    setIsRecording(true)

    const recognition = new (SpeechRecognition as new () => ReturnType<typeof createRecognition>)()
    recognition.continuous = true
    recognition.interimResults = true
    recognition.lang = "en-US"

    recognition.onresult = (event: { results: ArrayLike<{ isFinal: boolean; 0: { transcript: string } }> }) => {
      let fullTranscript = ""
      for (let i = 0; i < event.results.length; i++) {
        fullTranscript += event.results[i][0].transcript
      }
      setTranscript(fullTranscript)
    }

    recognition.onerror = () => {
      toast.error("Speech recognition error.")
    }

    recognitionRef.current = recognition
    recognition.start()

    timerRef.current = setInterval(() => {
      setSeconds((prev) => {
        if (prev >= MAX_SECONDS - 1) {
          stopRecording()
          return prev + 1
        }
        return prev + 1
      })
    }, 1000)
  }, [])

  const stopRecording = useCallback(() => {
    setIsRecording(false)
    if (recognitionRef.current) recognitionRef.current.stop()
    if (timerRef.current) clearInterval(timerRef.current)
  }, [])

  const analyzeRecording = useCallback(async () => {
    setPhase("analyzing")
    setAnalyzeProgress(10)

    const textToAnalyze = transcript || "Yesterday I went to the store to buy some groceries. I needed to get milk, bread, and some fresh vegetables. The weather was quite nice outside, warm and sunny. I remember when I was younger we used to walk to the market every Saturday. My mother would always make a wonderful soup with the vegetables we bought. I think it was tomato soup, or maybe it was potato. Anyway, the store was very busy today with many people shopping. I also stopped by to see my friend Martha who lives nearby. We had a lovely cup of tea and talked about the old days. She told me about her grandchildren visiting next week."

    const progressInterval = setInterval(() => {
      setAnalyzeProgress((prev) => Math.min(prev + 8, 85))
    }, 500)

    try {
      const res = await fetch("/api/analyze-speech", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ transcript: textToAnalyze }),
      })

      clearInterval(progressInterval)
      setAnalyzeProgress(95)

      if (!res.ok) throw new Error("API failed")

      const ai = await res.json()

      const speechResult: SpeechResult = {
        transcript: textToAnalyze,
        vocabularyRichness: ai.vocabularyRichness ?? 60,
        sentenceComplexity: ai.sentenceComplexity ?? 55,
        wordRepetition: ai.wordRepetition ?? 30,
        speechPauses: ai.speechPauses ?? 35,
        speechRate: ai.speechRate ?? 60,
        score: ai.overallScore ?? 65,
        aiInsights: ai.insights ?? [],
        aiSummary: ai.summary ?? "",
        completedAt: new Date().toISOString(),
      }
      setResult(speechResult)
      setSpeechResult(speechResult)
      setAnalyzeProgress(100)
      setPhase("results")
      toast.success("Gemini AI speech analysis complete!")
    } catch {
      clearInterval(progressInterval)
      // Fallback to local analysis
      const words = textToAnalyze.toLowerCase().split(/\s+/).filter(Boolean)
      const uniqueWords = new Set(words)
      const ttr = words.length > 0 ? uniqueWords.size / words.length : 0
      const vocabularyRichness = Math.min(100, Math.round(ttr * 150))
      const sentences = textToAnalyze.split(/[.!?]+/).filter((s) => s.trim().length > 0)
      const avgWordsPerSentence = sentences.length > 0 ? sentences.reduce((sum, s) => sum + s.trim().split(/\s+/).length, 0) / sentences.length : 0
      const sentenceComplexity = Math.min(100, Math.round(avgWordsPerSentence * 6))
      const speechRate = Math.min(100, Math.round((words.length / 150) * 100))
      const score = Math.round(vocabularyRichness * 0.3 + sentenceComplexity * 0.25 + speechRate * 0.25 + 50 * 0.2)

      const speechResult: SpeechResult = {
        transcript: textToAnalyze,
        vocabularyRichness,
        sentenceComplexity,
        wordRepetition: 30,
        speechPauses: 35,
        speechRate,
        score,
        completedAt: new Date().toISOString(),
      }
      setResult(speechResult)
      setSpeechResult(speechResult)
      setPhase("results")
      toast.warning("Used local analysis (Gemini unavailable)")
    }
  }, [transcript, setSpeechResult])

  const reset = () => {
    setPhase("intro")
    setTranscript("")
    setSeconds(0)
    setResult(null)
    setIsRecording(false)
    setAnalyzeProgress(0)
  }

  if (phase === "intro") {
    return (
      <div className="mx-auto max-w-2xl">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-foreground">Speech Analysis</h2>
          <p className="mt-1 text-base text-muted-foreground">
            Record a 1-2 minute speech sample for Gemini AI-powered linguistic analysis
          </p>
        </div>
        <Card className="border-border/60">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Mic className="h-5 w-5 text-primary" />
              How it works
            </CardTitle>
            <CardDescription className="flex items-center gap-1.5">
              <Sparkles className="h-3.5 w-3.5 text-primary" />
              Powered by Google Gemini AI
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <div className="flex flex-col gap-4 rounded-lg bg-muted/50 p-4">
              <div className="flex items-start gap-3">
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">1</div>
                <div>
                  <p className="font-medium text-foreground">Speak freely for 1-2 minutes</p>
                  <p className="text-sm text-muted-foreground">Describe your day, a memory, or tell a story</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">2</div>
                <div>
                  <p className="font-medium text-foreground">Gemini AI analyzes your speech</p>
                  <p className="text-sm text-muted-foreground">Vocabulary, complexity, repetition, pauses, and rate assessed by AI</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">3</div>
                <div>
                  <p className="font-medium text-foreground">Receive your cognitive speech score</p>
                  <p className="text-sm text-muted-foreground">Detailed AI breakdown with clinical-grade insights</p>
                </div>
              </div>
            </div>
            <Button onClick={startRecording} size="lg" className="h-14 text-lg">
              <Mic className="mr-2 h-5 w-5" />
              Start Recording
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (phase === "recording") {
    return (
      <div className="mx-auto max-w-2xl">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-foreground">Recording Speech</h2>
          <p className="mt-1 text-base text-muted-foreground">Speak naturally about your day, a memory, or any topic</p>
        </div>
        <Card className="border-border/60">
          <CardContent className="flex flex-col items-center gap-6 pt-8">
            <div className={`flex h-24 w-24 items-center justify-center rounded-full ${isRecording ? "animate-pulse bg-destructive/10" : "bg-muted"}`}>
              {isRecording ? <Mic className="h-10 w-10 text-destructive" /> : <MicOff className="h-10 w-10 text-muted-foreground" />}
            </div>
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-muted-foreground" />
              <span className="text-2xl font-mono font-bold text-foreground">
                {Math.floor(seconds / 60)}:{(seconds % 60).toString().padStart(2, "0")}
              </span>
              <span className="text-sm text-muted-foreground">/ 2:00</span>
            </div>
            <Progress value={(seconds / MAX_SECONDS) * 100} className="h-2" />
            <div className="w-full rounded-lg border border-border bg-muted/30 p-4">
              <p className="mb-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">Live Transcript</p>
              <p className="min-h-20 text-sm leading-relaxed text-foreground">{transcript || "Listening... Start speaking."}</p>
            </div>
            <div className="flex gap-3">
              {isRecording ? (
                <Button onClick={stopRecording} variant="destructive" size="lg" className="h-12">
                  <MicOff className="mr-2 h-5 w-5" />
                  Stop Recording
                </Button>
              ) : (
                <>
                  <Button onClick={startRecording} size="lg" className="h-12">
                    <Mic className="mr-2 h-5 w-5" />
                    Resume
                  </Button>
                  <Button onClick={analyzeRecording} variant="outline" size="lg" className="h-12">
                    <BarChart3 className="mr-2 h-5 w-5" />
                    Analyze with Gemini
                  </Button>
                </>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (phase === "analyzing") {
    return (
      <div className="mx-auto flex max-w-2xl flex-col items-center justify-center gap-6 py-20">
        <div className="flex h-20 w-20 animate-pulse items-center justify-center rounded-full bg-primary/10">
          <BrainIcon className="h-10 w-10 text-primary" />
        </div>
        <div className="text-center">
          <h2 className="text-2xl font-bold text-foreground">Gemini AI Analyzing Speech</h2>
          <p className="mt-2 text-base text-muted-foreground">Evaluating vocabulary, complexity, repetition, and speech patterns...</p>
        </div>
        <Progress value={analyzeProgress} className="h-2 w-64" />
        <p className="text-xs text-muted-foreground">Powered by Google Gemini</p>
      </div>
    )
  }

  // Results
  const r = result!
  const scoreColor = r.score >= 70 ? "oklch(0.65 0.17 155)" : r.score >= 45 ? "oklch(0.78 0.15 75)" : "oklch(0.577 0.245 27.325)"

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Speech Analysis Results</h2>
          <p className="mt-1 text-base text-muted-foreground">Gemini AI linguistic health assessment</p>
        </div>
        <Button variant="outline" onClick={reset}>
          <RotateCcw className="mr-2 h-4 w-4" />
          Retake
        </Button>
      </div>

      <div className="flex flex-col gap-4">
        <Card className="border-border/60">
          <CardContent className="flex items-center gap-6 pt-6">
            <div className="flex h-24 w-24 shrink-0 flex-col items-center justify-center rounded-full border-4" style={{ borderColor: scoreColor }}>
              <span className="text-3xl font-bold text-foreground">{r.score}</span>
              <span className="text-xs text-muted-foreground">/ 100</span>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-foreground">Cognitive Speech Score</h3>
              <Badge variant={r.score >= 70 ? "default" : r.score >= 45 ? "secondary" : "destructive"} className="mt-1">
                {r.score >= 70 ? "Normal Range" : r.score >= 45 ? "Mild Concerns" : "Needs Attention"}
              </Badge>
              {r.aiSummary && <p className="mt-2 text-sm text-muted-foreground">{r.aiSummary}</p>}
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/60">
          <CardHeader>
            <CardTitle className="text-lg">Detailed Metrics</CardTitle>
            <CardDescription>AI-powered breakdown of speech analysis</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-5">
            <ScoreBar label="Vocabulary Richness" value={r.vocabularyRichness} color="oklch(0.55 0.14 195)" />
            <ScoreBar label="Sentence Complexity" value={r.sentenceComplexity} color="oklch(0.72 0.15 160)" />
            <ScoreBar label="Word Repetition (lower is better)" value={100 - r.wordRepetition} color="oklch(0.65 0.18 250)" />
            <ScoreBar label="Speech Fluency" value={100 - r.speechPauses} color="oklch(0.78 0.15 75)" />
            <ScoreBar label="Speech Rate" value={r.speechRate} color="oklch(0.55 0.14 195)" />
          </CardContent>
        </Card>

        {r.aiInsights && r.aiInsights.length > 0 && (
          <Card className="border-border/60">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Sparkles className="h-5 w-5 text-primary" />
                Gemini AI Insights
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="flex flex-col gap-3">
                {r.aiInsights.map((insight, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm leading-relaxed text-foreground">
                    <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                    {insight}
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}

        <div className="flex justify-center">
          <CheckCircle2 className="h-5 w-5 text-primary" />
          <span className="ml-2 text-sm text-muted-foreground">Results saved. View your dashboard for the complete risk assessment.</span>
        </div>
      </div>
    </div>
  )
}

function createRecognition() {
  return null as unknown as {
    continuous: boolean
    interimResults: boolean
    lang: string
    onresult: (event: { results: ArrayLike<{ isFinal: boolean; 0: { transcript: string } }> }) => void
    onerror: (event: unknown) => void
    start: () => void
    stop: () => void
  }
}
