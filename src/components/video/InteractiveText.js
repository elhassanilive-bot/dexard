import Link from "next/link";

const TOKEN_REGEX = /[#@][\p{L}\p{N}_.]{2,50}/gu;
const PREV_BLOCK_REGEX = /[\p{L}\p{N}_.]/u;

function toSegments(input) {
  const text = String(input || "");
  const out = [];
  let last = 0;

  for (const match of text.matchAll(TOKEN_REGEX)) {
    const token = match[0];
    const index = match.index ?? 0;
    const prev = index > 0 ? text[index - 1] : "";

    if (prev && PREV_BLOCK_REGEX.test(prev)) continue;

    if (index > last) out.push({ type: "text", value: text.slice(last, index) });
    out.push({ type: token.startsWith("#") ? "hashtag" : "mention", value: token });
    last = index + token.length;
  }

  if (last < text.length) out.push({ type: "text", value: text.slice(last) });
  return out;
}

export default function InteractiveText({
  text,
  className = "",
  mentionClassName = "font-semibold text-blue-700 hover:underline",
  hashtagClassName = "font-semibold text-red-700 hover:underline",
  linkify = true,
}) {
  const content = String(text || "");
  const lines = content.split(/\r?\n/);

  return (
    <span className={className}>
      {lines.map((line, lineIndex) => {
        const segments = toSegments(line);
        return (
          <span key={`line-${lineIndex}`}>
            {segments.map((segment, idx) => {
              if (segment.type === "text") {
                return <span key={`txt-${lineIndex}-${idx}`}>{segment.value}</span>;
              }

              const cls = segment.type === "mention" ? mentionClassName : hashtagClassName;
              if (!linkify) return <span key={`tok-${lineIndex}-${idx}`} className={cls}>{segment.value}</span>;

              if (segment.type === "mention") {
                const username = segment.value.slice(1);
                return (
                  <Link key={`m-${lineIndex}-${idx}`} href={`/channel/${encodeURIComponent(username)}`} className={cls}>
                    {segment.value}
                  </Link>
                );
              }

              return (
                <Link key={`h-${lineIndex}-${idx}`} href={`/?q=${encodeURIComponent(segment.value)}`} className={cls}>
                  {segment.value}
                </Link>
              );
            })}
            {lineIndex < lines.length - 1 ? <br /> : null}
          </span>
        );
      })}
    </span>
  );
}
