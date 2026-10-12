// Renderer markdown super-sederhana untuk jawaban AI: **tebal**, daftar "- " / "1.", dan paragraf.
// Sengaja tanpa dangerouslySetInnerHTML agar teks dari AI tidak bisa menyisipkan HTML.
import { Fragment, type ReactNode } from "react";

function inline(text: string): ReactNode[] {
  return text.split(/(\*\*[^*]+\*\*)/g).map((part, i) =>
    part.startsWith("**") && part.endsWith("**") && part.length > 4 ? <b key={i}>{part.slice(2, -2)}</b> : <Fragment key={i}>{part.replace(/(^|\s)\*(\S)/g, "$1$2")}</Fragment>,
  );
}

type Block = { kind: "p"; lines: string[] } | { kind: "ul" | "ol"; items: string[] };

export default function RichText({ text, className = "" }: { text: string; className?: string }) {
  const blocks: Block[] = [];
  for (const raw of text.replace(/\r/g, "").split("\n")) {
    const line = raw.trim();
    const ul = line.match(/^[-*•]\s+(.*)$/);
    const ol = line.match(/^\d+[.)]\s+(.*)$/);
    const last = blocks.at(-1);
    if (!line) {
      blocks.push({ kind: "p", lines: [] });
    } else if (ul || ol) {
      const kind = ul ? "ul" : "ol";
      const item = (ul ?? ol)![1];
      if (last && last.kind === kind) last.items.push(item);
      else blocks.push({ kind, items: [item] });
    } else {
      const heading = line.replace(/^#{1,6}\s+/, "");
      const content = heading !== line ? `**${heading.replace(/\*\*/g, "")}**` : line;
      if (last && last.kind === "p") last.lines.push(content);
      else blocks.push({ kind: "p", lines: [content] });
    }
  }
  return (
    <div className={`space-y-2 ${className}`}>
      {blocks.map((b, i) =>
        b.kind === "p" ? (
          b.lines.length ? <p key={i}>{b.lines.map((l, j) => <Fragment key={j}>{j > 0 && <br />}{inline(l)}</Fragment>)}</p> : null
        ) : b.kind === "ul" ? (
          <ul key={i} className="list-disc space-y-1 pl-5">{b.items.map((it, j) => <li key={j}>{inline(it)}</li>)}</ul>
        ) : (
          <ol key={i} className="list-decimal space-y-1 pl-5">{b.items.map((it, j) => <li key={j}>{inline(it)}</li>)}</ol>
        ),
      )}
    </div>
  );
}
