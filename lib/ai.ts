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

// 🔥 NEW — Step 17 scheduling detection
export async function detectScheduling(message: string) {
  const response = await client.responses.create({
    model: "gpt-4.1-mini",
    input: `
You are extracting scheduling intent.

Return JSON ONLY.

Fields:
- is_scheduling (true or false)
- date (string or null)
- time (string or null)

Examples:

"3pm tomorrow works"
→ { "is_scheduling": true, "date": "tomorrow", "time": "3pm" }

"next week is fine"
→ { "is_scheduling": true, "date": "next week", "time": null }

"thanks"
→ { "is_scheduling": false, "date": null, "time": null }

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
  } catch {
    return {
      is_scheduling: false,
      date: null,
      time: null,
    };
  }
}

// 🔥 NEW — extract contact information before scheduling
export async function extractContactInfo(message: string) {
  const response = await client.responses.create({
    model: "gpt-4.1-mini",
    input: `
You are extracting customer contact information from a message.

Return JSON ONLY.

Fields:
- name (string or null)
- phone (string or null)
- email (string or null)
- has_contact_info (true or false)

Rules:
- Only extract information that is explicitly present.
- Do not invent a phone number, name, or email.
- If the message contains a phone number, return it exactly as written.
- If the message contains only scheduling information and no contact information, has_contact_info should be false.

Examples:

"My number is 727-555-1234"
→ { "name": null, "phone": "727-555-1234", "email": null, "has_contact_info": true }

"This is John. You can call me at 555-123-4567"
→ { "name": "John", "phone": "555-123-4567", "email": null, "has_contact_info": true }

"Tomorrow at 3pm works"
→ { "name": null, "phone": null, "email": null, "has_contact_info": false }

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
  } catch {
    return {
      name: null,
      phone: null,
      email: null,
      has_contact_info: false,
    };
  }
}
