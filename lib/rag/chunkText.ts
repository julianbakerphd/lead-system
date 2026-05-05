export function chunkText(
  text: string,
  chunkSize = 1000,
  overlap = 150,
  maxChunks = 100,
): string[] {
  const cleaned = text
    .replace(/\r/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .replace(/[ \t]+/g, " ")
    .trim();

  if (!cleaned) return [];

  const chunks: string[] = [];
  let start = 0;

  while (start < cleaned.length && chunks.length < maxChunks) {
    const hardEnd = Math.min(start + chunkSize, cleaned.length);
    let chunkEnd = hardEnd;

    if (hardEnd < cleaned.length) {
      const slice = cleaned.slice(start, hardEnd);

      const paragraphBreak = slice.lastIndexOf("\n\n");
      const sentenceBreak = Math.max(
        slice.lastIndexOf(". "),
        slice.lastIndexOf("? "),
        slice.lastIndexOf("! "),
      );

      const bestBreak = Math.max(paragraphBreak, sentenceBreak);

      if (bestBreak > chunkSize * 0.5) {
        chunkEnd = start + bestBreak + 1;
      }
    }

    const chunk = cleaned.slice(start, chunkEnd).trim();

    if (chunk.length > 30) {
      chunks.push(chunk);
    }

    if (chunkEnd >= cleaned.length) {
      break;
    }

    const nextStart = chunkEnd - overlap;

    if (nextStart <= start) {
      start = chunkEnd;
    } else {
      start = nextStart;
    }
  }

  return chunks;
}
