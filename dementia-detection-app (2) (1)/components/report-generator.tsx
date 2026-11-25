"use client"

import { useState } from "react"
import { useAssessment } from "@/lib/assessment-context"
import { useAuth } from "@/lib/auth-context"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import {
  FileText,
  Download,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  AlertCircle,
  Brain,
  Mic,
  Gamepad2,
  PenTool,
  ScanLine,
  ShieldCheck,
  Lightbulb,
  Calendar,
} from "lucide-react"
import { toast } from "sonner"

function RiskBadge({ level }: { level: "low" | "moderate" | "high" }) {
  if (level === "low") {
    return (
      <Badge className="bg-success text-success-foreground gap-1.5 px-3 py-1 text-sm">
        <CheckCircle2 className="h-3.5 w-3.5" />
        Low Risk
      </Badge>
    )
  }
  if (level === "moderate") {
    return (
      <Badge className="bg-warning text-warning-foreground gap-1.5 px-3 py-1 text-sm">
        <AlertTriangle className="h-3.5 w-3.5" />
        Moderate Risk
      </Badge>
    )
  }
  return (
    <Badge variant="destructive" className="gap-1.5 px-3 py-1 text-sm">
      <AlertCircle className="h-3.5 w-3.5" />
      High Risk
    </Badge>
  )
}

function ScoreRow({
  label,
  icon: Icon,
  score,
  completed,
}: {
  label: string
  icon: typeof Mic
  score: number | null
  completed: boolean
}) {
  return (
    <div className="flex items-center gap-4 rounded-lg border border-border/60 bg-card p-4">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
        <Icon className="h-5 w-5 text-primary" />
      </div>
      <div className="flex-1">
        <p className="text-sm font-medium text-foreground">{label}</p>
      </div>
      {completed && score !== null ? (
        <span className="text-lg font-bold text-foreground">
          {score}<span className="text-sm font-normal text-muted-foreground">/100</span>
        </span>
      ) : (
        <span className="text-sm text-muted-foreground">Not completed</span>
      )}
    </div>
  )
}

