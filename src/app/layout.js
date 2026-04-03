import "./globals.css";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

export const metadata = {
  title: {
    default: "Dexard Video",
    template: "%s | Dexard Video",
  },
  description: "\u0645\u0646\u0635\u0629 \u0641\u064a\u062f\u064a\u0648 \u0623\u062e\u0644\u0627\u0642\u064a\u0629 \u0644\u0646\u0634\u0631 \u0627\u0644\u0645\u062d\u062a\u0648\u0649 \u0627\u0644\u0645\u0641\u064a\u062f \u0648\u0627\u0644\u0647\u0627\u062f\u0641",
};

export default function RootLayout({ children }) {
  return (
    <html lang="ar" dir="rtl">
      <body className="min-h-screen bg-slate-50 text-slate-900">
        <Navbar />
        <main className="min-h-screen pt-24">{children}</main>
        <Footer />
      </body>
    </html>
  );
}