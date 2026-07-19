"use client";
import { useRouter } from "next/navigation";
import { ChevronRight } from "lucide-react";

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
      className="inline-flex items-center gap-1 text-purple-400/80 hover:text-white text-xs transition"
    >
      <ChevronRight className="w-3 h-3 rotate-180" />
      رجوع
    </button>
  );
}
