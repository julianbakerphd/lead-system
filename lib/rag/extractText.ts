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
    const pdfParseModule: any = await import("pdf-parse");
    const pdfParse = pdfParseModule.default || pdfParseModule;

    const parsed = await pdfParse(buffer);
    return parsed.text || "";
  }

  throw new Error("Unsupported file type. Use .txt, .md, or .pdf for now.");
}
