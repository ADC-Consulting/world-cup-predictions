export const dynamic = 'force-dynamic';

import { prisma } from "@/lib/db";
import { calculatePoints, scorerPoints, POSITION_MULTIPLIER } from "@/lib/scoring";
import { notFound } from "next/navigation";
import Link from "next/link";

type Team = { name: string; flag: string };
type MatchRow = {
  id: string;
  group: string;
  scheduledAt: string;
  homeTeam: Team;
  awayTeam: Team;
  actualHome: number | null;
  actualAway: number | null;
  predHome: number | null;
  predAway: number | null;
  points: number | null;
};

function PointsBadge({ points }: { points: number | null }) {
  if (points === null) return <span className="text-xs text-slate-600 bg-white/5 rounded px-2 py-0.5">—</span>;
  if (points === 3) return <span className="text-xs text-green-400 bg-green-500/15 border border-green-500/30 rounded px-2 py-0.5 font-semibold">+3 Exact</span>;
  if (points === 2) return <span className="text-xs text-amber-400 bg-amber-500/15 border border-amber-500/30 rounded px-2 py-0.5 font-semibold">+2 Result</span>;
  return <span className="text-xs text-red-400 bg-red-500/15 border border-red-500/30 rounded px-2 py-0.5 font-semibold">0 Miss</span>;
}

