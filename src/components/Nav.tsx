"use client";
import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";

function HelpModal({ onClose }: { onClose: () => void }) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="bg-[#0f1629] border border-white/15 rounded-2xl w-full max-w-lg max-h-[85vh] overflow-y-auto shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
          <h2 className="text-lg font-bold text-amber-400">How to play</h2>
          <button onClick={onClose} className="text-slate-500 hover:text-white text-lg leading-none">✕</button>
        </div>

        <div className="px-6 py-5 space-y-6 text-sm">
          {/* How to predict */}
          <section>
            <h3 className="font-semibold text-white mb-2">⚽ Predicting match scores</h3>
            <p className="text-slate-400 leading-relaxed">
              Go to <strong className="text-slate-300">Predict</strong> and fill in the home and away score for each group stage match.
              Scores save automatically when you click out of a field — no submit button needed.
              Predictions <strong className="text-slate-300">lock at kick-off</strong>, after that you can only watch.
            </p>
          </section>

          {/* Scoring */}
          <section>
            <h3 className="font-semibold text-white mb-3">🏅 Scoring</h3>
            <div className="space-y-2">
              <div className="bg-white/5 rounded-lg px-3 py-2">
                <div className="flex items-center justify-between">
                  <span className="text-slate-300">⚽ Group stage — exact / correct result</span>
                  <span className="font-bold text-amber-400 shrink-0 ml-3">3 / 2</span>
                </div>
              </div>
              <div className="bg-white/5 rounded-lg px-3 py-2 space-y-1">
                <div className="text-slate-400 text-xs mb-1">⚔️ Knockout — escalating points (exact / result)</div>
                <div className="flex flex-wrap gap-1.5 text-xs">
                  <span className="bg-white/5 rounded px-2 py-0.5 text-slate-300">R32: 3/2</span>
                  <span className="bg-white/5 rounded px-2 py-0.5 text-slate-300">R16: 4/3</span>
                  <span className="bg-white/5 rounded px-2 py-0.5 text-slate-300">QF: 6/4</span>
                  <span className="bg-white/5 rounded px-2 py-0.5 text-slate-300">SF: 8/6</span>
                  <span className="bg-white/5 rounded px-2 py-0.5 text-amber-400">Final: 12/8</span>
                </div>
              </div>
              <div className="flex items-center justify-between bg-white/5 rounded-lg px-3 py-2">
                <span className="text-slate-300">✗ Wrong result (any stage)</span>
                <span className="font-bold text-red-400 shrink-0 ml-3">0 pts</span>
              </div>
              <div className="flex items-center justify-between bg-white/5 rounded-lg px-3 py-2">
                <span className="text-slate-300">🏆 Correct tournament champion</span>
                <span className="font-bold text-amber-400 shrink-0 ml-3">5 pts</span>
              </div>
              <div className="bg-white/5 rounded-lg px-3 py-2">
                <div className="flex items-center justify-between">
                  <span className="text-slate-300">👟 Top scorer pick (per goal from Mon 23:59+)</span>
                  <span className="font-bold text-amber-400 shrink-0 ml-3">× goals</span>
                </div>
                <div className="mt-1.5 flex gap-2 text-xs text-slate-500">
                  <span className="bg-white/5 rounded px-2 py-0.5">Defender 1.5×</span>
                  <span className="bg-white/5 rounded px-2 py-0.5">Midfielder 1×</span>
                  <span className="bg-white/5 rounded px-2 py-0.5">Forward 0.5×</span>
                </div>
              </div>
            </div>
          </section>

          {/* Bonus picks */}
          <section>
            <h3 className="font-semibold text-white mb-2">⏰ Bonus pick deadline</h3>
            <p className="text-slate-400 leading-relaxed">
              Your <strong className="text-slate-300">champion pick</strong> and <strong className="text-slate-300">top 5 scorer picks</strong> must be submitted before <strong className="text-amber-400">Tuesday 16 June at 23:59</strong> (Dutch time). After that they're locked in — you can't change them.
            </p>
          </section>

          {/* Tips */}
          <section>
            <h3 className="font-semibold text-white mb-2">💡 Tips</h3>
            <ul className="text-slate-400 space-y-1.5 leading-relaxed">
              <li>• Click any name on the leaderboard to see their full prediction history.</li>
              <li>• Click <strong className="text-slate-300">👥</strong> on any match to see what others predicted — only revealed after kick-off.</li>
              <li>• Pick a defender or midfielder as top scorer for a bigger multiplier, but they're less likely to score!</li>
            </ul>
          </section>

          {/* Prizes */}
          <section className="bg-amber-500/10 border border-amber-500/30 rounded-xl px-4 py-3">
            <h3 className="font-semibold text-amber-400 mb-1.5">🎁 Prizes</h3>
            <div className="flex gap-4 text-sm text-slate-300">
              <span>🥇 🍽️ Dinner voucher</span>
              <span>🥈 🍾 Salmari bottle</span>
              <span>🥉 🎂 Cake</span>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

export function Nav() {
  const { data: session } = useSession();
  const path = usePathname();
  const [helpOpen, setHelpOpen] = useState(false);

  const link = (href: string, label: string, matchPrefix?: string) => (
    <Link
      href={href}
      className={`px-3 py-1.5 rounded text-sm font-medium transition-colors ${
        (matchPrefix ? path.startsWith(matchPrefix) : path === href)
          ? "bg-amber-500 text-black"
          : "text-slate-300 hover:text-white hover:bg-white/10"
      }`}
    >
      {label}
    </Link>
  );

  return (
    <>
    <nav className="border-b border-white/10 bg-[#0a0e1a]/90 backdrop-blur sticky top-0 z-50">
      <div className="max-w-screen-2xl mx-auto px-4 h-14 flex items-center justify-between gap-4">
        <Link href="/" className="flex items-center gap-2 font-bold text-amber-400 text-lg shrink-0">
          🏆 <span className="hidden sm:inline">ADC World Cup 2026</span>
          <span className="sm:hidden">WC 2026</span>
        </Link>
        <div className="flex items-center gap-1">
          {link("/", "Leaderboard")}
          {session && link("/predict", "Predict", "/predict")}
          {session?.user?.isAdmin && link("/admin", "Admin")}
          <button
            onClick={() => setHelpOpen(true)}
            title="How to play"
            className="ml-1 w-7 h-7 rounded-full border border-white/20 text-slate-400 hover:text-amber-400 hover:border-amber-400 transition-colors text-xs font-bold flex items-center justify-center shrink-0"
          >
            ?
          </button>
          {session ? (
            <button
              onClick={() => signOut({ callbackUrl: "/login" })}
              className="ml-2 px-3 py-1.5 rounded text-sm text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
            >
              Sign out
            </button>
          ) : (
            <Link
              href="/login"
              className="ml-2 px-3 py-1.5 rounded text-sm bg-amber-500 text-black font-medium hover:bg-amber-400 transition-colors"
            >
              Sign in
            </Link>
          )}
        </div>
      </div>
    </nav>
    {helpOpen && <HelpModal onClose={() => setHelpOpen(false)} />}
  </>
  );
}
