import "./globals.css";
import Navbar from "@/components/Navbar";
import PwaRegister from "@/components/PwaRegister";

export const metadata = {
  title: {
    default: "Dexard Video",
    template: "%s | Dexard Video",
  },
  description: "منصة فيديو أخلاقية لنشر المحتوى المفيد والهادف",
  icons: {
    icon: [{ url: "/icon.jpg", type: "image/jpeg", sizes: "3264x3264" }],
    shortcut: "/icon.jpg",
    apple: [{ url: "/icon.jpg", sizes: "3264x3264", type: "image/jpeg" }],
  },
  manifest: "/manifest.webmanifest",
  themeColor: "#0f172a",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Dexard Video",
  },
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  viewportFit: "cover",
  themeColor: "#0f172a",
};

export default function RootLayout({ children }) {
  return (
    <html lang="ar" dir="rtl">
      <body className="min-h-screen bg-slate-50 text-slate-900">
        <PwaRegister />
        <Navbar />
        <main className="min-h-screen pt-24 sm:pt-24">{children}</main>
      </body>
    </html>
  );
}

