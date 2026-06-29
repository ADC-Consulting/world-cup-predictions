"use client";
import { useState } from "react";
import { Flag } from "@/components/Flag";

type Team = { id: string; name: string; flag: string };
type Match = {
  id: string;
  group: string;
  scheduledAt: string;
  homeScore: number | null;
  awayScore: number | null;
  homeTeam: Team;
  awayTeam: Team;
};
type GoalEntry = { id: string; playerName: string; goals: number };

function fmt(iso: string) {
  return new Date(iso).toLocaleString("en-GB", {
    month: "short", day: "numeric", hour: "2-digit", minute: "2-digit",
  });
}

function MatchScoreRow({ match }: { match: Match }) {
  const [home, setHome] = useState(match.homeScore?.toString() ?? "");
  const [away, setAway] = useState(match.awayScore?.toString() ?? "");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  async function save() {
    if (home === "" || away === "") return;
    setSaving(true); setError("");
    try {
      const res = await fetch("/api/scores", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ matchId: match.id, homeScore: +home, awayScore: +away }),
      });
      if (!res.ok) { const d = await res.json(); setError(d.error); }
      else { setSaved(true); setTimeout(() => setSaved(false), 2000); }
    } finally { setSaving(false); }
  }

  const played = match.homeScore !== null;
  return (
    <div className={`flex items-center gap-3 py-3 px-4 rounded-xl transition-colors ${played ? "bg-green-500/5 border border-green-500/20" : "bg-white/5"}`}>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <Flag flag={match.homeTeam.flag} name={match.homeTeam.name} />
          <span className="font-medium text-sm truncate">{match.homeTeam.name}</span>
          <span className="text-slate-500 text-xs">vs</span>
          <span className="font-medium text-sm truncate">{match.awayTeam.name}</span>
          <Flag flag={match.awayTeam.flag} name={match.awayTeam.name} />
        </div>
        <div className="text-xs text-slate-500 mt-0.5">Group {match.group} · {fmt(match.scheduledAt)}</div>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <input type="number" min={0} max={20} value={home} onChange={(e) => setHome(e.target.value)}
          className="w-12 text-center bg-white/10 border border-white/20 rounded-lg py-1.5 text-sm font-bold outline-none focus:border-amber-400 transition-colors" />
        <span className="text-slate-500">–</span>
        <input type="number" min={0} max={20} value={away} onChange={(e) => setAway(e.target.value)}
          className="w-12 text-center bg-white/10 border border-white/20 rounded-lg py-1.5 text-sm font-bold outline-none focus:border-amber-400 transition-colors" />
        <button onClick={save} disabled={saving || home === "" || away === ""}
          className="px-3 py-1.5 bg-amber-500 hover:bg-amber-400 disabled:opacity-40 text-black text-xs font-semibold rounded-lg transition-colors">
          {saving ? "..." : "Save"}
        </button>
        <span className="text-sm w-4">{saved ? "✅" : error ? "❌" : played ? "✓" : ""}</span>
      </div>
    </div>
  );
}

