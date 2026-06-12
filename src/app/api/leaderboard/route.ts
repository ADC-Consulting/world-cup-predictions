import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { calculatePoints } from "@/lib/scoring";

export async function GET() {
  const [users, matches, predictions, championPicks] = await Promise.all([
    prisma.user.findMany({ where: { isAdmin: false } }),
    prisma.match.findMany({ where: { homeScore: { not: null } } }),
    prisma.prediction.findMany(),
    prisma.championPick.findMany({ include: { team: true } }),
  ]);

  // Find the champion (team with most wins — simplified: the team in the final match with homeScore set)
  // For now we just check if there's a designated champion team set via a separate mechanism.
  // Champion bonus: We'll track this separately once knockout stage is added.
  // For now: champion picks that match a "winner" team don't score yet — only group stage points.

  const leaderboard = users.map((user) => {
    let pts = 0;
    let exact = 0;
    let correct = 0;
    let predicted = 0;

    for (const match of matches) {
      const pred = predictions.find(
        (p) => p.userId === user.id && p.matchId === match.id
      );
      if (!pred) continue;
      predicted++;
      const p = calculatePoints(
        pred.homeScore,
        pred.awayScore,
        match.homeScore!,
        match.awayScore!
      );
      pts += p;
      if (p === 3) exact++;
      if (p >= 1) correct++;
    }

    return { id: user.id, name: user.name, pts, exact, correct, predicted };
  });

  leaderboard.sort((a, b) => b.pts - a.pts || b.exact - a.exact);

  return NextResponse.json(leaderboard);
}
