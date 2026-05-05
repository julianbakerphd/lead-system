import OpenAI from "openai";

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

export const RAG_EMBEDDING_MODEL = "text-embedding-3-small";

export async function embedText(text: string) {
  const result = await client.embeddings.create({
    model: RAG_EMBEDDING_MODEL,
    input: text,
  });

  return result.data[0].embedding;
}

export async function embedTexts(texts: string[]) {
  if (texts.length === 0) return [];

  const result = await client.embeddings.create({
    model: RAG_EMBEDDING_MODEL,
    input: texts,
  });

  return result.data.map((item) => item.embedding);
}
