"use client";
import { useState, useCallback, useMemo, useEffect } from "react";
import { Flag } from "@/components/Flag";

type Team = { id: string; name: string; group: string; flag: string };
type Match = {
  id: string;
  group: string;
  scheduledAt: string;
  locked: boolean;
  homeScore: number | null;
  awayScore: number | null;
  homeTeam: Team;
  awayTeam: Team;
  prediction: { homeScore: number; awayScore: number } | null;
};

// Monday 15 Jun 2026, 23:59 CEST = 21:59 UTC
const BONUS_LOCK = new Date("2026-06-15T21:59:00Z");

type TopScorerSlot = { slot: number; playerName: string; position: string };

interface Props {
  grouped: Record<string, Match[]>;
  teams: Team[];
  initialChampion: string | null;
  initialTopScorers: TopScorerSlot[];
}

function fmt(iso: string) {
  return new Date(iso).toLocaleString("en-GB", {
    month: "short", day: "numeric", hour: "2-digit", minute: "2-digit",
  });
}

function fmtDateHeading(iso: string) {
  return new Date(iso).toLocaleDateString("en-GB", {
    weekday: "long", day: "numeric", month: "long",
  });
}

function localDateKey(iso: string) {
  // Groups by local calendar date (so midnight-to-midnight in the user's timezone)
  const d = new Date(iso);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

type BreakdownData = {
  locked: boolean;
  homeTeam: { name: string; flag: string };
  awayTeam: { name: string; flag: string };
  scheduledAt: string;
  homeScore?: number | null;
  awayScore?: number | null;
  totalPredictions: number;
  totalUsers: number;
  predictions: { name: string; predHome: number; predAway: number; points: number | null }[] | null;
};

function PtsBadge({ points }: { points: number | null }) {
  if (points === null) return <span className="text-xs text-slate-500">—</span>;
  if (points === 3) return <span className="text-xs font-semibold text-green-400">+3</span>;
  if (points === 2) return <span className="text-xs font-semibold text-amber-400">+2</span>;
  return <span className="text-xs font-semibold text-red-400">0</span>;
}

function MatchBreakdownModal({ matchId, onClose }: { matchId: string; onClose: () => void }) {
  const [data, setData] = useState<BreakdownData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/matches/${matchId}/predictions`)
      .then((r) => r.json())
      .then((d) => { setData(d); setLoading(false); });
  }, [matchId]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="bg-[#0f1629] border border-white/15 rounded-2xl w-full max-w-md max-h-[80vh] flex flex-col shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/10">
          {loading || !data ? (
            <span className="text-slate-400 text-sm">Loading…</span>
          ) : (
            <div className="flex items-center gap-2 font-semibold text-sm">
              <Flag flag={data.homeTeam.flag} name={data.homeTeam.name} />
              <span>{data.homeTeam.name}</span>
              {data.locked && data.homeScore !== null ? (
                <span className="text-amber-400 font-bold mx-1">{data.homeScore} – {data.awayScore}</span>
              ) : (
                <span className="text-slate-500 mx-1">vs</span>
              )}
              <span>{data.awayTeam.name}</span>
              <Flag flag={data.awayTeam.flag} name={data.awayTeam.name} />
            </div>
          )}
          <button onClick={onClose} className="text-slate-500 hover:text-white text-lg leading-none ml-3">✕</button>
        </div>

        {/* Body */}
        <div className="overflow-y-auto flex-1 px-5 py-4">
          {loading && (
            <div className="text-center py-8 text-slate-500 text-sm">Loading…</div>
          )}

          {!loading && data && !data.locked && (
            <div className="text-center py-8">
              <div className="text-4xl mb-3">🔒</div>
              <p className="text-slate-300 font-medium">Predictions are hidden until kick-off</p>
              <p className="text-slate-500 text-sm mt-1">
                {data.totalPredictions} of {data.totalUsers} people have predicted
              </p>
              <div className="mt-4 bg-white/5 rounded-full h-2 overflow-hidden">
                <div
                  className="h-full bg-amber-500 rounded-full transition-all"
                  style={{ width: `${data.totalUsers > 0 ? (data.totalPredictions / data.totalUsers) * 100 : 0}%` }}
                />
              </div>
            </div>
          )}

          {!loading && data && data.locked && data.predictions && (
            <>
              <p className="text-xs text-slate-500 mb-3">
                {data.totalPredictions} of {data.totalUsers} people predicted
              </p>
              <div className="space-y-1.5">
                {data.predictions.map((p, i) => (
                  <div key={i} className="flex items-center gap-3 py-2 px-3 rounded-lg bg-white/5 text-sm">
                    <span className="font-medium flex-1 truncate">{p.name}</span>
                    <span className="text-slate-300 font-mono font-bold shrink-0">
                      {p.predHome} – {p.predAway}
                    </span>
                    <div className="w-6 text-right shrink-0">
                      <PtsBadge points={p.points} />
                    </div>
                  </div>
                ))}
                {data.totalPredictions === 0 && (
                  <p className="text-center text-slate-500 text-sm py-4">No predictions for this match</p>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function MatchRow({ match, showGroup, onSelect }: { match: Match; showGroup?: boolean; onSelect: () => void }) {
  const [home, setHome] = useState(match.prediction?.homeScore?.toString() ?? "");
  const [away, setAway] = useState(match.prediction?.awayScore?.toString() ?? "");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  const save = useCallback(async (h: string, a: string) => {
    if (h === "" || a === "") return;
    setSaving(true);
    setError("");
    try {
      const res = await fetch("/api/predictions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ matchId: match.id, homeScore: +h, awayScore: +a }),
      });
      if (!res.ok) { const d = await res.json(); setError(d.error); }
      else { setSaved(true); setTimeout(() => setSaved(false), 1500); }
    } finally { setSaving(false); }
  }, [match.id]);

  const groupBadge = showGroup ? (
    <span className="text-xs text-slate-500 bg-white/10 rounded px-1.5 py-0.5 shrink-0">
      Grp {match.group}
    </span>
  ) : null;

  const peopleBtn = (
    <button
      onClick={onSelect}
      title="See who predicted what"
      className="text-slate-500 hover:text-amber-400 transition-colors text-base shrink-0 leading-none"
    >
      👥
    </button>
  );

  if (match.locked) {
    return (
      <div className="flex items-center justify-between py-3 px-4 rounded-xl bg-white/5 opacity-70">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <Flag flag={match.homeTeam.flag} name={match.homeTeam.name} />
          <span className="font-medium text-sm truncate">{match.homeTeam.name}</span>
        </div>
        <div className="flex items-center gap-2 mx-3 text-center shrink-0">
          {match.homeScore !== null ? (
            <span className="font-bold text-white text-base w-12 text-center">
              {match.homeScore} – {match.awayScore}
            </span>
          ) : (
            <span className="text-xs text-slate-500 w-20 text-center">Locked</span>
          )}
          {match.prediction && (
            <span className="text-xs text-slate-500">
              (you: {match.prediction.homeScore}–{match.prediction.awayScore})
            </span>
          )}
        </div>
        <div className="flex items-center gap-2 flex-1 min-w-0 justify-end">
          <span className="font-medium text-sm truncate text-right">{match.awayTeam.name}</span>
          <Flag flag={match.awayTeam.flag} name={match.awayTeam.name} />
          {groupBadge}
          {peopleBtn}
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2 py-3 px-4 rounded-xl bg-white/5 hover:bg-white/8 transition-colors">
      <div className="flex items-center gap-2 flex-1 min-w-0">
        <Flag flag={match.homeTeam.flag} name={match.homeTeam.name} />
        <span className="font-medium text-sm truncate">{match.homeTeam.name}</span>
      </div>

      <div className="flex items-center gap-1.5 shrink-0">
        <input
          type="number"
          min={0}
          max={20}
          value={home}
          onChange={(e) => setHome(e.target.value)}
          onBlur={() => save(home, away)}
          className="w-10 text-center bg-white/10 border border-white/20 rounded-lg py-1.5 text-sm font-bold outline-none focus:border-amber-400 transition-colors"
        />
        <span className="text-slate-500 text-sm">–</span>
        <input
          type="number"
          min={0}
          max={20}
          value={away}
          onChange={(e) => setAway(e.target.value)}
          onBlur={() => save(home, away)}
          className="w-10 text-center bg-white/10 border border-white/20 rounded-lg py-1.5 text-sm font-bold outline-none focus:border-amber-400 transition-colors"
        />
        <span className="text-xs w-5 text-center">
          {saving ? "⏳" : saved ? "✅" : error ? "❌" : ""}
        </span>
      </div>

      <div className="flex items-center gap-2 flex-1 min-w-0 justify-end">
        <span className="font-medium text-sm truncate text-right">{match.awayTeam.name}</span>
        <Flag flag={match.awayTeam.flag} name={match.awayTeam.name} />
        {groupBadge}
        {peopleBtn}
      </div>

      <span className="text-xs text-slate-500 hidden lg:block w-28 text-right shrink-0">
        {fmt(match.scheduledAt)}
      </span>
    </div>
  );
}

export function PredictClient({ grouped, teams, initialChampion, initialTopScorers }: Props) {
  const [champion, setChampion] = useState(initialChampion ?? "");
  const [champSaved, setChampSaved] = useState(false);
  const [topScorers, setTopScorers] = useState<TopScorerSlot[]>(initialTopScorers);
  const [scorerSaved, setScorerSaved] = useState<number | null>(null);
  const [view, setView] = useState<"group" | "date">("group");
  const [selectedMatchId, setSelectedMatchId] = useState<string | null>(null);
  const bonusLocked = new Date() >= BONUS_LOCK;

  async function saveChampion(teamId: string) {
    if (!teamId) return;
    await fetch("/api/predictions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ championTeamId: teamId }),
    });
    setChampSaved(true);
    setTimeout(() => setChampSaved(false), 1500);
  }

  async function saveTopScorer(slot: TopScorerSlot) {
    await fetch("/api/predictions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ topScorerPick: slot }),
    });
    setScorerSaved(slot.slot);
    setTimeout(() => setScorerSaved(null), 1500);
  }

  function updateSlot(slot: number, field: keyof TopScorerSlot, value: string) {
    setTopScorers((prev) =>
      prev.map((s) => s.slot === slot ? { ...s, [field]: value } : s)
    );
  }

  const groups = Object.keys(grouped).sort();

  // Build date-grouped view from all matches, sorted by kick-off time
  const byDate = useMemo(() => {
    const allMatches = groups.flatMap((g) => grouped[g]);
    allMatches.sort((a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime());
    const map = new Map<string, Match[]>();
    for (const m of allMatches) {
      const key = localDateKey(m.scheduledAt);
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(m);
    }
    return map;
  }, [grouped, groups]);

  // Find today's date key to auto-scroll / highlight
  const todayKey = localDateKey(new Date().toISOString());

  return (
    <div>
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <h1 className="text-3xl font-bold text-amber-400">⚽ Your Predictions</h1>
        <div className="flex rounded-lg overflow-hidden bg-white/5 border border-white/10">
          <button
            onClick={() => setView("group")}
            className={`px-4 py-2 text-sm font-medium transition-colors ${
              view === "group" ? "bg-amber-500 text-black" : "text-slate-400 hover:text-white"
            }`}
          >
            By Group
          </button>
          <button
            onClick={() => setView("date")}
            className={`px-4 py-2 text-sm font-medium transition-colors ${
              view === "date" ? "bg-amber-500 text-black" : "text-slate-400 hover:text-white"
            }`}
          >
            By Date
          </button>
        </div>
      </div>

      {/* Bonus picks lock notice */}
      {bonusLocked ? (
        <div className="bg-red-500/10 border border-red-500/30 rounded-xl px-4 py-2.5 mb-4 text-sm text-red-400">
          🔒 Champion and top scorer picks are locked (deadline was Mon 15 Jun, 23:59 Dutch time)
        </div>
      ) : (
        <div className="bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 mb-4 text-xs text-slate-400">
          ⏰ Champion and top scorer picks lock <strong className="text-slate-300">Monday 15 Jun at 23:59</strong> Dutch time
        </div>
      )}

      {/* Champion picker */}
      <div className={`border rounded-2xl p-4 mb-4 ${bonusLocked ? "bg-white/3 border-white/5 opacity-70" : "bg-amber-500/10 border-amber-500/30"}`}>
        <div className="flex items-center gap-3 flex-wrap">
          <span className="text-amber-400 font-semibold">🏆 Ultimate Champion</span>
          {bonusLocked ? (
            <span className="text-slate-300 text-sm flex items-center gap-1.5">
              {champion ? (
                <>
                  <Flag flag={teams.find((t) => t.id === champion)!.flag} name={teams.find((t) => t.id === champion)!.name} />
                  {teams.find((t) => t.id === champion)!.name}
                </>
              ) : "— not picked —"}
            </span>
          ) : (
            <>
              <select
                value={champion}
                onChange={(e) => { setChampion(e.target.value); saveChampion(e.target.value); }}
                className="flex-1 min-w-48 bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-sm outline-none focus:border-amber-400"
              >
                <option value="">— pick a team —</option>
                {[...teams].sort((a, b) => a.name.localeCompare(b.name)).map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </select>
              {champSaved && <span className="text-green-400 text-sm">✅ Saved</span>}
            </>
          )}
        </div>
        <p className="text-xs text-slate-400 mt-2">Correct pick = 5 bonus points</p>
      </div>

      {/* Top 5 Scorers picker */}
      <div className={`border rounded-2xl p-4 mb-8 ${bonusLocked ? "bg-white/3 border-white/5 opacity-70" : "bg-amber-500/10 border-amber-500/30"}`}>
        <div className="flex items-center justify-between mb-3">
          <span className="text-amber-400 font-semibold">👟 Top 5 Scorers</span>
          {bonusLocked && <span className="text-xs text-red-400">🔒 Locked</span>}
        </div>
        <div className="space-y-2">
          {topScorers.map((slot) => (
            <div key={slot.slot} className="flex items-center gap-2">
              <span className="text-xs text-slate-500 w-4 shrink-0">{slot.slot}.</span>
              {bonusLocked ? (
                <span className="text-slate-300 text-sm flex-1">
                  {slot.playerName || <span className="text-slate-600">— not picked —</span>}
                  {slot.playerName && (
                    <span className="ml-2 text-xs text-slate-500">
                      ({slot.position === "DEFENDER" ? "DEF" : slot.position === "MIDFIELDER" ? "MID" : "FWD"})
                    </span>
                  )}
                </span>
              ) : (
                <>
                  <input
                    type="text"
                    value={slot.playerName}
                    onChange={(e) => updateSlot(slot.slot, "playerName", e.target.value)}
                    onBlur={() => saveTopScorer(topScorers.find((s) => s.slot === slot.slot)!)}
                    onKeyDown={(e) => e.key === "Enter" && saveTopScorer(topScorers.find((s) => s.slot === slot.slot)!)}
                    placeholder={`Player ${slot.slot}`}
                    className="flex-1 bg-white/10 border border-white/20 rounded-lg px-3 py-1.5 text-sm outline-none focus:border-amber-400"
                  />
                  <select
                    value={slot.position}
                    onChange={(e) => {
                      updateSlot(slot.slot, "position", e.target.value);
                      if (slot.playerName.trim()) {
                        saveTopScorer({ ...slot, position: e.target.value });
                      }
                    }}
                    className="bg-white/10 border border-white/20 rounded-lg px-2 py-1.5 text-xs outline-none focus:border-amber-400 shrink-0"
                  >
                    <option value="FORWARD">FWD 0.5×</option>
                    <option value="MIDFIELDER">MID 1×</option>
                    <option value="DEFENDER">DEF 1.5×</option>
                  </select>
                  {scorerSaved === slot.slot && <span className="text-green-400 text-xs">✅</span>}
                </>
              )}
            </div>
          ))}
        </div>
        <p className="text-xs text-slate-400 mt-3">
          Pts per goal from Mon 15 Jun 23:59 CEST · FWD 0.5× · MID 1× · DEF 1.5×
        </p>
      </div>

      {/* BY GROUP view */}
      {view === "group" && (
        <div className="space-y-6">
          {groups.map((group) => (
            <div key={group}>
              <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                <span className="w-7 h-7 rounded-full bg-white/10 flex items-center justify-center text-white text-xs">
                  {group}
                </span>
                Group {group}
              </h2>
              <div className="space-y-1.5">
                {grouped[group].map((match) => (
                  <MatchRow key={match.id} match={match} onSelect={() => setSelectedMatchId(match.id)} />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* BY DATE view */}
      {view === "date" && (
        <div className="space-y-6">
          {Array.from(byDate.entries()).map(([dateKey, matches]) => {
            const isToday = dateKey === todayKey;
            const unpredicted = matches.filter((m) => !m.locked && !m.prediction).length;
            return (
              <div key={dateKey}>
                <h2 className="text-sm font-semibold uppercase tracking-widest mb-3 flex items-center gap-2 flex-wrap">
                  <span className={`${isToday ? "text-amber-400" : "text-slate-400"}`}>
                    {isToday ? "📅 Today — " : ""}{fmtDateHeading(matches[0].scheduledAt)}
                  </span>
                  {unpredicted > 0 && (
                    <span className="text-xs bg-amber-500/20 text-amber-400 border border-amber-500/30 rounded-full px-2 py-0.5">
                      {unpredicted} to predict
                    </span>
                  )}
                </h2>
                <div className="space-y-1.5">
                  {matches.map((match) => (
                    <MatchRow key={match.id} match={match} showGroup onSelect={() => setSelectedMatchId(match.id)} />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <p className="text-xs text-slate-500 mt-8 text-center">
        Scores save automatically when you click out of a field. Matches lock at kick-off.
      </p>

      {selectedMatchId && (
        <MatchBreakdownModal matchId={selectedMatchId} onClose={() => setSelectedMatchId(null)} />
      )}
    </div>
  );
}
