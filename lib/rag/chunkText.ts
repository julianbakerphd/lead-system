export function chunkText(
  text: string,
  chunkSize = 1200,
  overlap = 200,
): string[] {
  const cleaned = text
    .replace(/\r/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .replace(/[ \t]+/g, " ")
    .trim();

  if (!cleaned) return [];

  const chunks: string[] = [];
  let start = 0;

  while (start < cleaned.length) {
    const end = Math.min(start + chunkSize, cleaned.length);
    let chunk = cleaned.slice(start, end).trim();

    if (end < cleaned.length) {
      const lastParagraphBreak = chunk.lastIndexOf("\n\n");
      const lastSentenceBreak = Math.max(
        chunk.lastIndexOf(". "),
        chunk.lastIndexOf("? "),
        chunk.lastIndexOf("! "),
      );

      const bestBreak = Math.max(lastParagraphBreak, lastSentenceBreak);

      if (bestBreak > chunkSize * 0.5) {
        chunk = chunk.slice(0, bestBreak + 1).trim();
      }
    }

    if (chunk.length > 50) {
      chunks.push(chunk);
    }

    start += chunk.length - overlap;

    if (start < 0 || start >= cleaned.length) break;
  }

  return chunks;
}
