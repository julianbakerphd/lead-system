import OpenAI from "openai";

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

export type LeadDemoAiResult = {
  ai_summary: string | null;
  ai_priority: "low" | "medium" | "high" | null;
  ai_next_action: string | null;
  ai_suggested_reply: string | null;
  ai_processed_at: string | null;
};

type AnalyzeLeadParams = {
  name: string;
  email: string;
  phone: string;
  serviceNeeded: string;
  urgency: string;
  message: string;
  source: string;
};

function cleanJson(text: string) {
  return text
    .replace(/```json/g, "")
    .replace(/```/g, "")
    .trim();
}

function normalizePriority(value: unknown): "low" | "medium" | "high" | null {
  if (typeof value !== "string") return null;

  const priority = value.toLowerCase().trim();

  if (priority === "low") return "low";
  if (priority === "medium") return "medium";
  if (priority === "high") return "high";

  return null;
}

function fallbackAiResult(): LeadDemoAiResult {
  return {
    ai_summary: null,
    ai_priority: null,
    ai_next_action: null,
    ai_suggested_reply: null,
    ai_processed_at: null,
  };
}

export async function analyzeLeadDemo(
  params: AnalyzeLeadParams,
): Promise<LeadDemoAiResult> {
  try {
    const response = await client.responses.create({
      model: "gpt-4.1-mini",
      input: `
You are helping a small business review a new customer inquiry.

Return JSON ONLY with these fields:
- ai_summary: short plain-English summary of what the customer needs
- ai_priority: low, medium, or high
- ai_next_action: the next best action for the business owner
- ai_suggested_reply: a short friendly reply the business could send

Rules:
- Do not invent facts.
- Keep the summary short.
- Keep the suggested reply professional and simple.
- If the customer sounds urgent or has an emergency, use high priority.
- If the customer asks for help soon but not immediately, use medium priority.
- If it is general or non-urgent, use low priority.

Lead:
Name: ${params.name}
Email: ${params.email}
Phone: ${params.phone || "Not provided"}
Service Needed: ${params.serviceNeeded}
Urgency selected by customer: ${params.urgency}
Source: ${params.source}

Customer Message:
"${params.message}"
`,
    });

    const text = response.output_text ?? "";
    const cleaned = cleanJson(text);
    const parsed = JSON.parse(cleaned);

    return {
      ai_summary:
        typeof parsed.ai_summary === "string" ? parsed.ai_summary.trim() : null,
      ai_priority: normalizePriority(parsed.ai_priority),
      ai_next_action:
        typeof parsed.ai_next_action === "string"
          ? parsed.ai_next_action.trim()
          : null,
      ai_suggested_reply:
        typeof parsed.ai_suggested_reply === "string"
          ? parsed.ai_suggested_reply.trim()
          : null,
      ai_processed_at: new Date().toISOString(),
    };
  } catch (err) {
    console.error("Lead demo AI analysis failed:", err);
    return fallbackAiResult();
  }
}
