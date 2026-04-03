import { renderMarkdownToHtml } from "@/lib/blog/markdown";

const HTML_PATTERN = /<\/?[a-z][\s\S]*>/i;

export function isProbablyHtml(content) {
  return HTML_PATTERN.test(String(content || "").trim());
}

export function renderStoredBlogContent(content) {
  const value = String(content || "").trim();
  if (!value) return "";
  if (isProbablyHtml(value)) return value;
  return renderMarkdownToHtml(value);
}

export function prepareBlogContentForEditor(content) {
  const value = String(content || "").trim();
  if (!value) return "<p></p>";
  if (isProbablyHtml(value)) return value;
  return renderMarkdownToHtml(value);
}
