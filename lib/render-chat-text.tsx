import type { ReactNode } from "react";

// Minimal, safe renderer for the markdown-ish text Dosey replies with:
// paragraphs, bullet/numbered lists, **bold**, *italic*, `code`. Output is React
// nodes only — no HTML is ever parsed — and unrecognised or still-streaming
// (unclosed) markers stay as literal text.

const INLINE = /(\*\*[^*\n]+\*\*|`[^`\n]+`|\*[^*\s][^*\n]*\*|_[^_\s][^_\n]*_)/g;

function renderInline(text: string, keyPrefix: string): ReactNode[] {
  return text.split(INLINE).map((part, i) => {
    const key = `${keyPrefix}-${i}`;
    if (part.length > 4 && part.startsWith("**") && part.endsWith("**")) {
      return <strong key={key} className="font-semibold">{part.slice(2, -2)}</strong>;
    }
    if (part.length > 2 && part.startsWith("`") && part.endsWith("`")) {
      return (
        <code key={key} className="rounded bg-surface px-1 py-0.5 text-[0.85em]">
          {part.slice(1, -1)}
        </code>
      );
    }
    if (
      part.length > 2 &&
      ((part.startsWith("*") && part.endsWith("*")) || (part.startsWith("_") && part.endsWith("_")))
    ) {
      return <em key={key}>{part.slice(1, -1)}</em>;
    }
    return part;
  });
}

const BULLET = /^\s*[-*]\s+(.*)$/;
const NUMBERED = /^\s*\d+[.)]\s+(.*)$/;

export function renderChatText(text: string): ReactNode {
  const blocks: ReactNode[] = [];
  const lines = text.split("\n");
  let paragraph: string[] = [];
  let list: { ordered: boolean; items: string[] } | null = null;

  const flushParagraph = () => {
    if (paragraph.length === 0) return;
    const key = `p${blocks.length}`;
    blocks.push(
      <p key={key} className="[&:not(:first-child)]:mt-2">
        {paragraph.flatMap((line, i) =>
          i === 0 ? renderInline(line, `${key}-${i}`) : [<br key={`${key}-br${i}`} />, ...renderInline(line, `${key}-${i}`)],
        )}
      </p>,
    );
    paragraph = [];
  };

  const flushList = () => {
    if (!list) return;
    const key = `l${blocks.length}`;
    const items = list.items.map((item, i) => <li key={i}>{renderInline(item, `${key}-${i}`)}</li>);
    blocks.push(
      list.ordered ? (
        <ol key={key} className="list-decimal space-y-0.5 pl-5 [&:not(:first-child)]:mt-2">{items}</ol>
      ) : (
        <ul key={key} className="list-disc space-y-0.5 pl-5 [&:not(:first-child)]:mt-2">{items}</ul>
      ),
    );
    list = null;
  };

  for (const line of lines) {
    if (line.trim() === "") {
      flushParagraph();
      flushList();
      continue;
    }
    const bullet = BULLET.exec(line);
    const numbered = bullet ? null : NUMBERED.exec(line);
    const match = bullet ?? numbered;
    if (match) {
      flushParagraph();
      const ordered = numbered !== null;
      if (list && list.ordered !== ordered) flushList();
      if (!list) list = { ordered, items: [] };
      list.items.push(match[1]);
    } else {
      flushList();
      paragraph.push(line);
    }
  }
  flushParagraph();
  flushList();

  return blocks;
}
