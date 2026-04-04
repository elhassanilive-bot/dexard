import AuthenticatedVideoCollection from "@/components/account/AuthenticatedVideoCollection";

export const metadata = {
  title: "مقاطعك",
  robots: { index: false, follow: false },
};

export default function MyVideosPage() {
  return <AuthenticatedVideoCollection title="مقاطعك" endpoint="/api/me/videos" emptyText="لا توجد فيديوهات في قناتك حتى الآن" />;
}
