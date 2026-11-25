"use client"

import { createContext, useContext, useState, useCallback, type ReactNode } from "react"

export interface SpeechResult {
  transcript: string
  vocabularyRichness: number
  sentenceComplexity: number
  wordRepetition: number
  speechPauses: number
  speechRate: number
  score: number
  aiInsights?: string[]
  aiSummary?: string
  completedAt: string
}

export interface CognitiveResult {
  wordRecall: { accuracy: number; reactionTime: number }
  numberSequence: { accuracy: number; reactionTime: number }
  objectRecognition: { accuracy: number; reactionTime: number }
  patternRecognition: { accuracy: number; reactionTime: number }
  score: number
  aiInsights?: string[]
  aiSummary?: string
  domainAnalysis?: {
    shortTermMemory: string
    workingMemory: string
    semanticProcessing: string
    executiveFunction: string
  }
  completedAt: string
}

export interface DrawingResult {
  imageData: string
  shapeDistortion: number
  numberPlacement: number
  symmetry: number
  tremorDetection: number
  score: number
  aiInsights?: string[]
  aiSummary?: string
  completedAt: string
}

export interface MriResult {
  hippocampalVolume: number
  corticalAtrophy: number
  whiteMatterIntegrity: number
  ventricularSize: number
  overallBrainVolume: number
  overallScore: number
  riskLevel: "low" | "moderate" | "high"
  findings: string[]
  insights: string[]
  recommendations: string[]
  summary: string
  differentialDiagnosis: string[]
  completedAt: string
}

export interface RiskAssessment {
  overallScore: number
  riskLevel: "low" | "moderate" | "high"
  confidence: number
  speechWeight: number
  cognitiveWeight: number
  drawingWeight: number
  mriWeight: number
  insights: string[]
  recommendations: string[]
  completedAt: string
}

export interface AssessmentHistory {
  id: string
  date: string
  speech?: SpeechResult
  cognitive?: CognitiveResult
  drawing?: DrawingResult
  mri?: MriResult
  risk?: RiskAssessment
}

interface AssessmentContextType {
  currentSpeech: SpeechResult | null
  currentCognitive: CognitiveResult | null
  currentDrawing: DrawingResult | null
  currentMri: MriResult | null
  currentRisk: RiskAssessment | null
  history: AssessmentHistory[]
  setSpeechResult: (result: SpeechResult) => void
  setCognitiveResult: (result: CognitiveResult) => void
  setDrawingResult: (result: DrawingResult) => void
  setMriResult: (result: MriResult) => void
  calculateRisk: () => RiskAssessment
  clearCurrent: () => void
}

const AssessmentContext = createContext<AssessmentContextType | undefined>(undefined)

function generateInsights(
  risk: RiskAssessment,
  speech: SpeechResult | null,
  cognitive: CognitiveResult | null,
  drawing: DrawingResult | null,
  mri: MriResult | null
): string[] {
  const insights: string[] = []

  if (speech?.aiInsights) {
    insights.push(...speech.aiInsights.slice(0, 2))
  } else if (speech) {
    if (speech.vocabularyRichness < 40) insights.push("Vocabulary diversity is below expected range, which may indicate word-finding difficulties.")
    if (speech.score >= 70) insights.push("Speech analysis shows strong linguistic patterns within normal range.")
  }

  if (cognitive?.aiInsights) {
    insights.push(...cognitive.aiInsights.slice(0, 2))
  } else if (cognitive) {
    if (cognitive.wordRecall.accuracy < 50) insights.push("Word recall accuracy suggests potential short-term memory concerns.")
    if (cognitive.score >= 70) insights.push("Cognitive test performance is within healthy expected range.")
  }

  if (drawing?.aiInsights) {
    insights.push(...drawing.aiInsights.slice(0, 2))
  } else if (drawing) {
    if (drawing.shapeDistortion > 60) insights.push("Clock drawing shows shape distortion, which may reflect visuospatial processing changes.")
    if (drawing.score >= 70) insights.push("Drawing test demonstrates intact visuospatial abilities.")
  }

  if (mri) {
    insights.push(...mri.insights.slice(0, 2))
  }

  if (risk.riskLevel === "low") {
    insights.push("Overall cognitive profile is within normal parameters for age group.")
  } else if (risk.riskLevel === "moderate") {
    insights.push("Some indicators warrant follow-up evaluation with a healthcare professional.")
  } else {
    insights.push("Multiple indicators suggest the need for comprehensive clinical assessment.")
  }

  return insights
}