export default async function UserPredictionsPage({
  params,
}: {
  params: Promise<{ username: string }>;
}) {
  const { username } = await params;

  const user = await prisma.user.findUnique({
    where: { username },
    include: {
      championPick: { include: { team: true } },
      topScorerPicks: { orderBy: { slot: "asc" } },
    },
  });

  if (!user || user.isAdmin) notFound();

  const [matches, predictions, goalEntries] = await Promise.all([
    prisma.match.findMany({
      include: { homeTeam: true, awayTeam: true },
      orderBy: [{ scheduledAt: "asc" }],
    }),
    prisma.prediction.findMany({ where: { userId: user.id } }),
    prisma.scorerGoalEntry.findMany(),
  ]);

  const now = new Date();
  const topScorerBonus = goalEntries.length > 0
    ? scorerPoints(user.topScorerPicks, goalEntries)
    : 0;

  const rows: MatchRow[] = matches.map((m) => {
    const pred = predictions.find((p) => p.matchId === m.id);
    const played = m.homeScore !== null;
    const locked = new Date(m.scheduledAt) <= now;

    return {
      id: m.id,
      group: m.group,
      scheduledAt: m.scheduledAt.toISOString(),
      homeTeam: m.homeTeam,
      awayTeam: m.awayTeam,
      actualHome: m.homeScore,
      actualAway: m.awayScore,
      predHome: locked ? (pred?.homeScore ?? null) : null,
      predAway: locked ? (pred?.awayScore ?? null) : null,
      points: played && pred
        ? calculatePoints(pred.homeScore, pred.awayScore, m.homeScore!, m.awayScore!)
        : null,
    };
  });

  const matchPts = rows.reduce((sum, r) => sum + (r.points ?? 0), 0);
  const totalPts = matchPts + topScorerBonus;
  const exact = rows.filter((r) => r.points === 3).length;
  const correct = rows.filter((r) => r.points !== null && r.points >= 1).length;

  const groups = Array.from(new Set(rows.map((r) => r.group))).sort();
  const byGroup = groups.reduce<Record<string, MatchRow[]>>((acc, g) => {
    acc[g] = rows.filter((r) => r.group === g);
    return acc;
  }, {});

  const fmt = (n: number) => n % 1 === 0 ? String(n) : n.toFixed(1);

  return (
    <div>
      <div className="mb-6 flex items-center gap-4 flex-wrap">
        <Link href="/" className="text-slate-500 hover:text-amber-400 text-sm transition-colors">
          ← Leaderboard
        </Link>
        <h1 className="text-2xl font-bold text-white">{user.name}'s Predictions</h1>
      </div>

      {/* Stats */}
      <div className="flex gap-3 mb-6 flex-wrap">
        <div className="bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-center">
          <div className="text-2xl font-bold text-amber-400">{fmt(totalPts)}</div>
          <div className="text-xs text-slate-400">Points</div>
        </div>
        <div className="bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-center">
          <div className="text-2xl font-bold text-green-400">{exact}</div>
          <div className="text-xs text-slate-400">Exact</div>
        </div>
        <div className="bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-center">
          <div className="text-2xl font-bold text-slate-300">{correct}</div>
          <div className="text-xs text-slate-400">Result</div>
        </div>
      </div>

      {/* Champion pick */}
      {user.championPick && (
        <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl px-4 py-2 text-sm flex items-center gap-2 mb-3 w-fit">
          <span>🏆</span>
          <span className="text-amber-400 font-semibold">Champion:</span>
          <span>{user.championPick.team.flag} {user.championPick.team.name}</span>
        </div>
      )}

      {/* Top 5 scorer picks */}
      {user.topScorerPicks.length > 0 && (
        <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl px-4 py-3 mb-8">
          <div className="flex items-center gap-2 mb-2">
            <span>👟</span>
            <span className="text-amber-400 font-semibold text-sm">Top 5 Scorers</span>
            {topScorerBonus > 0 && (
              <span className="text-green-400 text-xs ml-auto">+{fmt(topScorerBonus)} pts</span>
            )}
          </div>
          <div className="space-y-1">
            {user.topScorerPicks.map((pick) => {
              const entry = goalEntries.find(
                (e) => e.playerName.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]/g, "") ===
                  pick.playerName.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]/g, "")
              );
              const mult = POSITION_MULTIPLIER[pick.position] ?? 0.5;
              const pts = entry ? entry.goals * mult : null;
              const posLabel = pick.position === "DEFENDER" ? "DEF" : pick.position === "MIDFIELDER" ? "MID" : "FWD";
              return (
                <div key={pick.slot} className="flex items-center gap-2 text-sm">
                  <span className="text-slate-500 text-xs w-4">{pick.slot}.</span>
                  <span className="flex-1">{pick.playerName}</span>
                  <span className="text-xs text-slate-500">{posLabel}</span>
                  {pts !== null && pts > 0 && (
                    <span className="text-green-400 text-xs">+{fmt(pts)}</span>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Predictions by group */}
      <div className="space-y-6">
        {groups.map((group) => (
          <div key={group}>
            <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-2">
              <span className="w-7 h-7 rounded-full bg-white/10 flex items-center justify-center text-white text-xs">{group}</span>
              Group {group}
            </h2>
            <div className="space-y-1.5">
              {byGroup[group].map((row) => (
                <div key={row.id} className="flex items-center gap-2 py-2.5 px-4 rounded-xl bg-white/5 text-sm">
                  <div className="flex items-center gap-1.5 flex-1 min-w-0">
                    <span>{row.homeTeam.flag}</span>
                    <span className="truncate font-medium">{row.homeTeam.name}</span>
                  </div>
                  <div className="flex items-center gap-2 shrink-0 text-center">
                    {row.predHome !== null ? (
                      <span className="font-bold w-16 text-center text-slate-300">{row.predHome} – {row.predAway}</span>
                    ) : (
                      <span className="w-16 text-center text-slate-600 text-xs">No pick</span>
                    )}
                    {row.actualHome !== null && (
                      <span className="text-xs text-slate-500 w-14 text-center">({row.actualHome}–{row.actualAway})</span>
                    )}
                  </div>
                  <div className="flex items-center gap-1.5 flex-1 min-w-0 justify-end">
                    <span className="truncate font-medium text-right">{row.awayTeam.name}</span>
                    <span>{row.awayTeam.flag}</span>
                  </div>
                  <div className="w-20 text-right shrink-0">
                    <PointsBadge points={row.points} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
