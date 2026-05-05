import { createRequire } from "module";

const require = createRequire(import.meta.url);

export async function extractTextFromFile(
  fileName: string,
  mimeType: string,
  buffer: Buffer,
) {
  const lowerName = fileName.toLowerCase();

  if (
    mimeType.includes("text/plain") ||
    mimeType.includes("text/markdown") ||
    lowerName.endsWith(".txt") ||
    lowerName.endsWith(".md")
  ) {
    return buffer.toString("utf8");
  }

  if (mimeType.includes("pdf") || lowerName.endsWith(".pdf")) {
    const pdfParse = require("pdf-parse/lib/pdf-parse.js");
    const parsed = await pdfParse(buffer);
    return parsed.text || "";
  }

  throw new Error("Unsupported file type. Use .txt, .md, or .pdf for now.");
}
