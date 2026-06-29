"use client";
import { useState, useCallback } from "react";
import { calculatePointsForStage, stagePoints, STAGE_LABELS } from "@/lib/scoring";

type Team = { id: string; name: string; flag: string };
type BracketMatch = {
  id: string;
  stage: string;
  scheduledAt: string;
  homeScore: number | null;
  awayScore: number | null;
  homeTeam: Team;
  awayTeam: Team;
  locked: boolean;
  prediction: { homeScore: number; awayScore: number } | null;
};

const STAGE_ORDER = ["R32", "R16", "QF", "SF", "F"];

function fmt(iso: string) {
  return new Date(iso).toLocaleString("en-GB", {
    weekday: "short", day: "numeric", month: "short",
    hour: "2-digit", minute: "2-digit",
  });
}

function PointsBadge({ points, stage }: { points: number; stage: string }) {
  const { exact } = stagePoints(stage);
  if (points === exact)
    return <span className="text-xs text-green-400 bg-green-500/15 border border-green-500/30 rounded px-2 py-0.5 font-semibold">+{points}</span>;
  if (points > 0)
    return <span className="text-xs text-amber-400 bg-amber-500/15 border border-amber-500/30 rounded px-2 py-0.5 font-semibold">+{points}</span>;
  return <span className="text-xs text-red-400 bg-red-500/15 border border-red-500/30 rounded px-2 py-0.5 font-semibold">0</span>;
}

function MatchCard({ match, onPredictionSaved }: { match: BracketMatch; onPredictionSaved: (id: string, h: number, a: number) => void }) {
  const [home, setHome] = useState(match.prediction?.homeScore?.toString() ?? "");
  const [away, setAway] = useState(match.prediction?.awayScore?.toString() ?? "");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const save = useCallback(async () => {
    if (home === "" || away === "" || match.locked) return;
    setSaving(true);
    try {
      await fetch("/api/predictions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ matchId: match.id, homeScore: +home, awayScore: +away }),
      });
      onPredictionSaved(match.id, +home, +away);
      setSaved(true);
      setTimeout(() => setSaved(false), 1500);
    } finally {
      setSaving(false);
    }
  }, [home, away, match.id, match.locked, onPredictionSaved]);

  const played = match.homeScore !== null;
  const pts = played && match.prediction !== null
    ? calculatePointsForStage(match.prediction!.homeScore, match.prediction!.awayScore, match.homeScore!, match.awayScore!, match.stage)
    : null;

  return (
    <div className={`rounded-xl border text-sm w-full ${played ? "bg-white/5 border-white/10" : match.locked ? "bg-white/3 border-white/5" : "bg-[#0f1629] border-white/15"}`}>
      {/* Date */}
      <div className="px-3 pt-2 pb-1 text-[10px] text-slate-500">{fmt(match.scheduledAt)}</div>

      {/* Home team */}
      <div className="flex items-center justify-between px-3 py-1.5 gap-2">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <span className="text-base shrink-0">{match.homeTeam.flag}</span>
          <span className="font-medium truncate">{match.homeTeam.name}</span>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          {played ? (
            <span className={`font-bold text-base w-5 text-center ${match.homeScore! > match.awayScore! ? "text-white" : "text-slate-500"}`}>{match.homeScore}</span>
          ) : match.locked ? (
            <span className="text-slate-600 text-xs w-5 text-center">—</span>
          ) : (
            <input
              type="number" min={0} max={20} value={home}
              onChange={(e) => setHome(e.target.value)}
              onBlur={save}
              onKeyDown={(e) => e.key === "Enter" && save()}
              className="w-9 text-center bg-white/10 border border-white/20 rounded-lg py-1 text-sm font-bold outline-none focus:border-amber-400 transition-colors"
            />
          )}
        </div>
      </div>

      {/* Away team */}
      <div className="flex items-center justify-between px-3 py-1.5 gap-2 border-t border-white/5">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <span className="text-base shrink-0">{match.awayTeam.flag}</span>
          <span className="font-medium truncate">{match.awayTeam.name}</span>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          {played ? (
            <span className={`font-bold text-base w-5 text-center ${match.awayScore! > match.homeScore! ? "text-white" : "text-slate-500"}`}>{match.awayScore}</span>
          ) : match.locked ? (
            <span className="text-slate-600 text-xs w-5 text-center">—</span>
          ) : (
            <input
              type="number" min={0} max={20} value={away}
              onChange={(e) => setAway(e.target.value)}
              onBlur={save}
              onKeyDown={(e) => e.key === "Enter" && save()}
              className="w-9 text-center bg-white/10 border border-white/20 rounded-lg py-1 text-sm font-bold outline-none focus:border-amber-400 transition-colors"
            />
          )}
        </div>
      </div>

      {/* Footer: prediction + points */}
      {(match.prediction || saving || saved) && (
        <div className="px-3 pb-2 pt-1 flex items-center justify-between border-t border-white/5">
          <span className="text-[10px] text-slate-500">
            {match.prediction ? `Your pick: ${match.prediction.homeScore}–${match.prediction.awayScore}` : ""}
          </span>
          <div className="flex items-center gap-1">
            {saving && <span className="text-[10px] text-slate-500">saving…</span>}
            {saved && <span className="text-[10px] text-green-400">✓ saved</span>}
            {pts !== null && <PointsBadge points={pts} stage={match.stage} />}
          </div>
        </div>
      )}
    </div>
  );
}

