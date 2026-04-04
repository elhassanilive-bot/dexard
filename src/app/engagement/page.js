import AuthenticatedVideoCollection from "@/components/account/AuthenticatedVideoCollection";

export const metadata = {
  title: "التفاعلات",
  robots: { index: false, follow: false },
};

export default function EngagementPage() {
  return <AuthenticatedVideoCollection title="تفاعلاتك" endpoint="/api/me/reactions" emptyText="لا توجد تفاعلات على الفيديوهات بعد" />;
}
