"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

export function PredictTabs() {
  const path = usePathname();
  const isKnockouts = path.startsWith("/predict/knockouts");

  return (
    <div className="flex gap-2 mb-6">
      <Link
        href="/predict"
        className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
          !isKnockouts ? "bg-amber-500 text-black" : "text-slate-400 hover:text-white hover:bg-white/10"
        }`}
      >
        ⚽ Group Stage
      </Link>
      <Link
        href="/predict/knockouts"
        className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
          isKnockouts ? "bg-amber-500 text-black" : "text-slate-400 hover:text-white hover:bg-white/10"
        }`}
      >
        ⚔️ Knockouts
      </Link>
    </div>
  );
}
