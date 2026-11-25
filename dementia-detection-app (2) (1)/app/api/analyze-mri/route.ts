import { NextRequest, NextResponse } from "next/server"
import { callGemini } from "@/lib/gemini"

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData()
    const file = formData.get("file") as File | null
    const reportText = formData.get("reportText") as string | null

    if (!file && !reportText) {
      return NextResponse.json({ error: "Either an MRI image or report text is required" }, { status: 400 })
    }

    const prompt = `You are an expert neuroradiologist AI assistant analyzing brain MRI data for signs of neurodegeneration, particularly Alzheimer's disease and related dementias.

${reportText ? `The following is the MRI report text to analyze:
"""
${reportText}
"""` : "Analyze the provided brain MRI image."}

Evaluate for the following neurodegenerative markers:
1. **Hippocampal Volume** (0-100, 100 = normal): Medial temporal lobe atrophy (MTA scale)
2. **Cortical Atrophy** (0-100, 100 = normal): Global cortical atrophy (GCA scale) 
3. **White Matter Integrity** (0-100, 100 = normal): White matter hyperintensities (Fazekas scale)
4. **Ventricular Size** (0-100, 100 = normal): Ventricular enlargement assessment
5. **Overall Brain Volume** (0-100, 100 = normal): General brain volume assessment

Provide:
- A dementia risk classification: "low", "moderate", or "high"
- Specific findings and their clinical significance
- Comparison to age-matched normative data
- Recommendations for follow-up

Respond with ONLY valid JSON:
{
  "hippocampalVolume": <number 0-100>,
  "corticalAtrophy": <number 0-100>,
  "whiteMatterIntegrity": <number 0-100>,
  "ventricularSize": <number 0-100>,
  "overallBrainVolume": <number 0-100>,
  "overallScore": <number 0-100>,
  "riskLevel": "<low|moderate|high>",
  "mtaScore": "<MTA score description>",
  "gcaScore": "<GCA score description>",
  "fazekasScore": "<Fazekas score description>",
  "findings": ["<string>", "<string>", "<string>"],
  "insights": ["<string>", "<string>", "<string>"],
  "riskIndicators": ["<string>"],
  "recommendations": ["<string>", "<string>"],
  "summary": "<3-4 sentence detailed clinical summary>",
  "differentialDiagnosis": ["<string>", "<string>"]
}`

    const parts: Array<{ text: string } | { inlineData: { mimeType: string; data: string } }> = [{ text: prompt }]

    if (file) {
      const bytes = await file.arrayBuffer()
      const base64 = Buffer.from(bytes).toString("base64")
      parts.push({ inlineData: { mimeType: file.type || "image/jpeg", data: base64 } })
    }

    const result = await callGemini({ parts, maxOutputTokens: 2048 })
    return NextResponse.json(result)
  } catch (error) {
    console.error("MRI analysis error:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Analysis failed", rateLimited: true },
      { status: 502 }
    )
  }
}