export function ReportGenerator() {
  const { user } = useAuth()
  const {
    currentSpeech,
    currentCognitive,
    currentDrawing,
    currentMri,
    currentRisk,
    calculateRisk,
    history,
  } = useAssessment()
  const [isGenerating, setIsGenerating] = useState(false)

  const hasAnyResult = !!currentSpeech || !!currentCognitive || !!currentDrawing || !!currentMri
  const risk = currentRisk

  const handleCalculateRisk = () => {
    if (!hasAnyResult) {
      toast.error("Please complete at least one assessment before generating a report.")
      return
    }
    setIsGenerating(true)
    setTimeout(() => {
      calculateRisk()
      setIsGenerating(false)
      toast.success("Risk assessment calculated and report generated!")
    }, 1500)
  }

  const handleDownload = () => {
    if (!risk) {
      toast.error("Generate the risk assessment first.")
      return
    }

    const reportDate = new Date().toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    })

    const lines = [
      "=" .repeat(60),
      "NEUROSENSE COGNITIVE HEALTH REPORT",
      "=" .repeat(60),
      "",
      `Report Date: ${reportDate}`,
      `Patient: ${user?.name ?? "Unknown"}`,
      `Role: ${user?.role ?? "Unknown"}`,
      "",
      "-".repeat(60),
      "RISK ASSESSMENT SUMMARY",
      "-".repeat(60),
      "",
      `Overall Score: ${risk.overallScore} / 100`,
      `Risk Level: ${risk.riskLevel.toUpperCase()}`,
      `Confidence: ${risk.confidence}%`,
      "",
      "-".repeat(60),
      "TEST SCORES",
      "-".repeat(60),
      "",
      `Speech Analysis: ${currentSpeech ? `${currentSpeech.score}/100` : "Not completed"}`,
    ]

    if (currentSpeech) {
      lines.push(
        `  - Vocabulary Richness: ${currentSpeech.vocabularyRichness}`,
        `  - Sentence Complexity: ${currentSpeech.sentenceComplexity}`,
        `  - Word Repetition: ${currentSpeech.wordRepetition}`,
        `  - Speech Pauses: ${currentSpeech.speechPauses}`,
        `  - Speech Rate: ${currentSpeech.speechRate}`,
      )
    }

    lines.push(
      "",
      `Cognitive Tests: ${currentCognitive ? `${currentCognitive.score}/100` : "Not completed"}`,
    )

    if (currentCognitive) {
      lines.push(
        `  - Word Recall: ${currentCognitive.wordRecall.accuracy}% (${(currentCognitive.wordRecall.reactionTime / 1000).toFixed(1)}s)`,
        `  - Number Sequence: ${currentCognitive.numberSequence.accuracy}% (${(currentCognitive.numberSequence.reactionTime / 1000).toFixed(1)}s)`,
        `  - Object Recognition: ${currentCognitive.objectRecognition.accuracy}% (${(currentCognitive.objectRecognition.reactionTime / 1000).toFixed(1)}s)`,
        `  - Pattern Recognition: ${currentCognitive.patternRecognition.accuracy}% (${(currentCognitive.patternRecognition.reactionTime / 1000).toFixed(1)}s)`,
      )
    }

    lines.push(
      "",
      `Drawing Test: ${currentDrawing ? `${currentDrawing.score}/100` : "Not completed"}`,
    )

    if (currentDrawing) {
      lines.push(
        `  - Shape Accuracy: ${currentDrawing.shapeDistortion}`,
        `  - Number Placement: ${currentDrawing.numberPlacement}`,
        `  - Symmetry: ${currentDrawing.symmetry}`,
        `  - Tremor Detection: ${currentDrawing.tremorDetection}`,
      )
    }

    lines.push(
      "",
      `MRI Analysis: ${currentMri ? `${currentMri.overallScore}/100 (${currentMri.riskLevel} risk)` : "Not completed"}`,
    )

    if (currentMri) {
      lines.push(
        `  - Hippocampal Volume: ${currentMri.hippocampalVolume}`,
        `  - Cortical Integrity: ${currentMri.corticalAtrophy}`,
        `  - White Matter Integrity: ${currentMri.whiteMatterIntegrity}`,
        `  - Ventricular Size: ${currentMri.ventricularSize}`,
        `  - Overall Brain Volume: ${currentMri.overallBrainVolume}`,
        `  - Summary: ${currentMri.summary}`,
      )
    }

    lines.push(
      "",
      "-".repeat(60),
      "AI INSIGHTS",
      "-".repeat(60),
      "",
    )

    risk.insights.forEach((insight, i) => {
      lines.push(`${i + 1}. ${insight}`)
    })

    lines.push(
      "",
      "-".repeat(60),
      "RECOMMENDATIONS",
      "-".repeat(60),
      "",
    )

    risk.recommendations.forEach((rec, i) => {
      lines.push(`${i + 1}. ${rec}`)
    })

    lines.push(
      "",
      "-".repeat(60),
      "ASSESSMENT HISTORY",
      "-".repeat(60),
      "",
    )

    history.forEach((h) => {
      lines.push(
        `${h.date}: Overall ${h.risk?.overallScore ?? "N/A"} | Risk: ${h.risk?.riskLevel ?? "N/A"}`
      )
    })

    lines.push(
      "",
      "=".repeat(60),
      "DISCLAIMER",
      "=".repeat(60),
      "",
      "This report is generated by an AI-powered screening tool and",
      "is NOT a medical diagnosis. Results should be reviewed by a",
      "qualified healthcare professional. NeuroSense is intended as",
      "a cognitive health screening aid only.",
      "",
      `Generated by NeuroSense on ${reportDate}`,
    )

    const content = lines.join("\n")
    const blob = new Blob([content], { type: "text/plain" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `neurosense-report-${new Date().toISOString().split("T")[0]}.txt`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
    toast.success("Report downloaded successfully!")
  }

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-foreground">Reports</h2>
        <p className="mt-1 text-base text-muted-foreground">
          Generate and download your cognitive health assessment report
        </p>
      </div>

      <div className="flex flex-col gap-4">
        {/* Patient Info */}
        <Card className="border-border/60">
          <CardContent className="flex items-center gap-4 pt-6">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10">
              <Brain className="h-7 w-7 text-primary" />
            </div>
            <div className="flex-1">
              <p className="text-lg font-semibold text-foreground">{user?.name}</p>
              <p className="text-sm capitalize text-muted-foreground">{user?.role}</p>
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Calendar className="h-4 w-4" />
              {new Date().toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
                year: "numeric",
              })}
            </div>
          </CardContent>
        </Card>

        {/* Test Scores */}
        <Card className="border-border/60">
          <CardHeader>
            <CardTitle className="text-lg">Assessment Scores</CardTitle>
            <CardDescription>Current session results</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            <ScoreRow
              label="Speech Analysis"
              icon={Mic}
              score={currentSpeech?.score ?? null}
              completed={!!currentSpeech}
            />
            <ScoreRow
              label="Cognitive Tests"
              icon={Gamepad2}
              score={currentCognitive?.score ?? null}
              completed={!!currentCognitive}
            />
            <ScoreRow
              label="Drawing Test"
              icon={PenTool}
              score={currentDrawing?.score ?? null}
              completed={!!currentDrawing}
            />
            <ScoreRow
              label="MRI Analysis"
              icon={ScanLine}
              score={currentMri?.overallScore ?? null}
              completed={!!currentMri}
            />
          </CardContent>
        </Card>

        {/* Risk Assessment */}
        {risk ? (
          <Card className="border-border/60">
            <CardContent className="flex flex-col gap-4 pt-6">
              <div className="flex items-center gap-4">
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10">
                  <ShieldCheck className="h-8 w-8 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Risk Assessment Result
                  </p>
                  <div className="mt-1 flex items-center gap-3">
                    <span className="text-3xl font-bold text-foreground">
                      {risk.overallScore}
                    </span>
                    <span className="text-sm text-muted-foreground">/100</span>
                    <RiskBadge level={risk.riskLevel} />
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">Confidence:</span>
                <Progress value={risk.confidence} className="h-2 w-24" />
                <span className="text-sm font-medium text-foreground">
                  {risk.confidence}%
                </span>
              </div>
            </CardContent>
          </Card>
        ) : null}

        {/* Insights */}
        {risk && (
          <Card className="border-border/60">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Lightbulb className="h-5 w-5 text-warning" />
                AI Insights
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="flex flex-col gap-3">
                {risk.insights.map((insight, i) => (
                  <li
                    key={i}
                    className="flex items-start gap-2 text-sm leading-relaxed text-foreground"
                  >
                    <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                    {insight}
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}

        {/* Recommendations */}
        {risk && (
          <Card className="border-border/60">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <CheckCircle2 className="h-5 w-5 text-success" />
                Recommendations
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="flex flex-col gap-3">
                {risk.recommendations.map((rec, i) => (
                  <li
                    key={i}
                    className="flex items-start gap-2 text-sm leading-relaxed text-foreground"
                  >
                    <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-success" />
                    {rec}
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}

        {/* Actions */}
        <div className="flex gap-3">
          <Button
            onClick={handleCalculateRisk}
            disabled={!hasAnyResult || isGenerating}
            className="flex-1 h-12 text-base"
          >
            {isGenerating ? (
              <>
                <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                Calculating...
              </>
            ) : (
              <>
                <FileText className="mr-2 h-4 w-4" />
                {risk ? "Recalculate Risk" : "Generate Risk Assessment"}
              </>
            )}
          </Button>
          {risk && (
            <Button
              variant="outline"
              onClick={handleDownload}
              className="h-12 text-base"
            >
              <Download className="mr-2 h-4 w-4" />
              Download Report
            </Button>
          )}
        </div>

        {!hasAnyResult && (
          <p className="text-center text-sm text-muted-foreground">
            Complete at least one assessment (Speech, Cognitive, or Drawing) to generate
            a risk report.
          </p>
        )}

        {/* History */}
        {history.length > 0 && (
          <Card className="border-border/60">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Calendar className="h-5 w-5 text-primary" />
                Previous Assessments
              </CardTitle>
              <CardDescription>
                History of past cognitive health screenings
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col gap-2">
                {history.map((h) => (
                  <div
                    key={h.id}
                    className="flex items-center justify-between rounded-lg border border-border/60 bg-muted/30 px-4 py-3"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-medium text-foreground">{h.date}</span>
                      {h.risk && <RiskBadge level={h.risk.riskLevel} />}
                    </div>
                    <span className="text-sm font-bold text-foreground">
                      {h.risk?.overallScore ?? "N/A"}
                      <span className="font-normal text-muted-foreground">/100</span>
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        <p className="text-center text-xs text-muted-foreground">
          This report is generated by an AI screening tool and is not a medical
          diagnosis. Please consult a healthcare professional for clinical
          evaluation.
        </p>
      </div>
    </div>
  )
}
