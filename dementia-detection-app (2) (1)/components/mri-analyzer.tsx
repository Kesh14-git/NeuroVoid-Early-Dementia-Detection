"use client"

import { useState, useRef } from "react"
import { useAssessment, type MriResult } from "@/lib/assessment-context"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import {
  RotateCcw,
  CheckCircle2,
  AlertTriangle,
  AlertCircle,
  Upload,
  FileImage,
  Sparkles,
  Brain,
  ArrowRight,
  FileText,
  X,
} from "lucide-react"
import { toast } from "sonner"

type Phase = "intro" | "upload" | "analyzing" | "results"

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

function RiskBadge({ level }: { level: "low" | "moderate" | "high" }) {
  if (level === "low") {
    return (
      <Badge className="bg-success text-success-foreground gap-1.5 px-3 py-1 text-sm">
        <CheckCircle2 className="h-3.5 w-3.5" />Low Risk
      </Badge>
    )
  }
  if (level === "moderate") {
    return (
      <Badge className="bg-warning text-warning-foreground gap-1.5 px-3 py-1 text-sm">
        <AlertTriangle className="h-3.5 w-3.5" />Moderate Risk
      </Badge>
    )
  }
  return (
    <Badge variant="destructive" className="gap-1.5 px-3 py-1 text-sm">
      <AlertCircle className="h-3.5 w-3.5" />High Risk
    </Badge>
  )
}

