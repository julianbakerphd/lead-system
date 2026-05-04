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

  const text = response.output_text ?? "";

  const cleaned = text
    .replace(/```json/g, "")
    .replace(/```/g, "")
    .trim();

  try {
    return JSON.parse(cleaned);
  } catch (err) {
    console.error("AI PARSE ERROR:", cleaned);
    throw new Error("Invalid AI JSON output");
  }
}

export async function generateResponse(
  messages: { role: string; content: string }[],
) {
  // 🔥 Convert conversation into a readable prompt
  const conversationText = messages
    .map((m) => {
      const speaker = m.role === "user" ? "Customer" : "Assistant";
      return `${speaker}: ${m.content}`;
    })
    .join("\n");

  const response = await client.responses.create({
    model: "gpt-4.1-mini",
    input: `
You are a helpful business assistant.

Continue this conversation naturally and professionally.

Keep replies:
- short
- friendly
- clear
- focused on scheduling or helping the customer

Conversation:
${conversationText}

Assistant:
`,
  });

  return (response.output_text ?? "").trim();
}
