export const VIDEO_BUCKET = process.env.NEXT_PUBLIC_SUPABASE_VIDEO_BUCKET || "videos";
export const THUMBNAIL_BUCKET = process.env.NEXT_PUBLIC_SUPABASE_THUMBNAIL_BUCKET || "thumbnails";

export const MAX_VIDEO_SIZE_BYTES = 1024 * 1024 * 500;
export const MAX_VIDEO_DURATION_SECONDS = 60 * 30;

export const FEED_PAGE_SIZE = 12;

export const FEED_FILTERS = [
  { key: "latest", label: "\u0627\u0644\u0623\u062d\u062f\u062b" },
  { key: "trending", label: "\u0627\u0644\u0631\u0627\u0626\u062c" },
  { key: "most_viewed", label: "\u0627\u0644\u0623\u0643\u062b\u0631 \u0645\u0634\u0627\u0647\u062f\u0629" },
];