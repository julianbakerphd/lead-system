"use client";

import { useEffect, useState } from "react";

type RagDocument = {
  id: string;
  title: string;
  file_name: string | null;
  file_type: string;
  source_type: string;
  status: string;
  character_count: number;
  chunk_count: number;
  created_at: string;
};

type Source = {
  number: number;
  document_title: string;
  source_label: string;
  similarity: number;
  excerpt: string;
};

type ChatMessage = {
  role: "user" | "assistant";
  content: string;
  sources?: Source[];
};

export default function DocumentAssistantPage() {
  const [documents, setDocuments] = useState<RagDocument[]>([]);
  const [title, setTitle] = useState("");
  const [text, setText] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [asking, setAsking] = useState(false);
  const [question, setQuestion] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [error, setError] = useState<string | null>(null);

  async function fetchDocuments() {
    const res = await fetch("/api/rag/documents", {
      cache: "no-store",
    });

    const data = await res.json();

    if (data.success) {
      setDocuments(data.data || []);
    }
  }

  useEffect(() => {
    fetchDocuments();
  }, []);

  async function uploadDocument() {
    try {
      setError(null);
      setUploading(true);

      const formData = new FormData();
      formData.append("title", title);
      formData.append("text", text);

      if (file) {
        formData.append("file", file);
      }

      const res = await fetch("/api/rag/documents", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (!data.success) {
        throw new Error(data.error || "Upload failed.");
      }

      setTitle("");
      setText("");
      setFile(null);

      const fileInput = document.getElementById(
        "rag-file-input",
      ) as HTMLInputElement | null;

      if (fileInput) {
        fileInput.value = "";
      }

      await fetchDocuments();
    } catch (err: any) {
      setError(err?.message || "Upload failed.");
    } finally {
      setUploading(false);
    }
  }

  async function askQuestion() {
    const trimmed = question.trim();

    if (!trimmed) return;

    try {
      setError(null);
      setAsking(true);

      setMessages((prev) => [
        ...prev,
        {
          role: "user",
          content: trimmed,
        },
      ]);

      setQuestion("");

      const res = await fetch("/api/rag/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ question: trimmed }),
      });

      const data = await res.json();

      if (!data.success) {
        throw new Error(data.error || "Question failed.");
      }

      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: data.answer,
          sources: data.sources || [],
        },
      ]);
    } catch (err: any) {
      setError(err?.message || "Question failed.");
    } finally {
      setAsking(false);
    }
  }

  const totalChunks = documents.reduce(
    (sum, document) => sum + (document.chunk_count || 0),
    0,
  );

  return (
    <div className="min-h-screen bg-slate-100 p-6">
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="rounded-2xl bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
            <div>
              <div className="text-sm font-semibold uppercase tracking-wide text-blue-600">
                Portfolio Demo
              </div>

              <h1 className="mt-2 text-3xl font-bold text-slate-950">
                Private AI Knowledge Assistant
              </h1>

              <p className="mt-2 max-w-3xl text-slate-600">
                Upload internal business documents, index them with embeddings,
                and ask questions with source-backed answers.
              </p>
            </div>

            <div className="rounded-xl border bg-slate-50 p-4 text-sm">
              <div className="font-semibold text-slate-900">Knowledge Base</div>

              <div className="mt-2 text-slate-600">
                {documents.length} documents indexed
              </div>

              <div className="text-slate-600">{totalChunks} chunks stored</div>
            </div>
          </div>
        </div>

        {error && (
          <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="space-y-6 lg:col-span-1">
            <div className="rounded-2xl bg-white p-5 shadow-sm">
              <h2 className="text-lg font-bold text-slate-950">
                Add Documents
              </h2>

              <p className="mt-1 text-sm text-slate-600">
                Paste text or upload a PDF, TXT, or Markdown file.
              </p>

              <div className="mt-4 space-y-3">
                <input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Document title"
                  className="w-full rounded-lg border px-3 py-2 text-sm"
                />

                <input
                  id="rag-file-input"
                  type="file"
                  accept=".txt,.md,text/plain,text/markdown"
                  onChange={(e) => setFile(e.target.files?.[0] || null)}
                  className="w-full rounded-lg border bg-white px-3 py-2 text-sm"
                />

                <textarea
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  placeholder="Or paste an SOP, FAQ, policy, manual, or internal guide here..."
                  className="min-h-40 w-full rounded-lg border px-3 py-2 text-sm"
                />

                <button
                  onClick={uploadDocument}
                  disabled={uploading || (!text.trim() && !file)}
                  className={`w-full rounded-lg px-4 py-2 text-sm font-semibold text-white ${
                    uploading || (!text.trim() && !file)
                      ? "bg-slate-400"
                      : "bg-blue-600 hover:bg-blue-700"
                  }`}
                >
                  {uploading ? "Indexing Document..." : "Upload & Index"}
                </button>
              </div>
            </div>

            <div className="rounded-2xl bg-white p-5 shadow-sm">
              <h2 className="text-lg font-bold text-slate-950">
                Document Library
              </h2>

              <div className="mt-4 space-y-3">
                {documents.length === 0 && (
                  <div className="rounded-lg border border-dashed p-4 text-sm text-slate-500">
                    No documents indexed yet.
                  </div>
                )}

                {documents.map((document) => (
                  <div
                    key={document.id}
                    className="rounded-xl border bg-slate-50 p-3"
                  >
                    <div className="font-semibold text-slate-900">
                      {document.title}
                    </div>

                    <div className="mt-1 text-xs text-slate-500">
                      {document.file_name || document.source_type}
                    </div>

                    <div className="mt-2 flex flex-wrap gap-2 text-xs">
                      <span className="rounded-full bg-blue-100 px-2 py-1 text-blue-700">
                        {document.status}
                      </span>

                      <span className="rounded-full bg-slate-200 px-2 py-1 text-slate-700">
                        {document.chunk_count} chunks
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="lg:col-span-2">
            <div className="flex min-h-[720px] flex-col rounded-2xl bg-white shadow-sm">
              <div className="border-b p-5">
                <h2 className="text-lg font-bold text-slate-950">
                  Ask Questions
                </h2>

                <p className="mt-1 text-sm text-slate-600">
                  The assistant answers from uploaded documents and shows the
                  sources it used.
                </p>
              </div>

              <div className="flex-1 space-y-4 overflow-y-auto p-5">
                {messages.length === 0 && (
                  <div className="rounded-xl border border-dashed bg-slate-50 p-5 text-sm text-slate-500">
                    Try asking: “What does the onboarding guide say new
                    employees should do first?”
                  </div>
                )}

                {messages.map((message, index) => (
                  <div
                    key={index}
                    className={`rounded-2xl border p-4 ${
                      message.role === "user"
                        ? "ml-auto max-w-2xl bg-blue-600 text-white"
                        : "mr-auto max-w-3xl bg-slate-50 text-slate-900"
                    }`}
                  >
                    <div className="whitespace-pre-wrap text-sm leading-relaxed">
                      {message.content}
                    </div>

                    {message.sources && message.sources.length > 0 && (
                      <div className="mt-4 space-y-2 border-t pt-3">
                        <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                          Sources
                        </div>

                        {message.sources.map((source) => (
                          <div
                            key={`${source.number}-${source.source_label}`}
                            className="rounded-lg bg-white p-3 text-xs text-slate-700"
                          >
                            <div className="font-semibold text-slate-900">
                              [{source.number}] {source.document_title}
                            </div>

                            <div className="mt-1 text-slate-500">
                              {source.source_label}
                            </div>

                            <div className="mt-2 line-clamp-3">
                              {source.excerpt}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}

                {asking && (
                  <div className="mr-auto max-w-3xl rounded-2xl border bg-slate-50 p-4 text-sm text-slate-500">
                    Searching documents and generating an answer...
                  </div>
                )}
              </div>

              <div className="border-t p-5">
                <div className="flex gap-3">
                  <input
                    value={question}
                    onChange={(e) => setQuestion(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        askQuestion();
                      }
                    }}
                    placeholder="Ask a question about the uploaded documents..."
                    className="flex-1 rounded-lg border px-3 py-2 text-sm"
                  />

                  <button
                    onClick={askQuestion}
                    disabled={asking || !question.trim()}
                    className={`rounded-lg px-5 py-2 text-sm font-semibold text-white ${
                      asking || !question.trim()
                        ? "bg-slate-400"
                        : "bg-blue-600 hover:bg-blue-700"
                    }`}
                  >
                    Ask
                  </button>
                </div>

                <p className="mt-2 text-xs text-slate-500">
                  This assistant is for internal document search. Answers should
                  be verified against the original sources.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
