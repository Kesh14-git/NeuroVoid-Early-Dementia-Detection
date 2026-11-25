import { NextRequest, NextResponse } from "next/server"
import { callGemini } from "@/lib/gemini"

export async function POST(req: NextRequest) {
  try {
    const { imageData } = await req.json()
    if (!imageData || typeof imageData !== "string") {
      return NextResponse.json({ error: "imageData is required" }, { status: 400 })
    }

    const base64 = imageData.replace(/^data:image\/\w+;base64,/, "")

    const prompt = `You are a clinical neuropsychologist AI analyzing a Clock Drawing Test (CDT) image for cognitive screening.

The patient was asked to draw a clock face showing the time 10:10 (ten minutes past ten).

Evaluate the drawing on these clinical criteria:
1. **Shape Accuracy** (0-100): Is the clock face roughly circular? Is it proportional?
2. **Number Placement** (0-100): Are all 12 numbers present? Are they in correct positions? Proper spacing?
3. **Symmetry** (0-100): Is the drawing balanced? Are numbers evenly distributed?
4. **Hand Placement** (0-100): Are hour and minute hands present? Do they point to correct positions (10 and 2)?
5. **Tremor/Stroke Quality** (0-100, higher = steadier): Are the lines smooth or shaky? Signs of motor difficulty?

Respond with ONLY valid JSON:
{
  "shapeAccuracy": <number 0-100>,
  "numberPlacement": <number 0-100>,
  "symmetry": <number 0-100>,
  "handPlacement": <number 0-100>,
  "strokeQuality": <number 0-100>,
  "overallScore": <number 0-100>,
  "insights": ["<string>", "<string>", "<string>"],
  "riskIndicators": ["<string>"],
  "summary": "<2-3 sentence clinical summary>",
  "cdtScore": "<Shulman CDT score 1-6 where 6 is perfect>"
}`

    const result = await callGemini({
      parts: [
        { text: prompt },
        { inlineData: { mimeType: "image/png", data: base64 } },
      ],
    })
    return NextResponse.json(result)
  } catch (error) {
    console.error("Drawing analysis error:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Analysis failed", rateLimited: true },
      { status: 502 }
    )
  }
}
