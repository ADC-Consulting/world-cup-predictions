"use client";
import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState<"login" | "register">("login");
  const [form, setForm] = useState({ name: "", username: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      if (mode === "register") {
        const res = await fetch("/api/register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: form.name, username: form.username, password: form.password }),
        });
        const data = await res.json();
        if (!res.ok) { setError(data.error); setLoading(false); return; }
      }
      const result = await signIn("credentials", {
        username: form.username,
        password: form.password,
        redirect: false,
      });
      if (result?.error) { setError("Invalid username or password"); setLoading(false); return; }
      router.push("/predict");
    } catch {
      setError("Something went wrong");
      setLoading(false);
    }
  }

  return (
    <div className="min-h-[70vh] flex items-center justify-center">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="text-5xl mb-3">🏆</div>
          <h1 className="text-2xl font-bold text-amber-400">ADC World Cup 2026</h1>
          <p className="text-slate-400 text-sm mt-1">Office prediction game</p>
        </div>

        <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
          <div className="flex rounded-lg overflow-hidden mb-6 bg-white/5">
            {(["login", "register"] as const).map((m) => (
              <button
                key={m}
                onClick={() => { setMode(m); setError(""); }}
                className={`flex-1 py-2 text-sm font-medium transition-colors capitalize ${
                  mode === m ? "bg-amber-500 text-black" : "text-slate-400 hover:text-white"
                }`}
              >
                {m === "login" ? "Sign in" : "Join"}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === "register" && (
              <div>
                <label className="block text-sm text-slate-400 mb-1">Display name</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={set("name")}
                  placeholder="Your name for the leaderboard"
                  required
                  className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2.5 text-sm outline-none focus:border-amber-400 transition-colors"
                />
              </div>
            )}
            <div>
              <label className="block text-sm text-slate-400 mb-1">Username</label>
              <input
                type="text"
                value={form.username}
                onChange={set("username")}
                placeholder="Choose a username"
                required
                autoComplete="username"
                className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2.5 text-sm outline-none focus:border-amber-400 transition-colors"
              />
            </div>
            <div>
              <label className="block text-sm text-slate-400 mb-1">Password</label>
              <input
                type="password"
                value={form.password}
                onChange={set("password")}
                placeholder="••••••••"
                required
                autoComplete="current-password"
                className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2.5 text-sm outline-none focus:border-amber-400 transition-colors"
              />
            </div>
            {error && <p className="text-red-400 text-sm">{error}</p>}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-black font-semibold py-2.5 rounded-lg transition-colors"
            >
              {loading ? "..." : mode === "login" ? "Sign in" : "Create account & sign in"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
