import OpenAI from "openai";
import supabase from "@/lib/supabase";
import { embedText } from "@/lib/rag/embeddings";

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const { question } = await req.json();

    if (!question || typeof question !== "string") {
      return Response.json(
        { success: false, error: "Missing question." },
        { status: 400 },
      );
    }

    const questionEmbedding = await embedText(question);

    const { data: chunks, error: matchError } = await supabase.rpc(
      "match_rag_chunks",
      {
        query_embedding: questionEmbedding,
        match_count: 6,
        match_threshold: 0.2,
      },
    );

    if (matchError) {
      return Response.json(
        { success: false, error: matchError.message },
        { status: 500 },
      );
    }

    if (!chunks || chunks.length === 0) {
      const answer =
        "I could not find enough relevant information in the uploaded documents to answer that question.";

      await supabase.from("rag_chat_messages").insert([
        {
          question,
          answer,
          sources: [],
        },
      ]);

      return Response.json({
        success: true,
        answer,
        sources: [],
      });
    }

    const context = chunks
      .map((chunk: any, index: number) => {
        return `[Source ${index + 1}]
Document: ${chunk.document_title}
Location: ${chunk.source_label || `Chunk ${chunk.chunk_index + 1}`}
Content:
${chunk.content}`;
      })
      .join("\n\n---\n\n");

    const response = await client.responses.create({
      model: "gpt-4.1-mini",
      input: `
You are a private internal document assistant for a business.

Rules:
- Answer only using the provided sources.
- Do not use outside knowledge.
- If the sources do not contain the answer, say you could not find enough information.
- Be concise, professional, and clear.
- Include source references like [Source 1] and [Source 2] inside the answer.
- Do not provide legal, medical, financial, HR, or compliance advice.
- Do not make decisions for the company.
- Present yourself as a document search assistant, not an authority.

User question:
${question}

Available sources:
${context}

Answer:
`,
    });

    const answer = (response.output_text || "").trim();

    const sources = chunks.map((chunk: any, index: number) => ({
      number: index + 1,
      document_id: chunk.document_id,
      chunk_id: chunk.id,
      document_title: chunk.document_title,
      source_label: chunk.source_label,
      similarity: chunk.similarity,
      excerpt:
        chunk.content.length > 260
          ? `${chunk.content.slice(0, 260)}...`
          : chunk.content,
    }));

    await supabase.from("rag_chat_messages").insert([
      {
        question,
        answer,
        sources,
      },
    ]);

    return Response.json({
      success: true,
      answer,
      sources,
    });
  } catch (err: any) {
    console.error("RAG chat error:", err);

    return Response.json(
      {
        success: false,
        error: err?.message || "Chat failed.",
      },
      { status: 500 },
    );
  }
}