export function BracketClient({ byStage }: { byStage: Record<string, BracketMatch[]> }) {
  const [matches, setMatches] = useState(byStage);

  const handleSaved = useCallback((stage: string, id: string, h: number, a: number) => {
    setMatches((prev) => ({
      ...prev,
      [stage]: prev[stage].map((m) =>
        m.id === id ? { ...m, prediction: { homeScore: h, awayScore: a } } : m
      ),
    }));
  }, []);

  const hasAnyMatches = STAGE_ORDER.some((s) => (matches[s]?.length ?? 0) > 0);

  const { exact: r32Exact, result: r32Result } = stagePoints("R32");
  const { exact: r16Exact, result: r16Result } = stagePoints("R16");
  const { exact: qfExact, result: qfResult } = stagePoints("QF");
  const { exact: sfExact, result: sfResult } = stagePoints("SF");
  const { exact: fExact, result: fResult } = stagePoints("F");

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-amber-400">⚔️ Knockout Stage</h1>
        <p className="text-slate-400 text-sm mt-1">Predict scores for each knockout match — locks at kick-off</p>
      </div>

      {/* Scoring legend */}
      <div className="flex gap-2 flex-wrap text-xs text-slate-500 mb-6">
        <span className="bg-white/5 rounded px-2 py-1">R32: {r32Exact}/{r32Result} pts</span>
        <span className="bg-white/5 rounded px-2 py-1">R16: {r16Exact}/{r16Result} pts</span>
        <span className="bg-white/5 rounded px-2 py-1">QF: {qfExact}/{qfResult} pts</span>
        <span className="bg-white/5 rounded px-2 py-1">SF: {sfExact}/{sfResult} pts</span>
        <span className="bg-white/5 rounded px-2 py-1">Final: {fExact}/{fResult} pts</span>
        <span className="bg-white/5 rounded px-2 py-1 text-slate-600">exact / correct result</span>
      </div>

      {!hasAnyMatches ? (
        <div className="text-center py-20 text-slate-500">
          <div className="text-4xl mb-3">⚔️</div>
          <p className="text-lg">No knockout matches added yet.</p>
          <p className="text-sm mt-1">Check back once the bracket is confirmed.</p>
        </div>
      ) : (
        /* Horizontal scrollable bracket */
        <div className="overflow-x-auto pb-4">
          <div className="flex gap-6 min-w-max">
            {STAGE_ORDER.map((stage) => {
              const stageMatches = matches[stage] ?? [];
              if (stageMatches.length === 0) return null;
              return (
                <div key={stage} className="flex flex-col">
                  {/* Round header */}
                  <div className="text-center mb-3">
                    <span className="text-xs font-semibold text-amber-400 uppercase tracking-widest">
                      {STAGE_LABELS[stage] ?? stage}
                    </span>
                    <span className="ml-2 text-xs text-slate-600">({stageMatches.length})</span>
                  </div>
                  {/* Matches */}
                  <div className="flex flex-col gap-3 w-64">
                    {stageMatches.map((m) => (
                      <MatchCard
                        key={m.id}
                        match={m}
                        onPredictionSaved={(id, h, a) => handleSaved(stage, id, h, a)}
                      />
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
