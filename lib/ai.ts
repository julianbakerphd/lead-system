import OpenAI from "openai";

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

export async function processLead(message: string) {
  const response = await client.responses.create({
    model: "gpt-4.1-mini",
    input: `
You are analyzing a customer inquiry.

Return JSON ONLY with:
- summary (short)
- category (one word)
- priority (low, medium, high)
- lead_quality (low, medium, high)

Message:
"${message}"
`,
  });

  const text = response.output_text;

  const cleaned = text
    .replace(/```json/g, "")
    .replace(/```/g, "")
    .trim();

  return JSON.parse(cleaned);
}
