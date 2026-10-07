import type { AIProvider } from "@/lib/ai/provider";

export class OpenAIProvider implements AIProvider {
  constructor(private readonly apiKey = process.env.OPENAI_API_KEY) {}

  async analyzeScreenshot(): Promise<unknown[]> {
    this.ensureConfigured();
    // TODO: Implement OpenAI vision review in the AI visual review milestone.
    return [];
  }

  async analyzeContent(): Promise<unknown[]> {
    this.ensureConfigured();
    // TODO: Implement grammar/content analysis in the AI content review milestone.
    return [];
  }

  async validateDesignIssue(): Promise<{ valid: boolean; confidence: number }> {
    this.ensureConfigured();
    // TODO: Use an LLM to validate low-confidence visual/design findings.
    return { valid: false, confidence: 0 };
  }

  async generateSummary(): Promise<string> {
    this.ensureConfigured();
    // TODO: Replace the deterministic summary once AI summary generation is enabled.
    return "";
  }

  private ensureConfigured() {
    if (!this.apiKey) {
      throw new Error("OPENAI_API_KEY is required before enabling AI review.");
    }
  }
}
