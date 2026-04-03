import AuthShell from "@/components/auth/AuthShell";

export const metadata = {
  title: "\u0627\u0644\u062d\u0633\u0627\u0628",
  robots: { index: false, follow: false },
};

export default async function AuthPage({ searchParams }) {
  const resolved = await searchParams;
  const mode = String(resolved?.mode || "signin");
  return <AuthShell initialMode={mode} />;
}