export function MriAnalyzer() {
  const { currentMri, setMriResult } = useAssessment()
  const [phase, setPhase] = useState<Phase>(currentMri ? "results" : "intro")
  const [result, setResult] = useState<MriResult | null>(currentMri)
  const [uploadedFile, setUploadedFile] = useState<File | null>(null)
  const [reportText, setReportText] = useState("")
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [analyzeProgress, setAnalyzeProgress] = useState(0)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setUploadedFile(file)
      if (file.type.startsWith("image/")) {
        const url = URL.createObjectURL(file)
        setPreviewUrl(url)
      } else {
        setPreviewUrl(null)
      }
    }
  }

  const removeFile = () => {
    setUploadedFile(null)
    if (previewUrl) URL.revokeObjectURL(previewUrl)
    setPreviewUrl(null)
    if (fileInputRef.current) fileInputRef.current.value = ""
  }

  const analyzeWithGemini = async () => {
    if (!uploadedFile && !reportText.trim()) {
      toast.error("Please upload an MRI image or paste a radiology report.")
      return
    }

    setPhase("analyzing")
    setAnalyzeProgress(10)

    const progressInterval = setInterval(() => {
      setAnalyzeProgress((prev) => Math.min(prev + 5, 85))
    }, 600)

    try {
      const formData = new FormData()
      if (uploadedFile) formData.append("file", uploadedFile)
      if (reportText.trim()) formData.append("reportText", reportText.trim())

      const res = await fetch("/api/analyze-mri", {
        method: "POST",
        body: formData,
      })

      clearInterval(progressInterval)
      setAnalyzeProgress(95)

      if (!res.ok) throw new Error("API failed")

      const ai = await res.json()

      const mriResult: MriResult = {
        hippocampalVolume: ai.hippocampalVolume ?? 70,
        corticalAtrophy: ai.corticalAtrophy ?? 75,
        whiteMatterIntegrity: ai.whiteMatterIntegrity ?? 70,
        ventricularSize: ai.ventricularSize ?? 72,
        overallBrainVolume: ai.overallBrainVolume ?? 73,
        overallScore: ai.overallScore ?? 72,
        riskLevel: ai.riskLevel ?? "moderate",
        findings: ai.findings ?? [],
        insights: ai.insights ?? [],
        recommendations: ai.recommendations ?? [],
        summary: ai.summary ?? "",
        differentialDiagnosis: ai.differentialDiagnosis ?? [],
        completedAt: new Date().toISOString(),
      }
      setResult(mriResult)
      setMriResult(mriResult)
      setAnalyzeProgress(100)
      setPhase("results")
      toast.success("Gemini AI MRI analysis complete!")
    } catch {
      clearInterval(progressInterval)
      toast.error("MRI analysis failed. Please check your Gemini API key and try again.")
      setPhase("upload")
      setAnalyzeProgress(0)
    }
  }

  const reset = () => {
    setPhase("intro")
    setResult(null)
    setUploadedFile(null)
    setReportText("")
    if (previewUrl) URL.revokeObjectURL(previewUrl)
    setPreviewUrl(null)
    setAnalyzeProgress(0)
  }

  if (phase === "intro") {
    return (
      <div className="mx-auto max-w-2xl">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-foreground">MRI Report Analyzer</h2>
          <p className="mt-1 text-base text-muted-foreground">
            Upload brain MRI scans or paste radiology reports for Gemini AI analysis
          </p>
        </div>

        <Card className="border-border/60">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Brain className="h-5 w-5 text-primary" />
              How it works
            </CardTitle>
            <CardDescription className="flex items-center gap-1.5">
              <Sparkles className="h-3.5 w-3.5 text-primary" />
              Powered by Google Gemini Vision AI
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <div className="flex flex-col gap-4 rounded-lg bg-muted/50 p-4">
              <div className="flex items-start gap-3">
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">1</div>
                <div>
                  <p className="font-medium text-foreground">Upload MRI image or paste report</p>
                  <p className="text-sm text-muted-foreground">Support for brain MRI scans (JPEG, PNG) or text radiology reports</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">2</div>
                <div>
                  <p className="font-medium text-foreground">Gemini AI performs neuroradiology analysis</p>
                  <p className="text-sm text-muted-foreground">Evaluates hippocampal volume, cortical atrophy, white matter, and ventricles</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">3</div>
                <div>
                  <p className="font-medium text-foreground">Receive comprehensive neuroimaging assessment</p>
                  <p className="text-sm text-muted-foreground">Risk classification, findings, differential diagnosis, and recommendations</p>
                </div>
              </div>
            </div>

            <div className="rounded-lg border border-warning/50 bg-warning/10 p-3">
              <p className="text-xs leading-relaxed text-foreground">
                <AlertTriangle className="mb-0.5 mr-1 inline h-3.5 w-3.5 text-warning" />
                <strong>Disclaimer:</strong> This is an AI screening tool and does NOT replace professional neuroradiological interpretation. Always consult a qualified physician for clinical decisions.
              </p>
            </div>

            <Button onClick={() => setPhase("upload")} size="lg" className="h-14 text-lg">
              <Upload className="mr-2 h-5 w-5" />
              Start MRI Analysis
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (phase === "upload") {
    return (
      <div className="mx-auto max-w-2xl">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-foreground">Upload MRI Data</h2>
          <p className="mt-1 text-base text-muted-foreground">Provide an MRI image, a radiology report, or both</p>
        </div>

        <div className="flex flex-col gap-4">
          {/* File Upload */}
          <Card className="border-border/60">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <FileImage className="h-5 w-5 text-primary" />
                MRI Image Upload
              </CardTitle>
              <CardDescription>Upload a brain MRI scan image (JPEG, PNG)</CardDescription>
            </CardHeader>
            <CardContent>
              {uploadedFile ? (
                <div className="flex flex-col gap-3">
                  <div className="flex items-center justify-between rounded-lg border border-border bg-muted/30 p-3">
                    <div className="flex items-center gap-3">
                      <FileImage className="h-8 w-8 text-primary" />
                      <div>
                        <p className="text-sm font-medium text-foreground">{uploadedFile.name}</p>
                        <p className="text-xs text-muted-foreground">{(uploadedFile.size / 1024 / 1024).toFixed(2)} MB</p>
                      </div>
                    </div>
                    <Button variant="ghost" size="icon" onClick={removeFile}>
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                  {previewUrl && (
                    <div className="overflow-hidden rounded-lg border border-border">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={previewUrl} alt="MRI preview" className="h-48 w-full object-contain bg-card" />
                    </div>
                  )}
                </div>
              ) : (
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="flex h-40 w-full flex-col items-center justify-center gap-3 rounded-lg border-2 border-dashed border-border bg-muted/20 transition-colors hover:border-primary hover:bg-muted/40"
                >
                  <Upload className="h-10 w-10 text-muted-foreground" />
                  <div className="text-center">
                    <p className="text-sm font-medium text-foreground">Click to upload MRI image</p>
                    <p className="text-xs text-muted-foreground">JPEG, PNG up to 10MB</p>
                  </div>
                </button>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileSelect}
                className="hidden"
              />
            </CardContent>
          </Card>

          {/* Text Report */}
          <Card className="border-border/60">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <FileText className="h-5 w-5 text-primary" />
                Radiology Report Text
              </CardTitle>
              <CardDescription>Paste the MRI radiology report text for analysis</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col gap-2">
                <Label htmlFor="report-text" className="sr-only">Report text</Label>
                <Textarea
                  id="report-text"
                  placeholder="Paste the radiology report text here...&#10;&#10;Example: 'MRI of the brain without contrast: There is mild diffuse cortical atrophy. The hippocampal volumes are mildly reduced bilaterally. Small vessel ischemic changes are noted in the periventricular white matter...'"
                  value={reportText}
                  onChange={(e) => setReportText(e.target.value)}
                  rows={6}
                  className="resize-none"
                />
                <p className="text-xs text-muted-foreground">
                  {reportText.length > 0 ? `${reportText.split(/\s+/).filter(Boolean).length} words` : "No text entered"}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="flex gap-3">
            <Button variant="outline" onClick={reset} className="h-12">
              <RotateCcw className="mr-2 h-4 w-4" />
              Cancel
            </Button>
            <Button
              onClick={analyzeWithGemini}
              disabled={!uploadedFile && !reportText.trim()}
              className="flex-1 h-12 text-base"
            >
              <Sparkles className="mr-2 h-4 w-4" />
              Analyze with Gemini AI
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    )
  }

  if (phase === "analyzing") {
    return (
      <div className="mx-auto flex max-w-2xl flex-col items-center justify-center gap-6 py-20">
        <div className="flex h-20 w-20 animate-pulse items-center justify-center rounded-full bg-primary/10">
          <Brain className="h-10 w-10 text-primary" />
        </div>
        <div className="text-center">
          <h2 className="text-2xl font-bold text-foreground">Gemini AI Analyzing MRI</h2>
          <p className="mt-2 text-base text-muted-foreground">
            Evaluating hippocampal volume, cortical atrophy, white matter integrity, and ventricular size...
          </p>
        </div>
        <Progress value={analyzeProgress} className="h-2 w-64" />
        <p className="text-xs text-muted-foreground">Powered by Google Gemini</p>
      </div>
    )
  }

  // Results
  const r = result!
  const scoreColor = r.overallScore >= 70 ? "oklch(0.65 0.17 155)" : r.overallScore >= 45 ? "oklch(0.78 0.15 75)" : "oklch(0.577 0.245 27.325)"

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">MRI Analysis Results</h2>
          <p className="mt-1 text-base text-muted-foreground">Gemini AI neuroradiology assessment</p>
        </div>
        <Button variant="outline" onClick={reset}>
          <RotateCcw className="mr-2 h-4 w-4" />
          New Analysis
        </Button>
      </div>

      <div className="flex flex-col gap-4">
        {/* Overall Score */}
        <Card className="border-border/60">
          <CardContent className="flex items-center gap-6 pt-6">
            <div className="flex h-24 w-24 shrink-0 flex-col items-center justify-center rounded-full border-4" style={{ borderColor: scoreColor }}>
              <span className="text-3xl font-bold text-foreground">{r.overallScore}</span>
              <span className="text-xs text-muted-foreground">/ 100</span>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-foreground">Brain Health Score</h3>
              <div className="mt-1"><RiskBadge level={r.riskLevel} /></div>
              {r.summary && <p className="mt-2 text-sm text-muted-foreground">{r.summary}</p>}
            </div>
          </CardContent>
        </Card>

        {/* Neuroimaging Metrics */}
        <Card className="border-border/60">
          <CardHeader>
            <CardTitle className="text-lg">Neuroimaging Metrics</CardTitle>
            <CardDescription>Structural brain assessment (100 = normal)</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-5">
            <ScoreBar label="Hippocampal Volume" value={r.hippocampalVolume} color="oklch(0.55 0.14 195)" />
            <ScoreBar label="Cortical Integrity" value={r.corticalAtrophy} color="oklch(0.72 0.15 160)" />
            <ScoreBar label="White Matter Integrity" value={r.whiteMatterIntegrity} color="oklch(0.65 0.18 250)" />
            <ScoreBar label="Ventricular Size (normal)" value={r.ventricularSize} color="oklch(0.78 0.15 75)" />
            <ScoreBar label="Overall Brain Volume" value={r.overallBrainVolume} color="oklch(0.55 0.14 195)" />
          </CardContent>
        </Card>

        {/* Findings */}
        {r.findings.length > 0 && (
          <Card className="border-border/60">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Sparkles className="h-5 w-5 text-primary" />
                Key Findings
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="flex flex-col gap-3">
                {r.findings.map((finding, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm leading-relaxed text-foreground">
                    <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                    {finding}
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}

        {/* Differential Diagnosis */}
        {r.differentialDiagnosis.length > 0 && (
          <Card className="border-border/60">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <AlertCircle className="h-5 w-5 text-warning" />
                Differential Diagnosis
              </CardTitle>
              <CardDescription>Possible conditions to consider</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {r.differentialDiagnosis.map((dx, i) => (
                  <Badge key={i} variant="outline" className="px-3 py-1.5 text-sm">
                    {dx}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* AI Insights */}
        {r.insights.length > 0 && (
          <Card className="border-border/60">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Brain className="h-5 w-5 text-primary" />
                Gemini AI Insights
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="flex flex-col gap-3">
                {r.insights.map((insight, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm leading-relaxed text-foreground">
                    <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                    {insight}
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}

        {/* Recommendations */}
        {r.recommendations.length > 0 && (
          <Card className="border-border/60">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <CheckCircle2 className="h-5 w-5 text-success" />
                Recommendations
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="flex flex-col gap-3">
                {r.recommendations.map((rec, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm leading-relaxed text-foreground">
                    <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-success" />
                    {rec}
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}

        <div className="flex items-center justify-center gap-2">
          <CheckCircle2 className="h-5 w-5 text-primary" />
          <span className="text-sm text-muted-foreground">MRI results saved. View your dashboard for the complete risk assessment.</span>
        </div>

        <p className="text-center text-xs text-muted-foreground">
          This analysis is generated by AI and is NOT a clinical diagnosis. Always consult a qualified neuroradiologist.
        </p>
      </div>
    </div>
  )
}
