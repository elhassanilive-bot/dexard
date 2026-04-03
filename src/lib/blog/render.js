function stripHtml(value) {
  return String(value || "")
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function formatArabicDate(iso) {
  if (!iso) return "";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";

  try {
    return new Intl.DateTimeFormat("ar-MA", {
      year: "numeric",
      month: "long",
      day: "numeric",
    }).format(date);
  } catch {
    return date.toISOString().slice(0, 10);
  }
}

export function estimateReadingTime(content) {
  const words = stripHtml(content)
    .split(/\s+/)
    .filter(Boolean).length;

  if (!words) return 1;
  return Math.max(1, Math.ceil(words / 220));
}

export function renderPlainContent(content) {
  const text = stripHtml(content);
  if (!text) return [];

  return text
    .split(/\n{2,}/g)
    .map((p) => p.trim())
    .filter(Boolean);
}
