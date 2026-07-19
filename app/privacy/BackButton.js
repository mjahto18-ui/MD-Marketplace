"use client";
import { useRouter } from "next/navigation";
import { ArrowRight } from "lucide-react";

export default function BackButton() {
  const router = useRouter();

  const handleBack = () => {
    if (typeof window !== "undefined" && window.history.length > 1) {
      router.back();
    } else {
      router.push("/terms-approval");
    }
  };

  return (
    <button
      onClick={handleBack}
      className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/10 border border-white/20 text-white hover:bg-white/15 hover:border-purple-400/50 transition-all group text-sm font-medium backdrop-blur-sm"
    >
      <ArrowRight className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
      <span>رجوع</span>
    </button>
  );
}
