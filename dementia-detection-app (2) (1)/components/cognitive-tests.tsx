"use client"

import { useState, useCallback, useRef, useEffect } from "react"
import { useAssessment, type CognitiveResult } from "@/lib/assessment-context"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { CheckCircle2, RotateCcw, BookOpen, Hash, Eye, Grid3X3, Timer, ArrowRight, Sparkles, AlertCircle } from "lucide-react"
import { toast } from "sonner"

type TestType = "word-recall" | "number-sequence" | "object-recognition" | "pattern-recognition"
type Phase = "intro" | "testing" | "analyzing" | "results"

interface TestScore {
  accuracy: number
  reactionTime: number
}

const WORD_LISTS = [
  ["sunset", "ocean", "garden", "piano", "blanket", "mountain", "candle", "butterfly"],
  ["river", "castle", "feather", "trumpet", "diamond", "forest", "lantern", "dolphin"],
  ["meadow", "violin", "crystal", "rainbow", "compass", "harbor", "blossom", "thunder"],
]

const NUMBER_SEQUENCES = [
  { sequence: [3, 7, 2, 9, 4], display: "3 - 7 - 2 - 9 - 4" },
  { sequence: [8, 1, 5, 3, 6, 2], display: "8 - 1 - 5 - 3 - 6 - 2" },
  { sequence: [4, 9, 2, 7, 1, 8, 5], display: "4 - 9 - 2 - 7 - 1 - 8 - 5" },
]

const OBJECT_SETS = [
  { objects: ["Apple", "Chair", "Clock", "Umbrella", "Key", "Book"], target: "Clock", question: "Which of these objects tells time?" },
  { objects: ["Hammer", "Scissors", "Pen", "Compass", "Ruler", "Wrench"], target: "Compass", question: "Which of these objects shows direction?" },
  { objects: ["Lamp", "Mirror", "Pillow", "Vase", "Frame", "Curtain"], target: "Mirror", question: "Which object shows your reflection?" },
  { objects: ["Spoon", "Knife", "Plate", "Cup", "Bowl", "Fork"], target: "Cup", question: "Which object do you drink from?" },
]

const PATTERN_SETS = [
  { pattern: [1, 2, 4, 8, "?"], answer: 16, options: [10, 12, 16, 20], rule: "Each number doubles" },
  { pattern: [2, 5, 10, 17, "?"], answer: 26, options: [22, 24, 26, 28], rule: "Differences increase by 2" },
  { pattern: [1, 1, 2, 3, 5, "?"], answer: 8, options: [6, 7, 8, 10], rule: "Fibonacci sequence" },
  { pattern: [3, 6, 12, 24, "?"], answer: 48, options: [36, 42, 48, 52], rule: "Each number doubles" },
]

function ScoreBar({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-foreground">{label}</span>
        <span className="text-sm font-bold text-foreground">{value}%</span>
      </div>
      <div className="h-3 overflow-hidden rounded-full bg-muted">
        <div className="h-full rounded-full transition-all duration-1000" style={{ width: `${value}%`, backgroundColor: color }} />
      </div>
    </div>
  )
}

