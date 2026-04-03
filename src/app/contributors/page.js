import ContributorHub from "@/components/blog/ContributorHub";
import { BLOG_CATEGORY_TREE } from "@/lib/blog/categories";
import { listContributorsPublic } from "@/lib/blog/posts";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";

export const metadata = {
  title: "المساهمون",
  description: "جميع المساهمين والناشرين في أرزابريس مع إمكانية إرسال المقالات للمراجعة.",
  alternates: { canonical: "/contributors" },
};

export default async function ContributorsPage() {
  const { contributors } = await listContributorsPublic({ limit: 300 });

  return <ContributorHub contributors={contributors} categoryTree={BLOG_CATEGORY_TREE} />;
}
