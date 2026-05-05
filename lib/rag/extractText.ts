export async function extractTextFromFile(file: File) {
  const fileName = file.name.toLowerCase();
  const mimeType = file.type || "";

  const isTextFile =
    mimeType.includes("text/plain") ||
    mimeType.includes("text/markdown") ||
    fileName.endsWith(".txt") ||
    fileName.endsWith(".md");

  if (!isTextFile) {
    throw new Error("Only .txt and .md files are supported for now.");
  }

  return await file.text();
}
