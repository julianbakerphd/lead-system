import supabase from "@/lib/supabase";
import { chunkText } from "@/lib/rag/chunkText";
import { embedTexts } from "@/lib/rag/embeddings";
import { extractTextFromFile } from "@/lib/rag/extractText";

export const runtime = "nodejs";

export async function GET() {
  const { data, error } = await supabase
    .from("rag_documents")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    return Response.json(
      { success: false, error: error.message },
      { status: 500 },
    );
  }

  return Response.json({ success: true, data });
}

export async function POST(req: Request) {
  try {
    const formData = await req.formData();

    const title = String(formData.get("title") || "").trim();
    const pastedText = String(formData.get("text") || "").trim();

    const fileEntry = formData.get("file");
    const file =
      fileEntry && typeof fileEntry === "object" && "arrayBuffer" in fileEntry
        ? (fileEntry as File)
        : null;

    let rawText = pastedText;
    let fileName: string | null = null;
    let fileType = "text";
    let sourceType = pastedText ? "pasted_text" : "file_upload";

    if (file && file.size > 0) {
      fileName = file.name;
      fileType = file.type || "unknown";

      rawText = await extractTextFromFile(file);
      sourceType = "file_upload";
    }

    const finalTitle =
      title || fileName || `Document ${new Date().toLocaleDateString("en-US")}`;

    if (!rawText || rawText.trim().length < 20) {
      return Response.json(
        {
          success: false,
          error: "Document text is too short or empty.",
        },
        { status: 400 },
      );
    }

    const chunks = chunkText(rawText);

    if (chunks.length === 0) {
      return Response.json(
        {
          success: false,
          error: "Could not create useful chunks from this document.",
        },
        { status: 400 },
      );
    }

    const { data: document, error: documentError } = await supabase
      .from("rag_documents")
      .insert([
        {
          title: finalTitle,
          file_name: fileName,
          file_type: fileType,
          source_type: sourceType,
          status: "indexing",
          character_count: rawText.length,
          chunk_count: chunks.length,
        },
      ])
      .select()
      .single();

    if (documentError || !document) {
      return Response.json(
        {
          success: false,
          error: documentError?.message || "Failed to create document record.",
        },
        { status: 500 },
      );
    }

    const embeddings = await embedTexts(chunks);

    const rows = chunks.map((chunk, index) => ({
      document_id: document.id,
      chunk_index: index,
      content: chunk,
      source_label: `${finalTitle} · Chunk ${index + 1}`,
      embedding: embeddings[index],
    }));

    const { error: chunksError } = await supabase
      .from("rag_chunks")
      .insert(rows);

    if (chunksError) {
      await supabase
        .from("rag_documents")
        .update({
          status: "failed",
          updated_at: new Date().toISOString(),
        })
        .eq("id", document.id);

      return Response.json(
        {
          success: false,
          error: chunksError.message,
        },
        { status: 500 },
      );
    }

    await supabase
      .from("rag_documents")
      .update({
        status: "indexed",
        updated_at: new Date().toISOString(),
      })
      .eq("id", document.id);

    return Response.json({
      success: true,
      data: {
        ...document,
        status: "indexed",
        chunk_count: chunks.length,
      },
    });
  } catch (err: any) {
    console.error("RAG document upload error:", err);

    return Response.json(
      {
        success: false,
        error: err?.message || "Document upload failed.",
      },
      { status: 500 },
    );
  }
}

export async function DELETE(req: Request) {
  try {
    const { id } = await req.json();

    if (!id || typeof id !== "string") {
      return Response.json(
        { success: false, error: "Missing document id." },
        { status: 400 },
      );
    }

    const { error } = await supabase
      .from("rag_documents")
      .delete()
      .eq("id", id);

    if (error) {
      return Response.json(
        { success: false, error: error.message },
        { status: 500 },
      );
    }

    return Response.json({ success: true });
  } catch (err: any) {
    console.error("RAG document delete error:", err);

    return Response.json(
      {
        success: false,
        error: err?.message || "Delete failed.",
      },
      { status: 500 },
    );
  }
}
