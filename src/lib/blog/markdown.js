function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function safeUrl(url) {
  const raw = String(url || "").trim();
  if (!raw) return "";
  if (raw.startsWith("/")) return raw;
  if (raw.startsWith("mailto:")) return raw;
  if (raw.startsWith("https://") || raw.startsWith("http://")) return raw;
  return "";
}

function renderInline(text) {
  let out = escapeHtml(text);

  out = out.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, (_, alt, url) => {
    const href = safeUrl(url);
    if (!href) return escapeHtml(`![${alt}](${url})`);
    return `<img src="${escapeHtml(href)}" alt="${escapeHtml(alt)}" loading="lazy" />`;
  });

  out = out.replace(/\[([^\]]+)\]\(([^)]+)\)/g, (_, label, url) => {
    const href = safeUrl(url);
    if (!href) return escapeHtml(`[${label}](${url})`);
    const external = href.startsWith("http");
    const target = external ? ` target="_blank" rel="noopener noreferrer"` : "";
    return `<a href="${escapeHtml(href)}"${target}>${escapeHtml(label)}</a>`;
  });

  out = out.replace(/`([^`]+)`/g, (_, code) => `<code>${escapeHtml(code)}</code>`);
  out = out.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
  out = out.replace(/\*([^*]+)\*/g, "<em>$1</em>");

  return out;
}

export function renderMarkdownToHtml(markdown) {
  const src = String(markdown || "").replace(/\r\n/g, "\n").trim();
  if (!src) return "";

  const lines = src.split("\n");
  const html = [];
  let inCode = false;
  let codeBuffer = [];
  let inUl = false;
  let inOl = false;
  let inQuote = false;
  let paragraph = [];

  function closeParagraph() {
    if (!paragraph.length) return;
    html.push(`<p>${renderInline(paragraph.join(" "))}</p>`);
    paragraph = [];
  }

  function closeLists() {
    if (inUl) {
      html.push("</ul>");
      inUl = false;
    }
    if (inOl) {
      html.push("</ol>");
      inOl = false;
    }
  }

  function closeQuote() {
    if (!inQuote) return;
    closeParagraph();
    html.push("</blockquote>");
    inQuote = false;
  }

  for (const rawLine of lines) {
    const line = rawLine.trimEnd();
    const trimmed = line.trim();

    if (trimmed.startsWith("```")) {
      if (inCode) {
        html.push(`<pre><code>${escapeHtml(codeBuffer.join("\n"))}</code></pre>`);
        codeBuffer = [];
        inCode = false;
      } else {
        closeQuote();
        closeLists();
        closeParagraph();
        inCode = true;
      }
      continue;
    }

    if (inCode) {
      codeBuffer.push(rawLine);
      continue;
    }

    if (!trimmed) {
      closeQuote();
      closeLists();
      closeParagraph();
      continue;
    }

    if (/^---+$/.test(trimmed) || /^\*\*\*+$/.test(trimmed)) {
      closeQuote();
      closeLists();
      closeParagraph();
      html.push("<hr />");
      continue;
    }

    const quoteMatch = trimmed.match(/^>\s?(.*)$/);
    if (quoteMatch) {
      closeLists();
      if (!inQuote) {
        closeParagraph();
        html.push("<blockquote>");
        inQuote = true;
      }
      paragraph.push(quoteMatch[1]);
      continue;
    }

    closeQuote();

    const headingMatch = trimmed.match(/^(#{1,6})\s+(.*)$/);
    if (headingMatch) {
      closeLists();
      closeParagraph();
      const level = headingMatch[1].length;
      html.push(`<h${level}>${renderInline(headingMatch[2])}</h${level}>`);
      continue;
    }

    const ulMatch = trimmed.match(/^[-*]\s+(.*)$/);
    if (ulMatch) {
      closeParagraph();
      if (inOl) {
        html.push("</ol>");
        inOl = false;
      }
      if (!inUl) {
        html.push("<ul>");
        inUl = true;
      }
      html.push(`<li>${renderInline(ulMatch[1])}</li>`);
      continue;
    }

    const olMatch = trimmed.match(/^\d+\.\s+(.*)$/);
    if (olMatch) {
      closeParagraph();
      if (inUl) {
        html.push("</ul>");
        inUl = false;
      }
      if (!inOl) {
        html.push("<ol>");
        inOl = true;
      }
      html.push(`<li>${renderInline(olMatch[1])}</li>`);
      continue;
    }

    paragraph.push(trimmed);
  }

  if (inCode) {
    html.push(`<pre><code>${escapeHtml(codeBuffer.join("\n"))}</code></pre>`);
  }

  closeQuote();
  closeLists();
  closeParagraph();

  return html.join("");
}
