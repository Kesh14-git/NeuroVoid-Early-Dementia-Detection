"use client"

import { useMemo } from "react"
import { useAssessment } from "@/lib/assessment-context"
import { useAuth } from "@/lib/auth-context"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Separator } from "@/components/ui/separator"
import {
  Activity,
  Brain,
  Mic,
  PenTool,
  Gamepad2,
  ScanLine,
  TrendingDown,
  TrendingUp,
  Minus,
  ShieldCheck,
  Lightbulb,
  CheckCircle2,
  AlertTriangle,
  AlertCircle,
  Clock,
  Heart,
  Target,
  Stethoscope,
  CalendarDays,
  Sparkles,
  ArrowRight,
  BarChart3,
  FileCheck,
  Zap,
  Eye,
  HandMetal,
  MessageSquare,
} from "lucide-react"
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RTooltip,
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
} from "recharts"

/* ------------------------------------------------------------------ */
/*  Clinical interpretation helpers                                    */
/* ------------------------------------------------------------------ */

interface Interpretation {
  label: string
  color: string
  bg: string
  severity: "excellent" | "normal" | "borderline" | "concern"
  description: string
}

function interpret(score: number): Interpretation {
  if (score >= 80) return { label: "Excellent", color: "oklch(0.55 0.17 155)", bg: "bg-success/10", severity: "excellent", description: "Well within normal range. No concerns." }
  if (score >= 65) return { label: "Normal", color: "oklch(0.55 0.14 195)", bg: "bg-primary/10", severity: "normal", description: "Results within expected parameters." }
  if (score >= 45) return { label: "Borderline", color: "oklch(0.78 0.15 75)", bg: "bg-warning/10", severity: "borderline", description: "Some indicators below expected. Monitoring advised." }
  return { label: "Below Range", color: "oklch(0.577 0.245 27.325)", bg: "bg-destructive/10", severity: "concern", description: "Multiple markers below threshold. Evaluation advised." }
}

function pctLabel(v: number): string {
  if (v >= 80) return "Strong"
  if (v >= 65) return "Normal"
  if (v >= 45) return "Mild Concern"
  return "Significant Concern"
}
function pctColor(v: number): string {
  if (v >= 80) return "oklch(0.55 0.17 155)"
  if (v >= 65) return "oklch(0.55 0.14 195)"
  if (v >= 45) return "oklch(0.78 0.15 75)"
  return "oklch(0.577 0.245 27.325)"
}

function describeSpeech(s: { vocabularyRichness: number; sentenceComplexity: number; wordRepetition: number; speechPauses: number; speechRate: number; score: number; aiSummary?: string }): string {
  if (s.aiSummary) return s.aiSummary
  const i = interpret(s.score)
  const parts: string[] = []
  parts.push(`Overall language function is rated ${i.label.toLowerCase()} (${s.score}/100).`)
  if (s.vocabularyRichness >= 65) parts.push("Vocabulary diversity is within the healthy range, suggesting intact semantic retrieval.")
  else parts.push("Vocabulary diversity is reduced, which may indicate early word-finding difficulties commonly seen in mild cognitive impairment.")
  if (s.wordRepetition > 50) parts.push("Elevated word repetition was detected, often correlated with working memory decline.")
  if (s.speechPauses > 50) parts.push("Frequent hesitation pauses were noted, which may reflect slower cognitive processing speed.")
  else parts.push("Speech fluency and pacing appear within normal limits.")
  return parts.join(" ")
}

function describeCognitive(c: { wordRecall: { accuracy: number; reactionTime: number }; numberSequence: { accuracy: number; reactionTime: number }; objectRecognition: { accuracy: number; reactionTime: number }; patternRecognition: { accuracy: number; reactionTime: number }; score: number; aiSummary?: string }): string {
  if (c.aiSummary) return c.aiSummary
  const i = interpret(c.score)
  const domains = [
    { name: "short-term memory (word recall)", v: c.wordRecall.accuracy },
    { name: "working memory (number sequences)", v: c.numberSequence.accuracy },
    { name: "semantic processing (object recognition)", v: c.objectRecognition.accuracy },
    { name: "executive function (pattern recognition)", v: c.patternRecognition.accuracy },
  ]
  const weakest = [...domains].sort((a, b) => a.v - b.v)[0]
  const strongest = [...domains].sort((a, b) => b.v - a.v)[0]
  const parts: string[] = []
  parts.push(`Composite cognitive score is ${i.label.toLowerCase()} at ${c.score}/100.`)
  parts.push(`Strongest domain: ${strongest.name} at ${strongest.v}%.`)
  if (weakest.v < 60) parts.push(`Area of concern: ${weakest.name} at ${weakest.v}%, below the expected threshold for this age group. Further evaluation may be warranted.`)
  else parts.push(`All cognitive domains are within expected parameters.`)
  const avgRT = Math.round((c.wordRecall.reactionTime + c.numberSequence.reactionTime + c.objectRecognition.reactionTime + c.patternRecognition.reactionTime) / 4)
  if (avgRT > 1500) parts.push(`Average reaction time of ${avgRT}ms suggests mildly slowed processing speed.`)
  return parts.join(" ")
}