function generateRecommendations(riskLevel: string, mri: MriResult | null): string[] {
  const base = [
    "Maintain regular physical exercise (30 minutes daily)",
    "Engage in social activities and conversations",
    "Practice cognitive exercises like puzzles and reading",
  ]

  if (mri?.recommendations) {
    base.push(...mri.recommendations)
  }

  if (riskLevel === "moderate") {
    return [
      "Schedule a follow-up assessment in 3 months",
      "Consider consultation with a neurologist",
      ...base,
      "Monitor sleep quality and maintain consistent sleep schedule",
    ]
  }

  if (riskLevel === "high") {
    return [
      "Strongly recommend scheduling an appointment with a neurologist",
      "Consider comprehensive neuropsychological testing",
      "Schedule a follow-up assessment in 1 month",
      ...base,
      "Ensure medication compliance if applicable",
    ]
  }

  return [
    "Continue regular screening every 6 months",
    ...base,
    "Maintain a healthy diet rich in omega-3 fatty acids",
  ]
}

const SAMPLE_HISTORY: AssessmentHistory[] = [
  {
    id: "h-1",
    date: "2025-08-15",
    speech: { transcript: "", vocabularyRichness: 62, sentenceComplexity: 58, wordRepetition: 35, speechPauses: 40, speechRate: 55, score: 68, completedAt: "2025-08-15" },
    cognitive: { wordRecall: { accuracy: 70, reactionTime: 1200 }, numberSequence: { accuracy: 65, reactionTime: 1400 }, objectRecognition: { accuracy: 80, reactionTime: 900 }, patternRecognition: { accuracy: 60, reactionTime: 1600 }, score: 65, completedAt: "2025-08-15" },
    drawing: { imageData: "", shapeDistortion: 30, numberPlacement: 75, symmetry: 70, tremorDetection: 20, score: 72, completedAt: "2025-08-15" },
    risk: { overallScore: 68, riskLevel: "low", confidence: 82, speechWeight: 0.30, cognitiveWeight: 0.30, drawingWeight: 0.20, mriWeight: 0.20, insights: [], recommendations: [], completedAt: "2025-08-15" },
  },
  {
    id: "h-2",
    date: "2025-11-15",
    speech: { transcript: "", vocabularyRichness: 58, sentenceComplexity: 52, wordRepetition: 40, speechPauses: 45, speechRate: 50, score: 62, completedAt: "2025-11-15" },
    cognitive: { wordRecall: { accuracy: 65, reactionTime: 1350 }, numberSequence: { accuracy: 60, reactionTime: 1500 }, objectRecognition: { accuracy: 75, reactionTime: 1000 }, patternRecognition: { accuracy: 55, reactionTime: 1700 }, score: 60, completedAt: "2025-11-15" },
    drawing: { imageData: "", shapeDistortion: 35, numberPlacement: 70, symmetry: 65, tremorDetection: 25, score: 68, completedAt: "2025-11-15" },
    risk: { overallScore: 63, riskLevel: "moderate", confidence: 78, speechWeight: 0.30, cognitiveWeight: 0.30, drawingWeight: 0.20, mriWeight: 0.20, insights: [], recommendations: [], completedAt: "2025-11-15" },
  },
  {
    id: "h-3",
    date: "2026-02-10",
    speech: { transcript: "", vocabularyRichness: 55, sentenceComplexity: 48, wordRepetition: 44, speechPauses: 50, speechRate: 46, score: 58, completedAt: "2026-02-10" },
    cognitive: { wordRecall: { accuracy: 60, reactionTime: 1450 }, numberSequence: { accuracy: 55, reactionTime: 1600 }, objectRecognition: { accuracy: 70, reactionTime: 1100 }, patternRecognition: { accuracy: 50, reactionTime: 1800 }, score: 56, completedAt: "2026-02-10" },
    drawing: { imageData: "", shapeDistortion: 40, numberPlacement: 65, symmetry: 60, tremorDetection: 30, score: 64, completedAt: "2026-02-10" },
    risk: { overallScore: 59, riskLevel: "moderate", confidence: 75, speechWeight: 0.30, cognitiveWeight: 0.30, drawingWeight: 0.20, mriWeight: 0.20, insights: [], recommendations: [], completedAt: "2026-02-10" },
  },
]

