import type { AppConfig } from "@/server/config";

export interface DraftRequest {
  locale: "de" | "en" | "ru";
  personLabel: string;
  intent: string;
  doctorName?: string;
  careAreaName?: string;
  keyFacts: string[];
}

export interface DraftService {
  generate(
    input: DraftRequest,
  ): Promise<{ subject: string; body: string; aiGenerated: boolean }>;
}

export class TemplateDraftService implements DraftService {
  async generate(input: DraftRequest) {
    const subject = `${input.intent} - ${input.careAreaName ?? "medical follow-up"}`;
    const facts = input.keyFacts.length
      ? input.keyFacts.map((fact) => `- ${fact}`).join("\n")
      : "- I am following up on the latest visit and need guidance on the next step.";
    const greeting =
      input.locale === "de"
        ? `Hallo ${input.doctorName ?? "Praxis"},`
        : input.locale === "ru"
          ? `Здравствуйте, ${input.doctorName ?? "доктор"},`
          : `Hello ${input.doctorName ?? "doctor"},`;
    const signoff =
      input.locale === "de"
        ? "Viele Grusse"
        : input.locale === "ru"
          ? "С уважением"
          : "Best regards";

    return {
      subject,
      body: `${greeting}\n\nI would like help with: ${input.intent}.\n\nContext:\n${facts}\n\nThank you,\n${input.personLabel}\n\n${signoff}`,
      aiGenerated: false,
    };
  }
}

export class HostedDraftService implements DraftService {
  private readonly fallback = new TemplateDraftService();

  constructor(private readonly config: AppConfig) {}

  async generate(input: DraftRequest) {
    if (!this.config.ai.apiKey) {
      return this.fallback.generate(input);
    }

    const response = await fetch(
      this.config.ai.baseUrl || "https://api.openai.com/v1/chat/completions",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${this.config.ai.apiKey}`,
        },
        body: JSON.stringify({
          model: this.config.ai.model,
          messages: [
            {
              role: "system",
              content:
                "You draft concise, well-structured medical communication. Return JSON with subject and body. Do not invent facts.",
            },
            {
              role: "user",
              content: JSON.stringify(input),
            },
          ],
          response_format: {
            type: "json_object",
          },
        }),
      },
    );

    if (!response.ok) {
      return this.fallback.generate(input);
    }

    const payload = (await response.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
    };
    const raw = payload.choices?.[0]?.message?.content;
    if (!raw) {
      return this.fallback.generate(input);
    }
    try {
      const parsed = JSON.parse(raw) as { subject: string; body: string };
      return {
        subject: parsed.subject,
        body: parsed.body,
        aiGenerated: true,
      };
    } catch {
      return this.fallback.generate(input);
    }
  }
}

export function createDraftService(config: AppConfig): DraftService {
  return new HostedDraftService(config);
}