function describeDrawing(d: { shapeDistortion: number; numberPlacement: number; symmetry: number; tremorDetection: number; score: number; aiSummary?: string }): string {
  if (d.aiSummary) return d.aiSummary
  const i = interpret(d.score)
  const parts: string[] = []
  parts.push(`Clock Drawing Test is rated ${i.label.toLowerCase()} (${d.score}/100).`)
  if (d.shapeDistortion > 50) parts.push("Shape distortion was detected, which may suggest visuospatial processing changes.")
  else parts.push("Clock shape is well-formed and circular.")
  if (d.numberPlacement < 60) parts.push("Number placement shows irregularities in spatial distribution.")
  else parts.push("Numbers are appropriately placed around the clock face.")
  if (d.tremorDetection > 40) parts.push("Stroke analysis suggests possible fine motor tremor.")
  else parts.push("Stroke steadiness and line quality are within normal limits.")
  return parts.join(" ")
}

function describeMri(m: { hippocampalVolume: number; corticalAtrophy: number; whiteMatterIntegrity: number; ventricularSize: number; overallBrainVolume: number; overallScore: number; riskLevel: string; summary: string }): string {
  if (m.summary) return m.summary
  return `MRI analysis indicates ${m.riskLevel} risk with an overall structural integrity score of ${m.overallScore}/100.`
}

/* ------------------------------------------------------------------ */
/*  Sub-components                                                     */
/* ------------------------------------------------------------------ */

function RiskGaugeLarge({ score, level }: { score: number; level: "low" | "moderate" | "high" }) {
  const rotation = (score / 100) * 180 - 90
  const color = level === "low" ? "oklch(0.55 0.17 155)" : level === "moderate" ? "oklch(0.78 0.15 75)" : "oklch(0.577 0.245 27.325)"
  const i = interpret(score)
  return (
    <div className="flex flex-col items-center">
      <div className="relative mx-auto h-36 w-56">
        <svg viewBox="0 0 200 115" className="h-full w-full">
          <path d="M 20 100 A 80 80 0 0 1 180 100" fill="none" stroke="oklch(0.91 0.01 200)" strokeWidth="16" strokeLinecap="round" />
          <path d="M 20 100 A 80 80 0 0 1 60 34" fill="none" stroke="oklch(0.577 0.245 27.325)" strokeWidth="16" strokeLinecap="round" opacity="0.12" />
          <path d="M 60 34 A 80 80 0 0 1 140 34" fill="none" stroke="oklch(0.78 0.15 75)" strokeWidth="16" strokeLinecap="round" opacity="0.12" />
          <path d="M 140 34 A 80 80 0 0 1 180 100" fill="none" stroke="oklch(0.55 0.17 155)" strokeWidth="16" strokeLinecap="round" opacity="0.12" />
          <line x1="100" y1="100" x2="100" y2="30" stroke={color} strokeWidth="3" strokeLinecap="round" style={{ transform: `rotate(${rotation}deg)`, transformOrigin: "100px 100px", transition: "transform 1.2s cubic-bezier(0.34,1.56,0.64,1)" }} />
          <circle cx="100" cy="100" r="7" fill={color} />
          <circle cx="100" cy="100" r="3" fill="oklch(1 0 0)" />
          <text x="25" y="112" fontSize="7" fill="oklch(0.5 0.02 240)">High Risk</text>
          <text x="155" y="112" fontSize="7" fill="oklch(0.5 0.02 240)">Low Risk</text>
        </svg>
        <div className="absolute inset-x-0 bottom-1 text-center">
          <span className="text-4xl font-bold text-foreground">{score}</span>
          <span className="text-sm text-muted-foreground">/100</span>
        </div>
      </div>
      <Badge className="mt-1 px-3 py-0.5 text-xs font-semibold" style={{ backgroundColor: `color-mix(in oklch, ${i.color} 15%, transparent)`, color: i.color }}>{i.label}</Badge>
    </div>
  )
}

