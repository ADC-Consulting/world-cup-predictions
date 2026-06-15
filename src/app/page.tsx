import { prisma } from "@/lib/db";

export const dynamic = 'force-dynamic';
import { calculatePoints, scorerPoints } from "@/lib/scoring";
import Link from "next/link";

async function getLeaderboard() {
  const [users, finishedMatches, predictions, championPicks, topScorerPicks, goalEntries] = await Promise.all([
    prisma.user.findMany({ where: { isAdmin: false } }),
    prisma.match.findMany({ where: { homeScore: { not: null } } }),
    prisma.prediction.findMany(),
    prisma.championPick.findMany({ include: { team: true } }),
    prisma.topScorerPick.findMany(),
    prisma.scorerGoalEntry.findMany(),
  ]);

  return users.map((user) => {
    let pts = 0, exact = 0, correct = 0, predicted = 0;
    for (const match of finishedMatches) {
      const pred = predictions.find((p) => p.userId === user.id && p.matchId === match.id);
      if (!pred) continue;
      predicted++;
      const p = calculatePoints(pred.homeScore, pred.awayScore, match.homeScore!, match.awayScore!);
      pts += p;
      if (p === 3) exact++;
      if (p >= 1) correct++;
    }

    const champPick = championPicks.find((c) => c.userId === user.id);
    const userPicks = topScorerPicks.filter((p) => p.userId === user.id);
    const topScorerBonus = goalEntries.length > 0 ? scorerPoints(userPicks, goalEntries) : 0;
    pts += topScorerBonus;

    return {
      id: user.id,
      name: user.name,
      username: (user as { username: string }).username,
      pts,
      exact,
      correct,
      predicted,
      topScorerBonus,
      championTeam: champPick?.team ?? null,
    };
  }).sort((a, b) => b.pts - a.pts || b.exact - a.exact);
}

async function getChampionPicksOverview() {
  const picks = await prisma.championPick.findMany({
    include: { team: true, user: true },
  });
  const byTeam = new Map<string, { team: { name: string; flag: string }; pickers: string[] }>();
  for (const pick of picks) {
    if (!byTeam.has(pick.teamId)) {
      byTeam.set(pick.teamId, { team: pick.team, pickers: [] });
    }
    byTeam.get(pick.teamId)!.pickers.push((pick.user as { name: string }).name);
  }
  return Array.from(byTeam.values()).sort((a, b) => b.pickers.length - a.pickers.length);
}

export default async function HomePage() {
  const [leaderboard, championOverview] = await Promise.all([
    getLeaderboard(),
    getChampionPicksOverview(),
  ]);
  const finishedCount = await prisma.match.count({ where: { homeScore: { not: null } } });
  const totalMatches = await prisma.match.count();

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-amber-400">🏆 Leaderboard</h1>
        <p className="text-slate-400 text-sm mt-1">
          {finishedCount} of {totalMatches} group stage matches played
        </p>
      </div>

      {leaderboard.length === 0 ? (
        <div className="text-center py-16 text-slate-500">
          <div className="text-4xl mb-3">⚽</div>
          <p className="text-lg">No predictions yet.</p>
          <p className="text-sm mt-1">Be the first to <Link href="/predict" className="text-amber-400 hover:underline">make your predictions!</Link></p>
        </div>
      ) : (
        <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/10 text-xs text-slate-400 uppercase tracking-wide">
                <th className="text-left px-4 py-3 w-8">#</th>
                <th className="text-left px-4 py-3">Name</th>
                <th className="text-right px-4 py-3">Pts</th>
                <th className="text-right px-4 py-3 hidden sm:table-cell">Exact</th>
                <th className="text-right px-4 py-3 hidden sm:table-cell">Result</th>
                <th className="text-right px-4 py-3 hidden md:table-cell">Predicted</th>
              </tr>
            </thead>
            <tbody>
              {leaderboard.map((entry, i) => (
                <tr key={entry.id} className="border-b border-white/5 last:border-0 hover:bg-white/5 transition-colors">
                  <td className="px-4 py-3 text-slate-500 font-mono text-sm">
                    <div className="flex items-center gap-1.5">
                      <span>{i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : i + 1}</span>
                      {i === 0 && <span title="Prize: dinner voucher" className="text-base cursor-default">🍽️</span>}
                      {i === 1 && <span title="Prize: salmari bottle" className="text-base cursor-default">🍾</span>}
                      {i === 2 && <span title="Prize: cake" className="text-base cursor-default">🎂</span>}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <Link href={`/predictions/${entry.username}`} className="font-medium hover:text-amber-400 transition-colors">
                      {entry.name}
                    </Link>
                    {entry.championTeam && (
                      <span className="ml-2 text-xs text-slate-500" title={`Champion: ${entry.championTeam.name}`}>
                        {entry.championTeam.flag}
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right font-bold text-amber-400 text-lg">
                    {entry.pts % 1 === 0 ? entry.pts : entry.pts.toFixed(1)}
                    {entry.topScorerBonus > 0 && (
                      <span className="ml-1 text-xs text-green-400 font-normal">
                        +{entry.topScorerBonus % 1 === 0 ? entry.topScorerBonus : entry.topScorerBonus.toFixed(1)}
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right text-slate-300 hidden sm:table-cell">
                    <span className="text-green-400">{entry.exact}</span>
                  </td>
                  <td className="px-4 py-3 text-right text-slate-300 hidden sm:table-cell">{entry.correct}</td>
                  <td className="px-4 py-3 text-right text-slate-500 text-sm hidden md:table-cell">{entry.predicted}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="mt-4 flex gap-2 text-xs text-slate-500 flex-wrap">
        <span className="bg-white/5 rounded px-2 py-1">🍽️ Dinner voucher</span>
        <span className="bg-white/5 rounded px-2 py-1">🍾 Salmari bottle</span>
        <span className="bg-white/5 rounded px-2 py-1">🎂 Cake</span>
      </div>

      <div className="mt-3 flex gap-2 text-xs text-slate-500 flex-wrap">
        <span className="bg-white/5 rounded px-2 py-1">⚽ Exact score = <strong className="text-amber-400">3 pts</strong></span>
        <span className="bg-white/5 rounded px-2 py-1">✓ Correct result = <strong className="text-slate-300">2 pts</strong></span>
        <span className="bg-white/5 rounded px-2 py-1">🏆 Correct champion = <strong className="text-amber-400">5 pts</strong></span>
        <span className="bg-white/5 rounded px-2 py-1">👟 Top scorer · FWD 0.5× · MID 1× · DEF 1.5× per goal</span>
      </div>

      {championOverview.length > 0 && (
        <details className="mt-8 group">
          <summary className="cursor-pointer text-sm font-semibold text-slate-400 uppercase tracking-widest hover:text-amber-400 transition-colors select-none">
            🏆 Champion Picks Overview
            <span className="ml-2 font-normal normal-case tracking-normal text-slate-500">
              ({leaderboard.filter((e) => e.championTeam).length} of {leaderboard.length} picked)
            </span>
          </summary>
          <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {championOverview.map(({ team, pickers }) => (
              <div key={team.name} className="bg-white/5 border border-white/10 rounded-xl p-3">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-2xl">{team.flag}</span>
                  <span className="font-medium text-sm">{team.name}</span>
                </div>
                <div className="text-xs text-slate-400 space-y-0.5">
                  {pickers.map((name) => <div key={name}>{name}</div>)}
                </div>
              </div>
            ))}
          </div>
        </details>
      )}
    </div>
  );
}
