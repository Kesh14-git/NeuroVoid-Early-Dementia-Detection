import { NextRequest, NextResponse } from "next/server"
import { callGemini } from "@/lib/gemini"

export async function POST(req: NextRequest) {
  try {
    const { transcript } = await req.json()
    if (!transcript || typeof transcript !== "string") {
      return NextResponse.json({ error: "transcript is required" }, { status: 400 })
    }

    const prompt = `You are a clinical neuropsychologist AI assistant analyzing speech samples for early signs of cognitive decline and dementia.

Analyze the following speech transcript and provide a JSON assessment. Consider:
- Vocabulary richness (Type-Token Ratio, word diversity, use of specific vs. generic words)
- Sentence complexity (clause structure, subordination, grammatical accuracy)
- Word repetition (unnecessary repetition of content words, perseveration)
- Speech fluency (filler words, self-corrections, topic drift, pauses indicated by "...")
- Speech rate and coherence (logical flow, topic maintenance, tangential thinking)

Speech transcript:
"""
${transcript}
"""

Respond with ONLY valid JSON in this exact format (scores 0-100, higher is better except wordRepetition where higher means more repetition which is worse):
{
  "vocabularyRichness": <number 0-100>,
  "sentenceComplexity": <number 0-100>,
  "wordRepetition": <number 0-100>,
  "speechPauses": <number 0-100>,
  "speechRate": <number 0-100>,
  "overallScore": <number 0-100>,
  "insights": ["<string>", "<string>", "<string>"],
  "riskIndicators": ["<string>"],
  "summary": "<2-3 sentence clinical summary>"
}`

    const result = await callGemini({ parts: [{ text: prompt }] })
    return NextResponse.json(result)
  } catch (error) {
    console.error("Speech analysis error:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Analysis failed", rateLimited: true },
      { status: 502 }
    )
  }
}