function RiskBadge({ level }: { level: "low" | "moderate" | "high" }) {
  if (level === "low") return <Badge className="gap-1 bg-success/15 px-2.5 py-0.5 text-xs text-success"><CheckCircle2 className="h-3 w-3" />Low Risk</Badge>
  if (level === "moderate") return <Badge className="gap-1 bg-warning/15 px-2.5 py-0.5 text-xs text-warning"><AlertTriangle className="h-3 w-3" />Moderate Risk</Badge>
  return <Badge variant="destructive" className="gap-1 px-2.5 py-0.5 text-xs"><AlertCircle className="h-3 w-3" />High Risk</Badge>
}

function ModuleReportCard({ icon: Icon, title, score, completed, color, summary }: {
  icon: typeof Mic; title: string; score: number | null; completed: boolean; color: string; summary: string | null
}) {
  const i = score !== null ? interpret(score) : null
  return (
    <Card className="group relative overflow-hidden border-border/60 transition-shadow hover:shadow-md">
      <div className="absolute inset-x-0 top-0 h-1" style={{ backgroundColor: completed ? color : "transparent" }} />
      <CardContent className="flex flex-col gap-3 pt-5 pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg" style={{ backgroundColor: `color-mix(in oklch, ${color} 12%, transparent)` }}>
              <Icon className="h-4 w-4" style={{ color }} />
            </div>
            <span className="text-sm font-semibold text-foreground">{title}</span>
          </div>
          {completed ? <CheckCircle2 className="h-4 w-4 text-success" /> : <div className="h-4 w-4 rounded-full border-2 border-border" />}
        </div>
        {completed && score !== null && i ? (
          <>
            <div className="flex items-center gap-3">
              <div className="flex-1">
                <div className="mb-1 flex items-center justify-between">
                  <Badge className="text-[10px]" style={{ backgroundColor: `color-mix(in oklch, ${i.color} 12%, transparent)`, color: i.color }}>{i.label}</Badge>
                  <span className="text-lg font-bold text-foreground">{score}<span className="text-xs font-normal text-muted-foreground">/100</span></span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-muted">
                  <div className="h-full rounded-full transition-all duration-1000" style={{ width: `${score}%`, backgroundColor: i.color }} />
                </div>
              </div>
            </div>
            {summary && <p className="text-xs leading-relaxed text-muted-foreground">{summary}</p>}
          </>
        ) : (
          <p className="text-xs text-muted-foreground/60">Test not yet completed. Run this assessment to generate analysis.</p>
        )}
      </CardContent>
    </Card>
  )
}

function FindingSection({ icon: Icon, title, severity, children }: {
  icon: typeof Brain; title: string; severity: "excellent" | "normal" | "borderline" | "concern"; children: React.ReactNode
}) {
  const cfg = {
    excellent: { color: "oklch(0.55 0.17 155)", bg: "bg-success/5", border: "border-success/20", label: "Normal" },
    normal: { color: "oklch(0.55 0.14 195)", bg: "bg-primary/5", border: "border-primary/20", label: "Within Range" },
    borderline: { color: "oklch(0.78 0.15 75)", bg: "bg-warning/5", border: "border-warning/20", label: "Monitor" },
    concern: { color: "oklch(0.577 0.245 27.325)", bg: "bg-destructive/5", border: "border-destructive/20", label: "Action Needed" },
  }[severity]
  return (
    <div className={`rounded-xl border ${cfg.border} ${cfg.bg} p-4`}>
      <div className="mb-2.5 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Icon className="h-4 w-4" style={{ color: cfg.color }} />
          <span className="text-sm font-semibold text-foreground">{title}</span>
        </div>
        <Badge className="text-[10px]" style={{ backgroundColor: `color-mix(in oklch, ${cfg.color} 12%, transparent)`, color: cfg.color }}>{cfg.label}</Badge>
      </div>
      <p className="text-[13px] leading-relaxed text-muted-foreground">{children}</p>
    </div>
  )
}