function TopScorerAdmin({ initialEntries }: { initialEntries: GoalEntry[] }) {
  const [entries, setEntries] = useState<GoalEntry[]>(initialEntries);
  const [newName, setNewName] = useState("");
  const [newGoals, setNewGoals] = useState("");
  const [saving, setSaving] = useState<string | null>(null);

  async function upsert(playerName: string, goals: number, id?: string) {
    setSaving(id ?? "new");
    const res = await fetch("/api/scores/top-scorers", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ playerName, goals }),
    });
    const data = await res.json();
    if (res.ok) {
      setEntries((prev) => {
        const exists = prev.find((e) => e.id === data.id);
        if (exists) return prev.map((e) => e.id === data.id ? data : e);
        return [...prev, data].sort((a, b) => b.goals - a.goals);
      });
      if (!id) { setNewName(""); setNewGoals(""); }
    }
    setSaving(null);
  }

  async function remove(id: string) {
    setSaving(id);
    await fetch("/api/scores/top-scorers", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    setEntries((prev) => prev.filter((e) => e.id !== id));
    setSaving(null);
  }

  return (
    <div className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-4 mb-8">
      <p className="text-amber-400 font-semibold mb-1">👟 Top Scorer Goals</p>
      <p className="text-xs text-slate-400 mb-4">
        Enter players and their goal tally (from Mon 15 Jun 23:59 CEST onwards).
        Points: FWD 0.5× · MID 1× · DEF 1.5× per goal. Matching is accent- and case-insensitive.
      </p>

      {entries.length > 0 && (
        <div className="space-y-1.5 mb-4">
          {entries.map((e) => (
            <EntryRow key={e.id} entry={e} saving={saving === e.id} onSave={upsert} onDelete={remove} />
          ))}
        </div>
      )}

      {/* Add new entry */}
      <div className="flex items-center gap-2 flex-wrap">
        <input
          type="text"
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          onKeyDown={(ev) => ev.key === "Enter" && newName.trim() && upsert(newName.trim(), Number(newGoals) || 0)}
          placeholder="Player name (e.g. Mbappé)"
          className="flex-1 min-w-40 bg-white/10 border border-white/20 rounded-lg px-3 py-1.5 text-sm outline-none focus:border-amber-400"
        />
        <input
          type="number"
          min={0}
          max={30}
          value={newGoals}
          onChange={(e) => setNewGoals(e.target.value)}
          placeholder="Goals"
          className="w-20 text-center bg-white/10 border border-white/20 rounded-lg px-2 py-1.5 text-sm font-bold outline-none focus:border-amber-400"
        />
        <button
          onClick={() => newName.trim() && upsert(newName.trim(), Number(newGoals) || 0)}
          disabled={saving === "new" || !newName.trim()}
          className="px-3 py-1.5 bg-amber-500 hover:bg-amber-400 disabled:opacity-40 text-black text-xs font-semibold rounded-lg transition-colors"
        >
          {saving === "new" ? "..." : "+ Add"}
        </button>
      </div>
    </div>
  );
}

function EntryRow({ entry, saving, onSave, onDelete }: {
  entry: GoalEntry;
  saving: boolean;
  onSave: (name: string, goals: number, id: string) => void;
  onDelete: (id: string) => void;
}) {
  const [goals, setGoals] = useState(String(entry.goals));
  return (
    <div className="flex items-center gap-2 text-sm">
      <span className="flex-1 font-medium">{entry.playerName}</span>
      <input
        type="number"
        min={0}
        max={30}
        value={goals}
        onChange={(e) => setGoals(e.target.value)}
        className="w-16 text-center bg-white/10 border border-white/20 rounded-lg px-2 py-1 text-sm font-bold outline-none focus:border-amber-400"
      />
      <span className="text-xs text-slate-500">goals</span>
      <button
        onClick={() => onSave(entry.playerName, Number(goals), entry.id)}
        disabled={saving}
        className="px-2 py-1 bg-amber-500/20 hover:bg-amber-500/40 text-amber-400 text-xs rounded-lg transition-colors disabled:opacity-40"
      >
        {saving ? "..." : "Save"}
      </button>
      <button
        onClick={() => onDelete(entry.id)}
        disabled={saving}
        className="px-2 py-1 bg-red-500/10 hover:bg-red-500/20 text-red-400 text-xs rounded-lg transition-colors disabled:opacity-40"
      >
        ✕
      </button>
    </div>
  );
}

type UserRow = { id: string; name: string; username: string };

