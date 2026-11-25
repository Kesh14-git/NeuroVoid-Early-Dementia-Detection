const GEMINI_API_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent"

interface GeminiPart {
  text?: string
  inlineData?: { mimeType: string; data: string }
}

interface GeminiOptions {
  parts: GeminiPart[]
  maxOutputTokens?: number
  temperature?: number
  rawText?: boolean
}

export async function callGemini(options: GeminiOptions & { rawText: true }, retries?: number): Promise<string>
export async function callGemini(options: GeminiOptions, retries?: number): Promise<Record<string, unknown>>
export async function callGemini(options: GeminiOptions, retries = 3): Promise<Record<string, unknown> | string> {
  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) throw new Error("GEMINI_API_KEY not configured")

  const { parts, maxOutputTokens = 1024, temperature = 0.3, rawText = false } = options

  for (let attempt = 0; attempt < retries; attempt++) {
    try {
      const response = await fetch(`${GEMINI_API_URL}?key=${apiKey}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts }],
          generationConfig: {
            temperature,
            maxOutputTokens,
            ...(rawText ? {} : { responseMimeType: "application/json" }),
          },
        }),
      })

      if (response.status === 429) {
        const retryAfter = Math.min(Math.pow(2, attempt + 1) * 1000, 30000)
        console.warn(`Gemini rate limited (attempt ${attempt + 1}/${retries}). Retrying in ${retryAfter}ms...`)
        await new Promise((r) => setTimeout(r, retryAfter))
        continue
      }

      if (!response.ok) {
        const errText = await response.text()
        console.error("Gemini API error:", errText)
        throw new Error(`Gemini API returned ${response.status}`)
      }

      const data = await response.json()
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text
      if (!text) throw new Error("No response text from Gemini")

      if (rawText) return text
      return JSON.parse(text)
    } catch (error) {
      if (attempt === retries - 1) throw error
      const backoff = Math.pow(2, attempt + 1) * 1000
      console.warn(`Gemini call failed (attempt ${attempt + 1}/${retries}). Retrying in ${backoff}ms...`)
      await new Promise((r) => setTimeout(r, backoff))
    }
  }

  throw new Error("All Gemini retries exhausted")
}