function StatPill({ icon: Icon, label, value }: { icon: typeof Clock; label: string; value: string }) {
  return (
    <div className="flex items-center gap-2.5 rounded-lg bg-muted/50 px-4 py-2.5">
      <Icon className="h-4 w-4 text-primary" />
      <div>
        <p className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</p>
        <p className="text-sm font-semibold text-foreground">{value}</p>
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/*  Main Dashboard                                                     */
/* ------------------------------------------------------------------ */

export function DashboardView() {
  const { user } = useAuth()
  const { currentSpeech, currentCognitive, currentDrawing, currentMri, currentRisk, history } = useAssessment()

  const latestHistory = history[history.length - 1]
  const latestRisk = currentRisk ?? latestHistory?.risk ?? null
  const prevRisk = history.length >= 2 ? history[history.length - 2]?.risk : null
  const completedCount = [currentSpeech, currentCognitive, currentDrawing, currentMri].filter(Boolean).length

  // ------ Derived analysis text ------

  const speechData = currentSpeech ?? latestHistory?.speech ?? null
  const cognitiveData = currentCognitive ?? latestHistory?.cognitive ?? null
  const drawingData = currentDrawing ?? latestHistory?.drawing ?? null
  const mriData = currentMri ?? null

  const speechText = useMemo(() => speechData ? describeSpeech(speechData) : null, [speechData])
  const cognitiveText = useMemo(() => cognitiveData ? describeCognitive(cognitiveData) : null, [cognitiveData])
  const drawingText = useMemo(() => drawingData ? describeDrawing(drawingData) : null, [drawingData])
  const mriText = useMemo(() => mriData ? describeMri(mriData) : null, [mriData])

  const severity = (score: number | undefined): "excellent" | "normal" | "borderline" | "concern" => {
    if (score === undefined) return "normal"
    return interpret(score).severity
  }

  // ------ Trend chart data ------
  const trendData = useMemo(() => {
    const data = history.map((h) => ({
      date: new Date(h.date).toLocaleDateString("en-US", { month: "short", year: "2-digit" }),
      overall: h.risk?.overallScore ?? null,
      speech: h.speech?.score ?? null,
      cognitive: h.cognitive?.score ?? null,
      drawing: h.drawing?.score ?? null,
    }))
    if (currentRisk) {
      data.push({ date: "Now", overall: currentRisk.overallScore, speech: currentSpeech?.score ?? null, cognitive: currentCognitive?.score ?? null, drawing: currentDrawing?.score ?? null })
    }
    return data
  }, [history, currentRisk, currentSpeech, currentCognitive, currentDrawing])

  // ------ Radar data ------
  const radarData = useMemo(() => [
    { metric: "Vocabulary", value: speechData?.vocabularyRichness ?? 0, fullMark: 100 },
    { metric: "Fluency", value: speechData ? Math.max(0, 100 - speechData.speechPauses) : 0, fullMark: 100 },
    { metric: "Memory", value: cognitiveData?.wordRecall.accuracy ?? 0, fullMark: 100 },
    { metric: "Reasoning", value: cognitiveData?.patternRecognition.accuracy ?? 0, fullMark: 100 },
    { metric: "Visuospatial", value: drawingData?.score ?? 0, fullMark: 100 },
    { metric: "Processing", value: cognitiveData?.objectRecognition.accuracy ?? 0, fullMark: 100 },
  ], [speechData, cognitiveData, drawingData])

  // ------ Cognitive domain analysis ------
  const domainRows = useMemo(() => [
    { icon: Brain, domain: "Short-term Memory", metric: "Word Recall", score: cognitiveData?.wordRecall.accuracy ?? 0, detail: cognitiveData ? `Recalled ${Math.round(cognitiveData.wordRecall.accuracy / 20)}/5 words in ${(cognitiveData.wordRecall.reactionTime / 1000).toFixed(1)}s` : "Not tested" },
    { icon: Zap, domain: "Working Memory", metric: "Number Sequences", score: cognitiveData?.numberSequence.accuracy ?? 0, detail: cognitiveData ? `Completed sequences with ${cognitiveData.numberSequence.accuracy}% accuracy` : "Not tested" },
    { icon: Eye, domain: "Semantic Processing", metric: "Object Recognition", score: cognitiveData?.objectRecognition.accuracy ?? 0, detail: cognitiveData ? `Identified objects with ${cognitiveData.objectRecognition.accuracy}% accuracy` : "Not tested" },
    { icon: Target, domain: "Executive Function", metric: "Pattern Recognition", score: cognitiveData?.patternRecognition.accuracy ?? 0, detail: cognitiveData ? `Pattern solving at ${cognitiveData.patternRecognition.accuracy}% accuracy` : "Not tested" },
    { icon: HandMetal, domain: "Visuospatial / Motor", metric: "Clock Drawing", score: drawingData?.score ?? 0, detail: drawingData ? `Shape: ${drawingData.shapeDistortion > 50 ? "distorted" : "intact"}, Symmetry: ${drawingData.symmetry}%` : "Not tested" },
    { icon: MessageSquare, domain: "Language Function", metric: "Speech Fluency", score: speechData?.score ?? 0, detail: speechData ? `Vocabulary: ${speechData.vocabularyRichness}%, Fluency: ${Math.max(0, 100 - speechData.speechPauses)}%` : "Not tested" },
  ], [cognitiveData, drawingData, speechData])

  // ------ Risk trend ------
  const riskTrend = useMemo(() => {
    if (!latestRisk || !prevRisk) return null
    const diff = latestRisk.overallScore - prevRisk.overallScore
    if (Math.abs(diff) < 2) return { text: "Stable -- no significant change between assessments.", icon: Minus, className: "text-muted-foreground" }
    if (diff > 0) return { text: `Improved ${diff} points from last assessment, suggesting stable or improving function.`, icon: TrendingUp, className: "text-success" }
    return { text: `Declined ${Math.abs(diff)} points from last assessment. Closer monitoring may be appropriate.`, icon: TrendingDown, className: "text-destructive" }
  }, [latestRisk, prevRisk])

  const greeting = useMemo(() => {
    const h = new Date().getHours()
    if (h < 12) return "Good morning"
    if (h < 17) return "Good afternoon"
    return "Good evening"
  }, [])

  // ------ Overall interpretive summary ------
  const overallSummary = useMemo(() => {
    if (!latestRisk) return null
    const level = latestRisk.riskLevel
    const score = latestRisk.overallScore
    if (level === "low") return `The composite cognitive health score of ${score}/100 places the patient in the low-risk category. All assessed domains are functioning within normal or near-normal parameters. Routine follow-up screening in 6 months is recommended to track longitudinal trends.`
    if (level === "moderate") return `The composite cognitive health score of ${score}/100 indicates moderate risk. One or more cognitive domains show mild deviations from expected baseline. A follow-up assessment within 3 months is recommended, along with consultation with a neurologist to rule out treatable causes.`
    return `The composite cognitive health score of ${score}/100 indicates elevated risk. Multiple cognitive domains show below-threshold performance. Urgent referral for comprehensive neuropsychological evaluation and neuroimaging is strongly recommended.`
  }, [latestRisk])

  return (
    <div className="mx-auto max-w-7xl">
      {/* ============================================================ */}
      {/* HEADER                                                       */}
      {/* ============================================================ */}
      <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <h2 className="text-balance text-2xl font-bold text-foreground md:text-3xl">{greeting}, {user?.name?.split(" ")[0]}</h2>
          <p className="mt-1 text-base text-muted-foreground">AI-analyzed cognitive health report</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <StatPill icon={CalendarDays} label="Last Assessment" value={latestHistory ? new Date(latestHistory.date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "None yet"} />
          <StatPill icon={Activity} label="Total Sessions" value={String(history.length)} />
          <StatPill icon={FileCheck} label="This Session" value={`${completedCount}/4 done`} />
        </div>
      </div>

      {/* ============================================================ */}
      {/* ROW 1: RISK GAUGE + EXECUTIVE SUMMARY                        */}
      {/* ============================================================ */}
      <Card className="mb-6 border-border/60">
        <CardContent className="flex flex-col gap-6 pt-6 lg:flex-row lg:gap-10">
          <div className="flex flex-shrink-0 flex-col items-center gap-3">
            {latestRisk ? (
              <RiskGaugeLarge score={latestRisk.overallScore} level={latestRisk.riskLevel} />
            ) : (
              <div className="flex h-40 w-56 flex-col items-center justify-center rounded-xl bg-muted/40">
                <ShieldCheck className="h-12 w-12 text-muted-foreground" />
                <p className="mt-3 text-sm text-muted-foreground">Complete assessments to<br />generate risk analysis</p>
              </div>
            )}
            {latestRisk && (
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <span>Confidence:</span>
                <Progress value={latestRisk.confidence} className="h-1.5 w-16" />
                <span className="font-semibold text-foreground">{latestRisk.confidence}%</span>
              </div>
            )}
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-3">
              <Stethoscope className="h-5 w-5 text-primary" />
              <h3 className="text-lg font-bold text-foreground">Executive Summary</h3>
              {latestRisk && <RiskBadge level={latestRisk.riskLevel} />}
            </div>
            {overallSummary ? (
              <>
                <p className="mt-3 text-sm leading-relaxed text-foreground">{overallSummary}</p>
                {riskTrend && (
                  <div className={`mt-3 flex items-center gap-2 rounded-lg px-3 py-2 text-sm ${riskTrend.className} bg-muted/40`}>
                    <riskTrend.icon className="h-4 w-4" />
                    <span>{riskTrend.text}</span>
                  </div>
                )}
                <Separator className="my-4" />
                <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
                  <span>Speech: <strong className="text-foreground">{latestRisk!.speechWeight * 100}%</strong> weight</span>
                  <span>Cognitive: <strong className="text-foreground">{latestRisk!.cognitiveWeight * 100}%</strong> weight</span>
                  <span>Drawing: <strong className="text-foreground">{latestRisk!.drawingWeight * 100}%</strong> weight</span>
                  {latestRisk!.mriWeight > 0 && <span>MRI: <strong className="text-foreground">{latestRisk!.mriWeight * 100}%</strong> weight</span>}
                </div>
              </>
            ) : (
              <p className="mt-3 text-sm text-muted-foreground">Complete at least one assessment to generate a clinical summary. The risk engine combines speech, cognitive, drawing, and optionally MRI analysis using weighted scoring to produce a composite evaluation.</p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* ============================================================ */}
      {/* ROW 2: SESSION PROGRESS                                      */}
      {/* ============================================================ */}
      <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[
          { label: "Speech Analysis", done: !!currentSpeech, icon: Mic, color: "oklch(0.55 0.14 195)" },
          { label: "Cognitive Tests", done: !!currentCognitive, icon: Gamepad2, color: "oklch(0.72 0.15 160)" },
          { label: "Drawing Test", done: !!currentDrawing, icon: PenTool, color: "oklch(0.65 0.18 250)" },
          { label: "MRI Analysis", done: !!currentMri, icon: ScanLine, color: "oklch(0.60 0.20 30)" },
        ].map((t) => (
          <div key={t.label} className={`flex items-center gap-3 rounded-xl border px-4 py-3 transition-colors ${t.done ? "border-success/30 bg-success/5" : "border-border bg-card"}`}>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg" style={{ backgroundColor: `color-mix(in oklch, ${t.color} 12%, transparent)` }}>
              <t.icon className="h-4 w-4" style={{ color: t.color }} />
            </div>
            <div className="flex-1">
              <p className="text-xs font-medium text-foreground">{t.label}</p>
              <p className={`text-[11px] ${t.done ? "font-semibold text-success" : "text-muted-foreground"}`}>{t.done ? "Completed" : "Pending"}</p>
            </div>
            {t.done ? <CheckCircle2 className="h-4 w-4 text-success" /> : <div className="h-4 w-4 rounded-full border-2 border-border" />}
          </div>
        ))}
      </div>

      {/* ============================================================ */}
      {/* ROW 3: MODULE REPORT CARDS (with AI-written summaries)       */}
      {/* ============================================================ */}
      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <ModuleReportCard icon={Mic} title="Speech Analysis" score={speechData?.score ?? null} completed={!!speechData} color="oklch(0.55 0.14 195)" summary={speechText} />
        <ModuleReportCard icon={Gamepad2} title="Cognitive Tests" score={cognitiveData?.score ?? null} completed={!!cognitiveData} color="oklch(0.72 0.15 160)" summary={cognitiveText} />
        <ModuleReportCard icon={PenTool} title="Drawing Test" score={drawingData?.score ?? null} completed={!!drawingData} color="oklch(0.65 0.18 250)" summary={drawingText} />
        <ModuleReportCard icon={ScanLine} title="MRI Analysis" score={mriData?.overallScore ?? null} completed={!!mriData} color="oklch(0.60 0.20 30)" summary={mriText} />
      </div>

      {/* ============================================================ */}
      {/* ROW 4: DETAILED CLINICAL FINDINGS                            */}
      {/* ============================================================ */}
      {(speechData || cognitiveData || drawingData || mriData) && (
        <Card className="mb-6 border-border/60">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Stethoscope className="h-5 w-5 text-primary" />
              Detailed Clinical Findings
            </CardTitle>
            <CardDescription>In-depth AI-interpreted analysis for each assessment module</CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {speechData && (
              <FindingSection icon={Mic} title="Speech and Language Function" severity={severity(speechData.score)}>
                {speechText}
              </FindingSection>
            )}
            {cognitiveData && (
              <FindingSection icon={Brain} title="Cognitive Function Battery" severity={severity(cognitiveData.score)}>
                {cognitiveText}
              </FindingSection>
            )}
            {drawingData && (
              <FindingSection icon={PenTool} title="Visuospatial and Motor Function" severity={severity(drawingData.score)}>
                {drawingText}
              </FindingSection>
            )}
            {mriData && (
              <FindingSection icon={ScanLine} title="Neuroimaging Analysis (MRI)" severity={mriData.riskLevel === "low" ? "excellent" : mriData.riskLevel === "moderate" ? "borderline" : "concern"}>
                {mriText}
              </FindingSection>
            )}
          </CardContent>
        </Card>
      )}

      {/* ============================================================ */}
      {/* ROW 5: COGNITIVE DOMAIN BREAKDOWN TABLE                      */}
      {/* ============================================================ */}
      {(cognitiveData || drawingData || speechData) && (
        <Card className="mb-6 border-border/60">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <BarChart3 className="h-4 w-4 text-primary" />
              Cognitive Domain Breakdown
            </CardTitle>
            <CardDescription>Performance, clinical status, and detail per domain</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-3">
              {domainRows.map((d) => (
                <div key={d.domain} className="flex flex-col gap-1.5 rounded-lg bg-muted/30 px-4 py-3 sm:flex-row sm:items-center sm:gap-4">
                  <div className="flex items-center gap-2 sm:w-44 sm:shrink-0">
                    <d.icon className="h-4 w-4" style={{ color: pctColor(d.score) }} />
                    <span className="text-sm font-medium text-foreground">{d.domain}</span>
                  </div>
                  <div className="flex flex-1 items-center gap-3">
                    <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-muted">
                      <div className="h-full rounded-full transition-all duration-700" style={{ width: `${d.score}%`, backgroundColor: pctColor(d.score) }} />
                    </div>
                    <span className="w-9 text-right text-sm font-bold text-foreground">{d.score}</span>
                  </div>
                  <div className="flex items-center gap-2 sm:w-64 sm:shrink-0">
                    <Badge className="w-28 justify-center text-[10px]" style={{ backgroundColor: `color-mix(in oklch, ${pctColor(d.score)} 12%, transparent)`, color: pctColor(d.score) }}>{pctLabel(d.score)}</Badge>
                    <span className="text-[11px] text-muted-foreground">{d.detail}</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* ============================================================ */}
      {/* ROW 6: CHARTS                                                */}
      {/* ============================================================ */}
      <div className="mb-6 grid grid-cols-1 gap-5 lg:grid-cols-2">
        {/* Score Progression */}
        <Card className="border-border/60">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base"><Activity className="h-4 w-4 text-primary" />Score Progression</CardTitle>
            <CardDescription>Longitudinal trend across assessments</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={trendData}>
                  <defs>
                    <linearGradient id="gradOverall" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="oklch(0.55 0.14 195)" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="oklch(0.55 0.14 195)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.91 0.01 200)" />
                  <XAxis dataKey="date" tick={{ fontSize: 11 }} stroke="oklch(0.5 0.02 240)" />
                  <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} stroke="oklch(0.5 0.02 240)" />
                  <RTooltip contentStyle={{ backgroundColor: "oklch(1 0 0)", border: "1px solid oklch(0.91 0.01 200)", borderRadius: "8px", fontSize: "12px" }}
                    formatter={(value: number, name: string) => [`${value}/100 (${interpret(value).label})`, name.charAt(0).toUpperCase() + name.slice(1)]}
                  />
                  <Area type="monotone" dataKey="overall" stroke="oklch(0.55 0.14 195)" strokeWidth={2.5} fill="url(#gradOverall)" name="Overall" connectNulls />
                  <Area type="monotone" dataKey="speech" stroke="oklch(0.65 0.18 250)" strokeWidth={1.5} fill="transparent" strokeDasharray="4 4" name="Speech" connectNulls />
                  <Area type="monotone" dataKey="cognitive" stroke="oklch(0.72 0.15 160)" strokeWidth={1.5} fill="transparent" strokeDasharray="4 4" name="Cognitive" connectNulls />
                  <Area type="monotone" dataKey="drawing" stroke="oklch(0.78 0.15 75)" strokeWidth={1.5} fill="transparent" strokeDasharray="4 4" name="Drawing" connectNulls />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Cognitive Profile */}
        <Card className="border-border/60">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base"><Brain className="h-4 w-4 text-primary" />Cognitive Profile Map</CardTitle>
            <CardDescription>Multi-dimensional ability assessment</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart data={radarData}>
                  <PolarGrid stroke="oklch(0.91 0.01 200)" />
                  <PolarAngleAxis dataKey="metric" tick={{ fontSize: 10 }} stroke="oklch(0.5 0.02 240)" />
                  <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fontSize: 9 }} stroke="oklch(0.5 0.02 240)" />
                  <Radar name="Score" dataKey="value" stroke="oklch(0.55 0.14 195)" fill="oklch(0.55 0.14 195)" fillOpacity={0.15} strokeWidth={2} />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ============================================================ */}
      {/* ROW 7: KEY METRICS SNAPSHOT                                  */}
      {/* ============================================================ */}
      {(speechData || cognitiveData || drawingData) && (
        <Card className="mb-6 border-border/60">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base"><Heart className="h-4 w-4 text-destructive" />Key Health Indicators</CardTitle>
            <CardDescription>Individual metric status with clinical interpretation</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {[
                { label: "Vocabulary Diversity", value: speechData?.vocabularyRichness ?? 0, desc: speechData ? (speechData.vocabularyRichness >= 65 ? "Semantic retrieval intact" : "Reduced lexical variety") : "Not tested" },
                { label: "Speech Fluency", value: speechData ? Math.max(0, 100 - speechData.speechPauses) : 0, desc: speechData ? ((100 - speechData.speechPauses) >= 60 ? "Normal pacing" : "Frequent hesitations") : "Not tested" },
                { label: "Memory Recall", value: cognitiveData?.wordRecall.accuracy ?? 0, desc: cognitiveData ? (cognitiveData.wordRecall.accuracy >= 65 ? "Encoding and retrieval normal" : "Possible encoding deficit") : "Not tested" },
                { label: "Pattern Reasoning", value: cognitiveData?.patternRecognition.accuracy ?? 0, desc: cognitiveData ? (cognitiveData.patternRecognition.accuracy >= 65 ? "Executive function intact" : "Executive function below expected") : "Not tested" },
                { label: "Motor Steadiness", value: drawingData ? Math.max(0, 100 - drawingData.tremorDetection) : 0, desc: drawingData ? (drawingData.tremorDetection <= 40 ? "No tremor detected" : "Possible fine motor tremor") : "Not tested" },
                { label: "Spatial Accuracy", value: drawingData?.numberPlacement ?? 0, desc: drawingData ? (drawingData.numberPlacement >= 65 ? "Spatial awareness normal" : "Spatial deficits noted") : "Not tested" },
              ].map((item) => (
                <div key={item.label} className="flex flex-col gap-2 rounded-lg bg-muted/30 px-4 py-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-foreground">{item.label}</span>
                    <div className="flex items-center gap-1.5">
                      <span className="text-sm font-bold text-foreground">{item.value}%</span>
                      <Badge className="h-4 px-1 text-[9px]" style={{ backgroundColor: `color-mix(in oklch, ${pctColor(item.value)} 12%, transparent)`, color: pctColor(item.value) }}>{pctLabel(item.value)}</Badge>
                    </div>
                  </div>
                  <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                    <div className="h-full rounded-full transition-all duration-700" style={{ width: `${item.value}%`, backgroundColor: pctColor(item.value) }} />
                  </div>
                  <p className="text-[11px] text-muted-foreground">{item.desc}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* ============================================================ */}
      {/* ROW 8: AI INSIGHTS + RECOMMENDATIONS                         */}
      {/* ============================================================ */}
      {latestRisk && (
        <div className="mb-6 grid grid-cols-1 gap-5 lg:grid-cols-2">
          <Card className="border-border/60">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base"><Lightbulb className="h-4 w-4 text-warning" />AI Clinical Insights</CardTitle>
              <CardDescription>Key findings synthesized by Gemini AI</CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="flex flex-col gap-3">
                {latestRisk.insights.map((insight, i) => (
                  <li key={i} className="flex items-start gap-3 text-sm leading-relaxed text-foreground">
                    <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-[11px] font-bold text-primary">{i + 1}</span>
                    {insight}
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
          <Card className="border-border/60">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base"><Sparkles className="h-4 w-4 text-primary" />Personalized Recommendations</CardTitle>
              <CardDescription>Next steps based on your results</CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="flex flex-col gap-3">
                {latestRisk.recommendations.map((rec, i) => (
                  <li key={i} className="flex items-start gap-3 text-sm leading-relaxed text-foreground">
                    <ArrowRight className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                    {rec}
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </div>
      )}

      {/* ============================================================ */}
      {/* ROW 9: ASSESSMENT TIMELINE                                   */}
      {/* ============================================================ */}
      {history.length > 0 && (
        <Card className="border-border/60">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base"><Clock className="h-4 w-4 text-primary" />Assessment History</CardTitle>
            <CardDescription>Longitudinal record with clinical interpretation</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="relative">
              <div className="absolute left-4 top-0 h-full w-0.5 bg-border" />
              <div className="flex flex-col gap-4">
                {[...history].reverse().map((h) => {
                  const ri = h.risk ? interpret(h.risk.overallScore) : null
                  const testsRun = [h.speech && "Speech", h.cognitive && "Cognitive", h.drawing && "Drawing", h.mri && "MRI"].filter(Boolean).join(", ")
                  return (
                    <div key={h.id} className="relative flex items-start gap-4 pl-10">
                      <div className="absolute left-2.5 top-2 h-3 w-3 rounded-full border-2 border-card" style={{ backgroundColor: ri?.color ?? "oklch(0.5 0.02 240)" }} />
                      <div className="flex flex-1 flex-col gap-2 rounded-xl bg-muted/30 px-4 py-3">
                        <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                          <div className="flex items-center gap-3">
                            <span className="text-sm font-semibold text-foreground">{new Date(h.date).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}</span>
                            {h.risk && <RiskBadge level={h.risk.riskLevel} />}
                          </div>
                          {h.risk && (
                            <span className="text-lg font-bold" style={{ color: ri?.color }}>{h.risk.overallScore}/100</span>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {ri ? `${ri.label} -- ${ri.description}` : "No risk calculated."} Tests: {testsRun || "None"}.
                        </p>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
