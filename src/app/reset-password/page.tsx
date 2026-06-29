"use client";
import { useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";

function ResetForm() {
  const params = useSearchParams();
  const token = params.get("token") ?? "";

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "done" | "error">("idle");
  const [msg, setMsg] = useState("");

  if (!token) {
    return (
      <p className="text-red-400 text-sm">Invalid link — no token found. Ask the admin to generate a new one.</p>
    );
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (password !== confirm) { setMsg("Passwords don't match"); return; }
    if (password.length < 6) { setMsg("Password must be at least 6 characters"); return; }

    setStatus("loading"); setMsg("");
    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, newPassword: password }),
      });
      const data = await res.json();
      if (!res.ok) { setMsg(data.error); setStatus("error"); }
      else { setStatus("done"); }
    } catch {
      setMsg("Something went wrong — try again");
      setStatus("error");
    }
  }

  if (status === "done") {
    return (
      <div className="text-center space-y-4">
        <div className="text-4xl">✅</div>
        <p className="text-white font-semibold text-lg">Password updated!</p>
        <p className="text-slate-400 text-sm">You can now sign in with your new password.</p>
        <Link href="/login" className="inline-block mt-2 px-5 py-2 bg-amber-500 text-black font-semibold rounded-lg hover:bg-amber-400 transition-colors">
          Go to sign in
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <div>
        <label className="block text-sm text-slate-400 mb-1">New password</label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          minLength={6}
          placeholder="At least 6 characters"
          className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-sm outline-none focus:border-amber-400 transition-colors"
        />
      </div>
      <div>
        <label className="block text-sm text-slate-400 mb-1">Confirm password</label>
        <input
          type="password"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          required
          placeholder="Repeat your password"
          className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-sm outline-none focus:border-amber-400 transition-colors"
        />
      </div>
      {msg && <p className="text-sm text-red-400">{msg}</p>}
      <button
        type="submit"
        disabled={status === "loading"}
        className="w-full py-2 bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-black font-semibold rounded-lg transition-colors"
      >
        {status === "loading" ? "Saving…" : "Set new password"}
      </button>
    </form>
  );
}

export default function ResetPasswordPage() {
  return (
    <div className="min-h-screen bg-[#0a0e1a] flex items-center justify-center p-4">
      <div className="w-full max-w-sm bg-white/5 border border-white/10 rounded-2xl p-8">
        <h1 className="text-xl font-bold text-amber-400 mb-6">🔑 Set new password</h1>
        <Suspense fallback={<p className="text-slate-400 text-sm">Loading…</p>}>
          <ResetForm />
        </Suspense>
      </div>
    </div>
  );
}
