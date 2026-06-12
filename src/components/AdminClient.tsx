"use client";
import { useState } from "react";

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
          <span className="text-base">{match.homeTeam.flag}</span>
          <span className="font-medium text-sm truncate">{match.homeTeam.name}</span>
          <span className="text-slate-500 text-xs">vs</span>
          <span className="font-medium text-sm truncate">{match.awayTeam.name}</span>
          <span className="text-base">{match.awayTeam.flag}</span>
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

export function AdminClient({ matches, initialGoalEntries }: {
  matches: Match[];
  initialGoalEntries: GoalEntry[];
}) {
  const now = new Date();
  const played = matches.filter((m) => m.homeScore !== null);
  const upcoming = matches.filter((m) => m.homeScore === null && new Date(m.scheduledAt) <= now);
  const future = matches.filter((m) => m.homeScore === null && new Date(m.scheduledAt) > now);

  return (
    <div>
      <h1 className="text-3xl font-bold text-amber-400 mb-2">Admin — Enter Results</h1>
      <p className="text-slate-400 text-sm mb-8">{played.length} of {matches.length} matches with results entered</p>

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
    </div>
  );
}
