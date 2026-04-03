export function createSlugCandidate(input) {
  const trimmed = String(input || "").trim().toLowerCase();
  const cleaned = trimmed
    .replace(/['"]/g, "")
    .replace(/[^\p{Letter}\p{Number}\s-]+/gu, " ")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");

  if (cleaned) return cleaned;

  const now = new Date();
  const stamp = [
    now.getFullYear(),
    String(now.getMonth() + 1).padStart(2, "0"),
    String(now.getDate()).padStart(2, "0"),
    String(now.getHours()).padStart(2, "0"),
    String(now.getMinutes()).padStart(2, "0"),
    String(now.getSeconds()).padStart(2, "0"),
  ].join("");

  return `post-${stamp}`;
}