export function AssessmentProvider({ children }: { children: ReactNode }) {
  const [currentSpeech, setCurrentSpeech] = useState<SpeechResult | null>(null)
  const [currentCognitive, setCurrentCognitive] = useState<CognitiveResult | null>(null)
  const [currentDrawing, setCurrentDrawing] = useState<DrawingResult | null>(null)
  const [currentMri, setCurrentMri] = useState<MriResult | null>(null)
  const [currentRisk, setCurrentRisk] = useState<RiskAssessment | null>(null)
  const [history, setHistory] = useState<AssessmentHistory[]>(SAMPLE_HISTORY)

  const setSpeechResult = useCallback((result: SpeechResult) => setCurrentSpeech(result), [])
  const setCognitiveResult = useCallback((result: CognitiveResult) => setCurrentCognitive(result), [])
  const setDrawingResult = useCallback((result: DrawingResult) => setCurrentDrawing(result), [])
  const setMriResult = useCallback((result: MriResult) => setCurrentMri(result), [])

  const calculateRisk = useCallback(() => {
    const hasMri = !!currentMri
    const speechWeight = hasMri ? 0.25 : 0.35
    const cognitiveWeight = hasMri ? 0.25 : 0.40
    const drawingWeight = hasMri ? 0.20 : 0.25
    const mriWeight = hasMri ? 0.30 : 0

    const speechScore = currentSpeech?.score ?? 50
    const cognitiveScore = currentCognitive?.score ?? 50
    const drawingScore = currentDrawing?.score ?? 50
    const mriScore = currentMri?.overallScore ?? 50

    const overallScore = Math.round(
      speechScore * speechWeight +
      cognitiveScore * cognitiveWeight +
      drawingScore * drawingWeight +
      mriScore * mriWeight
    )

    let riskLevel: "low" | "moderate" | "high"
    if (currentMri) {
      // MRI has strong weight in final determination
      if (currentMri.riskLevel === "high" || overallScore < 40) riskLevel = "high"
      else if (currentMri.riskLevel === "moderate" || overallScore < 65) riskLevel = "moderate"
      else riskLevel = "low"
    } else {
      if (overallScore >= 70) riskLevel = "low"
      else if (overallScore >= 45) riskLevel = "moderate"
      else riskLevel = "high"
    }

    const confidence = Math.min(95, Math.max(60,
      65 + (currentSpeech ? 7 : 0) + (currentCognitive ? 8 : 0) + (currentDrawing ? 5 : 0) + (currentMri ? 10 : 0)
    ))

    const risk: RiskAssessment = {
      overallScore,
      riskLevel,
      confidence,
      speechWeight,
      cognitiveWeight,
      drawingWeight,
      mriWeight,
      insights: [],
      recommendations: [],
      completedAt: new Date().toISOString(),
    }

    risk.insights = generateInsights(risk, currentSpeech, currentCognitive, currentDrawing, currentMri)
    risk.recommendations = generateRecommendations(riskLevel, currentMri)

    setCurrentRisk(risk)

    const entry: AssessmentHistory = {
      id: `h-${Date.now()}`,
      date: new Date().toISOString().split("T")[0],
      speech: currentSpeech ?? undefined,
      cognitive: currentCognitive ?? undefined,
      drawing: currentDrawing ?? undefined,
      mri: currentMri ?? undefined,
      risk,
    }
    setHistory((prev) => [...prev, entry])

    return risk
  }, [currentSpeech, currentCognitive, currentDrawing, currentMri])

  const clearCurrent = useCallback(() => {
    setCurrentSpeech(null)
    setCurrentCognitive(null)
    setCurrentDrawing(null)
    setCurrentMri(null)
    setCurrentRisk(null)
  }, [])

  return (
    <AssessmentContext.Provider
      value={{
        currentSpeech,
        currentCognitive,
        currentDrawing,
        currentMri,
        currentRisk,
        history,
        setSpeechResult,
        setCognitiveResult,
        setDrawingResult,
        setMriResult,
        calculateRisk,
        clearCurrent,
      }}
    >
      {children}
    </AssessmentContext.Provider>
  )
}

export function useAssessment() {
  const context = useContext(AssessmentContext)
  if (context === undefined) {
    throw new Error("useAssessment must be used within an AssessmentProvider")
  }
  return context
}
