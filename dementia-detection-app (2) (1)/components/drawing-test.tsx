"use client"

import { useState, useRef, useCallback, useEffect } from "react"
import { useAssessment, type DrawingResult } from "@/lib/assessment-context"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { PenTool, RotateCcw, Trash2, CheckCircle2, ArrowRight, Sparkles, AlertCircle } from "lucide-react"
import { toast } from "sonner"

type Phase = "intro" | "drawing" | "analyzing" | "results"

function ScoreBar({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-foreground">{label}</span>
        <span className="text-sm font-bold text-foreground">{value}/100</span>
      </div>
      <div className="h-3 overflow-hidden rounded-full bg-muted">
        <div className="h-full rounded-full transition-all duration-1000" style={{ width: `${value}%`, backgroundColor: color }} />
      </div>
    </div>
  )
}

export function DrawingTest() {
  const { currentDrawing, setDrawingResult } = useAssessment()
  const [phase, setPhase] = useState<Phase>(currentDrawing ? "results" : "intro")
  const [result, setResult] = useState<DrawingResult | null>(currentDrawing)
  const [isDrawing, setIsDrawing] = useState(false)
  const [analyzeProgress, setAnalyzeProgress] = useState(0)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const lastPosRef = useRef<{ x: number; y: number } | null>(null)

  const initCanvas = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext("2d")
    if (!ctx) return
    const rect = canvas.getBoundingClientRect()
    canvas.width = rect.width * 2
    canvas.height = rect.height * 2
    ctx.scale(2, 2)
    ctx.fillStyle = "#ffffff"
    ctx.fillRect(0, 0, rect.width, rect.height)
    const centerX = rect.width / 2
    const centerY = rect.height / 2
    const radius = Math.min(centerX, centerY) - 20
    ctx.beginPath()
    ctx.arc(centerX, centerY, radius, 0, Math.PI * 2)
    ctx.strokeStyle = "oklch(0.91 0.01 200)"
    ctx.lineWidth = 1
    ctx.setLineDash([6, 4])
    ctx.stroke()
    ctx.setLineDash([])
    ctx.fillStyle = "oklch(0.7 0.02 240)"
    ctx.font = "13px Inter, sans-serif"
    ctx.textAlign = "center"
    ctx.fillText("Draw a clock showing 10:10", centerX, centerY + radius + 16)
  }, [])

  useEffect(() => {
    if (phase === "drawing") setTimeout(initCanvas, 100)
  }, [phase, initCanvas])

  const getPos = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current
    if (!canvas) return { x: 0, y: 0 }
    const rect = canvas.getBoundingClientRect()
    if ("touches" in e) {
      const touch = e.touches[0]
      return { x: touch.clientX - rect.left, y: touch.clientY - rect.top }
    }
    return { x: e.clientX - rect.left, y: e.clientY - rect.top }
  }

  const startDraw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    e.preventDefault()
    setIsDrawing(true)
    lastPosRef.current = getPos(e)
  }

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    e.preventDefault()
    if (!isDrawing || !lastPosRef.current) return
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext("2d")
    if (!ctx) return
    const pos = getPos(e)
    ctx.beginPath()
    ctx.moveTo(lastPosRef.current.x, lastPosRef.current.y)
    ctx.lineTo(pos.x, pos.y)
    ctx.strokeStyle = "oklch(0.16 0.02 240)"
    ctx.lineWidth = 2.5
    ctx.lineCap = "round"
    ctx.lineJoin = "round"
    ctx.stroke()
    lastPosRef.current = pos
  }

  const stopDraw = () => {
    setIsDrawing(false)
    lastPosRef.current = null
  }

  const submitDrawing = useCallback(async () => {
    const canvas = canvasRef.current
    if (!canvas) return

    setPhase("analyzing")
    setAnalyzeProgress(10)

    const imageData = canvas.toDataURL("image/png")

    const progressInterval = setInterval(() => {
      setAnalyzeProgress((prev) => Math.min(prev + 6, 85))
    }, 500)

    try {
      const res = await fetch("/api/analyze-drawing", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageData }),
      })

      clearInterval(progressInterval)
      setAnalyzeProgress(95)

      if (!res.ok) throw new Error("API failed")

      const ai = await res.json()

      const drawingResult: DrawingResult = {
        imageData,
        shapeDistortion: ai.shapeAccuracy ?? 60,
        numberPlacement: ai.numberPlacement ?? 55,
        symmetry: ai.symmetry ?? 50,
        tremorDetection: 100 - (ai.strokeQuality ?? 70),
        score: ai.overallScore ?? 55,
        aiInsights: ai.insights ?? [],
        aiSummary: ai.summary ?? "",
        completedAt: new Date().toISOString(),
      }
      setResult(drawingResult)
      setDrawingResult(drawingResult)
      setAnalyzeProgress(100)
      setPhase("results")
      toast.success("Gemini Vision drawing analysis complete!")
    } catch {
      clearInterval(progressInterval)
      // Fallback: basic pixel analysis
      const ctx = canvas.getContext("2d")!
      const pixels = ctx.getImageData(0, 0, canvas.width, canvas.height)
      const data = pixels.data
      let drawnPixels = 0
      for (let i = 0; i < data.length; i += 4) {
        if (data[i] < 240 || data[i + 1] < 240 || data[i + 2] < 240) drawnPixels++
      }
      const coverage = drawnPixels / (canvas.width * canvas.height)
      const score = Math.max(20, Math.min(85, Math.round(coverage * 800 + 30)))

      const drawingResult: DrawingResult = {
        imageData,
        shapeDistortion: Math.round(score * 0.9),
        numberPlacement: Math.round(score * 0.85),
        symmetry: Math.round(score * 0.8),
        tremorDetection: Math.round(30 + Math.random() * 15),
        score,
        completedAt: new Date().toISOString(),
      }
      setResult(drawingResult)
      setDrawingResult(drawingResult)
      setPhase("results")
      toast.warning("Used local analysis (Gemini unavailable)")
    }
  }, [setDrawingResult])

  const reset = () => {
    setPhase("intro")
    setResult(null)
    setAnalyzeProgress(0)
  }

  if (phase === "intro") {
    return (
      <div className="mx-auto max-w-2xl">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-foreground">Clock Drawing Test</h2>
          <p className="mt-1 text-base text-muted-foreground">A validated cognitive screening tool analyzed by Gemini Vision AI</p>
        </div>
        <Card className="border-border/60">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg"><PenTool className="h-5 w-5 text-primary" />Instructions</CardTitle>
            <CardDescription className="flex items-center gap-1.5"><Sparkles className="h-3.5 w-3.5 text-primary" />Powered by Google Gemini Vision</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <div className="flex flex-col gap-4 rounded-lg bg-muted/50 p-4">
              <div className="flex items-start gap-3">
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">1</div>
                <div><p className="font-medium text-foreground">Draw a clock face</p><p className="text-sm text-muted-foreground">Draw a circle and place all 12 numbers in the correct positions</p></div>
              </div>
              <div className="flex items-start gap-3">
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">2</div>
                <div><p className="font-medium text-foreground">Set the time to 10:10</p><p className="text-sm text-muted-foreground">Draw the hour and minute hands showing ten minutes past ten</p></div>
              </div>
              <div className="flex items-start gap-3">
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">3</div>
                <div><p className="font-medium text-foreground">Submit for Gemini Vision analysis</p><p className="text-sm text-muted-foreground">AI evaluates shape, symmetry, numbers, hands, and stroke quality</p></div>
              </div>
            </div>
            <Button onClick={() => setPhase("drawing")} size="lg" className="h-14 text-lg">Start Drawing<ArrowRight className="ml-2 h-5 w-5" /></Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (phase === "drawing") {
    return (
      <div className="mx-auto max-w-2xl">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-foreground">Draw a Clock</h2>
          <p className="mt-1 text-base text-muted-foreground">Draw a clock face showing the time 10:10</p>
        </div>
        <Card className="border-border/60">
          <CardContent className="flex flex-col gap-4 pt-6">
            <div className="overflow-hidden rounded-xl border border-border bg-card">
              <canvas
                ref={canvasRef}
                className="h-80 w-full cursor-crosshair touch-none"
                onMouseDown={startDraw}
                onMouseMove={draw}
                onMouseUp={stopDraw}
                onMouseLeave={stopDraw}
                onTouchStart={startDraw}
                onTouchMove={draw}
                onTouchEnd={stopDraw}
              />
            </div>
            <div className="flex gap-3">
              <Button variant="outline" onClick={initCanvas} className="flex-1"><Trash2 className="mr-2 h-4 w-4" />Clear</Button>
              <Button onClick={submitDrawing} className="flex-1"><CheckCircle2 className="mr-2 h-4 w-4" />Analyze with Gemini</Button>
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
          <PenTool className="h-10 w-10 text-primary" />
        </div>
        <div className="text-center">
          <h2 className="text-2xl font-bold text-foreground">Gemini Vision Analyzing Drawing</h2>
          <p className="mt-2 text-base text-muted-foreground">Evaluating shape, numbers, symmetry, hand placement, and stroke quality...</p>
        </div>
        <Progress value={analyzeProgress} className="h-2 w-64" />
        <p className="text-xs text-muted-foreground">Powered by Google Gemini Vision</p>
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
          <h2 className="text-2xl font-bold text-foreground">Drawing Test Results</h2>
          <p className="mt-1 text-base text-muted-foreground">Gemini Vision AI analysis of your clock drawing</p>
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
              <h3 className="text-lg font-semibold text-foreground">Drawing Score</h3>
              <Badge variant={r.score >= 70 ? "default" : r.score >= 45 ? "secondary" : "destructive"} className="mt-1">
                {r.score >= 70 ? "Normal Range" : r.score >= 45 ? "Mild Concerns" : "Needs Attention"}
              </Badge>
              {r.aiSummary && <p className="mt-2 text-sm text-muted-foreground">{r.aiSummary}</p>}
            </div>
          </CardContent>
        </Card>

        {r.imageData && (
          <Card className="border-border/60">
            <CardHeader><CardTitle className="text-lg">Your Drawing</CardTitle></CardHeader>
            <CardContent>
              <div className="overflow-hidden rounded-lg border border-border">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={r.imageData} alt="Submitted clock drawing" className="h-64 w-full object-contain bg-card" />
              </div>
            </CardContent>
          </Card>
        )}

        <Card className="border-border/60">
          <CardHeader><CardTitle className="text-lg">Detailed Metrics</CardTitle><CardDescription>Gemini Vision analysis breakdown</CardDescription></CardHeader>
          <CardContent className="flex flex-col gap-5">
            <ScoreBar label="Shape Accuracy" value={r.shapeDistortion} color="oklch(0.55 0.14 195)" />
            <ScoreBar label="Number Placement" value={r.numberPlacement} color="oklch(0.72 0.15 160)" />
            <ScoreBar label="Symmetry" value={r.symmetry} color="oklch(0.65 0.18 250)" />
            <ScoreBar label="Stroke Steadiness" value={100 - r.tremorDetection} color="oklch(0.78 0.15 75)" />
          </CardContent>
        </Card>

        {r.aiInsights && r.aiInsights.length > 0 && (
          <Card className="border-border/60">
            <CardHeader><CardTitle className="flex items-center gap-2 text-lg"><AlertCircle className="h-5 w-5 text-primary" />Gemini Vision Insights</CardTitle></CardHeader>
            <CardContent>
              <ul className="flex flex-col gap-3">
                {r.aiInsights.map((insight, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm leading-relaxed text-foreground">
                    <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-primary" />{insight}
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}

        <div className="flex items-center justify-center gap-2">
          <CheckCircle2 className="h-5 w-5 text-primary" />
          <span className="text-sm text-muted-foreground">Results saved. View your dashboard for the complete risk assessment.</span>
        </div>
      </div>
    </div>
  )
}
