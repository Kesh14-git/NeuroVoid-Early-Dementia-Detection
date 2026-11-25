import { callGemini } from "@/lib/gemini"
import { NextResponse } from "next/server"

const FALLBACK_RESPONSES: Record<string, string> = {
  "results": "Based on your completed assessments, your scores are recorded in the dashboard. Each test measures a different cognitive domain: speech analysis evaluates vocabulary and fluency, cognitive tests measure memory and pattern recognition, the drawing test assesses visuospatial abilities, and MRI analysis examines brain structure. For a detailed interpretation, please consult your healthcare provider.",
  "risk": "Risk assessment in NeuroSense combines scores from all four test modules using clinically validated weightings. A score above 70 generally indicates normal cognitive function, 50-70 may warrant monitoring, and below 50 suggests further clinical evaluation. Remember, this is a screening tool - only a medical professional can provide a diagnosis.",
  "next": "Recommended next steps: 1) Complete any remaining assessments for a comprehensive evaluation. 2) Review your full report in the Reports section. 3) Share your results with your healthcare provider. 4) Consider scheduling regular follow-up assessments every 3-6 months to track changes over time.",
  "improve": "Evidence-based ways to support brain health: Regular aerobic exercise (150 min/week), Mediterranean-style diet rich in omega-3s and antioxidants, quality sleep (7-8 hours), social engagement, cognitive stimulation through learning and puzzles, stress management through meditation or mindfulness, and managing cardiovascular risk factors like blood pressure and cholesterol.",
  "default": "I'm currently experiencing high demand on the AI service. In the meantime, you can review your test results on the Dashboard, generate a comprehensive report in the Reports section, or complete any remaining assessments. For urgent medical questions, please contact your healthcare provider directly."
}

function getFallbackResponse(message: string): string {
  const lower = message.toLowerCase()
  if (lower.includes("result") || lower.includes("score") || lower.includes("mean")) return FALLBACK_RESPONSES.results
  if (lower.includes("risk") || lower.includes("dementia") || lower.includes("alzheimer")) return FALLBACK_RESPONSES.risk
  if (lower.includes("next") || lower.includes("should") || lower.includes("recommend")) return FALLBACK_RESPONSES.next
  if (lower.includes("improve") || lower.includes("health") || lower.includes("prevent") || lower.includes("brain")) return FALLBACK_RESPONSES.improve
  return FALLBACK_RESPONSES.default
}

export async function POST(request: Request) {
  try {
    const { message, assessmentContext } = await request.json()
    if (!message || typeof message !== "string") {
      return NextResponse.json({ error: "Message is required" }, { status: 400 })
    }

    const systemPrompt = `You are NeuroSense AI Assistant, a helpful, empathetic medical AI chatbot embedded in a dementia screening platform called NeuroSense. 
You help patients, caregivers, and doctors understand cognitive health assessment results and answer questions about dementia, cognitive decline, brain health, and the assessments performed.

IMPORTANT RULES:
- Always be compassionate, clear, and non-alarmist.
- Use simple, jargon-free language unless speaking to a doctor.
- Never provide a definitive diagnosis. Always recommend consulting a healthcare professional.
- If the user asks about their results, reference the assessment data provided below.
- You can explain what each test measures, what scores mean, and what next steps might be appropriate.
- Keep responses concise (2-4 paragraphs max) but thorough.
- Format your response as plain text. Use short paragraphs. Do not use markdown.

PATIENT ASSESSMENT DATA:
${assessmentContext || "No assessments have been completed yet in this session."}
`

    try {
      const result = await callGemini({
        parts: [
          { text: systemPrompt },
          { text: `User question: ${message}` },
        ],
        maxOutputTokens: 800,
        temperature: 0.5,
        rawText: true,
      })
      return NextResponse.json({ reply: result })
    } catch {
      // Gemini failed (rate limit etc) - use intelligent local fallback
      const fallback = getFallbackResponse(message)
      return NextResponse.json({ reply: fallback })
    }
  } catch (error) {
    console.error("Chat API error:", error)
    return NextResponse.json({
      reply: "I apologize, but I'm having trouble right now. You can review your results on the Dashboard or generate a report in the Reports section. For medical questions, please consult your healthcare provider."
    })
  }
}
