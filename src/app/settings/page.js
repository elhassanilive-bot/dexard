import Link from "next/link";

export const metadata = {
  title: "الإعدادات والأمان",
  robots: { index: false, follow: false },
};

const items = [
  { href: "/account", title: "إعدادات الحساب", desc: "تعديل الاسم، المعرف، الصور، النبذة" },
  { href: "/security", title: "الأمان", desc: "إرشادات الأمان وحماية الحساب" },
  { href: "/privacy", title: "الخصوصية", desc: "سياسة الخصوصية" },
  { href: "/terms", title: "الشروط", desc: "شروط الاستخدام" },
];

export default function SettingsPage() {
  return (
    <section className="mx-auto max-w-5xl space-y-4 px-4 py-6 sm:px-6 lg:px-8">
      <h1 className="text-right text-3xl font-black text-slate-900">الإعدادات والأمان</h1>
      <div className="grid gap-3 sm:grid-cols-2">
        {items.map((item) => (
          <Link key={item.href} href={item.href} className="rounded-2xl border border-slate-200 bg-white p-4 text-right transition hover:-translate-y-0.5 hover:shadow-sm">
            <h2 className="text-lg font-bold text-slate-900">{item.title}</h2>
            <p className="mt-1 text-sm text-slate-600">{item.desc}</p>
          </Link>
        ))}
      </div>
    </section>
  );
}
