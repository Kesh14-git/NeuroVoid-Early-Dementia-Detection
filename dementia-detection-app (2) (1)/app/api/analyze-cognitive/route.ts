import { NextRequest, NextResponse } from "next/server"
import { callGemini } from "@/lib/gemini"

export async function POST(req: NextRequest) {
  try {
    const { testResults } = await req.json()
    if (!testResults) {
      return NextResponse.json({ error: "testResults is required" }, { status: 400 })
    }

    const prompt = `You are a clinical neuropsychologist AI assistant evaluating cognitive test results for early signs of dementia.

Analyze the following cognitive test results:

1. **Word Recall Test**: Accuracy ${testResults.wordRecall.accuracy}%, Reaction time ${testResults.wordRecall.reactionTime}ms
2. **Number Sequence Test**: Accuracy ${testResults.numberSequence.accuracy}%, Reaction time ${testResults.numberSequence.reactionTime}ms
3. **Object Recognition Test**: Accuracy ${testResults.objectRecognition.accuracy}%, Reaction time ${testResults.objectRecognition.reactionTime}ms
4. **Pattern Recognition Test**: Accuracy ${testResults.patternRecognition.accuracy}%, Reaction time ${testResults.patternRecognition.reactionTime}ms

Consider normative data for elderly adults (65+). Evaluate:
- Short-term memory (word recall)
- Working memory (number sequences)
- Semantic memory and naming (object recognition)
- Executive function and reasoning (pattern recognition)
- Processing speed (reaction times)

Respond with ONLY valid JSON:
{
  "overallScore": <number 0-100>,
  "memoryScore": <number 0-100>,
  "attentionScore": <number 0-100>,
  "executiveFunctionScore": <number 0-100>,
  "processingSpeedScore": <number 0-100>,
  "insights": ["<string>", "<string>", "<string>"],
  "riskIndicators": ["<string>"],
  "summary": "<2-3 sentence clinical summary>",
  "domainAnalysis": {
    "shortTermMemory": "<one sentence>",
    "workingMemory": "<one sentence>",
    "semanticProcessing": "<one sentence>",
    "executiveFunction": "<one sentence>"
  }
}`

    const result = await callGemini({ parts: [{ text: prompt }] })
    return NextResponse.json(result)
  } catch (error) {
    console.error("Cognitive analysis error:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Analysis failed", rateLimited: true },
      { status: 502 }
    )
  }
}
