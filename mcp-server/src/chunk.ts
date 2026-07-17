// Chunking: one chunk per level-2 (`##`) section, which matches how the KB is
// authored. The document H1 title and the section heading travel with each chunk
// so short sections keep enough context to embed and retrieve well.
import type { KbFile } from "./kb.js";

export interface Chunk {
  id: string;
  file: string;
  docTitle: string;
  heading: string; // "" for the intro chunk (content before the first ##)
  text: string; // raw section text, for display in search results
  embedInput: string; // docTitle + heading + body, for the embedder
}

function slug(s: string): string {
  return (
    s
      .toLowerCase()
      .normalize("NFKD")
      .replace(/[^\p{L}\p{N}\s-]/gu, "")
      .trim()
      .replace(/\s+/g, "-")
      .slice(0, 60) || "section"
  );
}

export function chunkFile(file: KbFile): Chunk[] {
  const lines = file.text.split(/\r?\n/);

  let docTitle = file.name;
  for (const l of lines) {
    const m = l.match(/^#\s+(.+)/);
    if (m) {
      docTitle = m[1].trim();
      break;
    }
  }

  const chunks: Chunk[] = [];
  let heading = "";
  let buf: string[] = [];
  let introIdx = 0;
  let seenH1 = false;

  const flush = () => {
    const body = buf.join("\n").trim();
    buf = [];
    if (!body && !heading) return; // nothing before the first heading
    const text = (heading ? `## ${heading}\n` : "") + body;
    if (!text.trim()) return;
    const id = `${file.name}#${heading ? slug(heading) : `intro-${introIdx++}`}`;
    const embedInput = [docTitle, heading, body].filter(Boolean).join("\n");
    chunks.push({
      id,
      file: file.name,
      docTitle,
      heading,
      text: text.trim(),
      embedInput,
    });
  };

  for (const l of lines) {
    const h2 = l.match(/^##\s+(.+)/);
    const h1 = l.match(/^#\s+(.+)/);
    if (h2) {
      flush();
      heading = h2[1].trim();
      continue;
    }
    if (h1 && !seenH1) {
      seenH1 = true; // drop the H1 title line itself; it lives in docTitle
      continue;
    }
    buf.push(l);
  }
  flush();

  return chunks;
}

export function chunkAll(files: KbFile[]): Chunk[] {
  return files.flatMap(chunkFile);
}