function WordRecallTest({ onComplete }: { onComplete: (score: TestScore) => void }) {
  const [step, setStep] = useState<"memorize" | "recall">("memorize")
  const [wordList] = useState(() => WORD_LISTS[Math.floor(Math.random() * WORD_LISTS.length)])
  const [selectedWords, setSelectedWords] = useState<string[]>([])
  const [timer, setTimer] = useState(10)
  const startTimeRef = useRef(Date.now())
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // Stable shuffled word list - computed once via useState initializer
  const [allWords] = useState(() => {
    const distractorPool = ["elephant", "rocket", "window", "glacier", "marble", "whisper", "pebble", "volcano", "anchor", "orchard", "lighthouse", "sparrow"]
    const distractors = distractorPool.filter((w) => !wordList.includes(w))
    const combined = [...new Set([...wordList, ...distractors])]
    // Fisher-Yates shuffle for stable randomization
    for (let i = combined.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [combined[i], combined[j]] = [combined[j], combined[i]]
    }
    return combined.slice(0, 12)
  })

  useEffect(() => {
    if (step === "memorize") {
      timerRef.current = setInterval(() => {
        setTimer((prev) => {
          if (prev <= 1) {
            clearInterval(timerRef.current!)
            setStep("recall")
            startTimeRef.current = Date.now()
            return 0
          }
          return prev - 1
        })
      }, 1000)
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current) }
  }, [step])

  const toggleWord = (word: string) => {
    setSelectedWords((prev) => prev.includes(word) ? prev.filter((w) => w !== word) : [...prev, word])
  }

  const submitRecall = () => {
    const reactionTime = Date.now() - startTimeRef.current
    const correctCount = selectedWords.filter((w) => wordList.includes(w)).length
    const wrongCount = selectedWords.filter((w) => !wordList.includes(w)).length
    const accuracy = Math.max(0, Math.round(((correctCount - wrongCount * 0.5) / wordList.length) * 100))
    onComplete({ accuracy: Math.min(100, accuracy), reactionTime })
  }

  if (step === "memorize") {
    return (
      <div className="flex flex-col items-center gap-6">
        <div className="text-center">
          <h3 className="text-xl font-semibold text-foreground">Memorize These Words</h3>
          <p className="mt-1 text-muted-foreground">You have {timer} seconds to remember these words</p>
        </div>
        <Progress value={(timer / 10) * 100} className="h-2 w-full max-w-xs" />
        <div className="flex flex-wrap justify-center gap-3">
          {wordList.map((word) => (
            <span key={word} className="rounded-lg bg-primary/10 px-4 py-2 text-lg font-medium text-primary">{word}</span>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col items-center gap-6">
      <div className="text-center">
        <h3 className="text-xl font-semibold text-foreground">Select the Words You Remember</h3>
        <p className="mt-1 text-muted-foreground">Tap all the words from the previous list ({selectedWords.length} selected)</p>
      </div>
      <div className="flex flex-wrap justify-center gap-3">
        {allWords.map((word) => (
          <button key={word} onClick={() => toggleWord(word)}
            className={`rounded-lg border px-4 py-2.5 text-base font-medium transition-colors ${
              selectedWords.includes(word) ? "border-primary bg-primary/10 text-primary" : "border-border bg-card text-foreground hover:bg-muted"
            }`}>{word}</button>
        ))}
      </div>
      <Button onClick={submitRecall} size="lg" className="h-12">Submit Answers<ArrowRight className="ml-2 h-4 w-4" /></Button>
    </div>
  )
}

function NumberSequenceTest({ onComplete }: { onComplete: (score: TestScore) => void }) {
  const [step, setStep] = useState<"show" | "input">("show")
  const [seqIndex] = useState(() => Math.floor(Math.random() * NUMBER_SEQUENCES.length))
  const [userInput, setUserInput] = useState<number[]>([])
  const [timer, setTimer] = useState(8)
  const startTimeRef = useRef(Date.now())
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const seq = NUMBER_SEQUENCES[seqIndex]

  useEffect(() => {
    if (step === "show") {
      timerRef.current = setInterval(() => {
        setTimer((prev) => {
          if (prev <= 1) { clearInterval(timerRef.current!); setStep("input"); startTimeRef.current = Date.now(); return 0 }
          return prev - 1
        })
      }, 1000)
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current) }
  }, [step])

  const addNumber = (n: number) => { if (userInput.length < seq.sequence.length) setUserInput((prev) => [...prev, n]) }

  const submit = () => {
    const reactionTime = Date.now() - startTimeRef.current
    let correctCount = 0
    seq.sequence.forEach((n, i) => { if (userInput[i] === n) correctCount++ })
    onComplete({ accuracy: Math.round((correctCount / seq.sequence.length) * 100), reactionTime })
  }

  if (step === "show") {
    return (
      <div className="flex flex-col items-center gap-6">
        <div className="text-center">
          <h3 className="text-xl font-semibold text-foreground">Remember This Sequence</h3>
          <p className="mt-1 text-muted-foreground">{timer} seconds remaining</p>
        </div>
        <Progress value={(timer / 8) * 100} className="h-2 w-full max-w-xs" />
        <div className="flex gap-3">
          {seq.sequence.map((n, i) => (
            <div key={i} className="flex h-14 w-14 items-center justify-center rounded-xl bg-primary text-xl font-bold text-primary-foreground">{n}</div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col items-center gap-6">
      <div className="text-center">
        <h3 className="text-xl font-semibold text-foreground">Enter the Sequence</h3>
        <p className="mt-1 text-muted-foreground">Tap the numbers in order</p>
      </div>
      <div className="flex gap-2">
        {seq.sequence.map((_, i) => (
          <div key={i} className={`flex h-14 w-14 items-center justify-center rounded-xl border-2 text-xl font-bold ${
            userInput[i] !== undefined ? "border-primary bg-primary/10 text-primary" : "border-border bg-muted text-muted-foreground"
          }`}>{userInput[i] ?? "?"}</div>
        ))}
      </div>
      <div className="grid grid-cols-5 gap-2">
        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 0].map((n) => (
          <button key={n} onClick={() => addNumber(n)} className="flex h-12 w-12 items-center justify-center rounded-lg border border-border bg-card text-lg font-medium text-foreground hover:bg-muted">{n}</button>
        ))}
      </div>
      <div className="flex gap-3">
        <Button variant="outline" onClick={() => setUserInput([])}>Clear</Button>
        <Button onClick={submit} disabled={userInput.length !== seq.sequence.length}>Submit<ArrowRight className="ml-2 h-4 w-4" /></Button>
      </div>
    </div>
  )
}

function ObjectRecognitionTest({ onComplete }: { onComplete: (score: TestScore) => void }) {
  const [questionIndex, setQuestionIndex] = useState(0)
  const [correct, setCorrect] = useState(0)
  const [totalTime, setTotalTime] = useState(0)
  const startTimeRef = useRef(Date.now())
  const questionsUsed = OBJECT_SETS.slice(0, 3)

  const handleAnswer = (answer: string) => {
    const elapsed = Date.now() - startTimeRef.current
    setTotalTime((prev) => prev + elapsed)
    if (answer === questionsUsed[questionIndex].target) setCorrect((prev) => prev + 1)
    if (questionIndex < questionsUsed.length - 1) { setQuestionIndex((prev) => prev + 1); startTimeRef.current = Date.now() }
    else {
      const finalCorrect = answer === questionsUsed[questionIndex].target ? correct + 1 : correct
      onComplete({ accuracy: Math.round((finalCorrect / questionsUsed.length) * 100), reactionTime: totalTime + elapsed })
    }
  }

  const q = questionsUsed[questionIndex]
  return (
    <div className="flex flex-col items-center gap-6">
      <div className="text-center">
        <h3 className="text-xl font-semibold text-foreground">Object Recognition</h3>
        <p className="mt-1 text-muted-foreground">Question {questionIndex + 1} of {questionsUsed.length}</p>
      </div>
      <Progress value={((questionIndex + 1) / questionsUsed.length) * 100} className="h-2 w-full max-w-xs" />
      <p className="text-lg font-medium text-foreground">{q.question}</p>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {q.objects.map((obj) => (
          <button key={obj} onClick={() => handleAnswer(obj)} className="flex h-16 items-center justify-center rounded-lg border border-border bg-card px-4 text-base font-medium text-foreground hover:bg-primary/10 hover:border-primary transition-colors">{obj}</button>
        ))}
      </div>
    </div>
  )
}

function PatternRecognitionTest({ onComplete }: { onComplete: (score: TestScore) => void }) {
  const [questionIndex, setQuestionIndex] = useState(0)
  const [correct, setCorrect] = useState(0)
  const [totalTime, setTotalTime] = useState(0)
  const startTimeRef = useRef(Date.now())
  const patternsUsed = PATTERN_SETS.slice(0, 3)

  const handleAnswer = (answer: number) => {
    const elapsed = Date.now() - startTimeRef.current
    setTotalTime((prev) => prev + elapsed)
    if (answer === patternsUsed[questionIndex].answer) setCorrect((prev) => prev + 1)
    if (questionIndex < patternsUsed.length - 1) { setQuestionIndex((prev) => prev + 1); startTimeRef.current = Date.now() }
    else {
      const finalCorrect = answer === patternsUsed[questionIndex].answer ? correct + 1 : correct
      onComplete({ accuracy: Math.round((finalCorrect / patternsUsed.length) * 100), reactionTime: totalTime + elapsed })
    }
  }

  const p = patternsUsed[questionIndex]
  return (
    <div className="flex flex-col items-center gap-6">
      <div className="text-center">
        <h3 className="text-xl font-semibold text-foreground">Pattern Recognition</h3>
        <p className="mt-1 text-muted-foreground">Question {questionIndex + 1} of {patternsUsed.length}</p>
      </div>
      <Progress value={((questionIndex + 1) / patternsUsed.length) * 100} className="h-2 w-full max-w-xs" />
      <div className="flex items-center gap-2">
        {p.pattern.map((n, i) => (
          <div key={i} className={`flex h-14 w-14 items-center justify-center rounded-xl text-xl font-bold ${
            n === "?" ? "border-2 border-dashed border-primary bg-primary/5 text-primary" : "bg-muted text-foreground"
          }`}>{String(n)}</div>
        ))}
      </div>
      <p className="text-sm text-muted-foreground">What number comes next?</p>
      <div className="flex gap-3">
        {p.options.map((opt) => (
          <button key={opt} onClick={() => handleAnswer(opt)} className="flex h-14 w-14 items-center justify-center rounded-xl border border-border bg-card text-lg font-bold text-foreground hover:bg-primary/10 hover:border-primary transition-colors">{opt}</button>
        ))}
      </div>
    </div>
  )
}

const TEST_INFO: { id: TestType; label: string; icon: typeof BookOpen; description: string }[] = [
  { id: "word-recall", label: "Word Recall", icon: BookOpen, description: "Memorize and recall a list of words" },
  { id: "number-sequence", label: "Number Sequence", icon: Hash, description: "Remember and reproduce number sequences" },
  { id: "object-recognition", label: "Object Recognition", icon: Eye, description: "Identify objects based on descriptions" },
  { id: "pattern-recognition", label: "Pattern Recognition", icon: Grid3X3, description: "Find the next number in a pattern" },
]

export function CognitiveTests() {
  const { currentCognitive, setCognitiveResult } = useAssessment()
  const [phase, setPhase] = useState<Phase>(currentCognitive ? "results" : "intro")
  const [currentTest, setCurrentTest] = useState(0)
  const [analyzeProgress, setAnalyzeProgress] = useState(0)
  const [scores, setScores] = useState<Record<TestType, TestScore>>({
    "word-recall": { accuracy: 0, reactionTime: 0 },
    "number-sequence": { accuracy: 0, reactionTime: 0 },
    "object-recognition": { accuracy: 0, reactionTime: 0 },
    "pattern-recognition": { accuracy: 0, reactionTime: 0 },
  })
  const [result, setResult] = useState<CognitiveResult | null>(currentCognitive)

  const analyzeWithGemini = useCallback(async (allScores: Record<TestType, TestScore>) => {
    setPhase("analyzing")
    setAnalyzeProgress(10)

    const progressInterval = setInterval(() => {
      setAnalyzeProgress((prev) => Math.min(prev + 8, 85))
    }, 500)

    try {
      const res = await fetch("/api/analyze-cognitive", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          testResults: {
            wordRecall: allScores["word-recall"],
            numberSequence: allScores["number-sequence"],
            objectRecognition: allScores["object-recognition"],
            patternRecognition: allScores["pattern-recognition"],
          },
        }),
      })

      clearInterval(progressInterval)
      setAnalyzeProgress(95)

      if (!res.ok) throw new Error("API failed")

      const ai = await res.json()
      const cogResult: CognitiveResult = {
        wordRecall: allScores["word-recall"],
        numberSequence: allScores["number-sequence"],
        objectRecognition: allScores["object-recognition"],
        patternRecognition: allScores["pattern-recognition"],
        score: ai.overallScore ?? Math.round(
          allScores["word-recall"].accuracy * 0.30 +
          allScores["number-sequence"].accuracy * 0.25 +
          allScores["object-recognition"].accuracy * 0.20 +
          allScores["pattern-recognition"].accuracy * 0.25
        ),
        aiInsights: ai.insights ?? [],
        aiSummary: ai.summary ?? "",
        domainAnalysis: ai.domainAnalysis ?? undefined,
        completedAt: new Date().toISOString(),
      }
      setResult(cogResult)
      setCognitiveResult(cogResult)
      setAnalyzeProgress(100)
      setPhase("results")
      toast.success("Gemini AI cognitive analysis complete!")
    } catch {
      clearInterval(progressInterval)
      // Fallback
      const overallScore = Math.round(
        allScores["word-recall"].accuracy * 0.30 +
        allScores["number-sequence"].accuracy * 0.25 +
        allScores["object-recognition"].accuracy * 0.20 +
        allScores["pattern-recognition"].accuracy * 0.25
      )
      const cogResult: CognitiveResult = {
        wordRecall: allScores["word-recall"],
        numberSequence: allScores["number-sequence"],
        objectRecognition: allScores["object-recognition"],
        patternRecognition: allScores["pattern-recognition"],
        score: overallScore,
        completedAt: new Date().toISOString(),
      }
      setResult(cogResult)
      setCognitiveResult(cogResult)
      setPhase("results")
      toast.warning("Used local scoring (Gemini unavailable)")
    }
  }, [setCognitiveResult])

  const handleTestComplete = useCallback(
    (testType: TestType, score: TestScore) => {
      const newScores = { ...scores, [testType]: score }
      setScores(newScores)

      if (currentTest < TEST_INFO.length - 1) {
        setCurrentTest((prev) => prev + 1)
        toast.success(`${TEST_INFO[currentTest].label} complete!`)
      } else {
        toast.success("All tests done! Sending to Gemini AI...")
        analyzeWithGemini(newScores)
      }
    },
    [currentTest, scores, analyzeWithGemini]
  )

  const reset = () => {
    setPhase("intro")
    setCurrentTest(0)
    setAnalyzeProgress(0)
    setScores({
      "word-recall": { accuracy: 0, reactionTime: 0 },
      "number-sequence": { accuracy: 0, reactionTime: 0 },
      "object-recognition": { accuracy: 0, reactionTime: 0 },
      "pattern-recognition": { accuracy: 0, reactionTime: 0 },
    })
    setResult(null)
  }

  if (phase === "intro") {
    return (
      <div className="mx-auto max-w-2xl">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-foreground">Cognitive Tests</h2>
          <p className="mt-1 text-base text-muted-foreground">Complete 4 gamified assessments, then Gemini AI evaluates your cognitive performance</p>
        </div>
        <div className="flex flex-col gap-3">
          {TEST_INFO.map((test, i) => {
            const Icon = test.icon
            return (
              <Card key={test.id} className="border-border/60">
                <CardContent className="flex items-center gap-4 py-4">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary/10"><Icon className="h-6 w-6 text-primary" /></div>
                  <div className="flex-1">
                    <p className="font-semibold text-foreground">{test.label}</p>
                    <p className="text-sm text-muted-foreground">{test.description}</p>
                  </div>
                  <Badge variant="outline">{i + 1}</Badge>
                </CardContent>
              </Card>
            )
          })}
        </div>
        <Button onClick={() => setPhase("testing")} size="lg" className="mt-6 h-14 w-full text-lg">
          Start Tests<ArrowRight className="ml-2 h-5 w-5" />
        </Button>
      </div>
    )
  }

  if (phase === "analyzing") {
    return (
      <div className="mx-auto flex max-w-2xl flex-col items-center justify-center gap-6 py-20">
        <div className="flex h-20 w-20 animate-pulse items-center justify-center rounded-full bg-primary/10">
          <Sparkles className="h-10 w-10 text-primary" />
        </div>
        <div className="text-center">
          <h2 className="text-2xl font-bold text-foreground">Gemini AI Analyzing Results</h2>
          <p className="mt-2 text-base text-muted-foreground">Evaluating memory, attention, executive function, and processing speed...</p>
        </div>
        <Progress value={analyzeProgress} className="h-2 w-64" />
        <p className="text-xs text-muted-foreground">Powered by Google Gemini</p>
      </div>
    )
  }

  if (phase === "testing") {
    const testType = TEST_INFO[currentTest].id
    return (
      <div className="mx-auto max-w-2xl">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <Badge variant="outline" className="mb-2">Test {currentTest + 1} of {TEST_INFO.length}</Badge>
            <h2 className="text-2xl font-bold text-foreground">{TEST_INFO[currentTest].label}</h2>
          </div>
          <div className="flex items-center gap-1">
            {TEST_INFO.map((_, i) => (
              <div key={i} className={`h-2 w-8 rounded-full ${i < currentTest ? "bg-primary" : i === currentTest ? "bg-primary/50" : "bg-muted"}`} />
            ))}
          </div>
        </div>
        <Card className="border-border/60">
          <CardContent className="pt-6">
            {testType === "word-recall" && <WordRecallTest onComplete={(s) => handleTestComplete("word-recall", s)} />}
            {testType === "number-sequence" && <NumberSequenceTest onComplete={(s) => handleTestComplete("number-sequence", s)} />}
            {testType === "object-recognition" && <ObjectRecognitionTest onComplete={(s) => handleTestComplete("object-recognition", s)} />}
            {testType === "pattern-recognition" && <PatternRecognitionTest onComplete={(s) => handleTestComplete("pattern-recognition", s)} />}
          </CardContent>
        </Card>
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
          <h2 className="text-2xl font-bold text-foreground">Cognitive Test Results</h2>
          <p className="mt-1 text-base text-muted-foreground">Gemini AI evaluation of all 4 assessments</p>
        </div>
        <Button variant="outline" onClick={reset}><RotateCcw className="mr-2 h-4 w-4" />Retake</Button>
      </div>

      <div className="flex flex-col gap-4">
        <Card className="border-border/60">
          <CardContent className="flex items-center gap-6 pt-6">
            <div className="flex h-24 w-24 shrink-0 flex-col items-center justify-center rounded-full border-4" style={{ borderColor: scoreColor }}>
              <span className="text-3xl font-bold text-foreground">{r.score}</span>
              <span className="text-xs text-muted-foreground">/ 100</span>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-foreground">Cognitive Performance Score</h3>
              <Badge variant={r.score >= 70 ? "default" : r.score >= 45 ? "secondary" : "destructive"} className="mt-1">
                {r.score >= 70 ? "Strong Performance" : r.score >= 45 ? "Some Areas of Concern" : "Needs Attention"}
              </Badge>
              {r.aiSummary && <p className="mt-2 text-sm text-muted-foreground">{r.aiSummary}</p>}
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/60">
          <CardHeader><CardTitle className="text-lg">Test Breakdown</CardTitle><CardDescription>Individual test accuracy scores</CardDescription></CardHeader>
          <CardContent className="flex flex-col gap-5">
            <ScoreBar label="Word Recall" value={r.wordRecall.accuracy} color="oklch(0.55 0.14 195)" />
            <ScoreBar label="Number Sequence" value={r.numberSequence.accuracy} color="oklch(0.72 0.15 160)" />
            <ScoreBar label="Object Recognition" value={r.objectRecognition.accuracy} color="oklch(0.65 0.18 250)" />
            <ScoreBar label="Pattern Recognition" value={r.patternRecognition.accuracy} color="oklch(0.78 0.15 75)" />
          </CardContent>
        </Card>

        {r.domainAnalysis && (
          <Card className="border-border/60">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg"><Sparkles className="h-5 w-5 text-primary" />Gemini Domain Analysis</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-3">
              {Object.entries(r.domainAnalysis).map(([key, val]) => (
                <div key={key} className="rounded-lg bg-muted/50 p-3">
                  <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">{key.replace(/([A-Z])/g, " $1").trim()}</p>
                  <p className="mt-1 text-sm text-foreground">{val}</p>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {r.aiInsights && r.aiInsights.length > 0 && (
          <Card className="border-border/60">
            <CardHeader><CardTitle className="flex items-center gap-2 text-lg"><AlertCircle className="h-5 w-5 text-primary" />Gemini AI Insights</CardTitle></CardHeader>
            <CardContent>
              <ul className="flex flex-col gap-3">
                {r.aiInsights.map((insight, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm leading-relaxed text-foreground">
                    <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />{insight}
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}

        <Card className="border-border/60">
          <CardHeader><CardTitle className="flex items-center gap-2 text-lg"><Timer className="h-5 w-5 text-primary" />Reaction Times</CardTitle></CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              {[
                { label: "Word Recall", time: r.wordRecall.reactionTime },
                { label: "Number Seq.", time: r.numberSequence.reactionTime },
                { label: "Object Recog.", time: r.objectRecognition.reactionTime },
                { label: "Pattern Recog.", time: r.patternRecognition.reactionTime },
              ].map((item) => (
                <div key={item.label} className="flex flex-col items-center rounded-lg bg-muted/50 p-3">
                  <span className="text-xs text-muted-foreground">{item.label}</span>
                  <span className="text-lg font-bold text-foreground">{(item.time / 1000).toFixed(1)}s</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <div className="flex items-center justify-center gap-2">
          <CheckCircle2 className="h-5 w-5 text-primary" />
          <span className="text-sm text-muted-foreground">Results saved. View your dashboard for the complete risk assessment.</span>
        </div>
      </div>
    </div>
  )
}
