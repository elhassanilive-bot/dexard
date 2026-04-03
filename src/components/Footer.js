import Link from "next/link";

const T = {
  desc: "\u062f\u0643\u0632\u0627\u0631\u062f \u0641\u064a\u062f\u064a\u0648 \u0645\u0646\u0635\u0629 \u0639\u0631\u0628\u064a\u0629 \u062d\u062f\u064a\u062b\u0629 \u0644\u0646\u0634\u0631 \u0627\u0644\u0645\u062d\u062a\u0648\u0649 \u0627\u0644\u0623\u062e\u0644\u0627\u0642\u064a \u0628\u062a\u062c\u0631\u0628\u0629 \u0645\u0634\u0627\u0647\u062f\u0629 \u0633\u0631\u064a\u0639\u0629 \u0648\u0633\u0644\u0633\u0629.",
  privacy: "\u0627\u0644\u062e\u0635\u0648\u0635\u064a\u0629",
  terms: "\u0627\u0644\u0634\u0631\u0648\u0637",
  account: "\u0627\u0644\u062d\u0633\u0627\u0628",
};

export default function Footer() {
  return (
    <footer className="border-t border-slate-200 bg-white">
      <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-8 text-sm text-slate-600 sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
        <p className="text-right leading-7">{T.desc}</p>
        <div className="flex items-center gap-4">
          <Link href="/privacy" className="hover:text-slate-900">{T.privacy}</Link>
          <Link href="/terms" className="hover:text-slate-900">{T.terms}</Link>
          <Link href="/auth" className="hover:text-slate-900">{T.account}</Link>
        </div>
      </div>
    </footer>
  );
}