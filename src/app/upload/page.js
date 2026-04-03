import UploadAuthGate from "@/components/video/UploadAuthGate";

export const metadata = {
  title: "\u0631\u0641\u0639 \u0641\u064a\u062f\u064a\u0648",
};

export default function UploadPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:px-8">
      <UploadAuthGate />
    </div>
  );
}