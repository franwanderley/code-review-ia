import { AppError } from '../shared/errors/AppError'

export interface AISuggestion {
  file: string
  line: number
  severity: 'info' | 'warning' | 'error'
  message: string
  suggestion: string
}

export class AIClient {
  private model = 'gemini-1.5-flash'

  private get apiKey(): string {
    const key = process.env.NARA_ROUTER_API_KEY
    if (!key)
      throw new AppError(
        'NARA_ROUTER_API_KEY environment variable is not defined',
        500,
      )
    return key
  }

  private get baseUrl(): string {
    const url = process.env.NARA_ROUTER_BASE_URL
    if (!url)
      throw new AppError(
        'NARA_ROUTER_BASE_URL environment variable is not defined',
        500,
      )
    return url
  }

  async analyzePullRequest(diff: string): Promise<AISuggestion[]> {
    const systemPrompt = `You are a Senior Software Engineer acting as a strict but constructive code reviewer.
Your task is to review the provided Git diff and suggest improvements regarding:
- Security vulnerabilities (OWASP)
- Performance & Efficiency
- Clean Code & SOLID principles
- Testability

You MUST respond strictly in valid JSON format. The response must be a JSON array of objects, where each object represents a single suggestion and strictly follows this schema:
{
  "file": "string (the path of the file being reviewed)",
  "line": "number (the specific line number in the modified file where the issue is found)",
  "severity": "string (must be one of: 'info', 'warning', 'error')",
  "message": "string (a concise explanation of the issue)",
  "suggestion": "string (the suggested code or refactoring to fix the issue)"
}

Do NOT wrap the response in markdown blocks (e.g. \`\`\`json). Return ONLY the raw JSON array.
If there are no issues found, return an empty array [].`

    try {
      const response = await fetch(`${this.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          model: this.model,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: diff },
          ],
          temperature: 0.2, // Low temperature for more deterministic reviews
          // Enforce JSON output on models that support it
          response_format: { type: 'json_object' },
        }),
      })

      if (!response.ok) {
        const errorText = await response.text()
        throw new AppError(
          `AI API returned status ${response.status}: ${errorText}`,
          502,
        )
      }

      interface NaraResponse {
        choices: { message?: { content?: string } }[]
      }
      const data = (await response.json()) as NaraResponse
      const content = data.choices[0]?.message?.content || '[]'

      // Clean up potential markdown wrapping if the model ignored instructions
      const cleanContent = content
        .replace(/^```json/m, '')
        .replace(/```$/m, '')
        .trim()

      let parsed: AISuggestion[]
      try {
        parsed = JSON.parse(cleanContent)
        // If response_format: json_object wraps it in a parent key (some APIs do this)
        if (!Array.isArray(parsed)) {
          // Attempt to extract the array if it's wrapped in an object like { "suggestions": [] }
          const possibleArray = Object.values(parsed).find(Array.isArray)
          parsed = (possibleArray as AISuggestion[]) || []
        }
      } catch (e) {
        throw new AppError(
          `Failed to parse AI response as JSON. Raw response: ${cleanContent}`,
          502,
        )
      }

      return parsed
    } catch (error: unknown) {
      if (error instanceof AppError) throw error
      throw new AppError(
        `Failed to communicate with AI API: ${error.message || 'Unknown error'}`,
        502,
      )
    }
  }
}
