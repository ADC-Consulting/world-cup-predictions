export const dynamic = "force-dynamic";

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { BracketClient } from "@/components/BracketClient";
import { BRACKET_PATHS } from "@/lib/bracketPaths";

const STAGE_ORDER = ["R32", "R16", "QF", "SF", "F"];

function resolveWinnerId(m: {
  homeScore: number | null;
  awayScore: number | null;
  homeTeamId: string;
  awayTeamId: string;
  penaltyWinnerId: string | null;
}): string | null {
  if (m.homeScore === null || m.awayScore === null) return null;
  if (m.homeScore > m.awayScore) return m.homeTeamId;
  if (m.awayScore > m.homeScore) return m.awayTeamId;
  return m.penaltyWinnerId ?? null;
}

// Auto-create next-round match slots as soon as both feeder winners are known.
// Runs on every page load — safe to re-run, skips existing matches.
async function ensureConfirmedMatchups() {
  const allKnockout = await prisma.match.findMany({
    where: { stage: { in: ["R32", "R16", "QF", "SF"] } },
  });

  const byTime = new Map(allKnockout.map((m) => [m.scheduledAt.toISOString(), m]));

  for (const path of BRACKET_PATHS) {
    const m1 = byTime.get(path.m1);
    const m2 = byTime.get(path.m2);
    if (!m1 || !m2) continue;

    const w1 = resolveWinnerId(m1);
    const w2 = resolveWinnerId(m2);
    if (!w1 || !w2) continue; // one or both still unresolved

    // Skip if next-round slot already exists
    const exists = await prisma.match.findFirst({
      where: { scheduledAt: new Date(path.next), stage: path.nextStage },
    });
    if (exists) continue;

    await prisma.match.create({
      data: {
        stage: path.nextStage,
        group: path.nextStage,
        homeTeamId: w1,
        awayTeamId: w2,
        scheduledAt: new Date(path.next),
      },
    });
  }
}

export default async function KnockoutsPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  // Ensure all confirmed matchups have a DB slot before loading data
  await ensureConfirmedMatchups();

  const [matches, predictions] = await Promise.all([
    prisma.match.findMany({
      where: { stage: { in: STAGE_ORDER } },
      include: { homeTeam: true, awayTeam: true },
      orderBy: { scheduledAt: "asc" },
    }),
    prisma.prediction.findMany({ where: { userId: session.user.id } }),
  ]);

  const serialized = matches.map((m) => ({
    id: m.id,
    stage: m.stage,
    scheduledAt: m.scheduledAt.toISOString(),
    homeScore: m.homeScore,
    awayScore: m.awayScore,
    homeTeam: { id: m.homeTeam.id, name: m.homeTeam.name, flag: m.homeTeam.flag },
    awayTeam: { id: m.awayTeam.id, name: m.awayTeam.name, flag: m.awayTeam.flag },
    locked: new Date(m.scheduledAt) <= new Date(),
    penaltyWinnerId: m.penaltyWinnerId,
    prediction: predictions.find((p) => p.matchId === m.id)
      ? { homeScore: predictions.find((p) => p.matchId === m.id)!.homeScore, awayScore: predictions.find((p) => p.matchId === m.id)!.awayScore }
      : null,
  }));

  const byStage = STAGE_ORDER.reduce<Record<string, typeof serialized>>((acc, s) => {
    acc[s] = serialized.filter((m) => m.stage === s);
    return acc;
  }, {});

  return <BracketClient byStage={byStage} />;
}
