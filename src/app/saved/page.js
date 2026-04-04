import AuthenticatedVideoCollection from "@/components/account/AuthenticatedVideoCollection";

export const metadata = {
  title: "المحفوظات",
  robots: { index: false, follow: false },
};

export default function SavedPage() {
  return <AuthenticatedVideoCollection title="المحفوظات" endpoint="/api/me/saved-videos" emptyText="لا توجد فيديوهات محفوظة" />;
}
