import FaqAccordion from '@/app/faq/FaqAccordion';
import { helpCenterHighlights, helpCenterSections } from '@/content/helpCenterData';

export default function HelpCenterPageView() {
  return (
    <div className="min-h-screen bg-[#f7f5f1] py-12 text-black">
      <div className="mx-auto flex max-w-6xl flex-col gap-10 px-4">
        <section className="rounded-[2rem] border border-black/10 bg-white p-8 text-center shadow-sm sm:p-10">
          <p className="text-xs font-semibold uppercase tracking-[0.45em] text-black/45">الدعم الذاتي</p>
          <h1 className="mt-4 text-4xl font-black text-black sm:text-5xl">مركز المساعدة</h1>
          <p className="mx-auto mt-4 max-w-3xl text-lg leading-8 text-black/65">
            ستجد هنا إجابات عملية حول الحساب، المنشورات، الفيديوهات، الدردشة، المساحات، المجتمعات، السوق،
            الوظائف، بيت الحلال، الصدقات، الإعدادات، والأعطال التقنية.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            {helpCenterHighlights.map((item) => (
              <span key={item} className="rounded-full border border-black/10 bg-[#faf8f6] px-4 py-2 text-sm font-semibold text-black/70">
                {item}
              </span>
            ))}
          </div>
        </section>

        <FaqAccordion sections={helpCenterSections} />
      </div>
    </div>
  );
}