function UserResetRow({ user }: { user: UserRow }) {
  const [status, setStatus] = useState<"idle" | "loading" | "done" | "error">("idle");
  const [resetUrl, setResetUrl] = useState("");
  const [copied, setCopied] = useState(false);

  async function generate() {
    setStatus("loading"); setResetUrl("");
    try {
      const res = await fetch("/api/admin/generate-reset-token", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user.id }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setResetUrl(data.resetUrl);
      setStatus("done");
    } catch {
      setStatus("error");
    }
  }

  async function copy() {
    await navigator.clipboard.writeText(resetUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="flex flex-col gap-2 py-3 px-4 rounded-xl bg-white/5">
      <div className="flex items-center justify-between gap-3">
        <div>
          <span className="font-medium text-sm text-slate-200">{user.name}</span>
          <span className="ml-2 text-xs text-slate-500">@{user.username}</span>
        </div>
        <button
          onClick={generate}
          disabled={status === "loading"}
          className="px-3 py-1.5 text-xs font-medium bg-white/10 hover:bg-white/20 disabled:opacity-40 text-slate-300 rounded-lg transition-colors shrink-0"
        >
          {status === "loading" ? "Generating…" : "🔑 Generate reset link"}
        </button>
      </div>
      {status === "done" && resetUrl && (
        <div className="flex items-center gap-2 bg-black/30 rounded-lg px-3 py-2">
          <span className="text-xs text-slate-400 truncate flex-1 font-mono">{resetUrl}</span>
          <button
            onClick={copy}
            className="px-2 py-1 text-xs bg-amber-500 hover:bg-amber-400 text-black font-semibold rounded transition-colors shrink-0"
          >
            {copied ? "Copied ✓" : "Copy"}
          </button>
        </div>
      )}
      {status === "done" && <p className="text-[10px] text-slate-600">Expires in 1 hour · single use</p>}
      {status === "error" && <p className="text-xs text-red-400">Failed to generate link</p>}
    </div>
  );
}
type PredRow = { userId: string; matchId: string; homeScore: number; awayScore: number };
type ChampRow = { userId: string; teamName: string; teamFlag: string };
type TopRow = { userId: string; slot: number; playerName: string; position: string };

function PredictionsTable({ matches, users, predictions, championPicks, topScorerPicks }: {
  matches: Match[];
  users: UserRow[];
  predictions: PredRow[];
  championPicks: ChampRow[];
  topScorerPicks: TopRow[];
}) {
  const [group, setGroup] = useState("all");
  const groups = ["all", ...Array.from(new Set(matches.map((m) => m.group))).sort()];
  const visibleMatches = group === "all" ? matches : matches.filter((m) => m.group === group);

  return (
    <div>
      {/* Group filter */}
      <div className="flex gap-1.5 flex-wrap mb-4">
        {groups.map((g) => (
          <button key={g} onClick={() => setGroup(g)}
            className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${group === g ? "bg-amber-500 text-black" : "bg-white/10 text-slate-400 hover:text-white"}`}>
            {g === "all" ? "All groups" : `Group ${g}`}
          </button>
        ))}
      </div>

      {/* Predictions grid */}
      <div className="overflow-x-auto rounded-xl border border-white/10">
        <table className="text-xs w-full min-w-max">
          <thead>
            <tr className="border-b border-white/10 bg-white/5">
              <th className="text-left px-3 py-2 text-slate-400 font-medium sticky left-0 bg-[#0f1629] min-w-40">Match</th>
              <th className="px-2 py-2 text-slate-400 font-medium min-w-14">Result</th>
              {users.map((u) => (
                <th key={u.id} className="px-2 py-2 text-slate-300 font-medium min-w-20 text-center">{u.name}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {visibleMatches.map((m) => {
              const result = m.homeScore !== null ? `${m.homeScore}–${m.awayScore}` : null;
              return (
                <tr key={m.id} className="border-b border-white/5 last:border-0 hover:bg-white/3">
                  <td className="px-3 py-2 sticky left-0 bg-[#0a0e1a]">
                    <div className="font-medium text-slate-200 flex items-center gap-1.5">
                      <Flag flag={m.homeTeam.flag} name={m.homeTeam.name} />
                      {m.homeTeam.name} vs {m.awayTeam.name}
                      <Flag flag={m.awayTeam.flag} name={m.awayTeam.name} />
                    </div>
                    <div className="text-slate-500 text-xs">Gr {m.group} · {new Date(m.scheduledAt).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}</div>
                  </td>
                  <td className="px-2 py-2 text-center">
                    {result ? <span className="text-green-400 font-bold">{result}</span> : <span className="text-slate-600">—</span>}
                  </td>
                  {users.map((u) => {
                    const p = predictions.find((p) => p.userId === u.id && p.matchId === m.id);
                    if (!p) return <td key={u.id} className="px-2 py-2 text-center text-slate-600">—</td>;
                    const score = `${p.homeScore}–${p.awayScore}`;
                    const correct = result && p.homeScore === m.homeScore && p.awayScore === m.awayScore ? "text-green-400" :
                      result && ((p.homeScore > p.awayScore) === (m.homeScore! > m.awayScore!) || (p.homeScore === p.awayScore) === (m.homeScore === m.awayScore)) ? "text-amber-400" :
                      result ? "text-red-400" : "text-slate-300";
                    return <td key={u.id} className={`px-2 py-2 text-center font-mono font-bold ${correct}`}>{score}</td>;
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Champion picks */}
      <div className="mt-8">
        <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-widest mb-3">🏆 Champion Picks</h3>
        <div className="overflow-x-auto rounded-xl border border-white/10">
          <table className="text-xs w-full">
            <thead>
              <tr className="border-b border-white/10 bg-white/5">
                <th className="text-left px-3 py-2 text-slate-400">Player</th>
                <th className="text-left px-3 py-2 text-slate-400">Champion pick</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => {
                const pick = championPicks.find((c) => c.userId === u.id);
                return (
                  <tr key={u.id} className="border-b border-white/5 last:border-0">
                    <td className="px-3 py-2 font-medium text-slate-200">{u.name}</td>
                    <td className="px-3 py-2">{pick ? `${pick.teamFlag} ${pick.teamName}` : <span className="text-slate-600">— not picked —</span>}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Top scorer picks */}
      <div className="mt-6">
        <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-widest mb-3">👟 Top 5 Scorer Picks</h3>
        <div className="overflow-x-auto rounded-xl border border-white/10">
          <table className="text-xs w-full min-w-max">
            <thead>
              <tr className="border-b border-white/10 bg-white/5">
                <th className="text-left px-3 py-2 text-slate-400">Player</th>
                {[1,2,3,4,5].map((s) => <th key={s} className="px-3 py-2 text-slate-400 text-center">Pick {s}</th>)}
              </tr>
            </thead>
            <tbody>
              {users.map((u) => {
                const picks = topScorerPicks.filter((t) => t.userId === u.id);
                return (
                  <tr key={u.id} className="border-b border-white/5 last:border-0">
                    <td className="px-3 py-2 font-medium text-slate-200">{u.name}</td>
                    {[1,2,3,4,5].map((s) => {
                      const p = picks.find((t) => t.slot === s);
                      const pos = p?.position === "DEFENDER" ? "DEF" : p?.position === "MIDFIELDER" ? "MID" : "FWD";
                      return <td key={s} className="px-3 py-2 text-center">{p ? <span>{p.playerName} <span className="text-slate-500">{pos}</span></span> : <span className="text-slate-600">—</span>}</td>;
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function SeedKnockoutButton() {
  const [status, setStatus] = useState<"idle" | "loading" | "done" | "error">("idle");
  const [msg, setMsg] = useState("");

  const hasR32 = status === "done";

  async function seed() {
    setStatus("loading");
    try {
      const res = await fetch("/api/admin/seed-knockout", { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed");
      setMsg(`✓ ${data.created} matches added${data.skipped ? `, ${data.skipped} already existed` : ""}. Refresh the Bracket page.`);
      setStatus("done");
    } catch (e: any) {
      setMsg(e.message);
      setStatus("error");
    }
  }

  return (
    <div className="mb-6 p-4 rounded-xl border border-amber-500/20 bg-amber-500/5">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <div className="text-sm font-semibold text-amber-400">⚔️ Seed all R32 matches</div>
          <div className="text-xs text-slate-500 mt-0.5">Adds all 16 Round of 32 matches to the database. Safe to run multiple times.</div>
        </div>
        <button
          onClick={seed}
          disabled={status === "loading" || status === "done"}
          className="px-4 py-2 rounded-lg text-sm font-medium bg-amber-500 text-black hover:bg-amber-400 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shrink-0"
        >
          {status === "loading" ? "Seeding…" : status === "done" ? "Done ✓" : "Seed R32 Matches"}
        </button>
      </div>
      {msg && (
        <div className={`mt-2 text-xs ${status === "error" ? "text-red-400" : "text-green-400"}`}>{msg}</div>
      )}
    </div>
  );
}

export function AdminClient({ matches, initialGoalEntries, users, predictions, championPicks, topScorerPicks }: {
  matches: Match[];
  initialGoalEntries: GoalEntry[];
  users: UserRow[];
  predictions: PredRow[];
  championPicks: ChampRow[];
  topScorerPicks: TopRow[];
}) {
  const [tab, setTab] = useState<"results" | "predictions" | "users">("results");
  const [syncing, setSyncing] = useState(false);
  const [syncMsg, setSyncMsg] = useState("");
  const now = new Date();
  const played = matches.filter((m) => m.homeScore !== null);
  const upcoming = matches.filter((m) => m.homeScore === null && new Date(m.scheduledAt) <= now);
  const future = matches.filter((m) => m.homeScore === null && new Date(m.scheduledAt) > now);

  async function syncScores() {
    setSyncing(true);
    setSyncMsg("");
    try {
      const res = await fetch("/api/sync-scores", { method: "POST" });
      const data = await res.json();
      if (res.ok) {
        setSyncMsg(`✅ ${data.updated} match${data.updated === 1 ? "" : "es"} updated — reload the page to see changes`);
      } else {
        setSyncMsg(`❌ ${data.error}`);
      }
    } catch {
      setSyncMsg("❌ Network error");
    } finally {
      setSyncing(false);
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div>
          <h1 className="text-3xl font-bold text-amber-400">Admin</h1>
          <p className="text-slate-400 text-sm mt-1">{played.length} of {matches.length} matches with results · {users.length} players</p>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <button
            onClick={syncScores}
            disabled={syncing}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-sm font-semibold rounded-lg transition-colors"
          >
            {syncing ? "Syncing…" : "⚡ Sync Scores"}
          </button>
          <div className="flex rounded-lg overflow-hidden bg-white/5 border border-white/10">
            <button onClick={() => setTab("results")}
              className={`px-4 py-2 text-sm font-medium transition-colors ${tab === "results" ? "bg-amber-500 text-black" : "text-slate-400 hover:text-white"}`}>
              Enter Results
            </button>
            <button onClick={() => setTab("predictions")}
              className={`px-4 py-2 text-sm font-medium transition-colors ${tab === "predictions" ? "bg-amber-500 text-black" : "text-slate-400 hover:text-white"}`}>
              All Predictions
            </button>
            <button onClick={() => setTab("users")}
              className={`px-4 py-2 text-sm font-medium transition-colors ${tab === "users" ? "bg-amber-500 text-black" : "text-slate-400 hover:text-white"}`}>
              Users
            </button>
          </div>
        </div>
      </div>
      {syncMsg && (
        <div className="mb-4 px-4 py-2.5 rounded-xl text-sm bg-white/5 border border-white/10 text-slate-300">
          {syncMsg}
        </div>
      )}

      {tab === "results" ? (
        <>
          <SeedKnockoutButton />
          <TopScorerAdmin initialEntries={initialGoalEntries} />
          {upcoming.length > 0 && (
            <section className="mb-8">
              <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-widest mb-3">⏰ Awaiting result ({upcoming.length})</h2>
              <div className="space-y-1.5">{upcoming.map((m) => <MatchScoreRow key={m.id} match={m} />)}</div>
            </section>
          )}
          {played.length > 0 && (
            <section className="mb-8">
              <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-widest mb-3">✅ Results entered ({played.length})</h2>
              <div className="space-y-1.5">{played.map((m) => <MatchScoreRow key={m.id} match={m} />)}</div>
            </section>
          )}
          {future.length > 0 && (
            <section>
              <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-widest mb-3">📅 Upcoming ({future.length})</h2>
              <div className="space-y-1.5">{future.map((m) => <MatchScoreRow key={m.id} match={m} />)}</div>
            </section>
          )}
        </>
      ) : tab === "users" ? (
        <div>
          <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-widest mb-3">🔑 Password Reset</h2>
          <p className="text-xs text-slate-500 mb-4">Generate a one-time reset link and share it with the user (e.g. via Slack). Link expires after 1 hour.</p>
          <div className="space-y-2">
            {users.map((u) => <UserResetRow key={u.id} user={u} />)}
          </div>
        </div>
      ) : (
        <PredictionsTable
          matches={matches}
          users={users}
          predictions={predictions}
          championPicks={championPicks}
          topScorerPicks={topScorerPicks}
        />
      )}
    </div>
  );
}
