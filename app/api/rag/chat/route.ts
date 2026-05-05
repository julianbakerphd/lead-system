import OpenAI from "openai";
import supabase from "@/lib/supabase";
import { embedText } from "@/lib/rag/embeddings";

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

export const runtime = "nodejs";

function isRiskyQuestion(question: string) {
  const q = question.toLowerCase();

  const riskyPatterns = [
    // Legal / compliance / regulatory
    /\blegal\b/,
    /\blawyer\b/,
    /\battorney\b/,
    /\blawsuit\b/,
    /\bsue\b/,
    /\bsued\b/,
    /\bliability\b/,
    /\bregulation\b/,
    /\bregulatory\b/,
    /\bcompliance\b/,
    /\blegally required\b/,
    /\bcontract\b/,
    /\bterms and conditions\b/,

    // Medical / health
    /\bmedical\b/,
    /\bdoctor\b/,
    /\bdiagnose\b/,
    /\btreatment\b/,
    /\bmedicine\b/,
    /\bpatient\b/,
    /\btherapy\b/,
    /\btherapist\b/,
    /\bmental health\b/,

    // HR / employment decisions
    /\bfire\b/,
    /\bfiring\b/,
    /\bterminate employee\b/,
    /\bhiring decision\b/,
    /\bpromotion\b/,
    /\bdiscipline employee\b/,
    /\bdiscrimination\b/,
    /\bharassment\b/,
    /\bprotected class\b/,
    /\bemployee complaint\b/,

    // Financial / tax / accounting / insurance
    /\btax advice\b/,
    /\baccounting advice\b/,
    /\binvestment\b/,
    /\binsurance claim\b/,
    /\bfinancial advice\b/,

    // Autonomous decisions/actions
    /\bmake the decision\b/,
    /\bdecide for us\b/,
    /\bsend the email for me\b/,
    /\bapprove this\b/,
    /\breject this\b/,
    /\bissue a refund\b/,
    /\bdeny a claim\b/,
  ];

  return riskyPatterns.some((pattern) => pattern.test(q));
}

function riskyQuestionFallback() {
  return "I cannot answer that type of question. This assistant is only for internal document search and source-backed summaries. It does not provide legal, medical, financial, HR, compliance, tax, accounting, insurance, or decision-making advice. Please consult the appropriate qualified person and verify the original source documents.";
}

export async function POST(req: Request) {
  try {
    const { question } = await req.json();

    if (!question || typeof question !== "string") {
      return Response.json(
        { success: false, error: "Missing question." },
        { status: 400 },
      );
    }

    if (isRiskyQuestion(question)) {
      const answer = riskyQuestionFallback();

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
You are a private internal document search assistant for a business.

Rules:
- Answer only using the provided sources.
- Do not use outside knowledge.
- If the sources do not contain the answer, say you could not find enough information.
- Be concise, professional, and clear.
- Include source references like [Source 1] and [Source 2] inside the answer.
- Do not provide legal, medical, financial, HR, compliance, tax, accounting, insurance, or employment advice.
- Do not answer questions about hiring, firing, discipline, harassment, discrimination, employee disputes, legal obligations, regulations, lawsuits, medical issues, taxes, investments, insurance claims, or compliance decisions.
- Do not make decisions for the company.
- Do not tell the user what they should do in a professional, legal, regulated, financial, medical, HR, or compliance sense.
- Present yourself as a document search assistant, not an authority.
- If the user asks for advice outside internal document search, refuse briefly and tell them to consult a qualified person.

User question:
${question}

Available sources:
${context}

Answer:
`,
    });

    const answer = (response.output_text || "").trim();
    const citedSourceNumbers = Array.from(
      answer.matchAll(/Source\s+(\d+)/gi),
    ).map((match) => Number(match[1]));

    const citedSet = new Set(citedSourceNumbers);

    const sources = chunks
      .map((chunk: any, index: number) => ({
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
      }))
      .filter((source: { number: number }) => citedSet.has(source.number));

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
